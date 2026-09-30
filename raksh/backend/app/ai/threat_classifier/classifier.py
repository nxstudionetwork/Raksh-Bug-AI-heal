from typing import Dict
from app.ai.text_analysis.analyzer import text_analyzer
from app.ai.url_analysis.analyzer import url_analyzer
from app.ai.preprocessing.text_cleaner import text_cleaner

class ThreatClassifier:
    def classify_text(self, features: Dict) -> Dict:
        analysis = text_analyzer.analyze(features)
        risk_score = analysis["max_score"]
        return {
            "risk_score": risk_score,
            "threat_category": analysis["top_category"],
            "scores": analysis["scores"],
            "detected_keywords": analysis["detected_keywords"],
            "psychological_tactics": analysis["psychological_tactics"],
            "keyword_match_count": analysis["keyword_match_count"],
            "tactic_count": analysis["tactic_count"],
        }
    
    def classify_url(self, url: str) -> Dict:
        return url_analyzer.analyze(url)
    
    def classify_combined(self, message_content: str, subject: str = "") -> Dict:
        features = text_cleaner.preprocess(message_content, subject)
        text_result = self.classify_text(features)
        url_results = []
        for url in features.get("urls", []):
            url_results.append(self.classify_url(url))
        
        url_risk = max((r["risk_score"] for r in url_results), default=0)
        combined_risk = max(text_result["risk_score"], url_risk)
        
        return {
            "risk_score": combined_risk,
            "text_analysis": text_result,
            "url_analyses": url_results,
            "features": features,
        }

threat_classifier = ThreatClassifier()
