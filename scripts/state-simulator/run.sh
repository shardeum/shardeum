#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Blockchain State Simulator${NC}"
echo "============================"

if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}Installing dependencies...${NC}"
    npm install
fi

COMMAND=${1:-simulate}

case $COMMAND in
    simulate)
        echo -e "${GREEN}Running full simulation...${NC}"
        npm run dev -- simulate "${@:2}"
        ;;
    analyze)
        echo -e "${GREEN}Running balance analysis...${NC}"
        npm run dev -- analyze "${@:2}"
        ;;
    inspect)
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Transaction ID required${NC}"
            echo "Usage: ./run.sh inspect <txId>"
            exit 1
        fi
        echo -e "${GREEN}Inspecting transaction $2...${NC}"
        npm run dev -- inspect-tx "$2" "${@:3}"
        ;;
    stats)
        echo -e "${GREEN}Showing database statistics...${NC}"
        npm run dev -- stats "${@:2}"
        ;;
    help)
        echo "Available commands:"
        echo "  simulate  - Run full simulation (default)"
        echo "  analyze   - Run balance analysis only"
        echo "  inspect   - Inspect a specific transaction"
        echo "  stats     - Show database statistics"
        echo ""
        echo "Examples:"
        echo "  ./run.sh simulate --max-flips 100"
        echo "  ./run.sh analyze"
        echo "  ./run.sh inspect 0xabc123..."
        echo "  ./run.sh stats"
        ;;
    *)
        echo -e "${RED}Unknown command: $COMMAND${NC}"
        echo "Run './run.sh help' for available commands"
        exit 1
        ;;
esac