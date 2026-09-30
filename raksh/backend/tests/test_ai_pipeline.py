import pytest
from app.ai.preprocessing.text_cleaner import text_cleaner
from app.ai.threat_classifier.classifier import threat_classifier
from app.ai.explainable_ai.explainer import explainer


class TestPreprocessor:
    def test_safe_message(self):
        features = text_cleaner.preprocess("Hello, how are you?", "")
        assert features["has_urls"] is False
        assert features["has_phone"] is False
        assert features["has_money"] is False
        assert len(features["urgency_phrases"]) == 0

    def test_phishing_features(self):
        text = "Urgent! Click http://fake-bank.com to verify your account now!"
        features = text_cleaner.preprocess(text, "Security Alert")
        assert features["has_urls"] is True
        assert len(features["urgency_phrases"]) > 0
        assert features["word_count"] > 0

    def test_scam_features(self):
        text = "Your account has been suspended! Act now to verify your login details on http://secure-bank.com"
        features = text_cleaner.preprocess(text, "Alert")
        assert features["has_urls"] is True
        assert len(features["urgency_phrases"]) > 0
        assert features["word_count"] > 0


class TestClassifier:
    def test_safe_classification(self):
        features = {"word_count": 5, "has_urls": False, "has_phone": False,
                     "has_email": False, "has_money": False, "urgency_score": 0,
                     "url_count": 0, "text": "Hi, let's meet tomorrow",
                     "has_suspicious_html": False, "exclamation_count": 0,
                     "all_caps_ratio": 0, "text_length": 20, "urls": [],
                     "phones": [], "emails": [], "money_mentions": [],
                     "urgency_phrases": [], "original_length": 20}
        result = threat_classifier.classify_text(features)
        assert result["threat_category"] == "safe"
        assert result["risk_score"] == 0

    def test_phishing_detection(self):
        features = {"word_count": 20, "has_urls": True, "has_phone": False,
                     "has_email": True, "has_money": True, "urgency_score": 0.8,
                     "url_count": 2, "text": "Urgent: verify your account at http://fake-bank.com",
                     "has_suspicious_html": False, "exclamation_count": 1,
                     "all_caps_ratio": 0.1, "text_length": 50, "urls": ["http://fake-bank.com"],
                     "phones": [], "emails": ["test@test.com"], "money_mentions": ["$100"],
                     "urgency_phrases": ["urgent"], "original_length": 50}
        result = threat_classifier.classify_text(features)
        assert result["threat_category"] == "phishing"
        assert result["risk_score"] > 30

    def test_scam_detection(self):
        features = {"word_count": 15, "has_urls": False, "has_phone": True,
                     "has_email": False, "has_money": True, "urgency_score": 0.5,
                     "url_count": 0, "text": "Congratulations! You won 5 crore! Call now! Limited time offer!",
                     "has_suspicious_html": False, "exclamation_count": 3,
                     "all_caps_ratio": 0.2, "text_length": 40, "urls": [],
                     "phones": ["+1-234-567-8900"], "emails": [], "money_mentions": ["5 crore"],
                     "urgency_phrases": ["limited time"], "original_length": 40}
        result = threat_classifier.classify_text(features)
        assert result["threat_category"] in ("scam", "social_engineering")
        assert result["risk_score"] > 0


class TestExplainer:
    def test_severity_mapping(self):
        assert explainer.get_severity(0) == "safe"
        assert explainer.get_severity(20) == "low"
        assert explainer.get_severity(40) == "medium"
        assert explainer.get_severity(60) == "high"
        assert explainer.get_severity(80) == "critical"

    def test_notification_type(self):
        assert explainer.get_notification_type("safe") == "safe"
        assert explainer.get_notification_type("low") == "warning"
        assert explainer.get_notification_type("medium") == "warning"
        assert explainer.get_notification_type("high") == "danger"
        assert explainer.get_notification_type("critical") == "danger"

    def test_explanation_generation(self):
        result = {
            "risk_score": 85, "threat_category": "phishing",
            "keyword_match_count": 5, "tactic_count": 2,
            "psychological_tactics": {"urgency": ["urgent"], "fear": ["compromised"]},
        }
        expl = explainer.generate_explanation(result)
        assert isinstance(expl, str) and len(expl) > 10
        rec = explainer.generate_recommendation(result)
        assert isinstance(rec, str) and len(rec) > 10
