# backend/app/crud.py
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_
from app import models, schemas
from datetime import datetime
import re
import uuid

def slugify(text: str) -> str:
    """Convert text to URL-friendly slug"""
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text.lower()

# Post CRUD
def create_post(db: Session, post: schemas.PostCreate, author_id: int):
    slug = slugify(post.title)
    # Ensure unique slug
    existing = db.query(models.Post).filter(models.Post.slug == slug).first()
    if existing:
        slug = f"{slug}-{uuid.uuid4().hex[:6]}"
    
    db_post = models.Post(
        **post.dict(),
        slug=slug,
        author_id=author_id,
        published_at=datetime.utcnow() if post.status == "published" else None
    )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post

def get_posts(
    db: Session, 
    skip: int = 0, 
    limit: int = 10,
    status: str = "published",
    category: str = None,
    tag: str = None,
    search: str = None
):
    query = db.query(models.Post)
    
    # Filter by status
    if status:
        query = query.filter(models.Post.status == status)
    
    # Filter by category
    if category:
        query = query.filter(models.Post.category == category)
    
    # Filter by tag (JSON array search)
    if tag:
        query = query.filter(models.Post.tags.any(tag))
    
    # Search in title and content
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                models.Post.title.ilike(search_pattern),
                models.Post.content.ilike(search_pattern),
                models.Post.summary.ilike(search_pattern)
            )
        )
    
    total = query.count()
    posts = query.order_by(desc(models.Post.created_at)).offset(skip).limit(limit).all()
    
    return posts, total

def get_post_by_slug(db: Session, slug: str):
    post = db.query(models.Post).filter(models.Post.slug == slug).first()
    if post:
        post.views += 1
        db.commit()
        db.refresh(post)
    return post

def update_post(db: Session, post_id: int, post_update: schemas.PostUpdate):
    db_post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not db_post:
        return None
    
    update_data = post_update.dict(exclude_unset=True)
    if 'status' in update_data and update_data['status'] == "published" and db_post.status != "published":
        update_data['published_at'] = datetime.utcnow()
    
    for field, value in update_data.items():
        setattr(db_post, field, value)
    
    db.commit()
    db.refresh(db_post)
    return db_post

def delete_post(db: Session, post_id: int):
    db_post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if db_post:
        db.delete(db_post)
        db.commit()
        return True
    return False

# Comment CRUD
def create_comment(db: Session, comment: schemas.CommentCreate):
    db_comment = models.Comment(**comment.dict())
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment

def get_post_comments(db: Session, post_id: int, skip: int = 0, limit: int = 10):
    return db.query(models.Comment).filter(
        models.Comment.post_id == post_id,
        models.Comment.is_approved == True
    ).offset(skip).limit(limit).all()