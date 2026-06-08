import os
import sys

# Ensure the backend directory is in the python path for workers and tasks
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from celery import Celery


# Load environment variables from .env if present
env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ[key.strip()] = val.strip().strip('"').strip("'")

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Initialize Celery
celery_app = Celery(
    "lumen_worker",
    broker=REDIS_URL,
    backend=REDIS_URL
)

# Optional configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

@celery_app.task(name="process_article_pipeline")
def process_article_pipeline(url: str, article_id: str):
    """
    Background worker task that runs the multi-agent ingestion pipeline:
    Analyzer -> Chunker -> Generator -> Validator -> Optimizer -> Embedding -> Publishing
    """
    print(f"--- STARTING MULTI-AGENT INGESTION PIPELINE FOR {url} (ID: {article_id}) ---")
    
    try:
        # Import pipeline inside task to avoid circular references and lazy-load dependencies
        from agents.pipeline import run_ingestion_pipeline
        
        result = run_ingestion_pipeline(url, article_id)
        if result:
            print(f"--- PIPELINE COMPLETED SUCCESSFULLY FOR ARTICLE ID: {article_id} ---")
            return {"status": "success", "article_id": article_id}
        else:
            print(f"--- PIPELINE RETURNED FALSE/FAILED FOR ARTICLE ID: {article_id} ---")
            return {"status": "failed", "article_id": article_id, "reason": "Pipeline script returned False"}
            
    except Exception as e:
        print(f"--- PIPELINE CATASTROPHIC ERROR FOR ARTICLE ID: {article_id}: {str(e)} ---")
        import traceback
        traceback.print_exc()
        
        # Mark article as failed in database (Supabase or local JSON)
        try:
            from main import is_supabase_configured, supabase
            err_msg = f"Processing Error: {str(e)}"
            if is_supabase_configured():
                supabase.table("articles").update({
                    "status": "failed",
                    "title": err_msg[:120]
                }).eq("id", article_id).execute()
            else:
                print("Supabase not configured, cannot update failure state.")
        except Exception as db_err:
            print(f"Failed to update database failure state: {db_err}")
            
        return {"status": "error", "error": str(e)}
