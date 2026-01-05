#!/bin/bash
# BTEC Generator - Docker Quick Start Script (Linux/Mac)
# This script helps you quickly start the BTEC Generator application

echo ""
echo "========================================"
echo "  BTEC Generator - Docker Deployment"
echo "========================================"
echo ""

# Check if Docker is running
if ! docker version &> /dev/null; then
    echo "[ERROR] Docker is not running!"
    echo "Please start Docker and try again."
    exit 1
fi

echo "[OK] Docker is running"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "[WARNING] .env file not found!"
    echo "Please create a .env file with your configuration."
    echo "See .env.example for reference."
    exit 1
fi

echo "[OK] Environment file found"
echo ""

# Ask user which action to perform
echo "What would you like to do?"
echo ""
echo "1. Start application (build and run)"
echo "2. Stop application"
echo "3. View logs"
echo "4. Restart application"
echo "5. Clean everything (remove containers and volumes)"
echo "6. Exit"
echo ""

read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        echo ""
        echo "[INFO] Building and starting services..."
        docker-compose up -d --build
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "========================================"
            echo "  Application started successfully!"
            echo "========================================"
            echo ""
            echo "Frontend:  http://localhost"
            echo "Backend:   http://localhost:3000"
            echo "Adminer:   http://localhost:8080"
            echo ""
            echo "To view logs: docker-compose logs -f"
            echo "To stop: docker-compose down"
            echo ""
        else
            echo "[ERROR] Failed to start services!"
        fi
        ;;
    2)
        echo ""
        echo "[INFO] Stopping services..."
        docker-compose down
        echo "[OK] Services stopped"
        ;;
    3)
        echo ""
        echo "[INFO] Showing logs (Press Ctrl+C to exit)..."
        docker-compose logs -f
        ;;
    4)
        echo ""
        echo "[INFO] Restarting services..."
        docker-compose restart
        echo "[OK] Services restarted"
        ;;
    5)
        echo ""
        echo "[WARNING] This will remove all containers, volumes, and data!"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" == "yes" ]; then
            echo "[INFO] Cleaning up..."
            docker-compose down -v --rmi local
            echo "[OK] Cleanup complete"
        else
            echo "[INFO] Cleanup cancelled"
        fi
        ;;
    6)
        echo ""
        echo "Goodbye!"
        exit 0
        ;;
    *)
        echo "Invalid choice!"
        exit 1
        ;;
esac

echo ""
