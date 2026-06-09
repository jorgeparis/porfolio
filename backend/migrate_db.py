import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.config import settings

async def migrate():
    engine = create_async_engine(settings.database_url)
    
    async with engine.begin() as conn:
        # Add description column if it doesn't exist
        try:
            await conn.execute(text("ALTER TABLE projects ADD COLUMN description TEXT"))
            print("Added description column to projects table")
        except Exception as e:
            if "duplicate column" in str(e).lower():
                print("Description column already exists")
            else:
                print(f"Error adding description: {e}")
        
        # Add is_primary column to images if it doesn't exist
        try:
            await conn.execute(text("ALTER TABLE images ADD COLUMN is_primary INTEGER DEFAULT 0"))
            print("Added is_primary column to images table")
        except Exception as e:
            if "duplicate column" in str(e).lower():
                print("is_primary column already exists")
            else:
                print(f"Error adding is_primary: {e}")
    
    await engine.dispose()
    print("Migration completed!")

if __name__ == "__main__":
    asyncio.run(migrate())