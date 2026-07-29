#!/usr/bin/env bash
# ============================================
#  ship.sh — One-command commit + push
#  Usage:  ./ship.sh "your commit message"
#  If no message provided, uses a timestamp.
# ============================================
set -e

cd "$(dirname "$0")"

MSG="${1:-update $(date '+%Y-%m-%d %H:%M')}"

echo ""
echo " [ship] Staging all changes..."
git add .

echo " [ship] Running type check..."
if ! npx tsc --noEmit 2>/dev/null; then
    echo ""
    echo " [ship] TYPE ERRORS DETECTED — fix before shipping."
    echo " [ship] Run 'npx tsc --noEmit' to see details."
    echo ""
    exit 1
fi

echo " [ship] Committing: $MSG"
if git commit -m "$MSG"; then
    echo " [ship] Pushing to origin/master..."
    git push origin master
    echo ""
    echo " [ship] Done. Shipped to origin/master."
else
    echo ""
    echo " [ship] Nothing to commit — working tree clean."
fi
