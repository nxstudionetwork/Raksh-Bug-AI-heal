from typing import Dict, List, Optional

class ThreatIntelligenceDB:
    def __init__(self):
        self._cache = {}
        
    KNOWN_SCAM_TYPES = {
        "Bank OTP Fraud": {"severity": "critical", "category": "banking_fraud", "indicators": ["otp", "bank", "account blocked", "verify"]},
        "Fake Delivery SMS": {"severity": "high", "category": "fake_delivery", "indicators": ["delivery", "package", "track", "courier"]},
        "WhatsApp Hijacking": {"severity": "critical", "category": "social_engineering", "indicators": ["whatsapp", "verification code", "support"]},
        "QR Code Phishing": {"severity": "high", "category": "phishing", "indicators": ["qr", "scan", "payment"]},
        "Fake Job Offer": {"severity": "high", "category": "fake_job", "indicators": ["job", "work from home", "registration fee", "salary"]},
        "Investment Ponzi": {"severity": "critical", "category": "crypto_scam", "indicators": ["investment", "guaranteed", "returns", "crypto", "bitcoin"]},
        "KYC Fraud": {"severity": "high", "category": "banking_fraud", "indicators": ["kyc", "update", "aadhaar", "pan", "bank"]},
        "Fake Lottery": {"severity": "medium", "category": "scam", "indicators": ["won", "lottery", "prize", "congratulations", "winner"]},
        "AI Voice Scam": {"severity": "critical", "category": "social_engineering", "indicators": ["voice", "deepfake", "ai", "clone"]},
    }
    
    def lookup(self, text: str) -> List[Dict]:
        text_lower = text.lower()
        matches = []
        for scam_name, details in self.KNOWN_SCAM_TYPES.items():
            indicators_found = [i for i in details["indicators"] if i in text_lower]
            if indicators_found:
                matches.append({
                    "scam_name": scam_name,
                    "severity": details["severity"],
                    "category": details["category"],
                    "indicators_found": indicators_found,
                    "match_count": len(indicators_found),
                })
        return sorted(matches, key=lambda x: x["match_count"], reverse=True)

threat_intel = ThreatIntelligenceDB()
