@echo off
REM BTEC Generator - Docker Quick Start Script (Windows)
REM This script helps you quickly start the BTEC Generator application

echo.
echo ========================================
echo   BTEC Generator - Docker Deployment
echo ========================================
echo.

REM Check if Docker is running
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [OK] Docker is running
echo.

REM Check if .env file exists
if not exist .env (
    echo [WARNING] .env file not found!
    echo Please create a .env file with your configuration.
    echo See .env.example for reference.
    pause
    exit /b 1
)

echo [OK] Environment file found
echo.

REM Ask user which action to perform
echo What would you like to do?
echo.
echo 1. Start application (build and run)
echo 2. Stop application
echo 3. View logs
echo 4. Restart application
echo 5. Clean everything (remove containers and volumes)
echo 6. Exit
echo.

set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" goto start
if "%choice%"=="2" goto stop
if "%choice%"=="3" goto logs
if "%choice%"=="4" goto restart
if "%choice%"=="5" goto clean
if "%choice%"=="6" goto end

echo Invalid choice!
pause
exit /b 1

:start
echo.
echo [INFO] Building and starting services...
docker-compose up -d --build
if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   Application started successfully!
    echo ========================================
    echo.
    echo Frontend:  http://localhost
    echo Backend:   http://localhost:3000
    echo Adminer:   http://localhost:8080
    echo.
    echo To view logs: docker-compose logs -f
    echo To stop: docker-compose down
    echo.
) else (
    echo [ERROR] Failed to start services!
)
pause
goto end

:stop
echo.
echo [INFO] Stopping services...
docker-compose down
echo [OK] Services stopped
pause
goto end

:logs
echo.
echo [INFO] Showing logs (Press Ctrl+C to exit)...
docker-compose logs -f
goto end

:restart
echo.
echo [INFO] Restarting services...
docker-compose restart
echo [OK] Services restarted
pause
goto end

:clean
echo.
echo [WARNING] This will remove all containers, volumes, and data!
set /p confirm="Are you sure? (yes/no): "
if /i "%confirm%"=="yes" (
    echo [INFO] Cleaning up...
    docker-compose down -v --rmi local
    echo [OK] Cleanup complete
) else (
    echo [INFO] Cleanup cancelled
)
pause
goto end

:end
echo.
echo Goodbye!
