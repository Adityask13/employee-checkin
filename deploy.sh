#!/bin/bash

# Employee Check-in App - Quick Deployment Script
echo "🚀 Employee Check-in App Deployment Helper"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Function to deploy to Vercel (easiest option)
deploy_vercel() {
    echo "📦 Deploying to Vercel..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        echo "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    echo "🔨 Building application..."
    npm run build
    
    if [ $? -eq 0 ]; then
        echo "✅ Build successful!"
        echo "🚀 Deploying to Vercel..."
        vercel --prod
        echo "✅ Deployment complete!"
        echo "🌐 Your app is now live!"
    else
        echo "❌ Build failed. Please fix errors and try again."
        exit 1
    fi
}

# Function to prepare for AWS Amplify
prepare_amplify() {
    echo "📦 Preparing for AWS Amplify deployment..."
    
    echo "🔨 Testing build..."
    npm run build
    
    if [ $? -eq 0 ]; then
        echo "✅ Build successful!"
        echo "📋 Next steps for AWS Amplify:"
        echo "1. Push your code to GitHub"
        echo "2. Go to AWS Amplify Console"
        echo "3. Connect your GitHub repository"
        echo "4. Deploy automatically"
        echo ""
        echo "📝 Files created:"
        echo "   - amplify.yml (build configuration)"
        echo "   - Updated next.config.ts"
        echo "   - DEPLOYMENT_GUIDE.md"
    else
        echo "❌ Build failed. Please fix errors and try again."
        exit 1
    fi
}

# Display options
echo ""
echo "Choose deployment option:"
echo "1) Deploy to Vercel (Easiest - Free tier available)"
echo "2) Prepare for AWS Amplify (More AWS integration)"
echo "3) Exit"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        deploy_vercel
        ;;
    2)
        prepare_amplify
        ;;
    3)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac
