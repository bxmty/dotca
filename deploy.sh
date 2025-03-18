#!/bin/bash
# Deployment script for different environments

# Check if environment argument is provided
if [ -z "$1" ]; then
  echo "Usage: ./deploy.sh <environment>"
  echo "Available environments: qa, staging, production"
  exit 1
fi

ENV=$1
ENV_FILE=".env.$ENV"

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
  echo "Error: Environment file $ENV_FILE not found"
  exit 1
fi

echo "Deploying to $ENV environment..."

# Load environment variables
set -a
source "$ENV_FILE"
set +a

# Build and deploy using docker-compose
docker-compose build
docker-compose up -d

echo "$ENV deployment completed!"