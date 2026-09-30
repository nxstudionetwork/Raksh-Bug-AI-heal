"""
Standalone AI analysis pipeline.
Usage: python -m ai_engine.analyze "Your message text to analyze"
       python -m ai_engine.analyze --file message.txt
"""
import json
import sys
import os
import time
from typing import Dict, Optional

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.ai.preprocessing.text_cleaner import text_cleaner
from backend.app.ai.threat_classifier.classifier import threat_classifier
from backend.app.ai.explainable_ai.explainer import explainer
from backend.app.ai.recommendation_engine.recommender import recommender
from backend.app.ai.confidence_engine.calculator import confidence_calculator
from backend.app.ai.scoring_engine.calculator import scoring_engine
from backend.app.ai.threat_intelligence.database import threat_intel


def analyze_text(message_content: str, subject: str = "", detailed: bool = False) -> Dict:
    classification = threat_classifier.classify_combined(message_content, subject)
    text_analysis = classification["text_analysis"]
    url_analyses = classification["url_analyses"]

    scores = scoring_engine.compute_scores(text_analysis, url_analyses)
    confidence = confidence_calculator.calculate(text_analysis)
    severity = explainer.get_severity(scores["risk_score"])
    explanation = explainer.generate_explanation({
        **text_analysis, "risk_score": scores["risk_score"],
        "threat_category": text_analysis["threat_category"]
    })
    recommendation_text = explainer.generate_recommendation({
        "risk_score": scores["risk_score"],
        "threat_category": text_analysis["threat_category"]
    })
    recommendations = recommender.generate({
        "risk_score": scores["risk_score"],
        "threat_category": text_analysis["threat_category"],
        "recommendation": recommendation_text,
        "psychological_tactics": text_analysis.get("psychological_tactics", {})
    })
    threat_intel_matches = threat_intel.lookup(message_content)

    result = {
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
        "requires_immediate_action": recommendations["requires_immediate_action"],
        "detected_keywords": text_analysis.get("detected_keywords", []),
        "psychological_tactics": text_analysis.get("psychological_tactics", {}),
        "threat_intel_matches": [m["scam_name"] for m in threat_intel_matches],
        "url_analyses": url_analyses,
    }

    if detailed:
        result["text_analysis"] = text_analysis
        result["url_analyses"] = url_analyses

    return result


def main():
    import argparse
    parser = argparse.ArgumentParser(description="RAKSH AI Engine - Analyze text for threats")
    parser.add_argument("text", nargs="?", help="Text to analyze")
    parser.add_argument("--file", "-f", help="Read text from file")
    parser.add_argument("--json", "-j", action="store_true", help="Output as JSON")
    parser.add_argument("--detailed", "-d", action="store_true", help="Show detailed analysis")
    args = parser.parse_args()

    if args.file:
        with open(args.file, "r") as f:
            text = f.read()
    elif args.text:
        text = args.text
    else:
        text = sys.stdin.read().strip()

    if not text:
        print("No text provided. Use --help for usage.")
        sys.exit(1)

    start = time.time()
    result = analyze_text(text, detailed=args.detailed)
    elapsed = int((time.time() - start) * 1000)

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"\n{'='*50}")
        print(f"RAKSH AI Analysis ({elapsed}ms)")
        print(f"{'='*50}")
        print(f"  Risk Score:      {result['risk_score']}/100")
        print(f"  Confidence:      {result['confidence']*100:.1f}%")
        print(f"  Threat Category: {result['threat_category'].replace('_', ' ').title()}")
        print(f"  Severity:        {result['severity'].title()}")
        print(f"  Explanation:     {result['explanation']}")
        print(f"  Recommendation:  {result['recommendation']}")
        if result["detected_keywords"]:
            print(f"  Keywords:        {', '.join(result['detected_keywords'])}")
        if result["suggested_actions"]:
            print(f"  Actions:         {'; '.join(result['suggested_actions'])}")
        print(f"{'='*50}\n")


if __name__ == "__main__":
    main()
