# backend/app/schemas.py
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import List, Optional
from enum import Enum

class PostStatus(str, Enum):
    draft = "draft"
    published = "published"
    archived = "archived"

# User schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True

# Post schemas
class PostBase(BaseModel):
    title: str
    content: str
    summary: Optional[str] = None
    featured_image: Optional[str] = None
    tags: List[str] = []
    category: Optional[str] = None
    status: PostStatus = PostStatus.draft
    reading_time: int = 5

class PostCreate(PostBase):
    pass

class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    summary: Optional[str] = None
    featured_image: Optional[str] = None
    tags: Optional[List[str]] = None
    category: Optional[str] = None
    status: Optional[PostStatus] = None
    reading_time: Optional[int] = None

class PostResponse(PostBase):
    id: int
    slug: str
    views: int
    created_at: datetime
    updated_at: Optional[datetime]
    published_at: Optional[datetime]
    author: UserResponse
    
    class Config:
        from_attributes = True

class PostListResponse(BaseModel):
    posts: List[PostResponse]
    total: int
    page: int
    pages: int

# Comment schemas
class CommentBase(BaseModel):
    content: str
    author_name: str
    author_email: EmailStr

class CommentCreate(CommentBase):
    post_id: int

class CommentResponse(CommentBase):
    id: int
    created_at: datetime
    is_approved: bool

    class Config:
        from_attributes = True