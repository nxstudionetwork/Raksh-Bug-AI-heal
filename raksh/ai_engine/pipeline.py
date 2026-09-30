import time
from typing import Dict, Optional
from app.ai.preprocessing.text_cleaner import text_cleaner
from app.ai.threat_classifier.classifier import threat_classifier
from app.ai.explainable_ai.explainer import explainer
from app.ai.recommendation_engine.recommender import recommender
from app.ai.confidence_engine.calculator import confidence_calculator
from app.ai.scoring_engine.calculator import scoring_engine
from app.ai.threat_intelligence.database import threat_intel
from app.database.models import ThreatCategory, Severity
from app.config.settings import settings
from app.utils.logger import logger

class AnalysisPipeline:
    MODEL_VERSION = "2.0.0"
    
    async def analyze(self, message_content: str, subject: str = "", source: str = "manual",
                      attachment_paths: list = None) -> Dict:
        start_time = time.time()
        try:
            classification = threat_classifier.classify_combined(message_content, subject)
            text_analysis = classification["text_analysis"]
            url_analyses = classification["url_analyses"]
            
            scores = scoring_engine.compute_scores(text_analysis, url_analyses)
            confidence = confidence_calculator.calculate(text_analysis)
            severity = explainer.get_severity(scores["risk_score"])
            explanation = explainer.generate_explanation({
                **text_analysis, "risk_score": scores["risk_score"], "threat_category": text_analysis["threat_category"]
            })
            recommendation_text = explainer.generate_recommendation({
                "risk_score": scores["risk_score"], "threat_category": text_analysis["threat_category"]
            })
            recommendations = recommender.generate({
                "risk_score": scores["risk_score"], "threat_category": text_analysis["threat_category"],
                "recommendation": recommendation_text, "psychological_tactics": text_analysis.get("psychological_tactics", {})
            })
            
            threat_intel_matches = threat_intel.lookup(message_content)
            
            attachment_results = []
            ocr_texts = []
            if attachment_paths:
                from app.ai.attachment_analysis.analyzer import attachment_analyzer
                for path in attachment_paths:
                    att_result = attachment_analyzer.analyze(path)
                    attachment_results.append(att_result)
                    from app.ai.image_analysis.analyzer import image_analyzer
                    img_result = image_analyzer.analyze(path)
                    if img_result.get("is_image"):
                        from app.ai.ocr.reader import ocr_reader
                        ocr_result = ocr_reader.read(path)
                        if ocr_result.get("text"):
                            ocr_texts.append(ocr_result["text"])
            
            combined_text = message_content
            if ocr_texts:
                combined_text = message_content + "\n" + "\n".join(ocr_texts)
                classification = threat_classifier.classify_combined(combined_text, subject)
                scores = scoring_engine.compute_scores(classification["text_analysis"], classification["url_analyses"])
                confidence = confidence_calculator.calculate(classification["text_analysis"])
                severity = explainer.get_severity(scores["risk_score"])
                explanation = explainer.generate_explanation({
                    **classification["text_analysis"], "risk_score": scores["risk_score"],
                    "threat_category": classification["text_analysis"]["threat_category"]
                })
                recommendation_text = explainer.generate_recommendation({
                    "risk_score": scores["risk_score"], "threat_category": classification["text_analysis"]["threat_category"]
                })
                recommendations = recommender.generate({
                    "risk_score": scores["risk_score"], "threat_category": classification["text_analysis"]["threat_category"],
                    "recommendation": recommendation_text,
                    "psychological_tactics": classification["text_analysis"].get("psychological_tactics", {})
                })
            
            processing_time = int((time.time() - start_time) * 1000)
            logger.info(f"Analysis complete: risk={scores['risk_score']}, category={text_analysis['threat_category']}, confidence={confidence:.2f}, time={processing_time}ms")
            
            return {
                "risk_score": scores["risk_score"],
                "spam_score": scores["spam_score"],
                "scam_score": scores["scam_score"],
                "phishing_score": scores["phishing_score"],
                "confidence": round(confidence, 3),
                "threat_category": text_analysis["threat_category"],
                "severity": severity,
                "explanation": explanation,
                "recommendation": recommendation_text,
                "suggested_actions": recommendations["suggested_actions"],
                "detected_keywords": text_analysis.get("detected_keywords", []),
                "psychological_tactics": text_analysis.get("psychological_tactics", {}),
                "threat_intel_matches": [m["scam_name"] for m in threat_intel_matches],
                "url_analyses": url_analyses,
                "attachment_analysis": attachment_results,
                "ocr_texts": ocr_texts,
                "requires_immediate_action": recommendations["requires_immediate_action"],
                "processing_time_ms": processing_time,
                "model_version": self.MODEL_VERSION,
            }
        except Exception as e:
            logger.error(f"Analysis pipeline failed: {e}")
            processing_time = int((time.time() - start_time) * 1000)
            return {
                "risk_score": 0, "spam_score": 0, "scam_score": 0, "phishing_score": 0,
                "confidence": 0, "threat_category": ThreatCategory.SAFE.value, "severity": Severity.SAFE.value,
                "explanation": "Analysis could not be completed due to a system error.", "recommendation": "Please try scanning this message again.",
                "suggested_actions": [], "requires_immediate_action": False, "detected_keywords": [],
                "psychological_tactics": {}, "threat_intel_matches": [], "url_analyses": [],
                "attachment_analysis": [], "ocr_texts": [],
                "processing_time_ms": processing_time, "model_version": self.MODEL_VERSION,
            }

pipeline = AnalysisPipeline()
