from typing import Dict

class ConfidenceCalculator:
    def calculate(self, analysis: Dict) -> float:
        keyword_count = analysis.get("keyword_match_count", 0)
        tactic_count = analysis.get("tactic_count", 0)
        scores = analysis.get("scores", {})
        max_score = max(scores.values()) if scores else 0
        
        confidence = 0.3
        confidence += min(keyword_count * 0.08, 0.3)
        confidence += min(tactic_count * 0.1, 0.2)
        confidence += min(max_score / 100 * 0.18, 0.18)
        
        return min(confidence, 0.98)

confidence_calculator = ConfidenceCalculator()
