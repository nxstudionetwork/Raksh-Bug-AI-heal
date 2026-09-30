import os
from typing import Dict, List, Optional

class AttachmentAnalyzer:
    DANGEROUS_EXTENSIONS = {'.exe', '.bat', '.cmd', '.vbs', '.ps1', '.scr', '.jar', '.msi', '.wsf', '.vbe', '.jse', '.hta'}
    SUSPICIOUS_EXTENSIONS = {'.docm', '.xlsm', '.pptm', '.zip', '.rar', '.7z', '.js', '.vba'}
    DOCUMENT_EXTENSIONS = {'.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv'}
    
    MAX_SAFE_SIZE = 10 * 1024 * 1024  # 10MB
    
    def analyze(self, filename: str, file_size: int, content_type: Optional[str] = None) -> Dict:
        ext = os.path.splitext(filename)[1].lower() if filename else ''
        risk_score = 0
        reasons = []
        
        if ext in self.DANGEROUS_EXTENSIONS:
            risk_score += 80
            reasons.append(f"Dangerous executable extension: {ext}")
        
        if ext in self.SUSPICIOUS_EXTENSIONS:
            risk_score += 40
            reasons.append(f"Suspicious extension: {ext}")
        
        if file_size > self.MAX_SAFE_SIZE:
            risk_score += 15
            reasons.append(f"File size exceeds safe limit ({file_size / 1024 / 1024:.1f}MB)")
        
        if file_size == 0:
            risk_score += 5
            reasons.append("Empty file")
        
        double_ext = filename.count('.') > 1
        if double_ext:
            risk_score += 25
            reasons.append("Double extension detected (possible masquerading)")
        
        if content_type:
            expected_type = self._get_expected_mime(ext)
            if expected_type and content_type != expected_type:
                risk_score += 30
                reasons.append(f"MIME type mismatch: expected {expected_type}, got {content_type}")
        
        risk_score = min(risk_score, 100)
        confidence = min(50 + risk_score * 0.4, 95)
        
        return {
            "filename": filename,
            "file_size": file_size,
            "extension": ext,
            "risk_score": round(risk_score, 1),
            "confidence": round(confidence, 1),
            "reasons": reasons,
            "is_dangerous": ext in self.DANGEROUS_EXTENSIONS,
            "is_suspicious": risk_score >= 30,
        }
    
    def _get_expected_mime(self, ext: str) -> Optional[str]:
        mime_map = {
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.zip': 'application/zip',
            '.png': 'image/png',
            '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
            '.txt': 'text/plain',
            '.csv': 'text/csv',
        }
        return mime_map.get(ext)

attachment_analyzer = AttachmentAnalyzer()
