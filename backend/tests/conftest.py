import os
import sys
import pytest
from unittest.mock import MagicMock

# Ensure backend directory is in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Set test environment variables before importing app
os.environ["SUPABASE_URL"] = "https://mock-test.supabase.co"
os.environ["SUPABASE_SERVICE_ROLE_KEY"] = "mock-service-role-key-test"
os.environ["GROQ_API_KEY"] = "gsk_mock_test_key"
os.environ["REDIS_URL"] = "redis://localhost:6379/0"

# Mock supabase in sys.modules to prevent conflict with local backend/supabase directory
mock_supabase = MagicMock()
mock_client = MagicMock()
mock_supabase.create_client.return_value = mock_client
mock_supabase.Client = MagicMock
sys.modules["supabase"] = mock_supabase

@pytest.fixture
def test_client():
    """FastAPI TestClient fixture."""
    from fastapi.testclient import TestClient
    from main import app
    return TestClient(app)

@pytest.fixture
def eager_celery():
    """Configures Celery to run tasks eagerly (in-process) for unit tests."""
    from celery_worker import celery_app
    old_eager = celery_app.conf.task_always_eager
    old_propagate = celery_app.conf.task_eager_propagates
    celery_app.conf.update(task_always_eager=True, task_eager_propagates=True)
    yield celery_app
    celery_app.conf.update(task_always_eager=old_eager, task_eager_propagates=old_propagate)
