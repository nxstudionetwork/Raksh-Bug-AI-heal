from typing import Dict, Optional

class ImageAnalyzer:
    def analyze(self, filename: str, file_size: int) -> Dict:
        risk_score = 0
        ext = filename.split('.')[-1].lower() if '.' in filename else ''
        if file_size > 20 * 1024 * 1024:
            risk_score += 20
        is_image = ext in {'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'}
        risk_score = min(risk_score, 100)
        return {
            "risk_score": round(risk_score, 1),
            "is_valid_image": is_image,
            "file_size": file_size,
        }

image_analyzer = ImageAnalyzer()
