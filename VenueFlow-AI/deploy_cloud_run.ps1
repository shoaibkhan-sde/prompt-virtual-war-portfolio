# VenueFlow AI — Cloud Run Deployment Script (PowerShell)
# Project ID: venueflow-ai-493715

$PROJECT_ID = "venueflow-ai-493715"
$IMAGE_NAME = "venueflow-app"
$SERVICE_NAME = "venueflow-service"
$REGION = "us-central1"

echo "Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

echo "Building container image using Cloud Build..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/$IMAGE_NAME .

echo "Deploying to Cloud Run..."
# We enable session-affinity for Socket.IO support
gcloud run deploy $SERVICE_NAME `
    --image gcr.io/$PROJECT_ID/$IMAGE_NAME `
    --platform managed `
    --region $REGION `
    --allow-unauthenticated `
    --session-affinity `
    --port 8080 `
    --cpu 2 `
    --memory 2Gi `
    --timeout 300 `
    --set-env-vars "FLASK_ENV=production,SECRET_KEY=venueflow_google_build_ai_prod_secret_2026_key,GOOGLE_API_KEY=AIzaSyB8xjdrg_apzJ-9gWAxJKMwXcFkIwZg0lk,GEMINI_MODEL=gemini-2.0-flash,GOOGLE_MAPS_API_KEY=AIzaSyB8xjdrg_apzJ-9gWAxJKMwXcFkIwZg0lk,FIREBASE_PROJECT_ID=venueflow-ai-493715"

echo "--------------------------------------------------------"
echo "Deployment Complete!"
echo "Your application should be live at the URL provided above."
echo "--------------------------------------------------------"
