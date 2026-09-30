from typing import Dict, List
from app.database.models import Severity

class Explainer:
    CATEGORY_EXPLANATIONS = {
        "phishing": "This message shows characteristics of a phishing attempt designed to steal your login credentials or personal information",
        "banking_fraud": "This message contains patterns consistent with banking fraud, often involving fake OTP requests or account alerts",
        "scam": "This message exhibits scam patterns typical of fraudulent schemes designed to trick you into sending money",
        "fake_job": "This message appears to be a fake job offer, commonly requiring upfront payments or excessive personal data",
        "crypto_scam": "This message matches cryptocurrency scam patterns, such as guaranteed high returns or investment pressure",
        "social_engineering": "This message uses social engineering tactics to manipulate you into taking a specific action",
        "spam": "This message appears to be unsolicited bulk communication with promotional content",
        "otp_fraud": "This message exhibits OTP fraud patterns, attempting to trick you into sharing authentication codes",
        "fake_delivery": "This message mimics a delivery notification to trick you into clicking malicious links",
        "safe": "This message appears legitimate with no detectable threat patterns",
    }
    
    def generate_explanation(self, result: Dict) -> str:
        category = result.get("threat_category", "safe")
        risk = result.get("risk_score", 0)
        keyword_count = result.get("keyword_match_count", 0)
        tactic_count = result.get("tactic_count", 0)
        psychological_tactics = result.get("psychological_tactics", {})
        
        parts = [self.CATEGORY_EXPLANATIONS.get(category, "Unknown threat pattern detected.")]
        
        if keyword_count > 0:
            parts.append(f"Identified {keyword_count} suspicious keyword pattern{'s' if keyword_count > 1 else ''} in the content")
        
        if tactic_count > 0:
            tactics_str = ", ".join(psychological_tactics.keys())
            parts.append(f"Detected psychological manipulation tactics: {tactics_str}")
        
        if risk >= 80:
            parts.append("HIGH RISK: This message contains critical threat indicators and requires immediate action")
        elif risk >= 50:
            parts.append("MODERATE RISK: This message shows significant risk indicators and should be reviewed carefully")
        elif risk >= 20:
            parts.append("LOW RISK: This message has some minor risk indicators but may be legitimate")
        else:
            parts.append("No significant threat indicators detected in this message")
        
        return " | ".join(parts)
    
    def generate_recommendation(self, result: Dict) -> str:
        category = result.get("threat_category", "safe")
        risk = result.get("risk_score", 0)
        
        recs = {
            "phishing": "Do not click any links or download attachments. Report this message to your security team immediately. If you entered credentials, change them immediately",
            "banking_fraud": "Do not share OTPs, PINs, or banking details. Contact your bank directly using the official number on their website or app",
            "scam": "Do not send money or share personal information. Block the sender and report the message to relevant authorities",
            "fake_job": "Verify the job offer through official company channels. Legitimate employers never ask for upfront fees or sensitive documents",
            "crypto_scam": "Do not invest based on unsolicited advice or pressure. Consult a licensed financial advisor before any investment",
            "social_engineering": "Do not send money or share information. Verify the request through a separate, trusted communication channel",
            "spam": "Mark as spam and block the sender. Do not click links or reply to the message",
            "otp_fraud": "Never share OTPs or verification codes with anyone. Your bank or service provider will never ask for these",
            "fake_delivery": "Do not click tracking links in unsolicited messages. Use the official courier website with your tracking number",
            "safe": "No action required. This message appears safe and legitimate",
        }
        
        recommendation = recs.get(category, "Exercise caution with this message")
        
        if risk >= 80:
            recommendation += " | IMMEDIATE ACTION REQUIRED: This is a critical threat"
        elif risk >= 50:
            recommendation += " | Review this message carefully before taking any action"
        
        return recommendation
    
    def get_severity(self, risk_score: float) -> str:
        if risk_score >= 80:
            return Severity.CRITICAL.value
        elif risk_score >= 60:
            return Severity.HIGH.value
        elif risk_score >= 40:
            return Severity.MEDIUM.value
        elif risk_score >= 20:
            return Severity.LOW.value
        return Severity.SAFE.value
    
    def get_notification_type(self, severity: str) -> str:
        mapping = {
            Severity.CRITICAL.value: "danger",
            Severity.HIGH.value: "danger",
            Severity.MEDIUM.value: "warning",
            Severity.LOW.value: "warning",
            Severity.SAFE.value: "safe",
        }
        return mapping.get(severity, "info")

explainer = Explainer()
