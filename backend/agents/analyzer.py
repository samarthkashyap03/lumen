import os
import json
import requests
from bs4 import BeautifulSoup
import urllib.parse
from groq import Groq

class AnalyzerAgent:
    """
    AI Agent 1: Text & Semantic Analyzer.
    - Scrapes URL (if the source is a URL ingest).
    - Performs a deep semantic analysis of the article text using Groq LLM.
    - Generates a structured JSON analysis report (themes, arguments, tone, style rules).
    """

    def scrape_url(self, url: str) -> dict:
        """Helper to scrape web URL and extract text and metadata."""
        print(f"[Analyzer Scraper] Scraping web URL: {url}")
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        }
        try:
            response = requests.get(url, headers=headers, timeout=12)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")
            
            # Clean scripts/styles
            for s in soup(["script", "style", "nav", "footer", "header", "aside"]):
                s.decompose()
                
            title = ""
            if soup.title:
                title = soup.title.string.strip()
            if not title:
                h1 = soup.find("h1")
                if h1:
                    title = h1.get_text().strip()
                    
            author = "Lumen Editors"
            author_meta = soup.find("meta", attrs={"name": "author"})
            if author_meta:
                author = author_meta.get("content", "").strip()
            else:
                author_el = soup.select_one(".author, .byline, [rel='author']")
                if author_el:
                    author = author_el.get_text().strip()
                    
            paragraphs = soup.find_all("p")
            body_text = "\n\n".join([p.get_text().strip() for p in paragraphs if len(p.get_text().strip()) > 30])
            if not body_text:
                body_text = soup.get_text(separator="\n\n").strip()
                
            category = self.infer_category_simple(url, title, body_text)
            
            return {
                "title": title or "Scraped Dispatch",
                "author": author,
                "extracted_text": body_text,
                "category": category
            }
        except Exception as e:
            print(f"[Analyzer Scraper Error] Failed to scrape {url}: {e}. Using fallback mock content.")
            parsed = urllib.parse.urlparse(url)
            return {
                "title": f"Article from {parsed.netloc or 'Lumen Source'}",
                "author": "Lumen Staff",
                "extracted_text": (
                    "Artificial intelligence and computational grids are transforming human productivity. "
                    "In recent weeks, neural reasoning agents have advanced beyond prompt-based inputs. "
                    "Instead, we are seeing real-time reasoning models which plan and reflect on solutions. "
                    "Tokyo has also unveiled energy-efficient carbon-neutral grids for computational datacenters. "
                    "This marks a significant change in global smart grid architectures."
                ),
                "category": "Technology"
            }

    def infer_category_simple(self, url: str, title: str, text: str) -> str:
        categories = ["AI", "Science", "Politics", "Startups", "Lifestyle", "Technology"]
        combined = f"{url} {title} {text}".lower()
        counts = {cat: 0 for cat in categories}
        keywords = {
            "AI": ["ai", "artificial intelligence", "neural", "gpu", "model", "llm", "intelligence", "agent"],
            "Science": ["science", "galaxy", "nasa", "space", "astronomer", "biology", "physics", "climate", "carbon"],
            "Politics": ["politics", "senate", "election", "government", "policy", "court", "bill", "vote"],
            "Startups": ["startup", "venture", "funding", "invest", "vc", "founder", "saas", "ipo"],
            "Lifestyle": ["lifestyle", "travel", "culture", "design", "living", "art", "music", "fashion"],
            "Technology": ["technology", "software", "hardware", "cyber", "internet", "developer", "web", "app"]
        }
        for cat, words in keywords.items():
            for w in words:
                counts[cat] += combined.count(w)
        best_cat = max(counts, key=counts.get)
        if counts[best_cat] == 0:
            return "Technology"
        return best_cat

    def run(self, state: dict) -> dict:
        """
        AI Agent 1 core task: Analyze extracted text, output themes, arguments, 
        and recommendations to share with Agent 2.
        """
        text = state.get("extracted_text", "")
        title = state.get("title", "")
        
        print(f"[Agent 1 Analyzer] Performing semantic analysis on: '{title}'")
        
        groq_key = os.getenv("GROQ_API_KEY")
        if not groq_key:
            raise Exception("GROQ_API_KEY environment variable is not configured.")
            
        try:
            client = Groq(api_key=groq_key)
            prompt = (
                f"You are the AI Analyzer Agent (Agent 1) in Lumen's premium Multi-Agent publishing system.\n"
                f"Analyze the following article text and produce a structured analysis report in JSON.\n\n"
                f"Article Title: {title}\n"
                f"--- TEXT CONTENT ---\n{text}\n---------------------\n\n"
                f"INSTRUCTIONS:\n"
                f"Analyze the text and output a JSON object with the following fields:\n"
                f"1. \"key_themes\": List of main themes identified in the piece (e.g. ['Neural reasoning', 'Latency scaling']).\n"
                f"2. \"core_arguments\": List of the central arguments, findings, or narratives.\n"
                f"3. \"tone\": The intellectual and emotional tone of the piece (e.g. 'calm', 'editorial', 'academic').\n"
                f"4. \"suggested_insights\": A list of exactly 3 sequential central takeaways or core insights that summarize the narrative arc.\n"
                f"5. \"language_style_guide\": Directives on vocabulary or editorial style Agent 2 should follow.\n"
                f"6. \"punchy_article_title\": A revised, highly sophisticated, crisp, and punchy title for the entire article, written in a premium print-magazine editorial style (less than 10 words, very catchy and on point).\n"
                f"Output MUST be valid JSON only. Do not include markdown codeblocks or wrapper text."
            )
            
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are a specialized analysis agent. You only output valid JSON structures matching requested schemas."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                response_format={"type": "json_object"}
            )
            
            raw_response = completion.choices[0].message.content
            parsed = json.loads(raw_response)
            state["analysis_report"] = parsed
            print("[Agent 1 Analyzer] Deep semantic analysis completed successfully.")
            
        except Exception as e:
            print(f"[Agent 1 Analyzer Error] LLM analysis failed: {e}")
            raise Exception(f"AI Analyzer Agent API call failed: {str(e)}")
            
        return state

    def generate_mock_analysis(self, state: dict) -> dict:
        orig_title = state.get("title", "Dispatch")
        clean_title = orig_title.replace("Article from ", "").replace("Scraping: ", "").strip()
        
        # Remove common branding separators and suffixes
        for sep in [" - ", " | ", " – "]:
            if sep in clean_title:
                clean_title = clean_title.split(sep)[0].strip()
        clean_title = clean_title.rstrip(".… ")
        
        # Determine prefix based on the article's category
        cat = state.get("category", "General")
        prefix = "Focus on"
        if cat == "Science":
            prefix = "Exploring"
        elif cat in ["AI", "Technology"]:
            prefix = "Architecting"
        elif cat == "Startups":
            prefix = "Scaling"
        elif cat == "Politics":
            prefix = "Ruling on"
            
        punchy_title = f"{prefix} {clean_title}"
        
        # Truncate at word boundary only if extremely long (> 90 chars)
        if len(punchy_title) > 90:
            words = punchy_title.split()
            truncated = []
            char_count = 0
            for w in words:
                if char_count + len(w) > 85:
                    break
                truncated.append(w)
                char_count += len(w) + 1
            punchy_title = " ".join(truncated) + "..."
            
        return {
            "key_themes": [state.get("category", "General"), "Technical Innovation", "Structural Refinement"],
            "core_arguments": [
                f"The article discusses {clean_title}.",
                "An important update regarding local regulations and administrative directives."
            ],
            "tone": "calm, analytical, highly articulate",
            "suggested_insights": [
                "Key administrative direction established in the piece.",
                "Implications of direct regulatory compliance on public affairs.",
                "How regional policy changes impact structural oversight."
            ],
            "language_style_guide": "Use premium serif-style nouns, avoid clickbait, focus on depth and micro-refinement.",
            "punchy_article_title": punchy_title
        }
