#!/bin/bash

echo "🔧 Creating Missing Files for Railway Deployment"
echo "==============================================="

# Create scripts directory if it doesn't exist
mkdir -p scripts

# Create package.json files for services if they don't exist
services=("api-gateway" "order" "payment" "notification")

for service in "${services[@]}"; do
    if [ ! -f "$service/package.json" ]; then
        echo "📦 Creating package.json for $service..."
        
        # Create basic package.json based on service type
        if [ "$service" = "api-gateway" ]; then
            cat > "$service/package.json" << 'EOF'
{
  "name": "api-gateway",
  "version": "1.0.0",
  "description": "API Gateway for E-commerce Microservices",
  "main": "dist/main.js",
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main.js"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@nestjs/microservices": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/throttler": "^5.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "amqplib": "^0.10.3",
    "bcrypt": "^5.1.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.0",
    "pg": "^8.11.0",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.1",
    "typeorm": "^0.3.17"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@types/bcrypt": "^5.0.0",
    "@types/node": "^20.3.1",
    "typescript": "^5.1.3"
  }
}
EOF
        else
            cat > "$service/package.json" << EOF
{
  "name": "$service-service",
  "version": "1.0.0",
  "description": "$service Service for E-commerce",
  "main": "dist/main.js",
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main.js"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/microservices": "^10.0.0",
    "amqplib": "^0.10.3",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@types/node": "^20.3.1",
    "typescript": "^5.1.3"
  }
}
EOF
        fi
        
        echo "✅ Created $service/package.json"
    else
        echo "✅ $service/package.json already exists"
    fi
done

echo ""
echo "🎉 All missing files created!"
echo "Now you can run: npm run railway:setup"
