#!/bin/bash

# TrustHire - Integrated Dev Runner
# This script runs both backend and frontend in the current terminal (inline).

# Configuration
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
BACKEND_CMD="./venv/bin/python main.py"
FRONTEND_CMD="npm run dev"

# Colors for output prefixes
BLUE='\033[0;34m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting TrustHire in integrated mode...${NC}"

# 1. Kill any existing processes on ports 8000 and 3000
echo -e "${BLUE}Cleaning up stale processes...${NC}"
fuser -k 8000/tcp 2>/dev/null
fuser -k 3000/tcp 2>/dev/null
# Give OS a moment to release ports
sleep 1

# Function to run with prefix
run_with_prefix() {
    local dir=$1
    local cmd=$2
    local prefix=$3
    local color=$4
    
    cd "$dir" || exit 1
    # We use stdbuf to prevent output buffering issues in the pipe
    stdbuf -oL -eL $cmd 2>&1 | while IFS= read -r line; do
        echo -e "${color}${prefix}${NC} $line"
    done
}

# Run Backend in background
run_with_prefix "$BACKEND_DIR" "$BACKEND_CMD" "[BACKEND]" "$BLUE" &
BACKEND_PID=$!

# Run Frontend in background
sleep 1
run_with_prefix "$FRONTEND_DIR" "$FRONTEND_CMD" "[FRONTEND]" "$CYAN" &
FRONTEND_PID=$!

# Handle shutdown
cleanup() {
    echo -e "\n${RED}Stopping TrustHire services...${NC}"
    # Kill the background loops and all their children
    pkill -P $BACKEND_PID 2>/dev/null
    pkill -P $FRONTEND_PID 2>/dev/null
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    
    # Extra safety: kill by port again
    fuser -k 8000/tcp 2>/dev/null
    fuser -k 3000/tcp 2>/dev/null
    
    echo -e "${BLUE}Done.${NC}"
    exit
}

trap cleanup SIGINT SIGTERM

echo -e "Services are starting. Press ${RED}Ctrl+C${NC} to stop both.\n"

# Wait for both
wait $BACKEND_PID $FRONTEND_PID
