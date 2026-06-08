from datetime import datetime
import random
import os
import uuid

class PublishingAgent:
    """
    Publishing Agent (Helper).
    - Persists all processed structures (metadata, chunks + vectors, and optimized cards)
      into either Supabase or the local JSON fallback database.
    """

    def run(self, state: dict) -> bool:
        article_id = state["article_id"]
        title = state["title"]
        author = state["author"]
        body_text = state["extracted_text"]
        category = state["category"]
        cards = state.get("optimized_cards", [])
        chunks = state.get("chunks", [])
        embeddings = state.get("chunk_embeddings", [])
        
        print(f"[Publishing Agent] Writing processed results to database for article: '{title}' (ID: {article_id})")
        
        from main import is_supabase_configured, supabase
        
        if not is_supabase_configured():
            print(f"[Publishing Agent Error] Database is not configured.")
            return False
        
        category_images = {
            "AI": "ai",
            "Science": "space",
            "Cities": "city",
            "Technology": "ai",
            "Startups": "city",
            "Politics": "city",
            "Lifestyle": "space"
        }
        img_key = category_images.get(category, random.choice(["ai", "space", "city"]))
        
        try:
            # Update main article details
            supabase.table("articles").update({
                "title": title,
                "author": author,
                "body_text": body_text,
                "category": category,
                "published_at": datetime.utcnow().isoformat() + "Z",
                "status": "completed"
            }).eq("id", article_id).execute()
            
            # Insert chunks
            chunk_records = []
            for i, (chunk_text, chunk_vector) in enumerate(zip(chunks, embeddings)):
                chunk_records.append({
                    "article_id": article_id,
                    "chunk_index": i,
                    "content_text": chunk_text,
                    "embedding": chunk_vector
                })
            if chunk_records:
                supabase.table("article_chunks").delete().eq("article_id", article_id).execute()
                supabase.table("article_chunks").insert(chunk_records).execute()
                
            # Insert cards
            card_records = []
            for i, card in enumerate(cards):
                card_records.append({
                    "article_id": article_id,
                    "card_index": i,
                    "category": card.get("category", category),
                    "title": card.get("title", ""),
                    "summary": card.get("summary", ""),
                    "image_url": img_key
                })
            if card_records:
                supabase.table("swipe_cards").delete().eq("article_id", article_id).execute()
                supabase.table("swipe_cards").insert(card_records).execute()
                
            print(f"[Publishing Agent] Supabase transaction succeeded for article ID: {article_id}")
            return True
        except Exception as e:
            print(f"[Publishing Agent Error] Supabase transaction failed: {e}")
            return False
