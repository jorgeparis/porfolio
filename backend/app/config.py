import os
from typing import List
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

class Settings:
    def __init__(self):
        self.database_url: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./projects.db")
        self.upload_dir: str = os.getenv("UPLOAD_DIR", "uploads")
        self.max_file_size: int = int(os.getenv("MAX_FILE_SIZE", "10485760"))
        
        extensions_str = os.getenv("ALLOWED_EXTENSIONS", "jpg,jpeg,png,gif,webp")
        self.allowed_extensions: List[str] = [ext.strip().lower() for ext in extensions_str.split(",")]
        
        Path(self.upload_dir).mkdir(parents=True, exist_ok=True)

settings = Settings()

print("=" * 50)
print("Settings loaded:")
print(f"  Database URL: {settings.database_url}")
print(f"  Upload directory: {settings.upload_dir}")
print(f"  CORS origins: All origins allowed")
print("=" * 50)