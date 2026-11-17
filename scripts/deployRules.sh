#!/bin/sh
# Deploys firestore.rules to the Firebase project named in .env.<mode>, where mode is development or production.
set -e
set -a
. "./.env.$1"
npx firebase-tools deploy --only firestore:rules --project "$VITE_FIREBASE_PROJECT_ID"
