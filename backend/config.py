import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv(encoding='utf-8')

DATABASE_URL = os.getenv("DATABASE_URL")

print("DEBUG: DATABASE_URL repr ->", repr(DATABASE_URL))
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
