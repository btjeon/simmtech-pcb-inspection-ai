"""
Database connection management
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# pg8000 드라이버 사용 (순수 Python, 인코딩 문제 없음)
# 로컬 PostgreSQL의 pcb_inspection_db 데이터베이스 사용
DATABASE_URL = "postgresql+pg8000://postgres:0@localhost:5432/pcb_inspection_db"

# SQLAlchemy engine 생성
engine = create_engine(
    DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    echo=False
)

# SessionLocal class 생성
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db():
    """
    Dependency for getting database session
    FastAPI dependency로 사용
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Initialize database (create all tables)
    """
    from app.database import schema
    Base.metadata.create_all(bind=engine)
