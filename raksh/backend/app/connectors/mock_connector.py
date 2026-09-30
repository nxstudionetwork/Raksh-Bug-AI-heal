import asyncio
import random
from typing import Dict, List
from datetime import datetime
from app.connectors.base import BaseConnector


class MockConnector(BaseConnector):
    """Mock connector for testing the connector framework."""
    
    MOCK_MESSAGES = [
        {"sender": "+919876543210", "content": "URGENT: Your account has been compromised. Click here to verify immediately: http://fake-bank.xyz/verify", "subject": "Account Alert"},
        {"sender": "support@amaz0n-secure.com", "content": "Dear customer, your Amazon account has been locked due to suspicious activity. Verify now: http://amaz0n-verify.xyz", "subject": "Account Locked"},
        {"sender": "hr@google-jobs.top", "content": "Congratulations! Google is hiring work from home. Earn ₹75,000/month. Register now with ₹999 fee.", "subject": "Job Offer"},
        {"sender": "info@delivery-club.top", "content": "Your package is held at customs. Pay ₹500 release fee: http://dtdc-parcel-track.club", "subject": "Package Alert"},
        {"sender": "friend@email.com", "content": "Hey! Meeting tomorrow at 3pm. Let me know if you can make it.", "subject": "Meeting Reminder"},
        {"sender": "prize@lottery-win.top", "content": "CONGRATULATIONS! You won ₹50,00,000 in our lucky draw! Claim now: http://lottery-win.top/claim", "subject": "You Won!"},
    ]
    
    async def connect(self) -> bool:
        await asyncio.sleep(0.5)
        self.is_connected = True
        return True
    
    async def disconnect(self) -> bool:
        await asyncio.sleep(0.2)
        self.is_connected = False
        return True
    
    async def health_check(self) -> Dict:
        return {"status": "healthy" if self.is_connected else "disconnected", "platform": "mock"}
    
    async def fetch_messages(self, limit: int = 10) -> List[Dict]:
        await asyncio.sleep(0.3)
        count = min(limit, len(self.MOCK_MESSAGES))
        selected = random.sample(self.MOCK_MESSAGES, count)
        return [
            {
                "source": "email",
                "sender": msg["sender"],
                "receiver": "user@raksh.security",
                "subject": msg.get("subject", ""),
                "message_content": msg["content"],
                "received_time": datetime.utcnow().isoformat(),
            }
            for msg in selected
        ]
