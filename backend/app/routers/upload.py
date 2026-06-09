from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from app.database import get_db
from app.models import Project, Image
from app.services.file_service import file_service

router = APIRouter(prefix="/api/upload", tags=["upload"])

@router.post("/project-with-images")
async def upload_project_with_images(
    title: str = Form(...),
    category: str = Form(...),
    country: str = Form(...),
    description: Optional[str] = Form(None),
    files: List[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db)
):
    """Upload a new project with multiple images"""
    try:
        # Create project
        project = Project(
            title=title,
            category=category,
            country=country,
            description=description
        )
        db.add(project)
        await db.flush()  # Get project ID without committing
        
        # Save images
        saved_images = []
        for index, file in enumerate(files):
            file_info = await file_service.save_file(file, project.id, index)
            
            # Set first image as primary by default
            is_primary = 1 if index == 0 else 0
            
            image = Image(
                project_id=project.id,
                is_primary=is_primary,
                **file_info
            )
            db.add(image)
            saved_images.append(image)
        
        await db.commit()
        await db.refresh(project)
        
        return {
            "message": "Project uploaded successfully",
            "project": {
                "id": project.id,
                "title": project.title,
                "category": project.category,
                "country": project.country,
                "description": project.description,
                "created_at": project.created_at.isoformat()
            },
            "images_count": len(saved_images)
        }
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.post("/images/{project_id}")
async def upload_images_to_project(
    project_id: int,
    files: List[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db)
):
    """Add images to an existing project"""
    try:
        # Check if project exists
        result = await db.execute(select(Project).where(Project.id == project_id))
        project = result.scalar_one_or_none()
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get current max order index
        result = await db.execute(
            select(Image).where(Image.project_id == project_id)
        )
        existing_images = result.scalars().all()
        start_index = len(existing_images)
        
        # Save new images
        saved_images = []
        for index, file in enumerate(files):
            file_info = await file_service.save_file(file, project_id, start_index + index)
            
            image = Image(
                project_id=project_id,
                is_primary=0,  # New images are not primary by default
                **file_info
            )
            db.add(image)
            saved_images.append(image)
        
        await db.commit()
        
        return {
            "message": f"Added {len(saved_images)} images to project",
            "images_count": len(saved_images)
        }
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
    
    from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from app.database import get_db
from app.models import Project, Image
from app.services.file_service import file_service

router = APIRouter(prefix="/api/upload", tags=["upload"])

@router.options("/project-with-images")
async def options_upload():
    """Handle CORS preflight requests"""
    return JSONResponse(
        content={"message": "OK"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )

@router.post("/project-with-images")
async def upload_project_with_images(
    title: str = Form(...),
    category: str = Form(...),
    country: str = Form(...),
    description: Optional[str] = Form(None),
    files: List[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db)
):
    """Upload a new project with multiple images"""
    try:
        # Create project
        project = Project(
            title=title,
            category=category,
            country=country,
            description=description
        )
        db.add(project)
        await db.flush()  # Get project ID without committing
        
        # Save images
        saved_images = []
        for index, file in enumerate(files):
            file_info = await file_service.save_file(file, project.id, index)
            
            # Set first image as primary by default
            is_primary = 1 if index == 0 else 0
            
            image = Image(
                project_id=project.id,
                is_primary=is_primary,
                **file_info
            )
            db.add(image)
            saved_images.append(image)
        
        await db.commit()
        await db.refresh(project)
        
        return {
            "message": "Project uploaded successfully",
            "project": {
                "id": project.id,
                "title": project.title,
                "category": project.category,
                "country": project.country,
                "description": project.description,
                "created_at": project.created_at.isoformat()
            },
            "images_count": len(saved_images)
        }
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")