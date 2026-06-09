import os
import shutil
from pathlib import Path
from typing import List
from fastapi import UploadFile, HTTPException
from PIL import Image as PILImage
import aiofiles
from app.config import settings
from app.utils.validators import validate_file, sanitize_filename

class FileService:
    def __init__(self):
        # Create upload directory if it doesn't exist
        Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    
    async def save_file(self, file: UploadFile, project_id: int, order_index: int) -> dict:
        """Save uploaded file and return file info"""
        try:
            # Validate file
            validate_file(file)
            
            # Generate safe filename
            safe_filename = sanitize_filename(file.filename)
            
            # Create project subdirectory
            project_dir = Path(settings.upload_dir) / str(project_id)
            project_dir.mkdir(parents=True, exist_ok=True)
            
            # Save file path - use relative path from project root
            file_path = project_dir / safe_filename
            
            # Save file
            async with aiofiles.open(file_path, 'wb') as out_file:
                content = await file.read()
                await out_file.write(content)
            
            # Create thumbnail
            await self.create_thumbnail(file_path, project_dir / f"thumb_{safe_filename}")
            
            # Store path as string with forward slashes
            stored_path = str(file_path).replace('\\', '/')
            
            return {
                "filename": safe_filename,
                "original_filename": file.filename,
                "file_path": stored_path,
                "file_size": len(content),
                "mime_type": file.content_type,
                "order_index": order_index
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")
    
    async def create_thumbnail(self, image_path: Path, thumb_path: Path, size: tuple = (200, 200)):
        """Create thumbnail for image"""
        try:
            with PILImage.open(image_path) as img:
                # Convert to RGB if necessary
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')
                
                # Create thumbnail
                img.thumbnail(size, PILImage.Resampling.LANCZOS)
                img.save(thumb_path, 'JPEG', quality=85)
        except Exception as e:
            print(f"Error creating thumbnail: {e}")
    
    async def delete_files(self, project_id: int):
        """Delete all files for a project"""
        project_dir = Path(settings.upload_dir) / str(project_id)
        if project_dir.exists():
            shutil.rmtree(project_dir)
    
    async def delete_file(self, file_path: str):
        """Delete a single file"""
        path = Path(file_path)
        if path.exists():
            path.unlink()
            
        # Also delete thumbnail if exists
        thumb_path = path.parent / f"thumb_{path.name}"
        if thumb_path.exists():
            thumb_path.unlink()

file_service = FileService()