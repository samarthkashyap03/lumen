class ChunkerAgent:
    """
    Agent 2: Cleans raw extracted text and splits it into logical,
    semantic chunks. Ensures context paragraphs remain intact.
    """
    def run(self, state: dict) -> dict:
        text = state["extracted_text"]
        print(f"[Chunker] Splitting body text of length {len(text)} into semantic chunks")
        
        # Split by double newlines to isolate paragraphs
        raw_paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        
        chunks = []
        current_chunk = []
        current_length = 0
        
        # Target chunk size of ~1000 characters
        TARGET_SIZE = 1000
        
        for p in raw_paragraphs:
            # Skip very short fragments
            if len(p) < 15:
                continue
                
            current_chunk.append(p)
            current_length += len(p)
            
            # If current chunk has reached target size, save and start new chunk
            if current_length >= TARGET_SIZE:
                chunks.append("\n\n".join(current_chunk))
                current_chunk = []
                current_length = 0
                
        # Append remaining paragraphs if any
        if current_chunk:
            chunks.append("\n\n".join(current_chunk))
            
        # Fallback if no chunks were created
        if not chunks and text:
            chunks.append(text)
            
        state["chunks"] = chunks
        print(f"[Chunker] Generated {len(chunks)} semantic chunks")
        return state
