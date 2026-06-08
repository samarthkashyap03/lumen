import os
import json
import re
from groq import Groq

class OptimizerAgent:
    """
    AI Agent 3: Copywriting Optimizer & Fine-Tuner.
    - Takes generated cards from Agent 2.
    - Calls Groq LLM to refine cards for tone, flow, and print-magazine appeal.
    - Ensures key vocabulary terms (e.g. *focus*, *depth*, *intent*, *calmer*, *sanctuary*) are emphasized in italics (with `*` asterisks).
    """

    def run(self, state: dict) -> dict:
        raw_cards = state.get("raw_cards", [])
        title = state.get("title", "Untitled")
        
        print(f"[Agent 3 Optimizer] Fine-tuning and styling {len(raw_cards)} cards for: '{title}'")
        
        groq_key = os.getenv("GROQ_API_KEY")
        if not groq_key:
            raise Exception("GROQ_API_KEY environment variable is not configured.")
            
        try:
            client = Groq(api_key=groq_key)
            cards_str = json.dumps(raw_cards, indent=2)
            
            prompt = (
                f"You are the Copywriting Optimizer Agent (Agent 3) in Lumen's publishing pipeline.\n"
                f"Your task is to refine and style the following list of raw summary cards into publication-grade dispatches.\n\n"
                f"--- RAW CARDS FROM AGENT 2 ---\n{cards_str}\n------------------------------\n\n"
                f"INSTRUCTIONS:\n"
                f"1. Refine the title and summary copywriting to be highly sophisticated, elegant, and punchy. Ensure the summaries remain substantial, sweet, and descriptive (around 40-60 words, written in exactly 2 or 3 complete sentences). Avoid making them too short, and do not truncate them into a single line. Ensure all statements are grammatically complete, natural, and never cut off or ended abruptly.\n"
                f"2. Apply Typographic Emphasis: For each card, select exactly one or two key terms in the title and one key term in the summary, and wrap them in single asterisks (e.g. *focus* or *depth*) to format them in italics on the frontend.\n"
                f"   - Selected terms should represent critical concepts (e.g. *inference*, *grid*, *sanctuary*, *attention*, *silence*).\n"
                f"3. Return the optimized cards as a valid JSON array of objects, keeping the 'card_index', 'category', 'title', and 'summary' keys intact.\n"
                f"4. Output must be valid JSON only. Do not include markdown codeblocks or conversational wrappers."
            )
            
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are a specialized copywriting and formatting optimizer. You only output valid JSON arrays of card objects."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                response_format={"type": "json_object"}
            )
            
            raw_response = completion.choices[0].message.content
            parsed = json.loads(raw_response)
            
            if isinstance(parsed, dict) and "cards" in parsed:
                cards = parsed["cards"]
            elif isinstance(parsed, dict) and len(parsed) == 1 and isinstance(list(parsed.values())[0], list):
                cards = list(parsed.values())[0]
            elif isinstance(parsed, list):
                cards = parsed
            else:
                cards = [parsed]
                
            # Double check programmatic styling safety just in case LLM missed asterisks
            state["optimized_cards"] = self.programmatic_optimize(cards)
            print("[Agent 3 Optimizer] Cards optimized successfully.")
            
        except Exception as e:
            print(f"[Agent 3 Optimizer Error] LLM optimization failed: {e}")
            raise Exception(f"AI Copywriting Optimizer Agent API call failed: {str(e)}")
            
        return state

    def programmatic_optimize(self, cards: list) -> list:
        """Fallback programmatic formatter ensuring asterisks exist for styling accent colors."""
        emphasis_terms = ["focus", "depth", "intent", "algorithm", "reading", "future", "now", "recomposed", "reconstructed", "calmer", "sanctuary", "silence", "inference", "grid", "galaxy", "stars", "outrage"]
        optimized = []
        
        for idx, card in enumerate(cards):
            opt_card = card.copy()
            title = str(opt_card.get("title", f"Thesis Card {idx+1}")).strip()
            summary = str(opt_card.get("summary", "")).strip()
            
            # Title emphasis
            if "*" not in title and "_" not in title:
                replaced = False
                for term in emphasis_terms:
                    pattern = re.compile(rf"\b{term}\b", re.IGNORECASE)
                    if pattern.search(title):
                        title = pattern.sub(f"*{term}*", title, count=1)
                        replaced = True
                        break
                if not replaced:
                    words = title.split()
                    if words:
                        last_word = words[-1].strip(".,!?;:")
                        if len(last_word) > 2:
                            title = title.replace(last_word, f"*{last_word}*", 1)
                            
            # Summary emphasis
            if "*" not in summary and "_" not in summary:
                replaced = False
                for term in emphasis_terms:
                    pattern = re.compile(rf"\b{term}\b", re.IGNORECASE)
                    if pattern.search(summary):
                        summary = pattern.sub(f"*{term}*", summary, count=1)
                        replaced = True
                        break
                if not replaced:
                    words = summary.split()
                    if words:
                        mid_idx = len(words) // 2
                        target_word = words[mid_idx].strip(".,!?;:")
                        if len(target_word) > 3:
                            summary = summary.replace(target_word, f"*{target_word}*", 1)
                            
            opt_card["title"] = title
            opt_card["summary"] = summary
            opt_card["card_index"] = idx
            optimized.append(opt_card)
            
        return optimized
