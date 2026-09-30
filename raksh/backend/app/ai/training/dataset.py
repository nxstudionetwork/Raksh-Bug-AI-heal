from typing import Dict, List, Optional

class DatasetManager:
    def __init__(self):
        self.training_data = []
    
    def add_sample(self, message: str, prediction: str, confidence: float, user_feedback: Optional[str] = None, verified_label: Optional[str] = None):
        self.training_data.append({
            "message": message,
            "prediction": prediction,
            "confidence": confidence,
            "user_feedback": user_feedback,
            "verified_label": verified_label,
            "model_version": "1.0.0",
        })
    
    def get_stats(self) -> Dict:
        return {
            "total_samples": len(self.training_data),
            "with_feedback": sum(1 for d in self.training_data if d["user_feedback"]),
            "with_verification": sum(1 for d in self.training_data if d["verified_label"]),
        }

dataset_manager = DatasetManager()
