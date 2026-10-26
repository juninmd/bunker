#!/usr/bin/env bash

# Bunker Orchestration CLI
# Manages the monorepo apps: extension, desktop, mobile (android alias)

if [ -z "$1" ]; then
  echo "Usage: $0 {extension|desktop|mobile} [start|build]"
  exit 1
fi

APP="$1"
CMD="${2:-start}"

case "$APP" in
  extension)
    echo "Managing Extension..."
    cd "$(dirname "$0")/../apps/extension" || exit
    if [ "$CMD" = "start" ]; then
      echo "No specific start command for extension. Did you mean build?"
    elif [ "$CMD" = "build" ]; then
      npm run build
    else
      echo "Unknown command for extension: $CMD"
    fi
    ;;
  desktop)
    echo "Managing Desktop App..."
    cd "$(dirname "$0")/../apps/desktop" || exit
    if [ "$CMD" = "start" ]; then
      npm start
    elif [ "$CMD" = "build" ]; then
      npm run build
    else
      echo "Unknown command for desktop: $CMD"
    fi
    ;;
  mobile|android)
    echo "Managing Mobile App..."
    cd "$(dirname "$0")/../apps/mobile" || { echo "ERROR: apps/mobile not found" >&2; exit 1; }
    if [ "$CMD" = "start" ]; then
      npm start
    elif [ "$CMD" = "build" ]; then
      npm run build:apk
    else
      echo "Unknown command for mobile: $CMD"
    fi
    ;;
  *)
    echo "Unknown app: $APP"
    echo "Valid apps: extension, desktop, mobile (android is an alias)"
    exit 1
    ;;
esac
