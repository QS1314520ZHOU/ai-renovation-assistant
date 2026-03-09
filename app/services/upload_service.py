import os
import uuid
import shutil
from fastapi import UploadFile
from app.config import settings

UPLOADS_DIR = "app/static/uploads"


def _ensure_upload_dir():
    if not os.path.exists(UPLOADS_DIR):
        os.makedirs(UPLOADS_DIR, exist_ok=True)


def save_upload_bytes(contents: bytes, filename: str | None = None) -> str:
    _ensure_upload_dir()

    extension = os.path.splitext(filename or "")[1] or ".jpg"
    unique_filename = f"{uuid.uuid4()}{extension}"
    file_path = os.path.join(UPLOADS_DIR, unique_filename)

    with open(file_path, "wb") as buffer:
        buffer.write(contents)

    return f"/static/uploads/{unique_filename}"


def save_upload_file(file: UploadFile) -> str:
    _ensure_upload_dir()
    
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOADS_DIR, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return f"/static/uploads/{unique_filename}"
