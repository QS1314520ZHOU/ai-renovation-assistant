import os
import uuid
import shutil
from fastapi import UploadFile
from app.config import settings

UPLOADS_DIR = "app/static/uploads"

def save_upload_file(file: UploadFile) -> str:
    if not os.path.exists(UPLOADS_DIR):
        os.makedirs(UPLOADS_DIR, exist_ok=True)
    
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOADS_DIR, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return f"/static/uploads/{unique_filename}"
