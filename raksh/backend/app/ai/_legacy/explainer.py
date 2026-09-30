from typing import Dict
from app.database.models import Severity


class Explainer:
    THREAT_DESCRIPTIONS = {
        "phishing": "This message contains characteristics of a phishing attempt, often trying to steal personal information.",
        "banking_fraud": "This message shows signs of banking fraud, such as fake OTP requests or account alerts.",
        "scam": "This message exhibits scam patterns typical of fraudulent schemes designed to trick you into sending money.",
        "fake_job": "This message appears to be a fake job offer, often requiring upfront payments or personal data.",
        "crypto_scam": "This message displays cryptocurrency scam patterns, such as guaranteed returns or investment pressure.",
        "social_engineering": "This message uses social engineering tactics to manipulate you into taking urgent action.",
        "spam": "This message appears to be unsolicited bulk communication.",
        "safe": "This message appears legitimate with no detectable threat patterns.",
    }

    RECOMMENDATIONS = {
        "phishing": "Do not click any links. Report this message to your IT security team immediately.",
        "banking_fraud": "Do not share any OTP or banking details. Contact your bank directly using their official number.",
        "scam": "Do not send money or share personal information. Block the sender and report the message.",
        "fake_job": "Verify the job offer through official channels. Legitimate employers never ask for upfront fees.",
        "crypto_scam": "Do not invest based on unsolicited advice. Consult a licensed financial advisor.",
        "social_engineering": "Do not send money or share information. Verify the request through a separate communication channel.",
        "spam": "Mark as spam and block the sender. Do not click any links or reply to the message.",
        "safe": "No action required. This message appears safe.",
    }

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

    def generate_explanation(self, result: Dict) -> str:
        category = result.get("threat_category", "safe")
        risk = result.get("risk_score", 0)
        confidence = result.get("confidence", 0)

        base = self.THREAT_DESCRIPTIONS.get(category, "Unknown threat pattern detected.")
        urgency = ""
        if risk >= 60:
            urgency = " This message exhibits high-risk characteristics and requires immediate attention."
        elif risk >= 30:
            urgency = " This message shows moderate risk indicators and should be reviewed carefully."

        confidence_str = f" Analysis confidence: {confidence:.0%}."

        return base + urgency + confidence_str

    def generate_recommendation(self, result: Dict) -> str:
        category = result.get("threat_category", "safe")
        return self.RECOMMENDATIONS.get(category, "Exercise caution with this message.")


explainer = Explainer()
