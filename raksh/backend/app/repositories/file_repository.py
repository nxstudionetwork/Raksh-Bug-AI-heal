from typing import Optional, List
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.models import FileStorage


class FileRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, user_id: int, filename: str, original_filename: str,
                     file_path: str, file_size: int, mime_type: Optional[str] = None,
                     file_type: str = "other", scan_id: Optional[int] = None) -> FileStorage:
        file_record = FileStorage(
            user_id=user_id, filename=filename, original_filename=original_filename,
            file_path=file_path, file_size=file_size, mime_type=mime_type,
            file_type=file_type, scan_id=scan_id,
        )
        self.db.add(file_record)
        await self.db.flush()
        return file_record

    async def get_by_id(self, file_id: int) -> Optional[FileStorage]:
        result = await self.db.execute(
            select(FileStorage).where(FileStorage.id == file_id)
        )
        return result.scalar_one_or_none()

    async def list_by_user(self, user_id: int, skip: int = 0, limit: int = 20) -> List[FileStorage]:
        result = await self.db.execute(
            select(FileStorage).where(FileStorage.user_id == user_id)
            .order_by(FileStorage.created_at.desc())
            .offset(skip).limit(limit)
        )
        return result.scalars().all()
