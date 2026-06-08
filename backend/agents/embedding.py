from sentence_transformers import SentenceTransformer

class EmbeddingAgent:
    """
    Agent 6: Vectorizes the article chunks locally using
    the SentenceTransformer all-MiniLM-L6-v2 model.
    Produces 384-dimensional float arrays.
    """
    def __init__(self):
        self.model = None
        
    def run(self, state: dict) -> dict:
        chunks = state.get("chunks", [])
        print(f"[Embedding] Encoding {len(chunks)} text chunks using HuggingFace sentence-transformers")
        
        if not chunks:
            print("[Embedding Warning] No chunks provided for embedding.")
            return state
            
        try:
            if self.model is None:
                # Lazy-load model to conserve memory when agent is instantiated but not run
                self.model = SentenceTransformer('all-MiniLM-L6-v2')
                
            embeddings = self.model.encode(chunks)
            state["chunk_embeddings"] = [emb.tolist() for emb in embeddings]
            print(f"[Embedding] Generated {len(state['chunk_embeddings'])} embeddings. Dimension: {len(state['chunk_embeddings'][0])}")
            
        except Exception as e:
            print(f"[Embedding Error] Failed generating local embeddings: {e}")
            # Mock vectors if library loading fails
            mock_emb = [0.0] * 384
            state["chunk_embeddings"] = [mock_emb for _ in chunks]
            
        return state
