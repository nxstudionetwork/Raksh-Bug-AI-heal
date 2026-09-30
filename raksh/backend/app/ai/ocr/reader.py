from typing import Dict, Optional

class OCRReader:
    async def extract_text(self, image_path: str) -> Dict:
        try:
            import pytesseract
            from PIL import Image
            text = pytesseract.image_to_string(Image.open(image_path))
            return {"text": text.strip(), "success": True, "word_count": len(text.split())}
        except ImportError:
            return {"text": "", "success": False, "error": "OCR not available"}
        except Exception as e:
            return {"text": "", "success": False, "error": str(e)}

ocr_reader = OCRReader()
