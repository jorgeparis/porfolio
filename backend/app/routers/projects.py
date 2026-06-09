from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func, and_, or_
from sqlalchemy.orm import selectinload
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from app.database import get_db
from app.models import Project, Image
from app.services.file_service import file_service
import os

router = APIRouter(prefix="/api/projects", tags=["projects"])

# Pydantic models for response
class ImageResponse(BaseModel):
    id: int
    filename: str
    original_filename: str
    file_path: str
    file_size: int
    order_index: int
    is_primary: int
    created_at: str
    url: str = Field(..., description="URL to access the image")

class ProjectResponse(BaseModel):
    id: int
    title: str
    category: str
    country: str
    description: Optional[str]
    created_at: str
    updated_at: str
    images: List[ImageResponse]
    primary_image: Optional[ImageResponse] = None

class ProjectCreate(BaseModel):
    title: str
    category: str
    country: str
    description: Optional[str] = None

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    country: Optional[str] = None
    description: Optional[str] = None

class ProjectsListResponse(BaseModel):
    total: int
    projects: List[ProjectResponse]

# Helper function to get image URL
def get_image_url(file_path: str) -> str:
    """Convert file path to URL"""
    if not file_path:
        return ""
    
    # Convert Windows backslashes to forward slashes
    normalized_path = file_path.replace('\\', '/')
    
    # Extract the part after 'uploads/'
    if 'uploads/' in normalized_path:
        url_path = normalized_path.split('uploads/')[-1]
    else:
        url_path = normalized_path
    
    # Ensure no leading slash
    url_path = url_path.lstrip('/')
    
    # Return relative URL
    return f"/uploads/{url_path}"

@router.get("/", response_model=ProjectsListResponse)
async def get_all_projects(
    skip: int = Query(0, ge=0, description="Number of projects to skip"),
    limit: int = Query(100, ge=1, le=500, description="Number of projects to return"),
    category: Optional[str] = Query(None, description="Filter by category"),
    country: Optional[str] = Query(None, description="Filter by country"),
    search: Optional[str] = Query(None, description="Search in title and description"),
    db: AsyncSession = Depends(get_db)
):
    """Get all projects with filtering options"""
    
    # Build query
    query = select(Project).options(selectinload(Project.images))
    
    # Apply filters
    if category:
        query = query.where(Project.category == category)
    if country:
        query = query.where(Project.country == country)
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Project.title.ilike(search_term),
                Project.description.ilike(search_term)
            )
        )
    
    # Get total count
    count_query = select(func.count()).select_from(Project)
    if category:
        count_query = count_query.where(Project.category == category)
    if country:
        count_query = count_query.where(Project.country == country)
    if search:
        search_term = f"%{search}%"
        count_query = count_query.where(
            or_(
                Project.title.ilike(search_term),
                Project.description.ilike(search_term)
            )
        )
    
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination and ordering
    query = query.order_by(Project.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    projects = result.scalars().all()
    
    # Format response
    projects_data = []
    for p in projects:
        images_data = []
        primary_image = None
        
        for img in p.images:
            img_data = {
                "id": img.id,
                "filename": img.filename,
                "original_filename": img.original_filename,
                "file_path": img.file_path,
                "file_size": img.file_size,
                "order_index": img.order_index,
                "is_primary": img.is_primary,
                "created_at": img.created_at.isoformat(),
                "url": get_image_url(img.file_path)
            }
            images_data.append(img_data)
            
            if img.is_primary == 1:
                primary_image = img_data
        
        # If no primary image set, use first image
        if not primary_image and images_data:
            primary_image = images_data[0]
        
        projects_data.append({
            "id": p.id,
            "title": p.title,
            "category": p.category,
            "country": p.country,
            "description": p.description,
            "created_at": p.created_at.isoformat(),
            "updated_at": p.updated_at.isoformat(),
            "images": images_data,
            "primary_image": primary_image
        })
    
    return {
        "total": total,
        "projects": projects_data
    }

@router.get("/gallery", response_model=List[ProjectResponse])
async def get_gallery_projects(
    category: Optional[str] = Query(None, description="Filter by category"),
    country: Optional[str] = Query(None, description="Filter by country"),
    limit: int = Query(50, ge=1, le=200, description="Number of projects to return"),
    db: AsyncSession = Depends(get_db)
):
    """Get projects for gallery display"""
    
    query = select(Project).options(selectinload(Project.images))
    
    if category and category != "all":
        query = query.where(Project.category == category)
    if country:
        query = query.where(Project.country == country)
    
    query = query.order_by(Project.created_at.desc()).limit(limit)
    
    result = await db.execute(query)
    projects = result.scalars().all()
    
    # Format response
    projects_data = []
    for p in projects:
        images_data = []
        primary_image = None
        
        for img in p.images:
            img_data = {
                "id": img.id,
                "filename": img.filename,
                "original_filename": img.original_filename,
                "file_path": img.file_path,
                "file_size": img.file_size,
                "order_index": img.order_index,
                "is_primary": img.is_primary,
                "created_at": img.created_at.isoformat(),
                "url": get_image_url(img.file_path)
            }
            images_data.append(img_data)
            
            if img.is_primary == 1:
                primary_image = img_data
        
        if not primary_image and images_data:
            primary_image = images_data[0]
        
        projects_data.append({
            "id": p.id,
            "title": p.title,
            "category": p.category,
            "country": p.country,
            "description": p.description,
            "created_at": p.created_at.isoformat(),
            "updated_at": p.updated_at.isoformat(),
            "images": images_data,
            "primary_image": primary_image
        })
    
    return projects_data

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific project with its images"""
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.images))
        .where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    images_data = []
    primary_image = None
    
    for img in project.images:
        img_data = {
            "id": img.id,
            "filename": img.filename,
            "original_filename": img.original_filename,
            "file_path": img.file_path,
            "file_size": img.file_size,
            "order_index": img.order_index,
            "is_primary": img.is_primary,
            "created_at": img.created_at.isoformat(),
            "url": get_image_url(img.file_path)
        }
        images_data.append(img_data)
        
        if img.is_primary == 1:
            primary_image = img_data
    
    if not primary_image and images_data:
        primary_image = images_data[0]
    
    return {
        "id": project.id,
        "title": project.title,
        "category": project.category,
        "country": project.country,
        "description": project.description,
        "created_at": project.created_at.isoformat(),
        "updated_at": project.updated_at.isoformat(),
        "images": images_data,
        "primary_image": primary_image
    }

@router.get("/categories/list")
async def get_categories(db: AsyncSession = Depends(get_db)):
    """Get list of all categories with counts"""
    result = await db.execute(
        select(Project.category, func.count(Project.id))
        .group_by(Project.category)
    )
    categories = result.all()
    
    return {
        "categories": [
            {"name": cat, "count": count} 
            for cat, count in categories
        ]
    }

@router.get("/countries/list")
async def get_countries(db: AsyncSession = Depends(get_db)):
    """Get list of all countries with counts"""
    result = await db.execute(
        select(Project.country, func.count(Project.id))
        .group_by(Project.country)
    )
    countries = result.all()
    
    return {
        "countries": [
            {"name": country, "count": count}
            for country, count in countries
        ]
    }

@router.post("/", response_model=ProjectResponse)
async def create_project(
    project_data: ProjectCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new project without images"""
    project = Project(
        title=project_data.title,
        category=project_data.category,
        country=project_data.country,
        description=project_data.description
    )
    
    db.add(project)
    await db.commit()
    await db.refresh(project)
    
    return {
        "id": project.id,
        "title": project.title,
        "category": project.category,
        "country": project.country,
        "description": project.description,
        "created_at": project.created_at.isoformat(),
        "updated_at": project.updated_at.isoformat(),
        "images": [],
        "primary_image": None
    }

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update project details"""
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project_data.title is not None:
        project.title = project_data.title
    if project_data.category is not None:
        project.category = project_data.category
    if project_data.country is not None:
        project.country = project_data.country
    if project_data.description is not None:
        project.description = project_data.description
    
    project.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(project)
    
    # Load images
    result = await db.execute(
        select(Image).where(Image.project_id == project_id)
    )
    images = result.scalars().all()
    
    images_data = []
    primary_image = None
    
    for img in images:
        img_data = {
            "id": img.id,
            "filename": img.filename,
            "original_filename": img.original_filename,
            "file_path": img.file_path,
            "file_size": img.file_size,
            "order_index": img.order_index,
            "is_primary": img.is_primary,
            "created_at": img.created_at.isoformat(),
            "url": get_image_url(img.file_path)
        }
        images_data.append(img_data)
        
        if img.is_primary == 1:
            primary_image = img_data
    
    if not primary_image and images_data:
        primary_image = images_data[0]
    
    return {
        "id": project.id,
        "title": project.title,
        "category": project.category,
        "country": project.country,
        "description": project.description,
        "created_at": project.created_at.isoformat(),
        "updated_at": project.updated_at.isoformat(),
        "images": images_data,
        "primary_image": primary_image
    }

@router.delete("/{project_id}")
async def delete_project(
    project_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete a project and all its images"""
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Delete files from storage
    await file_service.delete_files(project_id)
    
    # Delete from database
    await db.delete(project)
    await db.commit()
    
    return {"message": "Project deleted successfully"}

@router.put("/images/{image_id}/primary")
async def set_primary_image(
    image_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Set an image as the primary/thumbnail for its project"""
    result = await db.execute(
        select(Image).where(Image.id == image_id)
    )
    image = result.scalar_one_or_none()
    
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Reset all images in this project
    await db.execute(
        "UPDATE images SET is_primary = 0 WHERE project_id = :project_id",
        {"project_id": image.project_id}
    )
    
    # Set this image as primary
    image.is_primary = 1
    
    await db.commit()
    
    return {"message": "Primary image updated successfully"}

@router.get("/debug/images")
async def debug_images(db: AsyncSession = Depends(get_db)):
    """Debug endpoint to check image URLs"""
    result = await db.execute(
        select(Image).limit(10)
    )
    images = result.scalars().all()
    
    image_info = []
    for img in images:
        image_info.append({
            "id": img.id,
            "filename": img.filename,
            "file_path": img.file_path,
            "url": get_image_url(img.file_path),
            "file_exists": os.path.exists(img.file_path) if img.file_path else False
        })
    
    return {
        "upload_dir": str(UPLOAD_DIR),
        "images": image_info
    }