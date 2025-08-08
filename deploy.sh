#!/bin/bash

# Nelliys App Deployment Script for Coolify
# This script helps set up the application for deployment

echo "🚀 Nelliys App Deployment Setup"
echo "================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your actual values before deploying!"
else
    echo "✅ .env file already exists"
fi

# Build images locally (optional, for testing)
read -p "🔨 Do you want to build Docker images locally for testing? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔨 Building Docker images..."
    
    echo "Building server image..."
    docker build -f Dockerfile.server -t nelliys-server .
    
    echo "Building web image..."
    docker build -f Dockerfile.web -t nelliys-web .
    
    echo "✅ Images built successfully!"
fi

echo ""
echo "📋 Next Steps for Coolify Deployment:"
echo "1. Push your code to a Git repository"
echo "2. In Coolify, create a new project"
echo "3. Add PostgreSQL database service"
echo "4. Create two applications:"
echo "   - Backend API (use Dockerfile.server)"
echo "   - Frontend Web (use Dockerfile.web)"
echo "5. Set environment variables in Coolify"
echo "6. Deploy both applications"
echo ""
echo "📚 Environment Variables needed:"
echo "- DATABASE_URL"
echo "- JWT_SECRET"
echo "- CORS_ORIGIN"
echo "- NEXT_PUBLIC_API_URL"
echo "- NEXT_PUBLIC_WS_URL"
echo ""
echo "🎉 Setup complete! Check the coolify-deploy.yml file for detailed instructions."