#!/bin/bash
echo "Writing .env file from EAS environment variables..."
> .env
if [ -n "$EXPO_PUBLIC_DEEPGRAM_API_KEY" ]; then
  echo "EXPO_PUBLIC_DEEPGRAM_API_KEY=$EXPO_PUBLIC_DEEPGRAM_API_KEY" >> .env
  echo "Written DEEPGRAM key"
fi
if [ -n "$EXPO_PUBLIC_OPENROUTER_API_KEY" ]; then
  echo "EXPO_PUBLIC_OPENROUTER_API_KEY=$EXPO_PUBLIC_OPENROUTER_API_KEY" >> .env
  echo "Written OPENROUTER key"
fi
if [ -n "$EXPO_PUBLIC_ADAPTY_KEY" ]; then
  echo "EXPO_PUBLIC_ADAPTY_KEY=$EXPO_PUBLIC_ADAPTY_KEY" >> .env
fi
cat .env
