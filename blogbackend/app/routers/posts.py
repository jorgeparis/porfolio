# backend/app/routers/posts.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app import schemas, crud
from app.database import get_db
from app.routers.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/posts", tags=["posts"])

@router.post("/", response_model=schemas.PostResponse)
def create_post(
    post: schemas.PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return crud.create_post(db, post, current_user.id)

@router.get("/", response_model=schemas.PostListResponse)
def get_posts(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    status: Optional[str] = Query("published", regex="^(draft|published|archived)$"),
    category: Optional[str] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    posts, total = crud.get_posts(db, skip, limit, status, category, tag, search)
    return {
        "posts": posts,
        "total": total,
        "page": skip // limit + 1,
        "pages": (total + limit - 1) // limit
    }

@router.get("/{slug}", response_model=schemas.PostResponse)
def get_post(slug: str, db: Session = Depends(get_db)):
    post = crud.get_post_by_slug(db, slug)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

@router.put("/{post_id}", response_model=schemas.PostResponse)
def update_post(
    post_id: int,
    post_update: schemas.PostUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = crud.update_post(db, post_id, post_update)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

@router.delete("/{post_id}")
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not crud.delete_post(db, post_id):
        raise HTTPException(status_code=404, detail="Post not found")
    return {"message": "Post deleted successfully"}

@router.post("/{post_id}/comments", response_model=schemas.CommentResponse)
def create_comment(
    post_id: int,
    comment: schemas.CommentCreate,
    db: Session = Depends(get_db)
):
    # Check if post exists
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    comment.post_id = post_id
    return crud.create_comment(db, comment)

@router.get("/{post_id}/comments", response_model=List[schemas.CommentResponse])
def get_comments(
    post_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    return crud.get_post_comments(db, post_id, skip, limit)