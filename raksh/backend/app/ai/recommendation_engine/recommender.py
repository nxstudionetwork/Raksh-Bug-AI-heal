from typing import Dict

class RecommendationEngine:
    def generate(self, result: Dict) -> Dict:
        category = result.get("threat_category", "safe")
        risk = result.get("risk_score", 0)
        tactics = result.get("psychological_tactics", {})
        
        suggested_actions = []
        
        if risk >= 80:
            suggested_actions.append("IMMEDIATE: Report this to cybersecurity team")
            suggested_actions.append("IMMEDIATE: Do not respond or click any links")
            suggested_actions.append("IMMEDIATE: Change affected passwords")
        elif risk >= 50:
            suggested_actions.append("Block sender and delete message")
            suggested_actions.append("Verify with sender through alternate channel")
            suggested_actions.append("Report as suspicious")
        elif risk >= 20:
            suggested_actions.append("Review message carefully before responding")
            suggested_actions.append("Verify if expected")
        else:
            suggested_actions.append("No action needed")
        
        if "urgency" in tactics:
            suggested_actions.insert(0, "WARNING: This message uses urgency to rush your decision. Pause and verify")
        if "fear" in tactics:
            suggested_actions.insert(0, "WARNING: This message uses fear to manipulate. Stay calm and verify facts")
        if "greed" in tactics:
            suggested_actions.insert(0, "WARNING: Too good to be true offers are usually scams")
        
        return {
            "primary_recommendation": result.get("recommendation", "Exercise caution"),
            "suggested_actions": suggested_actions,
            "requires_immediate_action": risk >= 60,
            "should_block_sender": risk >= 50,
        }

recommender = RecommendationEngine()
