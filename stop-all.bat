@echo off
REM PCB Inspection AI - Stop Script
REM 전체 시스템 중지

echo ====================================
echo PCB Inspection AI - 시스템 중지
echo ====================================
echo.

echo Docker Compose 서비스 중지 중...
docker-compose down

echo.
echo 시스템 중지 완료!
echo.
pause
