@echo off
REM PCB Inspection AI - Full System Start Script
REM 전체 시스템 실행 (Docker Compose)

echo ====================================
echo PCB Inspection AI - 전체 시스템 시작
echo ====================================
echo.

echo Docker Compose로 전체 시스템 시작 중...
docker-compose up -d

echo.
echo 시스템 시작 완료!
echo.
echo ====================================
echo 접속 정보:
echo ====================================
echo.
echo ✓ 프론트엔드: http://localhost:3000
echo ✓ 백엔드 API: http://localhost:8000
echo ✓ API 문서: http://localhost:8000/docs
echo ✓ PostgreSQL: localhost:5432
echo ✓ MinIO Console: http://localhost:9001
echo ✓ MLflow UI: http://localhost:5000
echo.
echo ====================================
echo 유용한 명령어:
echo ====================================
echo.
echo - 상태 확인: docker-compose ps
echo - 로그 확인: docker-compose logs -f
echo - 서비스 중지: docker-compose down
echo.
pause
