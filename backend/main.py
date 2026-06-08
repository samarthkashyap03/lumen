import os
import json
import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from groq import Groq
import requests

# Load environment variables from .env if present
env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ[key.strip()] = val.strip().strip('"').strip("'")

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://your-supabase-url.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", os.getenv("SUPABASE_KEY", "your-supabase-key"))
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

app = FastAPI(title="Lumen Ingestion & RAG API", version="1.0.0")

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase Client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialize Groq Client
groq_client = None
if GROQ_API_KEY:
    groq_client = Groq(api_key=GROQ_API_KEY)
else:
    print("WARNING: GROQ_API_KEY not found. AI features will run in Mock mode.")

# Lazy load embedding model
embedding_model = None
def get_embedding_model():
    global embedding_model
    if embedding_model is None:
        from sentence_transformers import SentenceTransformer
        embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
    return embedding_model


# --- Local Fallback Database Helper ---

MOCK_DB_PATH = os.path.join(os.path.dirname(__file__), "mock_db.json")

def load_mock_db():
    if not os.path.exists(MOCK_DB_PATH):
        # Default mock articles & profiles to show immediately
        default_db = {
            "users": {},  # email -> user dict
            "profiles": {
                "mock-editor-id": {
                    "id": "mock-editor-id",
                    "name": "Elena Rostova",
                    "role": "editor"
                }
            },
            "articles": {
                "mock-id-1": {
                    "id": "mock-id-1",
                    "url": "lumen://dispatches/mock-id-1",
                    "title": "Neural models now reason in real time",
                    "author": "Elena Rostova",
                    "body_text": "Artificial intelligence has undergone a fundamental architectural shift. By introducing compressed semantic trees, next-generation reasoning networks are capable of generating complete multi-step logical layouts within milliseconds.\n\nThis represents a massive departure from typical autoregressive prompt queries. Traditional large language models generate tokens step-by-step in sequence, inducing high computing latency. Real-time models pre-evaluate potential pathways in parallel clusters, caching token hierarchies before output execution starts.\n\nThe practical applications are immediate. Interactive voice interfaces feel conversational rather than rigid, adjusting emphasis dynamically to coordinate with human speech beats. Researchers anticipate this level of throughput will redefine consumer agents in the coming year, shifting focus from pure computational parameters to sensory latency boundaries.",
                    "category": "AI",
                    "status": "completed",
                    "editor_id": "mock-editor-id",
                    "published_at": "2026-06-06T12:00:00Z",
                    "created_at": "2026-06-06T12:00:00Z"
                }
            },
            "article_chunks": {
                "mock-id-1": [
                    {
                        "id": "chunk-1",
                        "article_id": "mock-id-1",
                        "chunk_index": 0,
                        "content_text": "Artificial intelligence has undergone a fundamental architectural shift. By introducing compressed semantic trees, next-generation reasoning networks are capable of generating complete multi-step logical layouts within milliseconds."
                    },
                    {
                        "id": "chunk-2",
                        "article_id": "mock-id-1",
                        "chunk_index": 1,
                        "content_text": "This represents a massive departure from typical autoregressive prompt queries. Traditional large language models generate tokens step-by-step in sequence, inducing high computing latency."
                    }
                ]
            },
            "swipe_cards": {
                "mock-id-1": [
                    {
                        "id": "card-1",
                        "article_id": "mock-id-1",
                        "card_index": 0,
                        "category": "AI",
                        "title": "Neural models reason in *real time*",
                        "summary": "A new reasoning architecture compresses critical semantic trees into milliseconds. Assistants can pre-plan answers in parallel prior to typing outputs.",
                        "image_url": "ai"
                    },
                    {
                        "id": "card-2",
                        "article_id": "mock-id-1",
                        "card_index": 1,
                        "category": "AI",
                        "title": "Shifting away from *autoregression*",
                        "summary": "Traditional sequential processing induces high latency boundaries. Parallel computing tracks cache entire hierarchies, allowing immediate response rates.",
                        "image_url": "space"
                    },
                    {
                        "id": "card-3",
                        "article_id": "mock-id-1",
                        "card_index": 2,
                        "category": "AI",
                        "title": "Redefining user *interaction*",
                        "summary": "Practical consumer voice loops adapt to real conversation dynamics. Focus moves from raw cluster size to absolute sensory response speeds.",
                        "image_url": "city"
                    }
                ]
            }
        }
        try:
            with open(MOCK_DB_PATH, "w") as f:
                json.dump(default_db, f, indent=2)
        except Exception as e:
            print(f"Error creating default mock DB: {e}")
        return default_db
    try:
        with open(MOCK_DB_PATH, "r") as f:
            return json.load(f)
    except Exception:
        return {"users": {}, "profiles": {}, "articles": {}, "article_chunks": {}, "swipe_cards": {}}

def save_mock_db(db):
    try:
        with open(MOCK_DB_PATH, "w") as f:
            json.dump(db, f, indent=2)
    except Exception as e:
        print(f"Error saving mock DB: {e}")

def is_supabase_configured():
    return SUPABASE_URL != "https://your-supabase-url.supabase.co" and SUPABASE_KEY != "your-supabase-key"


# --- Schemas ---

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str

class LoginRequest(BaseModel):
    email: str
    password: str
    role: str

class ArticleCreateRequest(BaseModel):
    title: str
    body_text: str
    category: str
    attachments: Optional[List[dict]] = []
    author: Optional[str] = None
    editor_id: Optional[str] = None

class IngestRequest(BaseModel):
    url: str
    editor_id: Optional[str] = None

class ChatMessageRequest(BaseModel):
    session_id: Optional[str] = None
    article_id: Optional[str] = None
    message: str
    user_id: Optional[str] = None
    token: Optional[str] = None

class EventRequest(BaseModel):
    user_id: Optional[str] = None
    article_id: Optional[str] = None
    event_type: str
    metadata: Optional[dict] = None


# --- Authentication Endpoints ---

@app.post("/api/auth/register")
async def auth_register(req: RegisterRequest):
    if is_supabase_configured():
        try:
            res = supabase.auth.sign_up({
                "email": req.email,
                "password": req.password,
                "options": {
                    "data": {
                        "name": req.name,
                        "role": req.role
                    }
                }
            })
            if res.user:
                # Insert into profiles
                supabase.table("profiles").insert({
                    "id": res.user.id,
                    "name": req.name,
                    "role": req.role
                }).execute()
                
                return {
                    "user_id": res.user.id,
                    "email": req.email,
                    "name": req.name,
                    "role": req.role,
                    "session_token": res.session.access_token if res.session else f"mock-token-{res.user.id}"
                }
        except Exception as e:
            print(f"Supabase registration failed, falling back: {e}")

    # Fallback Mock Auth
    db = load_mock_db()
    if req.email in db["users"]:
        raise HTTPException(status_code=400, detail="User already registered.")
        
    user_id = str(uuid.uuid4())
    new_user = {
        "id": user_id,
        "email": req.email,
        "password": req.password,
        "name": req.name,
        "role": req.role
    }
    db["users"][req.email] = new_user
    db["profiles"][user_id] = {
        "id": user_id,
        "name": req.name,
        "role": req.role
    }
    save_mock_db(db)
    
    return {
        "user_id": user_id,
        "email": req.email,
        "name": req.name,
        "role": req.role,
        "session_token": f"mock-token-{user_id}"
    }

@app.post("/api/auth/login")
async def auth_login(req: LoginRequest):
    if is_supabase_configured():
        try:
            res = supabase.auth.sign_in_with_password({
                "email": req.email,
                "password": req.password
            })
            if res.user:
                profile_res = supabase.table("profiles").select("*").eq("id", res.user.id).execute()
                role = req.role
                name = req.email.split("@")[0]
                if profile_res.data:
                    role = profile_res.data[0].get("role", "reader")
                    name = profile_res.data[0].get("name", name)
                
                return {
                    "user_id": res.user.id,
                    "email": req.email,
                    "name": name,
                    "role": role,
                    "session_token": res.session.access_token
                }
        except Exception as e:
            print(f"Supabase login failed, falling back: {e}")

    # Fallback Mock Auth
    db = load_mock_db()
    user = db["users"].get(req.email)
    if not user or user["password"] != req.password:
        raise HTTPException(status_code=400, detail="Invalid credentials.")
        
    # Enforce role update if toggled differently during mock login
    if user["role"] != req.role:
        user["role"] = req.role
        if user["id"] in db["profiles"]:
            db["profiles"][user["id"]]["role"] = req.role
        save_mock_db(db)
        
    return {
        "user_id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "session_token": f"mock-token-{user['id']}"
    }

@app.get("/api/auth/session")
async def auth_session(token: str):
    if token.startswith("mock-token-"):
        user_id = token.replace("mock-token-", "")
        db = load_mock_db()
        profile = db["profiles"].get(user_id)
        if profile:
            return {
                "user_id": user_id,
                "name": profile["name"],
                "role": profile["role"]
            }
        raise HTTPException(status_code=401, detail="Session expired.")
        
    if is_supabase_configured():
        try:
            # Retrieve user from token
            res = supabase.auth.get_user(token)
            if res.user:
                profile_res = supabase.table("profiles").select("*").eq("id", res.user.id).execute()
                role = "reader"
                name = res.user.email.split("@")[0]
                if profile_res.data:
                    role = profile_res.data[0].get("role", "reader")
                    name = profile_res.data[0].get("name", name)
                return {
                    "user_id": res.user.id,
                    "name": name,
                    "role": role
                }
        except Exception as e:
            print(f"Supabase session retrieval failed: {e}")
            
    raise HTTPException(status_code=401, detail="Invalid session token.")


# --- CMS & Article Endpoints ---

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "supabase_configured": is_supabase_configured(),
        "groq_configured": bool(GROQ_API_KEY)
    }

# CMS Manual Article Creator
@app.post("/api/cms/articles")
async def create_article(req: ArticleCreateRequest):
    article_id = str(uuid.uuid4())
    url = f"lumen://dispatches/{article_id}"
    author = req.author or "Lumen Editors"
    
    # Save to database
    if is_supabase_configured():
        try:
            supabase.table("articles").insert({
                "id": article_id,
                "url": url,
                "title": req.title,
                "author": author,
                "body_text": req.body_text,
                "category": req.category,
                "status": "processing",
                "editor_id": req.editor_id
            }).execute()
            
            # Start background pipeline
            from celery_worker import process_article_pipeline
            process_article_pipeline.delay(url, article_id)
            
            return {
                "message": "Article saved and pipeline queued.",
                "article_id": article_id,
                "status": "processing"
            }
        except Exception as e:
            print(f"Supabase article insertion failed: {e}")

    # Fallback In-Memory
    db = load_mock_db()
    db["articles"][article_id] = {
        "id": article_id,
        "url": url,
        "title": req.title,
        "author": author,
        "body_text": req.body_text,
        "category": req.category,
        "status": "processing",
        "editor_id": req.editor_id or "mock-editor-id",
        "created_at": datetime.utcnow().isoformat() + "Z",
        "published_at": None
    }
    save_mock_db(db)
    
    # Run locally in a thread
    import threading
    from celery_worker import process_article_pipeline
    threading.Thread(target=lambda: process_article_pipeline(url, article_id)).start()
    
    return {
        "message": "Article saved locally. Pipeline processing queued.",
        "article_id": article_id,
        "status": "processing"
    }

# CMS Ingest URL
@app.post("/api/cms/ingest")
async def ingest_url(request: IngestRequest):
    article_id = str(uuid.uuid4())
    
    if is_supabase_configured():
        try:
            existing = supabase.table("articles").select("id, status").eq("url", request.url).execute()
            if existing.data:
                return {
                    "message": "Article already exists or is in progress.",
                    "article_id": existing.data[0]["id"],
                    "status": existing.data[0]["status"]
                }
            
            supabase.table("articles").insert({
                "id": article_id,
                "url": request.url,
                "status": "processing",
                "title": "Ingesting text...",
                "category": "General",
                "editor_id": request.editor_id
            }).execute()
            
            from celery_worker import process_article_pipeline
            process_article_pipeline.delay(request.url, article_id)
            return {
                "message": "Ingestion pipeline queued successfully.",
                "article_id": article_id,
                "status": "processing"
            }
        except Exception as e:
            print(f"Supabase URL check failed: {e}")

    # Fallback In-Memory
    db = load_mock_db()
    for art in db["articles"].values():
        if art["url"] == request.url:
            return {
                "message": "Article already exists or is in progress.",
                "article_id": art["id"],
                "status": art["status"]
            }
            
    db["articles"][article_id] = {
        "id": article_id,
        "url": request.url,
        "title": "Ingesting text...",
        "author": "Lumen Scraper",
        "body_text": "",
        "category": "General",
        "status": "processing",
        "editor_id": request.editor_id or "mock-editor-id",
        "created_at": datetime.utcnow().isoformat() + "Z"
    }
    save_mock_db(db)
    
    # Run in background thread
    import threading
    from celery_worker import process_article_pipeline
    threading.Thread(target=lambda: process_article_pipeline(request.url, article_id)).start()
    
    return {
        "message": "Ingestion pipeline queued locally.",
        "article_id": article_id,
        "status": "processing"
    }

# Fetch submissions for specific editor
@app.get("/api/cms/my-articles")
async def get_my_articles(editor_id: str):
    if is_supabase_configured():
        try:
            res = supabase.table("articles").select("*").eq("editor_id", editor_id).order("created_at", desc=True).execute()
            return res.data
        except Exception as e:
            print(f"Failed to fetch my-articles: {e}")
            
    # Fallback
    db = load_mock_db()
    my_articles = [art for art in db["articles"].values() if art.get("editor_id") == editor_id]
    my_articles.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return my_articles

# Get Ingestion Status/Queue List
@app.get("/api/cms/queue")
async def get_ingestion_queue():
    if is_supabase_configured():
        try:
            res = supabase.table("articles").select("id, url, title, category, status, created_at").order("created_at", desc=True).execute()
            return res.data
        except Exception as e:
            print(f"Failed to fetch queue: {e}")
            
    # Fallback
    db = load_mock_db()
    queue = list(db["articles"].values())
    queue.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return queue

# Fetch all articles
@app.get("/api/articles")
async def get_articles():
    if is_supabase_configured():
        try:
            res = supabase.table("articles").select("*").eq("status", "completed").order("created_at", desc=True).execute()
            return res.data
        except Exception as e:
            print(f"Failed to fetch articles: {e}")
            
    # Fallback
    db = load_mock_db()
    articles = [art for art in db["articles"].values() if art["status"] == "completed"]
    articles.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return articles

# Fetch article counts grouped by category
@app.get("/api/categories/counts")
async def get_category_counts():
    known_categories = ["AI", "Technology", "Science", "Politics", "Startups", "Lifestyle", "General"]
    counts = {cat: 0 for cat in known_categories}

    if is_supabase_configured():
        try:
            res = supabase.table("articles").select("category").eq("status", "completed").execute()
            for art in (res.data or []):
                cat = art.get("category", "General") or "General"
                if cat in counts:
                    counts[cat] += 1
                else:
                    counts["General"] += 1
            return counts
        except Exception as e:
            print(f"Failed to fetch category counts from Supabase: {e}")

    # Fallback to local JSON
    db = load_mock_db()
    for art in db["articles"].values():
        if art.get("status") != "completed":
            continue
        cat = art.get("category", "General") or "General"
        if cat in counts:
            counts[cat] += 1
        else:
            counts["General"] += 1
    return counts

# Fetch article details including cards
@app.get("/api/articles/{article_id}")
async def get_article(article_id: str):
    if is_supabase_configured():
        try:
            article_res = supabase.table("articles").select("*").eq("id", article_id).execute()
            if article_res.data:
                cards_res = supabase.table("swipe_cards").select("*").eq("article_id", article_id).order("card_index").execute()
                article = article_res.data[0]
                article["cards"] = cards_res.data
                return article
        except Exception as e:
            print(f"Failed to fetch article details: {e}")
            
    # Fallback
    db = load_mock_db()
    article = db["articles"].get(article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
        
    cards = db["swipe_cards"].get(article_id, [])
    cards.sort(key=lambda x: x.get("card_index", 0))
    
    ret = article.copy()
    ret["cards"] = cards
    return ret

# Attachment photo/file upload
@app.post("/api/cms/upload")
async def upload_file():
    # Return simulated image key categories to show premium default designs
    import random
    categories = ["ai", "space", "city"]
    return {
        "url": random.choice(categories),
        "filename": "attached_file.png"
    }

# DELETE manual/ingested article
@app.delete("/api/cms/articles/{article_id}")
async def delete_article(article_id: str):
    if is_supabase_configured():
        try:
            # Table definitions have CASCADE deletes for swipe_cards and chunks
            supabase.table("articles").delete().eq("id", article_id).execute()
            return {"status": "success", "message": "Article deleted successfully."}
        except Exception as e:
            print(f"Failed to delete article from Supabase: {e}")
            
    # Fallback delete
    db = load_mock_db()
    if article_id in db["articles"]:
        del db["articles"][article_id]
    if article_id in db["article_chunks"]:
        del db["article_chunks"][article_id]
    if article_id in db["swipe_cards"]:
        del db["swipe_cards"][article_id]
    save_mock_db(db)
    return {"status": "success", "message": "Article deleted locally."}

# EDIT manual/ingested article and re-run pipeline
@app.put("/api/cms/articles/{article_id}")
async def update_article(article_id: str, req: ArticleCreateRequest):
    url = f"lumen://dispatches/{article_id}"
    
    if is_supabase_configured():
        try:
            existing = supabase.table("articles").select("url").eq("id", article_id).execute()
            if existing.data:
                url = existing.data[0].get("url") or url
                
            supabase.table("articles").update({
                "title": req.title,
                "body_text": req.body_text,
                "category": req.category,
                "status": "processing"
            }).eq("id", article_id).execute()
            
            # Start pipeline background worker to re-generate everything!
            from celery_worker import process_article_pipeline
            process_article_pipeline.delay(url, article_id)
            return {"status": "processing", "article_id": article_id, "message": "Article updated, pipeline queued."}
        except Exception as e:
            print(f"Failed to update article in Supabase: {e}")
            
    # Fallback
    db = load_mock_db()
    art = db["articles"].get(article_id)
    if not art:
        raise HTTPException(status_code=404, detail="Article not found")
        
    url = art.get("url") or url
    art.update({
        "title": req.title,
        "body_text": req.body_text,
        "category": req.category,
        "status": "processing"
    })
    save_mock_db(db)
    
    # Run pipeline locally in background thread
    import threading
    from celery_worker import process_article_pipeline
    threading.Thread(target=lambda: process_article_pipeline(url, article_id)).start()
    
    return {"status": "processing", "article_id": article_id, "message": "Article updated locally. Pipeline queued."}


# --- RAG Chat ---

LUMEN_ABOUT_DOC = """
Lumen is a reading platform built for people who want to stay informed without wasting time.

Founder & Builder:
- Built by Samarth Kashyap.
- Samarth holds an MSc in Computer Science from RPTU (Rheinland-Pfälzische Technische Universität Kaiserslautern-Landau).
- He built Lumen because he was frustrated with how overwhelming and algorithm-driven modern news feeds had become.

What makes Lumen different:
- No ads, no infinite scroll, no clickbait.
- Designed to help readers actually finish what they start.
- Human-curated articles, not algorithm-picked content.

Key Features:
1. Two ways to read: Every article has a quick 3-card summary (takes about 90 seconds) and the full original text. You can switch between them anytime.
2. Curation Desk (CMS): Editors submit articles or paste external URLs. Once published, articles are automatically processed by the AI pipeline.
3. AI Pipeline: Three AI agents work together — one reads and analyzes the article, one writes the summary cards, and one polishes the language.
4. AI Chat: Signed-in readers can ask questions about any article or search across the whole feed. The system finds relevant passages to answer your question.
5. Analytics: Editors can see how many people read their articles, how long they spend, and which topics are popular.

Access:
- Anyone can browse the top 3 articles for free without signing up.
- Sign in to access the full feed, AI chat, and article search.
"""

def is_token_authenticated(token: Optional[str]) -> bool:
    if not token:
        return False
    if token.startswith("mock-token-"):
        user_id = token.replace("mock-token-", "")
        try:
            db = load_mock_db()
            return user_id in db["profiles"]
        except Exception:
            return False
    if is_supabase_configured():
        try:
            res = supabase.auth.get_user(token)
            return res.user is not None
        except Exception:
            return False
    return False

@app.post("/api/chat/message")
async def send_chat_message(request: ChatMessageRequest):
    session_id = request.session_id
    if is_supabase_configured():
        try:
            if not session_id:
                new_session = supabase.table("chat_sessions").insert({"user_id": request.user_id}).execute()
                session_id = new_session.data[0]["id"]
        except Exception as e:
            session_id = "mock-session-id"
    else:
        session_id = session_id or f"mock-session-{str(uuid.uuid4())[:8]}"

    query = request.message
    context_chunks = []
    
    is_auth = is_token_authenticated(request.token)
    
    if is_auth:
        # User is authenticated: RAG flow runs
        if is_supabase_configured():
            try:
                model = get_embedding_model()
                query_vector = model.encode(query).tolist()
                if request.article_id:
                    rpc_res = supabase.rpc("match_chunks", {
                        "query_embedding": query_vector,
                        "match_threshold": 0.2,
                        "match_count": 5
                    }).execute()
                    context_chunks = [c for c in rpc_res.data if c.get("article_id") == request.article_id]
                else:
                    rpc_res = supabase.rpc("match_chunks", {
                        "query_embedding": query_vector,
                        "match_threshold": 0.2,
                        "match_count": 5
                    }).execute()
                    context_chunks = rpc_res.data
            except Exception as e:
                print(f"Embedding/Search failure: {e}")
                
        # Fallback search if empty context
        if not context_chunks:
            db = load_mock_db()
            # Word-overlap search fallback
            query_words = set(query.lower().split())
            candidates = []
            for art_id, chunks in db["article_chunks"].items():
                if request.article_id and art_id != request.article_id:
                    continue
                for chunk in chunks:
                    chunk_words = set(chunk["content_text"].lower().split())
                    intersection = query_words.intersection(chunk_words)
                    score = len(intersection) / max(1, len(query_words))
                    if score > 0.05:
                        candidates.append((score, chunk))
            candidates.sort(key=lambda x: x[0], reverse=True)
            context_chunks = [c[1] for c in candidates[:5]]

        # Prompt construction for authenticated RAG
        context_str = "\n\n".join([c.get("content_text", c.get("content", "")) for c in context_chunks])
        system_prompt = (
            "You are Lumen AI, a helpful reading assistant. Keep your tone friendly, clear, and conversational. "
            "Avoid academic or overly formal language. Write like you're explaining things to a smart friend. "
            "Keep responses to 2-3 short paragraphs. Use bullet points when listing things. "
            "If asked about Lumen's creator, mention that it was built by Samarth Kashyap, "
            "who holds an MSc in Computer Science from RPTU.\n\n"
            "Use the following article snippets to answer the user's question:\n\n"
            f"--- CONTEXT ---\n{context_str}\n----------------"
        )
    else:
        # User is NOT authenticated: general chatbot about Lumen runs
        system_prompt = (
            "You are the Lumen Assistant, a friendly and helpful guide to the Lumen platform. "
            "The user is not signed in, so you can't access any articles. "
            "Your job is to answer questions about how Lumen works — its features, how to get started, and what makes it different. "
            "Use bullet points to keep things clear. Keep your tone warm and conversational, not formal or academic. "
            "Encourage them to sign in or create a free account to read articles and ask questions about them.\n\n"
            "Here is a summary of what Lumen is and how it works:\n\n"
            f"--- LUMEN INFO ---\n{LUMEN_ABOUT_DOC}\n----------------\n\n"
            "Keep responses to 2-3 short paragraphs."
        )

    # Save user message to database
    if is_supabase_configured():
        try:
            supabase.table("chat_messages").insert({
                "session_id": session_id,
                "sender": "user",
                "content": query
            }).execute()
        except Exception as e:
            print(f"Error logging message: {e}")

    assistant_response = ""
    if groq_client:
        try:
            completion = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": query}
                ],
                temperature=0.5,
                max_tokens=600
            )
            assistant_response = completion.choices[0].message.content
        except Exception as e:
            assistant_response = f"Something went wrong on our end: {str(e)}. Try asking again in a moment."
    else:
        # Mock response when Groq is not configured
        if is_auth:
            assistant_response = (
                "Here's what I found based on your question:\n"
                "- The article covers this topic in detail, with a focus on practical takeaways.\n"
                "- Lumen's AI search looks for the most relevant passages to match your question.\n"
                "- Try asking something more specific and I'll narrow down the results."
            )
        else:
            assistant_response = (
                "Hi! Since you're not signed in, here's a quick overview of Lumen:\n"
                "- No ads — Lumen is a clean reading platform with no tracking or clickbait.\n"
                "- Every article comes with a 3-card AI summary, plus the full original text.\n"
                "- You can ask questions about any article using the AI chat.\n\n"
                "Sign in or create a free account to start reading and asking questions."
            )

    # Save assistant message
    if is_supabase_configured():
        try:
            supabase.table("chat_messages").insert({
                "session_id": session_id,
                "sender": "assistant",
                "content": assistant_response
            }).execute()
        except Exception as e:
            print(f"Error logging assistant response: {e}")

    return {
        "session_id": session_id,
        "response": assistant_response,
        "sources": [c.get("article_id") for c in context_chunks if "article_id" in c]
    }


# --- Analytics & Events ---

@app.post("/api/events")
async def log_event(request: EventRequest):
    event_data = {
        "id": str(uuid.uuid4()),
        "user_id": request.user_id,
        "article_id": request.article_id,
        "event_type": request.event_type,
        "metadata": request.metadata,
        "created_at": datetime.utcnow().isoformat()
    }
    if is_supabase_configured():
        try:
            supabase.table("analytics_events").insert(event_data).execute()
            return {"status": "logged"}
        except Exception as e:
            print(f"Analytics logging error: {e}")
    # Always persist to mock_db as fallback/local store
    db = load_mock_db()
    db.setdefault("events", []).append(event_data)
    save_mock_db(db)
    return {"status": "logged"}

@app.get("/api/analytics/summary")
async def get_analytics_summary():
    DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    if is_supabase_configured():
        try:
            articles_res = supabase.table("articles").select("category, status").execute()
            articles = articles_res.data or []
            profiles_res = supabase.table("profiles").select("id").execute()
            total_users = len(profiles_res.data or [])
            events_res = supabase.table("analytics_events").select("event_type, metadata, created_at").execute()
            events = events_res.data or []
        except Exception:
            articles, events, total_users = [], [], 0
    else:
        db = load_mock_db()
        articles = list(db.get("articles", {}).values())
        total_users = len(db.get("users", {}))
        events = db.get("events", [])

    # --- Article counts ---
    completed = [a for a in articles if a.get("status") == "completed"]
    total_articles = len(completed)

    # --- Real event aggregation ---
    total_views = sum(1 for e in events if e.get("event_type") == "view")
    total_swipes = sum(1 for e in events if e.get("event_type") == "swipe")
    total_reads = sum(1 for e in events if e.get("event_type") == "read")

    dwell_times = [
        e.get("metadata", {}).get("seconds", 0)
        for e in events
        if e.get("event_type") == "dwell_time" and isinstance(e.get("metadata"), dict)
    ]
    dwell_time_avg = round(sum(dwell_times) / len(dwell_times)) if dwell_times else 0

    # --- Weekly chart from real timestamps ---
    day_swipes = {d: 0 for d in DAYS}
    day_reads = {d: 0 for d in DAYS}
    for e in events:
        try:
            ts = e.get("created_at", "")
            if ts:
                from datetime import timezone
                dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                day_name = dt.strftime("%a")  # Mon, Tue …
                if e.get("event_type") == "swipe" and day_name in day_swipes:
                    day_swipes[day_name] += 1
                elif e.get("event_type") == "read" and day_name in day_reads:
                    day_reads[day_name] += 1
        except Exception:
            pass

    swipe_rate_by_day = [
        {"day": d, "swipes": day_swipes[d], "reads": day_reads[d]}
        for d in DAYS
    ]

    # --- Category distribution from articles ---
    cat_counts: dict = {}
    for a in completed:
        cat = a.get("category") or "General"
        cat_counts[cat] = cat_counts.get(cat, 0) + 1

    total_cat = sum(cat_counts.values()) or 1
    category_distribution = [
        {"name": name, "value": round(count / total_cat * 100)}
        for name, count in sorted(cat_counts.items(), key=lambda x: -x[1])
    ] or [{"name": "No articles yet", "value": 100}]

    return {
        "total_users": total_users,
        "total_articles": total_articles,
        "total_views": total_views,
        "total_swipes": total_swipes,
        "total_reads": total_reads,
        "dwell_time_avg": dwell_time_avg,
        "swipe_rate_by_day": swipe_rate_by_day,
        "category_distribution": category_distribution,
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
