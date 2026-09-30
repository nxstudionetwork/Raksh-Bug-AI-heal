import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.database.session import get_db
from app.midlleware.auth_middleware import get_current_user
from app.database.models import User
from app.services.file_service import FileService
from app.repositories.file_repository import FileRepository
from app.utils.logger import logger

router = APIRouter(prefix="/api/files", tags=["Files"])


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = FileService(db)
    try:
        result = await service.upload_file(current_user.id, file)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/")
async def list_files(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    file_type: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = FileRepository(db)
    files = await repo.list_by_user(current_user.id, skip, limit)
    if file_type:
        files = [f for f in files if f.file_type == file_type]
    return [
        {
            "id": f.id,
            "filename": f.filename,
            "original_filename": f.original_filename,
            "file_size": f.file_size,
            "file_type": f.file_type,
            "created_at": f.created_at.isoformat() if f.created_at else None,
        }
        for f in files
    ]


@router.delete("/{file_id}")
async def delete_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = FileRepository(db)
    file_record = await repo.get_by_id(file_id)
    if not file_record or file_record.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="File not found")
    if file_record.file_path and os.path.exists(file_record.file_path):
        try:
            os.remove(file_record.file_path)
        except OSError as e:
            logger.warning(f"Failed to delete physical file {file_record.file_path}: {e}")
    await db.delete(file_record)
    await db.flush()
    return {"message": "File deleted"}
