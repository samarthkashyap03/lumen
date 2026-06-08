import os
from .analyzer import AnalyzerAgent
from .chunker import ChunkerAgent
from .generator import GeneratorAgent
from .optimizer import OptimizerAgent
from .embedding import EmbeddingAgent
from .publishing import PublishingAgent

def run_ingestion_pipeline(url: str, article_id: str) -> bool:
    """
    Orchestrates the new 3-Agent Multi-AI-Agent pipeline:
    1. Scrapes URL (if not manually composed draft starting with lumen://).
    2. Chunks and Vectorizes text immediately for RAG retrieval.
    3. AI Agent 1 (Analyzer): Conducts theme, tone, and guidance analysis.
    4. AI Agent 2 (Card Generator): Compiles raw cards using Agent 1's report.
    5. AI Agent 3 (Optimizer): Copywrites and formats cards (using asterisks).
    6. Persistence: Saves results to DB (Supabase or local JSON) and flips status to completed.
    """
    from main import is_supabase_configured, supabase
    
    print(f"[Pipeline] Fetching initial text content for article ID: {article_id}")
    
    title = ""
    author = "Lumen Editors"
    extracted_text = ""
    category = "General"
    
    if not is_supabase_configured():
        raise Exception("Database is not configured")
        
    try:
        res = supabase.table("articles").select("*").eq("id", article_id).execute()
        if res.data:
            art = res.data[0]
            title = art.get("title") or ""
            author = art.get("author") or "Lumen Editors"
            extracted_text = art.get("body_text") or ""
            category = art.get("category") or "General"
    except Exception as e:
        print(f"[Pipeline Loader Error] Supabase fetch failed: {e}")
        raise e

    state = {
        "url": url,
        "article_id": article_id,
        "raw_html": "",
        "extracted_text": extracted_text,
        "title": title,
        "author": author,
        "category": category,
        "published_at": None,
        "chunks": [],
        "raw_cards": [],
        "analysis_report": {},
        "optimized_cards": [],
        "chunk_embeddings": [],
        "status": "processing"
    }

    # Scraper step (Run if we are ingesting from a raw URL instead of the manual editor composer)
    if not state["extracted_text"]:
        print("[Pipeline] Extracted text is empty. Running Web Scraper...")
        analyzer = AnalyzerAgent()
        scraped = analyzer.scrape_url(url)
        state.update(scraped)
        
        # Save scraped text back to database so it is persistently available
        try:
            supabase.table("articles").update({
                "title": state["title"],
                "author": state["author"],
                "body_text": state["extracted_text"],
                "category": state["category"]
            }).eq("id", article_id).execute()
        except Exception as e:
            print(f"[Pipeline] Database update of scraped article failed: {e}")

    if not state.get("extracted_text"):
        print("[Pipeline Error] No body text extracted. Aborting.")
        # Mark as failed in DB
        update_article_status(article_id, "failed")
        return False

    # Chunker Agent (Runs immediately to populate RAG chunks)
    print("[Pipeline] Splitting text into semantic paragraphs...")
    chunker = ChunkerAgent()
    state = chunker.run(state)
    if not state.get("chunks"):
        print("[Pipeline Error] Chunker failed.")
        update_article_status(article_id, "failed")
        return False

    # Embedding Agent (Generates vector representations for RAG search)
    print("[Pipeline] Generating semantic vector embeddings for chunks...")
    embedding_agent = EmbeddingAgent()
    state = embedding_agent.run(state)
    if not state.get("chunk_embeddings"):
        print("[Pipeline Error] Vector generation failed.")
        update_article_status(article_id, "failed")
        return False

    # --- AI MULTI-AGENT PIPELINE ---
    try:
        # 1. AI Agent 1 (Analyzer): Conducts semantic report analysis
        print("[Pipeline] Running AI Agent 1 (Analyzer)...")
        analyzer = AnalyzerAgent()
        state = analyzer.run(state)

        # Override article title if Agent 1 recommended a punchy title
        report = state.get("analysis_report", {})
        if isinstance(report, dict) and "punchy_article_title" in report:
            new_title = report["punchy_article_title"].strip()
            if new_title:
                print(f"[Pipeline] Overriding article title with AI punchy title: '{new_title}' (was '{state['title']}')")
                state["title"] = new_title

        # 2. AI Agent 2 (Card Generator): Compiles raw cards using Agent 1 recommendations
        print("[Pipeline] Running AI Agent 2 (Card Generator)...")
        generator = GeneratorAgent()
        state = generator.run(state)

        # 3. AI Agent 3 (Optimizer): Refines card copywriting and styles markup
        print("[Pipeline] Running AI Agent 3 (Optimizer)...")
        optimizer = OptimizerAgent()
        state = optimizer.run(state)

        # Persistence: Write results to DB and flip status to completed
        print("[Pipeline] Persisting final article structure...")
        publishing_agent = PublishingAgent()
        success = publishing_agent.run(state)
        
        if not success:
            raise Exception("Publishing Agent failed to persist results.")
            
        return success
    except Exception as e:
        print(f"[Pipeline Error] {e}")
        update_article_error(article_id, str(e))
        raise e

def update_article_status(article_id: str, status: str):
    """Fallback helper to update status if any segment of the pipeline crashes."""
    from main import supabase
    try:
        supabase.table("articles").update({"status": status}).eq("id", article_id).execute()
    except Exception:
        pass

def update_article_error(article_id: str, err_msg: str):
    """Helper to update status to failed and set the title to show the exact error message."""
    from main import supabase
    clean_err = f"Pipeline Error: {err_msg}"
    try:
        supabase.table("articles").update({
            "status": "failed",
            "title": clean_err[:120]
        }).eq("id", article_id).execute()
    except Exception:
        pass
