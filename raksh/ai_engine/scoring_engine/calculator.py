from typing import Dict

class ScoringEngine:
    def compute_scores(self, text_analysis: Dict, url_analyses: list = None) -> Dict:
        scores = text_analysis.get("scores", {})
        
        spam_score = scores.get("spam", 0)
        scam_score = scores.get("scam", 0) + scores.get("fake_job", 0) * 0.4
        phishing_score = scores.get("phishing", 0) + scores.get("banking_fraud", 0) * 0.4 + scores.get("social_engineering", 0) * 0.3
        overall_risk = text_analysis.get("max_score", 0)
        
        if url_analyses:
            for url_result in url_analyses:
                url_risk = url_result.get("risk_score", 0)
                overall_risk = max(overall_risk, url_risk)
                if url_result.get("is_known_malicious"):
                    phishing_score = max(phishing_score, 80)
                if url_result.get("is_suspicious"):
                    phishing_score = max(phishing_score, url_risk * 0.7)
        
        return {
            "risk_score": round(min(overall_risk, 100), 1),
            "spam_score": round(min(spam_score, 100), 1),
            "scam_score": round(min(scam_score, 100), 1),
            "phishing_score": round(min(phishing_score, 100), 1),
        }

scoring_engine = ScoringEngine()
