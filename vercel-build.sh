#!/bin/bash
set -e

export BASE_PATH=/
export NODE_ENV=production

echo "==> Installing dependencies..."
pnpm install --frozen-lockfile

echo "==> Building frontend..."
pnpm --filter @workspace/finbridge run build

echo "==> Copying output to vercel-output/..."
mkdir -p ./vercel-output
cp -r ./artifacts/finbridge/dist/. ./vercel-output/

echo "==> Done. Contents:"
ls ./vercel-output
