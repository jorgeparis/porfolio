from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)  # studio, network, telecom
    country = Column(String, nullable=False)
    description = Column(Text, nullable=True)  # Project description
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    images = relationship("Image", back_populates="project", cascade="all, delete-orphan")

class Image(Base):
    __tablename__ = "images"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String, nullable=False)
    order_index = Column(Integer, default=0)
    is_primary = Column(Integer, default=0)  # 1 for primary/thumbnail image
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Foreign Key
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    
    # Relationship
    project = relationship("Project", back_populates="images")

