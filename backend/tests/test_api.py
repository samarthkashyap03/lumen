import uuid
from unittest.mock import patch, MagicMock

def test_health_check_endpoint(test_client):
    response = test_client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "supabase_configured" in data
    assert "groq_configured" in data

def test_safe_uuid_utility():
    from main import safe_uuid
    valid_uuid_str = str(uuid.uuid4())
    assert safe_uuid(valid_uuid_str) == valid_uuid_str
    assert safe_uuid("not-a-valid-uuid") is None
    assert safe_uuid(None) is None
    assert safe_uuid("") is None

def test_admin_route_unauthorized_token(test_client):
    response = test_client.get("/api/admin/users?token=invalid-fake-token")
    assert response.status_code == 401
    assert "Unauthorized" in response.json()["detail"]

def test_create_article_endpoint(test_client):
    payload = {
        "title": "Test AI Revolution",
        "body_text": "This is a detailed article text about AI and systems design.",
        "category": "Technology",
        "author": "Test Author",
        "editor_id": str(uuid.uuid4())
    }

    with patch("main.supabase") as mock_db, patch("main.dispatch_pipeline") as mock_dispatch:
        mock_table = MagicMock()
        mock_insert = MagicMock()
        mock_db.table.return_value = mock_table
        mock_table.insert.return_value = mock_insert
        mock_insert.execute.return_value = MagicMock()

        response = test_client.post("/api/cms/articles", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "processing"
        assert "article_id" in data
        assert mock_dispatch.called

def test_ingest_url_endpoint(test_client):
    payload = {
        "url": "https://example.com/test-article",
        "editor_id": str(uuid.uuid4())
    }

    with patch("main.supabase") as mock_db, patch("main.dispatch_pipeline") as mock_dispatch:
        mock_table = MagicMock()
        mock_db.table.return_value = mock_table
        mock_table.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
        mock_table.insert.return_value.execute.return_value = MagicMock()

        response = test_client.post("/api/cms/ingest", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "processing"
        assert "article_id" in data
        assert mock_dispatch.called
