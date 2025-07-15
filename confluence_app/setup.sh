#!/bin/bash

echo "🚀 Setting up Confluence Text Selector App..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update the 'baseUrl' in atlassian-connect.json with your app's public URL"
echo "2. For development, you can use ngrok: 'ngrok http 3000'"
echo "3. Start the app: 'npm start'"
echo "4. Install in Confluence using your app descriptor URL"
echo ""
echo "For detailed instructions, see README.md"