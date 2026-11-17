import os
import uuid
from unittest.mock import patch, MagicMock
from celery_worker import celery_app, process_article_pipeline
from main import dispatch_pipeline

def test_celery_configuration():
    assert celery_app.conf.task_serializer == "json"
    assert "json" in celery_app.conf.accept_content
    assert celery_app.conf.result_serializer == "json"
    assert celery_app.conf.timezone == "UTC"

def test_celery_task_registration():
    registered_tasks = celery_app.tasks.keys()
    assert "process_article_pipeline" in registered_tasks

def test_celery_task_success_execution(eager_celery):
    test_article_id = str(uuid.uuid4())
    test_url = f"lumen://dispatches/{test_article_id}"

    with patch("agents.pipeline.run_ingestion_pipeline", return_value=True) as mock_pipeline:
        result = process_article_pipeline.apply(args=[test_url, test_article_id])
        assert result.successful()
        assert result.result["status"] == "success"
        assert result.result["article_id"] == test_article_id
        mock_pipeline.assert_called_once_with(test_url, test_article_id)

def test_celery_task_failure_execution(eager_celery):
    test_article_id = str(uuid.uuid4())
    test_url = "https://example.com/broken-article"

    with patch("agents.pipeline.run_ingestion_pipeline", side_effect=Exception("Scraper timed out")):
        with patch("main.is_supabase_configured", return_value=True), patch("main.supabase") as mock_db:
            mock_table = MagicMock()
            mock_db.table.return_value = mock_table
            mock_update = MagicMock()
            mock_table.update.return_value = mock_update
            mock_update.eq.return_value.execute.return_value = MagicMock()

            result = process_article_pipeline.apply(args=[test_url, test_article_id])
            assert result.result["status"] == "error"
            assert "Scraper timed out" in result.result["error"]
            mock_table.update.assert_called()

def test_dispatch_pipeline_uses_celery_delay():
    test_article_id = str(uuid.uuid4())
    test_url = f"lumen://dispatches/{test_article_id}"

    with patch.dict(os.environ, {"REDIS_URL": "redis://redis:6379/0"}):
        with patch("celery_worker.process_article_pipeline.delay") as mock_delay:
            dispatch_pipeline(test_url, test_article_id)
            mock_delay.assert_called_once_with(test_url, test_article_id)

def test_dispatch_pipeline_fallback_to_thread():
    test_article_id = str(uuid.uuid4())
    test_url = f"lumen://dispatches/{test_article_id}"

    # When REDIS_URL points to localhost or fails, it should use background Thread
    with patch.dict(os.environ, {"REDIS_URL": "redis://localhost:6379/0"}):
        with patch("threading.Thread") as mock_thread:
            mock_instance = MagicMock()
            mock_thread.return_value = mock_instance
            dispatch_pipeline(test_url, test_article_id)
            assert mock_instance.start.called
