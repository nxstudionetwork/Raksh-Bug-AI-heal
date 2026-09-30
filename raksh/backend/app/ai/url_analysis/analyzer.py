import re
from typing import Dict, List, Optional
from urllib.parse import urlparse

class URLAnalyzer:
    SUSPICIOUS_TLDS = {'.xyz', '.top', '.club', '.win', '.bid', '.download', '.review', '.date', '.work', '.loan', '.men', '.click', '.link', '.info'}
    KNOWN_MALICIOUS_DOMAINS = {
        'sbi-secure-update.com', 'amaz0n-verify.xyz', 'google-job-offer.top',
        'dtdc-parcel-track.club', 'free-netflix-sub.win', 'whatsapp-verify.bid',
        'crypto-invest-io.review', 'kyc-update-hdfc.download', 'irctc-refund.work',
        'flipkart-offer.date', 'netflix-free.xyz', 'wa-secure.xyz',
        'track-delivery.top', 'fake-bank.xyz', 'lottery-win.top',
    }
    
    SUSPICIOUS_KEYWORDS = ['verify', 'secure', 'login', 'account', 'update', 'confirm', 'validate', 'authenticate', 'banking', 'password', 'credit', 'otp', 'reset', 'payment', 'claim', 'prize', 'refund', 'kyc', 'aadhaar', 'pan']
    
    def analyze(self, url: str) -> Dict:
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        path = parsed.path.lower()
        
        # Remove www. prefix
        if domain.startswith('www.'):
            domain = domain[4:]
        
        is_https = parsed.scheme == 'https'
        domain_parts = domain.split('.')
        tld = '.' + domain_parts[-1] if len(domain_parts) > 1 else ''
        
        risk_score = 0
        reasons = []
        
        if domain in self.KNOWN_MALICIOUS_DOMAINS:
            risk_score += 60
            reasons.append(f"Known malicious domain: {domain}")
        
        if tld in self.SUSPICIOUS_TLDS:
            risk_score += 20
            reasons.append(f"Suspicious TLD: {tld}")
        
        if not is_https:
            risk_score += 10
            reasons.append("Not using HTTPS")
        
        suspicious_keywords_found = []
        for kw in self.SUSPICIOUS_KEYWORDS:
            if kw in domain or kw in path:
                suspicious_keywords_found.append(kw)
        if suspicious_keywords_found:
            risk_score += min(len(suspicious_keywords_found) * 8, 30)
            reasons.append(f"Contains suspicious keywords: {', '.join(suspicious_keywords_found[:3])}")
        
        ip_pattern = re.match(r'\d+\.\d+\.\d+\.\d+', domain)
        if ip_pattern:
            risk_score += 25
            reasons.append("Uses IP address instead of domain name")
        
        subdomain_count = len(domain_parts) - 2
        if subdomain_count > 2:
            risk_score += 10
            reasons.append("Excessive subdomains")
        
        if '://' in url and parsed.scheme not in ('http', 'https'):
            risk_score += 15
            reasons.append(f"Unusual URL scheme: {parsed.scheme}")
        
        if '@' in url:
            risk_score += 20
            reasons.append("URL contains @ symbol (credential phishing)")
        
        if re.search(r'[{}]', url):
            risk_score += 15
            reasons.append("URL contains path traversal characters")
        
        risk_score = min(risk_score, 100)
        confidence = min(50 + risk_score * 0.4, 98)
        
        return {
            "url": url,
            "domain": domain,
            "risk_score": round(risk_score, 1),
            "confidence": round(confidence, 1),
            "is_https": is_https,
            "tld": tld,
            "reasons": reasons,
            "suspicious_keywords": suspicious_keywords_found,
            "is_known_malicious": domain in self.KNOWN_MALICIOUS_DOMAINS,
            "is_suspicious_tld": tld in self.SUSPICIOUS_TLDS,
        }

url_analyzer = URLAnalyzer()
