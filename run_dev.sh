#!/bin/bash
echo "Starting PDF Learning Assistant..."

# Check for .env
if [ ! -f .env ]; then
  echo "Error: .env file missing. Please create one with GEMINI_API_KEY."
  exit 1
fi

# Install deps if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
  npx prisma generate
fi

# Run migrations/push
echo "Syncing database..."
npx prisma db push

# Start dev server
echo "Starting Next.js dev server..."
npm run dev
