#!/bin/bash

# Bunker Orchestration CLI
# Manages the monorepo apps: extension, desktop, android

if [ -z "$1" ]; then
  echo "Usage: $0 {extension|desktop|android} [start|build]"
  exit 1
fi

APP=$1
CMD=${2:-start}

case "$APP" in
  extension)
    echo "Managing Extension..."
    cd apps/extension || exit
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
    cd apps/desktop || exit
    if [ "$CMD" = "start" ]; then
      npm start
    elif [ "$CMD" = "build" ]; then
      npm run build
    else
      echo "Unknown command for desktop: $CMD"
    fi
    ;;
  android)
    echo "Managing Android App..."
    cd apps/android || exit
    if [ "$CMD" = "start" ]; then
      npm start
    elif [ "$CMD" = "build" ]; then
      npm run build:apk
    else
      echo "Unknown command for android: $CMD"
    fi
    ;;
  *)
    echo "Unknown app: $APP"
    echo "Valid apps: extension, desktop, android"
    exit 1
    ;;
esac
