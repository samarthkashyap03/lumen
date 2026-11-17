from agents.chunker import ChunkerAgent
from agents.embedding import EmbeddingAgent
from unittest.mock import MagicMock

def test_chunker_agent_splits_paragraphs():
    agent = ChunkerAgent()
    long_paragraph = "Artificial intelligence and distributed systems power modern applications. " * 20
    text = f"{long_paragraph}\n\n{long_paragraph}\n\n{long_paragraph}"
    
    state = {"extracted_text": text}
    result = agent.run(state)
    
    assert "chunks" in result
    assert len(result["chunks"]) >= 2
    for chunk in result["chunks"]:
        assert len(chunk) > 0

def test_chunker_agent_fallback_single_text():
    agent = ChunkerAgent()
    short_text = "This is a single short sentence."
    state = {"extracted_text": short_text}
    result = agent.run(state)
    assert len(result["chunks"]) == 1
    assert result["chunks"][0] == short_text

def test_embedding_agent_generates_384_dim_vectors():
    agent = EmbeddingAgent()
    mock_model = MagicMock()
    mock_model.encode.return_value = [[0.1] * 384, [0.2] * 384]
    agent.model = mock_model
    
    state = {"chunks": ["First test chunk.", "Second test chunk."]}
    result = agent.run(state)
    assert len(result["chunk_embeddings"]) == 2
    assert len(result["chunk_embeddings"][0]) == 384
    assert len(result["chunk_embeddings"][1]) == 384

def test_embedding_agent_mock_fallback_on_error():
    agent = EmbeddingAgent()
    mock_model = MagicMock()
    mock_model.encode.side_effect = Exception("CUDA out of memory")
    agent.model = mock_model
    
    state = {"chunks": ["Chunk that causes error."]}
    result = agent.run(state)
    assert len(result["chunk_embeddings"]) == 1
    assert len(result["chunk_embeddings"][0]) == 384
    assert result["chunk_embeddings"][0] == [0.0] * 384
