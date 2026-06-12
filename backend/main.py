import os
import json
import uuid
import re
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


def safe_uuid(val: Optional[str]) -> Optional[str]:
    """
    Validates if the provided value is a valid UUID.
    Returns the string value if valid, otherwise returns None.
    This protects Supabase query foreign key fields from failing with bad uuid syntax.
    """
    if not val:
        return None
    try:
        uuid.UUID(str(val))
        return str(val)
    except ValueError:
        return None

def dispatch_pipeline(url: str, article_id: str):
    """
    Dispatches the multi-agent ingestion pipeline.
    Checks if a remote REDIS_URL is configured to use Celery delay.
    If not configured or if delay raises an error, falls back to a background thread.
    """
    redis_url = os.getenv("REDIS_URL", "")
    use_celery = bool(redis_url and "localhost" not in redis_url and "127.0.0.1" not in redis_url)
    
    if use_celery:
        try:
            from celery_worker import process_article_pipeline
            process_article_pipeline.delay(url, article_id)
            print(f"[Pipeline Dispatch] Dispatched via Celery task queue for article {article_id}")
            return
        except Exception as e:
            print(f"[Pipeline Dispatch Warning] Celery dispatch failed: {e}. Falling back to Thread.")
            
    # Fallback to local background thread
    import threading
    from celery_worker import process_article_pipeline
    threading.Thread(target=lambda: process_article_pipeline(url, article_id)).start()
    print(f"[Pipeline Dispatch] Dispatched via background Thread for article {article_id}")


# --- Local Fallback Database Helper ---

def is_supabase_configured():
    return SUPABASE_URL != "https://your-supabase-url.supabase.co" and SUPABASE_KEY != "your-supabase-key"


# --- Schemas ---

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "editor"

class LoginRequest(BaseModel):
    email: str
    password: str
    role: Optional[str] = "editor"

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    password: str

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

class AdminLoginRequest(BaseModel):
    email: str
    password: str

class ChangeRoleRequest(BaseModel):
    role: str



# --- Authentication Endpoints ---

@app.post("/api/auth/register")
async def auth_register(req: RegisterRequest):
    if not is_supabase_configured():
        raise HTTPException(status_code=500, detail="Database is not configured")
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
                "role": req.role or "editor",
                "session_token": res.session.access_token if res.session else None
            }
        else:
            raise HTTPException(status_code=500, detail="Registration failed, no user returned")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Supabase registration failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/login")
async def auth_login(req: LoginRequest):
    if not is_supabase_configured():
        raise HTTPException(status_code=500, detail="Database is not configured")
    try:
        res = supabase.auth.sign_in_with_password({
            "email": req.email,
            "password": req.password
        })
        if res.user:
            profile_res = supabase.table("profiles").select("*").eq("id", res.user.id).execute()
            role = req.role or "editor"
            name = req.email.split("@")[0]
            if not profile_res.data:
                try:
                    supabase.table("profiles").insert({
                        "id": res.user.id,
                        "name": name,
                        "role": role
                    }).execute()
                    print(f"[Auto-heal] Created missing profile in Supabase on login for user {res.user.id}")
                except Exception as pe:
                    print(f"[Auto-heal Warning] Failed to create missing profile: {pe}")
            else:
                role = profile_res.data[0].get("role", "editor")
                name = profile_res.data[0].get("name", name)
            
            return {
                "user_id": res.user.id,
                "email": req.email,
                "name": name,
                "role": role,
                "session_token": res.session.access_token if res.session else None
            }
        else:
            raise HTTPException(status_code=400, detail="Invalid credentials.")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Supabase login failed: {e}")
        raise HTTPException(status_code=400, detail="Invalid credentials or login failed.")

@app.get("/api/auth/session")
async def auth_session(token: str):
    if not is_supabase_configured():
        raise HTTPException(status_code=500, detail="Database is not configured")
    try:
        # Retrieve user from token
        res = supabase.auth.get_user(token)
        if res.user:
            profile_res = supabase.table("profiles").select("*").eq("id", res.user.id).execute()
            role = "reader"
            name = res.user.email.split("@")[0]
            if not profile_res.data:
                try:
                    supabase.table("profiles").insert({
                        "id": res.user.id,
                        "name": name,
                        "role": role
                    }).execute()
                    print(f"[Auto-heal] Created missing profile in Supabase on session validation for user {res.user.id}")
                except Exception as pe:
                    print(f"[Auto-heal Warning] Failed to create missing profile: {pe}")
            else:
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


@app.post("/api/auth/forgot-password")
async def auth_forgot_password(req: ForgotPasswordRequest):
    if not is_supabase_configured():
        raise HTTPException(status_code=500, detail="Database is not configured")
    try:
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        redirect_url = f"{frontend_url.rstrip('/')}/reset-password"
        supabase.auth.reset_password_for_email(req.email, {
            "redirect_to": redirect_url
        })
        return {"message": "Password reset email sent."}
    except Exception as e:
        print(f"Supabase forgot password failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/auth/reset-password")
async def auth_reset_password(req: ResetPasswordRequest):
    if not is_supabase_configured():
        raise HTTPException(status_code=500, detail="Database is not configured")
    try:
        res = supabase.auth.get_user(req.token)
        if not res or not res.user:
            raise HTTPException(status_code=401, detail="Invalid or expired reset token.")
        
        # Update user password using admin SDK (assumes service role key)
        supabase.auth.admin.update_user_by_id(res.user.id, {
            "password": req.password
        })
        return {"message": "Password updated successfully."}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Supabase reset password failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/auth/login/google")
def auth_login_google(redirect_to: Optional[str] = None):
    if not is_supabase_configured():
        raise HTTPException(status_code=500, detail="Database is not configured")
    from fastapi.responses import RedirectResponse
    frontend_url = redirect_to or os.getenv("FRONTEND_URL", "http://localhost:5173")
    callback_url = f"{frontend_url.rstrip('/')}/oauth-callback"
    oauth_url = f"{SUPABASE_URL.rstrip('/')}/auth/v1/authorize?provider=google&redirect_to={callback_url}"
    return RedirectResponse(oauth_url)


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
    if not is_supabase_configured():
        raise HTTPException(status_code=500, detail="Database is not configured")
    
    article_id = str(uuid.uuid4())
    url = f"lumen://dispatches/{article_id}"
    author = req.author or "Lumen Editors"
    
    try:
        supabase.table("articles").insert({
            "id": article_id,
            "url": url,
            "title": req.title,
            "author": author,
            "body_text": req.body_text,
            "category": req.category,
            "status": "processing",
            "editor_id": safe_uuid(req.editor_id)
        }).execute()
        
        # Start background pipeline
        dispatch_pipeline(url, article_id)
        
        return {
            "message": "Article saved and pipeline queued.",
            "article_id": article_id,
            "status": "processing"
        }
    except Exception as e:
        print(f"Supabase article insertion failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to save article")

# CMS Ingest URL
@app.post("/api/cms/ingest")
async def ingest_url(request: IngestRequest):
    if not is_supabase_configured():
        raise HTTPException(status_code=500, detail="Database is not configured")
    article_id = str(uuid.uuid4())
    
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
            "editor_id": safe_uuid(request.editor_id)
        }).execute()
        
        dispatch_pipeline(request.url, article_id)
        return {
            "message": "Ingestion pipeline queued successfully.",
            "article_id": article_id,
            "status": "processing"
        }
    except Exception as e:
        print(f"Supabase URL check failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to queue ingestion")

# Fetch submissions for specific editor
@app.get("/api/cms/my-articles")
async def get_my_articles(editor_id: str):
    if not is_supabase_configured():
        raise HTTPException(status_code=500, detail="Database is not configured")
    try:
        res = supabase.table("articles").select("*").eq("editor_id", editor_id).order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        print(f"Failed to fetch my-articles: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch articles.")

# Get Ingestion Status/Queue List
@app.get("/api/cms/queue")
async def get_ingestion_queue():
    if not is_supabase_configured():
        raise HTTPException(status_code=500, detail="Database is not configured")
    try:
        res = supabase.table("articles").select("id, url, title, category, status, created_at").order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        print(f"Failed to fetch queue: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch queue.")

# Fetch all articles
@app.get("/api/articles")
async def get_articles():
    if not is_supabase_configured():
        raise HTTPException(status_code=500, detail="Database is not configured")
    try:
        res = supabase.table("articles").select("*").eq("status", "completed").order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        print(f"Failed to fetch articles: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch articles.")

# Fetch article counts grouped by category
@app.get("/api/categories/counts")
async def get_category_counts():
    if not is_supabase_configured():
        raise HTTPException(status_code=500, detail="Database is not configured")
    known_categories = ["AI", "Technology", "Science", "Politics", "Startups", "Lifestyle", "General"]
    counts = {cat: 0 for cat in known_categories}

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
        raise HTTPException(status_code=500, detail="Failed to fetch category counts.")

# Fetch article details including cards
@app.get("/api/articles/{article_id}")
async def get_article(article_id: str):
    if not is_supabase_configured():
        raise HTTPException(status_code=500, detail="Database is not configured")
    try:
        article_res = supabase.table("articles").select("*").eq("id", article_id).execute()
        if article_res.data:
            cards_res = supabase.table("swipe_cards").select("*").eq("article_id", article_id).order("card_index").execute()
            article = article_res.data[0]
            article["cards"] = cards_res.data
            return article
        else:
            raise HTTPException(status_code=404, detail="Article not found")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Failed to fetch article details: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch article details.")

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
    if not is_supabase_configured():
        raise HTTPException(status_code=500, detail="Database is not configured")
    try:
        # Table definitions have CASCADE deletes for swipe_cards and chunks
        supabase.table("articles").delete().eq("id", article_id).execute()
        return {"status": "success", "message": "Article deleted successfully."}
    except Exception as e:
        print(f"Failed to delete article from Supabase: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete article.")

# EDIT manual/ingested article and re-run pipeline
@app.put("/api/cms/articles/{article_id}")
async def update_article(article_id: str, req: ArticleCreateRequest):
    if not is_supabase_configured():
        raise HTTPException(status_code=500, detail="Database is not configured")
        
    url = f"lumen://dispatches/{article_id}"
    
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
        dispatch_pipeline(url, article_id)
        return {"status": "processing", "article_id": article_id, "message": "Article updated, pipeline queued."}
    except Exception as e:
        print(f"Failed to update article in Supabase: {e}")
        raise HTTPException(status_code=500, detail="Failed to update article.")


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
    if not token or not is_supabase_configured():
        return False
    try:
        res = supabase.auth.get_user(token)
        return res.user is not None
    except Exception:
        return False

@app.post("/api/chat/message")
async def send_chat_message(request: ChatMessageRequest):
    session_id = request.session_id
    if not is_supabase_configured():
        raise HTTPException(status_code=500, detail="Database is not configured")
    try:
        if not session_id:
            new_session = supabase.table("chat_sessions").insert({"user_id": request.user_id}).execute()
            session_id = new_session.data[0]["id"]
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to initiate chat session")

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
                    # 1. Try RPC first
                    try:
                        rpc_res = supabase.rpc("match_chunks", {
                            "query_embedding": query_vector,
                            "match_threshold": 0.2,
                            "match_count": 5
                        }).execute()
                        context_chunks = [c for c in rpc_res.data if c.get("article_id") == request.article_id]
                        
                        if not context_chunks:
                            raise Exception("RPC returned no chunks for this article")
                    except Exception as e:
                        print(f"Fallback to local RAG for article {request.article_id}. Reason: {e}")
                        chunk_res = supabase.table("article_chunks").select("content_text, embedding").eq("article_id", request.article_id).execute()
                        if chunk_res.data:
                            import numpy as np
                            from numpy.linalg import norm
                            q_vec = np.array(query_vector)
                            scored_chunks = []
                            for c in chunk_res.data:
                                if "embedding" in c and c["embedding"]:
                                    emb_val = c["embedding"]
                                    if isinstance(emb_val, str):
                                        import json
                                        emb_val = json.loads(emb_val)
                                    c_emb = np.array(emb_val)
                                    score = np.dot(q_vec, c_emb) / (norm(q_vec) * norm(c_emb))
                                    scored_chunks.append((score, c))
                            scored_chunks.sort(key=lambda x: x[0], reverse=True)
                            context_chunks = [c[1] for c in scored_chunks[:5]]
                else:
                    rpc_res = supabase.rpc("match_chunks", {
                        "query_embedding": query_vector,
                        "match_threshold": 0.2,
                        "match_count": 5
                    }).execute()
                    context_chunks = rpc_res.data
            except Exception as e:
                print(f"Embedding/Search failure: {e}")
                
        if not context_chunks:
            # Fallback search if empty context
            pass

        # Prompt construction for authenticated RAG
        context_str = "\n\n".join([c.get("content_text", c.get("content", "")) for c in context_chunks])
        system_prompt = (
            "You are Lumen AI, a helpful reading assistant. Keep your tone friendly, clear, and conversational. "
            "Avoid academic or overly formal language. Write like you're explaining things to a smart friend. "
            "Keep responses to 2-3 short paragraphs. Use bullet points when listing things. "
            "If asked about Lumen's creator, mention that it was built by Samarth Kashyap, "
            "who holds an MSc in Computer Science from RPTU.\n\n"
            "CRITICAL GUARDRAIL: You are STRICTLY grounded to only answer questions about the provided article snippets, "
            "the current reading context, or the Lumen platform itself. If the user asks anything off-topic (e.g. general "
            "coding, recipes, unrelated facts, writing unrelated content, etc.), you MUST politely decline to answer, "
            "explaining that you are only allowed to answer questions regarding the active article or Lumen.\n\n"
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
            "CRITICAL GUARDRAIL: You must ONLY answer questions about the Lumen platform (its features, creator Samarth Kashyap, "
            "how to use it, etc.). If the user asks about any other topic, you must politely decline to answer, "
            "explaining that your sole purpose is to assist with questions about Lumen.\n\n"
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
    if not is_supabase_configured():
        raise HTTPException(status_code=500, detail="Database is not configured")
    event_data = {
        "id": str(uuid.uuid4()),
        "user_id": request.user_id,
        "article_id": request.article_id,
        "event_type": request.event_type,
        "metadata": request.metadata,
        "created_at": datetime.utcnow().isoformat()
    }

    try:
        supabase_event = {
            "id": event_data["id"],
            "user_id": safe_uuid(event_data["user_id"]),
            "article_id": safe_uuid(event_data["article_id"]),
            "event_type": event_data["event_type"],
            "metadata": event_data["metadata"],
            "timestamp": event_data["created_at"]
        }
        supabase.table("analytics_events").insert(supabase_event).execute()
    except Exception as e:
        print(f"Analytics logging error: {e}")
        raise HTTPException(status_code=500, detail="Failed to log event")

    return {"status": "logged"}

@app.get("/api/analytics/summary")
async def get_analytics_summary():
    if not is_supabase_configured():
        raise HTTPException(status_code=500, detail="Database is not configured")
    DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    try:
        articles_res = supabase.table("articles").select("category, status").execute()
        articles = articles_res.data or []
        profiles_res = supabase.table("profiles").select("id").execute()
        total_users = len(profiles_res.data or [])
        events_res = supabase.table("analytics_events").select("*").execute()
        events = events_res.data or []
    except Exception as e:
        print(f"Supabase analytics fetch failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch analytics")
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
            ts = e.get("created_at") or e.get("timestamp") or ""
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


# --- Admin Endpoints ---

@app.post("/api/admin/login")
async def admin_login(req: AdminLoginRequest):
    if req.email == "admin@lumenbrief.com" and req.password == "admin_samarth@lumenbrief":
        return {
            "user_id": "admin-id-placeholder",
            "email": req.email,
            "name": "Samarth Kashyap (Admin)",
            "role": "admin",
            "session_token": "admin-session-token-secret-12345"
        }
    raise HTTPException(status_code=400, detail="Invalid admin credentials.")

@app.get("/api/admin/users")
async def admin_get_users(token: str):
    if token != "admin-session-token-secret-12345":
        raise HTTPException(status_code=401, detail="Unauthorized admin access.")
    if not is_supabase_configured():
        raise HTTPException(status_code=500, detail="Database is not configured")
    try:
        auth_users = []
        try:
            res = supabase.auth.admin.list_users()
            if hasattr(res, 'users'):
                auth_users = res.users
            elif isinstance(res, list):
                auth_users = res
            elif isinstance(res, dict) and 'users' in res:
                auth_users = res['users']
            else:
                auth_users = getattr(res, 'data', [])
        except Exception as ae:
            print(f"Error fetching auth users: {ae}")
            
        profiles_res = supabase.table("profiles").select("*").execute()
        profiles_map = {p["id"]: p for p in (profiles_res.data or [])}
        
        combined_users = []
        for u in auth_users:
            u_id = getattr(u, 'id', None) or (u.get('id') if isinstance(u, dict) else None)
            u_email = getattr(u, 'email', None) or (u.get('email') if isinstance(u, dict) else None)
            u_created_at = getattr(u, 'created_at', None) or (u.get('created_at') if isinstance(u, dict) else None)
            
            if not u_id:
                continue
                
            profile = profiles_map.get(u_id, {})
            combined_users.append({
                "id": u_id,
                "email": u_email or "N/A",
                "name": profile.get("name") or (u_email.split("@")[0] if u_email else "Unknown User"),
                "role": profile.get("role") or "reader",
                "created_at": u_created_at or profile.get("created_at")
            })
            
        auth_user_ids = {u["id"] for u in combined_users}
        for p_id, p in profiles_map.items():
            if p_id not in auth_user_ids:
                combined_users.append({
                    "id": p_id,
                    "email": "local-mock-user@lumen.app",
                    "name": p.get("name") or "Local Mock",
                    "role": p.get("role") or "reader",
                    "created_at": p.get("created_at")
                })
                
        return combined_users
    except Exception as e:
        print(f"Admin list users failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/admin/users/{user_id}")
async def admin_delete_user(user_id: str, token: str):
    if token != "admin-session-token-secret-12345":
        raise HTTPException(status_code=401, detail="Unauthorized admin access.")
    if not is_supabase_configured():
        raise HTTPException(status_code=500, detail="Database is not configured")
    try:
        try:
            supabase.auth.admin.delete_user(user_id)
        except Exception as ae:
            print(f"Could not delete from auth: {ae}")
            
        supabase.table("profiles").delete().eq("id", user_id).execute()
        return {"status": "success", "message": "User deleted successfully."}
    except Exception as e:
        print(f"Admin delete user failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/admin/users/{user_id}/role")
async def admin_change_user_role(user_id: str, req: ChangeRoleRequest, token: str):
    if token != "admin-session-token-secret-12345":
        raise HTTPException(status_code=401, detail="Unauthorized admin access.")
    if not is_supabase_configured():
        raise HTTPException(status_code=500, detail="Database is not configured")
    try:
        supabase.table("profiles").update({"role": req.role}).eq("id", user_id).execute()
        try:
            supabase.auth.admin.update_user_by_id(user_id, {
                "user_metadata": {"role": req.role}
            })
        except Exception as ae:
            print(f"Could not update auth metadata: {ae}")
            
        return {"status": "success", "message": f"User role updated to {req.role}."}
    except Exception as e:
        print(f"Admin change role failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/articles")
async def admin_get_articles(token: str):
    if token != "admin-session-token-secret-12345":
        raise HTTPException(status_code=401, detail="Unauthorized admin access.")
    if not is_supabase_configured():
        raise HTTPException(status_code=500, detail="Database is not configured")
    try:
        res = supabase.table("articles").select("*").order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        print(f"Admin fetch articles failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch articles.")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
