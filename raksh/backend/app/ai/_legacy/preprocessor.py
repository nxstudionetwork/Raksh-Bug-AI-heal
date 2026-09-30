import re
import html
from typing import List, Dict
from app.config.settings import settings


class MessagePreprocessor:
    URL_PATTERN = re.compile(r'https?://[^\s<>"]+|www\.[^\s<>"]+')
    PHONE_PATTERN = re.compile(r'\+?\d[\d\s\-\(\)]{7,15}\d')
    EMAIL_PATTERN = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')
    MONEY_PATTERN = re.compile(r'[£$€¥₹]\s?\d+(?:[,.]\d+)?|\d+\s?(?:USD|EUR|GBP|INR|dollars|euros|rupees)')
    URGENCY_WORDS = [
        "urgent", "immediately", "act now", "limited time", "expires", "deadline",
        "asap", "warning", "alert", "suspended", "terminated", "blocked",
        "unauthorized", "suspicious activity", "verify now", "confirm now",
    ]

    def extract_urls(self, text: str) -> List[str]:
        return list(set(self.URL_PATTERN.findall(text)))

    def extract_phones(self, text: str) -> List[str]:
        return list(set(self.PHONE_PATTERN.findall(text)))

    def extract_emails(self, text: str) -> List[str]:
        return list(set(self.EMAIL_PATTERN.findall(text)))

    def extract_money(self, text: str) -> List[str]:
        return list(set(self.MONEY_PATTERN.findall(text)))

    def extract_urgency_phrases(self, text: str) -> List[str]:
        found = []
        text_lower = text.lower()
        for word in self.URGENCY_WORDS:
            if word in text_lower:
                found.append(word)
        return found

    def clean_text(self, text: str) -> str:
        text = html.unescape(text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text[: settings.AI_MAX_TEXT_LENGTH]

    def preprocess(self, message_content: str, subject: str = "") -> Dict:
        full_text = f"{subject} {message_content}" if subject else message_content
        cleaned = self.clean_text(full_text)

        features = {
            "text": cleaned,
            "has_urls": len(self.extract_urls(cleaned)) > 0,
            "url_count": len(self.extract_urls(cleaned)),
            "has_phone": len(self.extract_phones(cleaned)) > 0,
            "phone_count": len(self.extract_phones(cleaned)),
            "has_email": len(self.extract_emails(cleaned)) > 0,
            "has_money": len(self.extract_money(cleaned)) > 0,
            "urgency_phrases": self.extract_urgency_phrases(cleaned),
            "urgency_score": len(self.extract_urgency_phrases(cleaned)) / max(len(self.URGENCY_WORDS), 1),
            "text_length": len(cleaned),
            "word_count": len(cleaned.split()),
        }
        return features


preprocessor = MessagePreprocessor()
