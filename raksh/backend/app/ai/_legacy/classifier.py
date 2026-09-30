import re
import math
from typing import Dict, Tuple
from app.ai.preprocessor import preprocessor
from app.config.settings import settings


class RuleBasedClassifier:
    """
    Rule-based classifier for threat detection.
    In production, replace this with Hugging Face transformers / PyTorch.
    The interface remains the same — swap out the implementation without
    changing any other part of the codebase.
    """

    # Keyword patterns mapped to threat categories with severity weights
    PATTERNS: Dict[str, list] = {
        "phishing": [
            "verify your account", "confirm your identity", "login details",
            "click here to verify", "account suspended", "security breach",
            "unauthorized login", "reset your password", "banking details",
            "update payment information", "verify your email", "account locked",
        ],
        "banking_fraud": [
            "otp", "one time password", "bank account", "credit card",
            "debit card", "net banking", "transaction failed", "atm card",
            "card blocked", "account credited", "money transferred",
            "upi", "bank statement", "payment received",
        ],
        "scam": [
            "you won", "congratulations", "lottery", "prize money",
            "claim your reward", "gift card", "free gift", "exclusive offer",
            "limited offer", "click here to claim", "you are selected",
        ],
        "fake_job": [
            "work from home", "earn money", "part time job", "data entry",
            "easy money", "registration fee", "processing fee", "job offer",
            "recruitment", "immediate joining", "high salary",
        ],
        "crypto_scam": [
            "bitcoin", "cryptocurrency", "investment opportunity", "guaranteed returns",
            "crypto trading", "mining", "defi", "nft", "pump and dump",
            "get rich quick", "passive income", "double your money",
        ],
        "social_engineering": [
            "urgent help", "i need money", "send me", "western union",
            "money gram", "emergency", "relative in trouble", "friend stuck",
            "advance fee", "paypal", "send money",
        ],
        "spam": [
            "click here", "subscribe", "unsubscribe", "newsletter",
            "promotion", "discount", "sale", "buy now", "order now",
            "limited stock", "hurry", "act fast",
        ],
    }

    def __init__(self):
        self.confidence_threshold = settings.AI_CONFIDENCE_THRESHOLD

    def classify(self, text_features: Dict) -> Dict:
        text = text_features.get("text", "").lower()
        scores = {}

        for category, patterns in self.PATTERNS.items():
            matches = 0
            for pattern in patterns:
                if pattern in text:
                    matches += 1
            raw_score = min(matches * 15, 100)
            if matches > 0:
                raw_score += 10  # base boost for any match

            scores[category] = raw_score

        # Check urgency
        urgency = text_features.get("urgency_score", 0)
        if urgency > 0:
            for cat in scores:
                scores[cat] += urgency * 20

        # URL-based boost for phishing/spam
        if text_features.get("has_urls"):
            scores["phishing"] += text_features.get("url_count", 0) * 8
            scores["spam"] += text_features.get("url_count", 0) * 5

        # Phone numbers boost for scam/social engineering
        if text_features.get("has_phone"):
            scores["scam"] += 15
            scores["social_engineering"] += 15

        # Money mentions boost for banking/crypto
        if text_features.get("has_money"):
            scores["banking_fraud"] += 20
            scores["crypto_scam"] += 15

        # Determine top category and compute final scores
        top_category = max(scores, key=scores.get)
        max_score = scores[top_category]

        # Clamp to 0-100
        risk_score = min(max_score, 100)

        # Compute spam, scam, phishing subscores
        spam_score = min(scores.get("spam", 0) + scores.get("fake_job", 0) * 0.5, 100)
        scam_score = min(scores.get("scam", 0) + scores.get("crypto_scam", 0) * 0.6 + scores.get("fake_job", 0) * 0.4, 100)
        phishing_score = min(scores.get("phishing", 0) + scores.get("banking_fraud", 0) * 0.5 + scores.get("social_engineering", 0) * 0.3, 100)

        # Compute confidence based on match strength
        total_patterns = sum(len(patterns) for patterns in self.PATTERNS.values())
        match_ratio = sum(1 for p in sum(self.PATTERNS.values(), []) if p in text) / max(total_patterns, 1)
        confidence = min(match_ratio * 5 + 0.3, 0.98)

        return {
            "risk_score": round(risk_score, 1),
            "spam_score": round(spam_score, 1),
            "scam_score": round(scam_score, 1),
            "phishing_score": round(phishing_score, 1),
            "confidence": round(confidence, 3),
            "threat_category": top_category,
            "raw_scores": scores,
        }


classifier = RuleBasedClassifier()
