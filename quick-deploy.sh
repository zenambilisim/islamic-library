#!/bin/bash

# ============================================================================
# Islamic Library - Quick Deployment Script
# ============================================================================
# Bu script deployment sürecini hızlandırır
# Kullanım: ./quick-deploy.sh
# ============================================================================

set -e  # Hata olursa dur

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Emojis
CHECK="✅"
CROSS="❌"
ROCKET="🚀"
PACKAGE="📦"
TEST="🧪"
INFO="ℹ️"

echo -e "${BLUE}${ROCKET} Islamic Library - Quick Deploy${NC}"
echo "============================================"
echo ""

# ============================================================================
# STEP 1: Pre-deployment checks
# ============================================================================

echo -e "${BLUE}${INFO} Step 1: Pre-deployment checks${NC}"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules not found. Installing dependencies...${NC}"
    npm install
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${RED}${CROSS} .env.local file not found!${NC}"
    echo "Please create .env.local with your Supabase credentials"
    exit 1
fi

echo -e "${GREEN}${CHECK} Environment variables OK${NC}"

# ============================================================================
# STEP 2: Run tests and build
# ============================================================================

echo -e "\n${BLUE}${TEST} Step 2: Building project${NC}"

# Clean dist folder
if [ -d "dist" ]; then
    rm -rf dist
    echo -e "${GREEN}${CHECK} Cleaned dist folder${NC}"
fi

# Run build
echo "Running: npm run build"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}${CHECK} Build successful${NC}"
else
    echo -e "${RED}${CROSS} Build failed!${NC}"
    exit 1
fi

# ============================================================================
# STEP 3: Git status check
# ============================================================================

echo -e "\n${BLUE}${PACKAGE} Step 3: Git status${NC}"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}⚠️  Git not initialized${NC}"
    read -p "Initialize git? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git init
        git branch -M main
        echo -e "${GREEN}${CHECK} Git initialized${NC}"
    else
        echo -e "${RED}${CROSS} Deployment cancelled${NC}"
        exit 1
    fi
fi

# Show git status
git status --short

# ============================================================================
# STEP 4: Commit changes
# ============================================================================

echo -e "\n${BLUE}${PACKAGE} Step 4: Commit changes${NC}"

# Check if there are changes to commit
if [[ -z $(git status -s) ]]; then
    echo -e "${YELLOW}⚠️  No changes to commit${NC}"
else
    # Ask for commit message
    read -p "Enter commit message (or press Enter for default): " commit_msg
    
    if [ -z "$commit_msg" ]; then
        commit_msg="Update: $(date '+%Y-%m-%d %H:%M')"
    fi
    
    git add .
    git commit -m "$commit_msg"
    echo -e "${GREEN}${CHECK} Changes committed${NC}"
fi

# ============================================================================
# STEP 5: Push to GitHub
# ============================================================================

echo -e "\n${BLUE}${ROCKET} Step 5: Push to GitHub${NC}"

# Check if remote exists
if ! git remote | grep -q 'origin'; then
    echo -e "${YELLOW}⚠️  No remote 'origin' found${NC}"
    read -p "Enter GitHub repository URL: " repo_url
    git remote add origin "$repo_url"
    echo -e "${GREEN}${CHECK} Remote added${NC}"
fi

# Push
echo "Pushing to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}${CHECK} Pushed to GitHub${NC}"
else
    echo -e "${YELLOW}⚠️  Push failed. Trying with -u flag...${NC}"
    git push -u origin main
fi

# ============================================================================
# STEP 6: Deployment info
# ============================================================================

echo -e "\n${BLUE}${ROCKET} Step 6: Deployment Info${NC}"
echo "============================================"
echo ""
echo -e "${GREEN}${CHECK} All done!${NC}"
echo ""
echo "📋 Next steps:"
echo "1. Go to Vercel Dashboard"
echo "2. Check deployment status"
echo "3. Site will be live in ~2 minutes"
echo ""
echo "🔗 Links:"
echo "   Vercel: https://vercel.com/dashboard"
echo "   GitHub: $(git remote get-url origin 2>/dev/null || echo 'Not set')"
echo ""
echo -e "${BLUE}${INFO} Happy coding! 🚀${NC}"
