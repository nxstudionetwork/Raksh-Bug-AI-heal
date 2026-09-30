import re
import html
from typing import List, Dict, Optional
from app.config.settings import settings

class TextCleaner:
    URL_PATTERN = re.compile(r'https?://[^\s<>"]+|www\.[^\s<>"]+')
    PHONE_PATTERN = re.compile(r'\+?\d[\d\s\-\(\)]{7,15}\d')
    EMAIL_PATTERN = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')
    MONEY_PATTERN = re.compile(r'[£$€¥₹]\s?\d+(?:[,.]\d+)?|\d+\s?(?:USD|EUR|GBP|INR|dollars|euros|rupees)')
    URGENCY_WORDS = ["urgent", "immediately", "act now", "limited time", "expires", "deadline", "asap", "warning", "alert", "suspended", "terminated", "blocked", "unauthorized", "suspicious activity", "verify now", "confirm now", "immediate action", "account will be", "final notice", "respond now"]
    
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
    
    def calculate_urgency_score(self, text: str) -> float:
        phrases = self.extract_urgency_phrases(text)
        if not phrases:
            return 0.0
        exclamation_count = text.count('!')
        all_caps_words = sum(1 for w in text.split() if len(w) > 2 and w.isupper())
        score = len(phrases) * 0.15
        score += min(exclamation_count * 0.05, 0.2)
        score += min(all_caps_words * 0.03, 0.15)
        return min(score, 1.0)
    
    def has_suspicious_html(self, text: str) -> bool:
        patterns = [r'<script', r'onclick', r'onload', r'<iframe', r'<embed', r'<object', r'<applet']
        return any(re.search(p, text, re.IGNORECASE) for p in patterns)
    
    def clean_text(self, text: str) -> str:
        text = html.unescape(text)
        text = re.sub(r'<[^>]+>', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text[:settings.AI_MAX_TEXT_LENGTH]
    
    def preprocess(self, message_content: str, subject: str = "") -> Dict:
        full_text = f"{subject} {message_content}" if subject else message_content
        cleaned = self.clean_text(full_text)
        urls = self.extract_urls(cleaned)
        phones = self.extract_phones(cleaned)
        emails_list = self.extract_emails(cleaned)
        money = self.extract_money(cleaned)
        urgency_phrases = self.extract_urgency_phrases(cleaned)
        
        return {
            "text": cleaned,
            "original_length": len(full_text),
            "has_urls": len(urls) > 0,
            "url_count": len(urls),
            "urls": urls,
            "has_phone": len(phones) > 0,
            "phone_count": len(phones),
            "phones": phones,
            "has_email": len(emails_list) > 0,
            "email_count": len(emails_list),
            "emails": emails_list,
            "has_money": len(money) > 0,
            "money_mentions": money,
            "urgency_phrases": urgency_phrases,
            "urgency_score": self.calculate_urgency_score(cleaned),
            "text_length": len(cleaned),
            "word_count": len(cleaned.split()),
            "has_suspicious_html": self.has_suspicious_html(full_text),
            "exclamation_count": cleaned.count('!'),
            "all_caps_ratio": sum(1 for w in cleaned.split() if len(w) > 2 and w.isupper()) / max(len(cleaned.split()), 1),
        }

text_cleaner = TextCleaner()
