#!/bin/bash
# Script to fix imports in a Next.js project for Docker builds

# Fix StripeWrapper.tsx imports
sed -i 's|@/lib/stripe|../../lib/stripe|g' src/app/components/StripeWrapper.tsx

# Fix stripe route.ts imports
sed -i 's|@/lib/stripe|../../../../lib/stripe|g' src/app/api/stripe/create-payment-intent/route.ts

echo "Fixed import paths for Docker build"