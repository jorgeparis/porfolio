from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List, Optional
import os
from pathlib import Path

from app.database import get_db
from app.models import Project, Image
from app.services.file_service import file_service
from app.config import settings

router = APIRouter(prefix="/api/upload", tags=["upload"])

# ============ OPTIONS ENDPOINTS FOR CORS ============


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


@router.options("/images/{image_id}")
async def options_delete_image():
    """Handle CORS preflight for delete"""
    return JSONResponse(
        content={"message": "OK"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )


@router.options("/bulk-delete")
async def options_bulk_delete():
    """Handle CORS preflight for bulk delete"""
    return JSONResponse(
        content={"message": "OK"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )

# ============ UPLOAD ENDPOINTS ============


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

# ============ DELETE ENDPOINTS ============


@router.delete("/images/{image_id}")
async def delete_image(
    image_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a single image and its associated file
    """
    try:
        # Get the image record
        result = await db.execute(
            select(Image).where(Image.id == image_id)
        )
        image = result.scalar_one_or_none()

        if not image:
            raise HTTPException(status_code=404, detail="Image not found")

        # Get project info for potential reordering
        project_id = image.project_id

        # Store image filename for file deletion
        filename = image.filename

        # Delete the database record
        await db.execute(
            delete(Image).where(Image.id == image_id)
        )
        await db.commit()

        # Delete the physical file
        file_path = Path(settings.upload_dir) / filename
        if file_path.exists():
            try:
                os.remove(file_path)
            except Exception as e:
                print(f"Warning: Could not delete file {filename}: {e}")

        # If the deleted image was primary, set another image as primary if exists
        if image.is_primary:
            result = await db.execute(
                select(Image).where(Image.project_id == project_id).limit(1)
            )
            next_image = result.scalar_one_or_none()
            if next_image:
                next_image.is_primary = 1
                await db.commit()

        return {
            "message": "Image deleted successfully",
            "id": image_id,
            "project_id": project_id
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")


@router.delete("/bulk-delete")
async def bulk_delete_images(
    image_ids: List[int] = Query(...,
                                 description="List of image IDs to delete"),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete multiple images at once
    """
    try:
        if not image_ids:
            raise HTTPException(
                status_code=400, detail="No image IDs provided")

        deleted_count = 0
        failed_ids = []
        deleted_files = []

        for image_id in image_ids:
            try:
                # Get the image record
                result = await db.execute(
                    select(Image).where(Image.id == image_id)
                )
                image = result.scalar_one_or_none()

                if image:
                    # Store filename for deletion
                    filename = image.filename

                    # Delete database record
                    await db.execute(
                        delete(Image).where(Image.id == image_id)
                    )
                    deleted_count += 1

                    # Delete physical file
                    file_path = Path(settings.upload_dir) / filename
                    if file_path.exists():
                        try:
                            os.remove(file_path)
                            deleted_files.append(filename)
                        except Exception as e:
                            print(
                                f"Warning: Could not delete file {filename}: {e}")
                else:
                    failed_ids.append(image_id)

            except Exception as e:
                failed_ids.append(image_id)
                print(f"Error deleting image {image_id}: {e}")

        await db.commit()

        return {
            "message": f"Deleted {deleted_count} images successfully",
            "deleted_count": deleted_count,
            "failed_ids": failed_ids if failed_ids else None,
            "deleted_files": deleted_files
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Bulk delete failed: {str(e)}")


@router.delete("/project/{project_id}")
async def delete_project_with_images(
    project_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete an entire project and all its associated images
    """
    try:
        # Get the project
        result = await db.execute(
            select(Project).where(Project.id == project_id)
        )
        project = result.scalar_one_or_none()

        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # Get all images for this project
        result = await db.execute(
            select(Image).where(Image.project_id == project_id)
        )
        images = result.scalars().all()

        # Delete all physical files
        deleted_files = []
        for image in images:
            file_path = Path(settings.upload_dir) / image.filename
            if file_path.exists():
                try:
                    os.remove(file_path)
                    deleted_files.append(image.filename)
                except Exception as e:
                    print(
                        f"Warning: Could not delete file {image.filename}: {e}")

        # Delete all image records
        await db.execute(
            delete(Image).where(Image.project_id == project_id)
        )

        # Delete the project
        await db.execute(
            delete(Project).where(Project.id == project_id)
        )

        await db.commit()

        return {
            "message": f"Project '{project.title}' deleted successfully",
            "project_id": project_id,
            "images_deleted": len(images),
            "files_deleted": len(deleted_files)
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Delete project failed: {str(e)}")

# ============ UPDATE ENDPOINTS ============


@router.put("/images/{image_id}")
async def update_image_metadata(
    image_id: int,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    country: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    is_primary: Optional[bool] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Update image metadata
    """
    try:
        # Get the image
        result = await db.execute(
            select(Image).where(Image.id == image_id)
        )
        image = result.scalar_one_or_none()

        if not image:
            raise HTTPException(status_code=404, detail="Image not found")

        # Update fields if provided
        if title is not None:
            image.title = title
        if description is not None:
            image.description = description
        if country is not None:
            image.country = country
        if category is not None:
            image.category = category

        # Handle primary image update
        if is_primary is not None and is_primary:
            # Unset primary for all other images in the same project
            await db.execute(
                update(Image)
                .where(
                    Image.project_id == image.project_id,
                    Image.id != image_id
                )
                .values(is_primary=0)
            )
            image.is_primary = 1

        await db.commit()
        await db.refresh(image)

        return {
            "message": "Image updated successfully",
            "image": {
                "id": image.id,
                "title": image.title,
                "description": image.description,
                "country": image.country,
                "category": image.category,
                "is_primary": image.is_primary,
                "filename": image.filename
            }
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Update failed: {str(e)}")

# ============ GET ENDPOINTS ============


@router.get("/images")
async def get_all_images(
    project_id: Optional[int] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all images with optional filtering
    """
    try:
        query = select(Image)

        if project_id:
            query = query.where(Image.project_id == project_id)

        query = query.offset(offset).limit(limit)

        result = await db.execute(query)
        images = result.scalars().all()

        return {
            "images": [
                {
                    "id": img.id,
                    "filename": img.filename,
                    "original_filename": img.original_filename,
                    "title": img.title,
                    "description": img.description,
                    "country": img.country,
                    "category": img.category,
                    "is_primary": img.is_primary,
                    "file_size": img.file_size,
                    "mime_type": img.mime_type,
                    "project_id": img.project_id,
                    "uploaded_at": img.uploaded_at.isoformat()
                }
                for img in images
            ],
            "count": len(images)
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch images: {str(e)}")
