from typing import Dict, List
from app.ai.preprocessing.text_cleaner import text_cleaner

class TextAnalyzer:
    THREAT_KEYWORDS = {
        "phishing": ["verify your account", "confirm your identity", "login details", "click here to verify", "account suspended", "security breach", "unauthorized login", "reset your password", "banking details", "update payment information", "verify your email", "account locked", "sign in", "credential", "password reset"],
        "banking_fraud": ["otp", "one time password", "bank account", "credit card", "debit card", "net banking", "transaction failed", "atm card", "card blocked", "account credited", "money transferred", "upi", "bank statement", "payment received", "account debited"],
        "scam": ["you won", "congratulations", "lottery", "prize money", "claim your reward", "gift card", "free gift", "exclusive offer", "limited offer", "click here to claim", "you are selected", "winner", "jackpot"],
        "fake_job": ["work from home", "earn money", "part time job", "data entry", "easy money", "registration fee", "processing fee", "job offer", "recruitment", "immediate joining", "high salary", "no experience", "work online"],
        "crypto_scam": ["bitcoin", "cryptocurrency", "investment opportunity", "guaranteed returns", "crypto trading", "mining", "defi", "nft", "pump and dump", "get rich quick", "passive income", "double your money", "crypto investment", "blockchain"],
        "social_engineering": ["urgent help", "i need money", "send me", "western union", "money gram", "emergency", "relative in trouble", "friend stuck", "advance fee", "paypal", "send money", "help me", "trusted friend"],
        "spam": ["click here", "subscribe", "unsubscribe", "newsletter", "promotion", "discount", "sale", "buy now", "order now", "limited stock", "hurry", "act fast", "offer expires", "free trial"],
        "otp_fraud": ["share otp", "send otp", "verify otp", "otp verification", "otp code", "confirm otp", "otp number", "otp sent", "enter otp", "otp required"],
        "fake_delivery": ["delivery failed", "package held", "shipment pending", "track your package", "delivery address", "customs fee", "parcel waiting", "delivery attempt", "shipping confirmation"],
    }
    
    PSYCHOLOGICAL_TACTICS = {
        "urgency": ["urgent", "immediately", "act now", "hurry", "limited time", "expires", "deadline", "asap", "final notice", "respond now"],
        "fear": ["suspended", "terminated", "blocked", "unauthorized", "compromised", "security breach", "illegal", "legal action", "sue", "police", "arrest", "warning"],
        "greed": ["free", "won", "winner", "prize", "lottery", "cash", "reward", "gift", "bonus", "discount", "exclusive", "limited offer"],
        "authority": ["official", "government", "bank", "police", "court", "legal", "regulatory", "compliance", "ministry", "department"],
        "sympathy": ["help", "emergency", "sick", "hospital", "accident", "trouble", "stuck", "stranded", "need money", "please help"],
    }
    
    def analyze(self, features: Dict) -> Dict:
        text = features.get("text", "").lower()
        category_scores = {}
        detected_keywords = []
        
        for category, keywords in self.THREAT_KEYWORDS.items():
            score = 0
            matched = []
            for keyword in keywords:
                if keyword in text:
                    score += 12
                    matched.append(keyword)
            if matched:
                score += 8
                detected_keywords.extend(matched)
            category_scores[category] = min(score, 100)
        
        detected_tactics = {}
        for tactic, words in self.PSYCHOLOGICAL_TACTICS.items():
            found = [w for w in words if w in text]
            if found:
                detected_tactics[tactic] = found
        
        urgency = features.get("urgency_score", 0)
        if urgency > 0:
            for cat in category_scores:
                category_scores[cat] += urgency * 25
        
        if features.get("has_urls"):
            category_scores["phishing"] += features.get("url_count", 0) * 10
            category_scores["spam"] += features.get("url_count", 0) * 5
        
        if features.get("has_phone"):
            category_scores["scam"] += 15
            category_scores["social_engineering"] += 15
        
        if features.get("has_money"):
            category_scores["banking_fraud"] += 20
            category_scores["crypto_scam"] += 15
        
        max_score = max(category_scores.values())
        if max_score == 0:
            top_category = "safe"
        else:
            top_category = max(category_scores, key=category_scores.get)
        
        return {
            "scores": {k: round(v, 1) for k, v in category_scores.items()},
            "top_category": top_category,
            "max_score": round(max_score, 1),
            "detected_keywords": list(set(detected_keywords)),
            "psychological_tactics": detected_tactics,
            "keyword_match_count": len(set(detected_keywords)),
            "tactic_count": len(detected_tactics),
        }

text_analyzer = TextAnalyzer()
