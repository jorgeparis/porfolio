# backend/app/main.py (updated)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from app.database import engine, Base
from app.routers import posts, auth
import os
from dotenv import load_dotenv

load_dotenv()

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Blog API",
    description="Modern blog API for portfolio website",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS middleware - allow your frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv(
        "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trusted Host middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=os.getenv("ALLOWED_HOSTS", "*").split(",")
)

# Include routers with a prefix to avoid conflicts
app.include_router(auth.router, prefix="/api/blog")
app.include_router(posts.router, prefix="/api/blog")


@app.get("/api/blog/health")
async def health_check():
    return {"status": "healthy", "message": "Blog API is running"}

if __name__ == "__main__":
    import uvicorn
    # Run on port 8001 to avoid conflict
    uvicorn.run(app, host="0.0.0.0", port=8001)
