@echo off
REM PCB Inspection AI - Development Start Script
REM 개발 환경 실행 스크립트

echo ====================================
echo PCB Inspection AI - 개발 환경 시작
echo ====================================
echo.

REM Docker Compose로 인프라 서비스 시작
echo [1/3] 인프라 서비스 시작 (PostgreSQL, MinIO, MLflow)...
docker-compose up -d postgres minio mlflow

echo.
echo [2/3] 데이터베이스 준비 대기 (10초)...
timeout /t 10 /nobreak > nul

echo.
echo [3/3] 서비스 시작 안내
echo.
echo ✓ PostgreSQL: localhost:5432
echo ✓ MinIO Console: http://localhost:9001 (minioadmin/minioadmin)
echo ✓ MLflow UI: http://localhost:5000
echo.
echo ====================================
echo 다음 단계:
echo ====================================
echo.
echo 1. 프론트엔드 실행:
echo    cd frontend
echo    npm install
echo    npx prisma generate
echo    npx prisma migrate dev
echo    npm run dev
echo.
echo 2. 백엔드 실행 (새 터미널):
echo    cd backend
echo    python -m venv venv
echo    venv\Scripts\activate
echo    pip install -r requirements.txt
echo    uvicorn app.main:app --reload
echo.
echo ====================================
echo 또는 전체 시스템을 Docker로 실행:
echo    docker-compose up -d
echo ====================================
echo.
pause
