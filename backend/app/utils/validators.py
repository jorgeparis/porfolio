from fastapi import HTTPException, UploadFile
from app.config import settings
import os

def validate_file(file: UploadFile):
    file.file.seek(0, os.SEEK_END)
    size = file.file.tell()
    file.file.seek(0)
    
    if size > settings.max_file_size:
        raise HTTPException(status_code=400, detail=f"File too large. Max size: {settings.max_file_size // 1024 // 1024}MB")
    
    file_extension = file.filename.split('.')[-1].lower()
    if file_extension not in settings.allowed_extensions:
        raise HTTPException(status_code=400, detail=f"File type not allowed. Allowed: {', '.join(settings.allowed_extensions)}")
    
    return True

def sanitize_filename(filename: str) -> str:
    import re
    from datetime import datetime
    
    name, ext = os.path.splitext(filename)
    name = re.sub(r'[^\w\-_.]', '_', name)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"{timestamp}_{name}{ext}"