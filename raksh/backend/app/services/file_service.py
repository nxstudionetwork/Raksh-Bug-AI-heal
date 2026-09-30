import os
import uuid
import aiofiles
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import UploadFile
from app.repositories.file_repository import FileRepository
from app.config.settings import settings


class FileService:
    ALLOWED_TYPES = {
        "image": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
        "document": [".pdf", ".doc", ".docx", ".txt", ".csv"],
        "audio": [".mp3", ".wav", ".ogg", ".m4a"],
        "video": [".mp4", ".avi", ".mov", ".mkv"],
        "archive": [".zip", ".rar", ".7z"],
    }
    
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

    def __init__(self, db: AsyncSession):
        self.repo = FileRepository(db)
        self.upload_dir = settings.UPLOAD_DIR

    async def upload_file(self, user_id: int, file: UploadFile, scan_id: Optional[int] = None) -> dict:
        ext = os.path.splitext(file.filename or "unknown")[1].lower()
        file_type = self._detect_file_type(ext)
        
        file_id = str(uuid.uuid4())
        safe_filename = f"{file_id}{ext}"
        user_dir = os.path.join(self.upload_dir, str(user_id))
        os.makedirs(user_dir, exist_ok=True)
        file_path = os.path.join(user_dir, safe_filename)
        
        content = await file.read()
        if len(content) > self.MAX_FILE_SIZE:
            raise ValueError("File too large")
        
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
        
        db_file = await self.repo.create(
            user_id=user_id,
            filename=safe_filename,
            original_filename=file.filename or "unknown",
            file_path=file_path,
            file_size=len(content),
            mime_type=file.content_type,
            file_type=file_type,
            scan_id=scan_id,
        )
        
        return {
            "id": db_file.id,
            "filename": safe_filename,
            "original_filename": file.filename,
            "file_size": len(content),
            "file_type": file_type,
            "created_at": db_file.created_at.isoformat() if db_file.created_at else None,
        }

    def _detect_file_type(self, ext: str) -> str:
        for file_type, extensions in self.ALLOWED_TYPES.items():
            if ext in extensions:
                return file_type
        return "other"
