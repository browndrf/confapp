# Confluence Text Selector App

A Confluence Connect app that allows users to select text from any page and add it to a "My Saved Content" page in their personal space (homepage).

## Features

- **Text Selection**: Users can copy and paste selected text from any Confluence page
- **Homepage Integration**: Automatically creates or updates a "My Saved Content" page in the user's personal space
- **Easy Access**: Adds a convenient "Add to Homepage" button to the page actions menu
- **Organized Content**: Each saved piece of content includes a title, timestamp, and is properly formatted

## How It Works

1. When viewing any Confluence page, users will see an "Add to Homepage" button in the page actions
2. Clicking the button opens a dialog where users can:
   - Paste selected text from the current page
   - Add a descriptive title
   - Save the content to their homepage
3. The app automatically creates or updates a "My Saved Content" page in the user's personal space
4. All saved content is organized chronologically with titles and timestamps

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A publicly accessible URL for your app (for development, you can use ngrok)

### Setup

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure your app URL:**
   - Update the `baseUrl` in `atlassian-connect.json` to point to your app's public URL
   - For development, you can use ngrok: `ngrok http 3000`

3. **Start the application:**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

4. **Install in Confluence:**
   - Go to your Confluence instance
   - Navigate to Settings → Apps → Manage Apps
   - Click "Upload app"
   - Enter your app descriptor URL: `https://your-app-domain.com/atlassian-connect.json`

### Development Setup with ngrok

For local development:

1. Start your app: `npm start`
2. In another terminal, start ngrok: `ngrok http 3000`
3. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)
4. Update `baseUrl` in `atlassian-connect.json` to use the ngrok URL
5. Install the app in Confluence using: `https://abc123.ngrok.io/atlassian-connect.json`

## Configuration

### App Descriptor (`atlassian-connect.json`)

Key configuration options:

- **baseUrl**: Your app's public URL
- **scopes**: Currently set to `READ` and `WRITE` for accessing and creating content
- **webItems**: Adds the "Add to Homepage" button to page actions
- **dialogs**: Configures the text selection dialog

### Security

The app uses JWT authentication as required by Atlassian Connect. All API calls are authenticated using signed JWTs.

## API Endpoints

- `GET /atlassian-connect.json` - App descriptor
- `POST /installed` - Installation lifecycle hook
- `POST /uninstalled` - Uninstallation lifecycle hook
- `GET /text-selector` - Main text selection interface
- `POST /add-to-homepage` - API endpoint to save content

## File Structure

```
confluence-text-selector-app/
├── app.js                    # Main application server
├── package.json             # Node.js dependencies
├── atlassian-connect.json   # Confluence Connect app descriptor
└── README.md               # This file
```

## Deployment

### Production Deployment

1. **Deploy to a cloud platform** (Heroku, AWS, etc.)
2. **Update the baseUrl** in `atlassian-connect.json` to your production URL
3. **Set environment variables** if needed
4. **Install the app** in your Confluence instance using the production descriptor URL

### Environment Variables

You can set these environment variables for production:

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)

## Usage

1. **Navigate to any Confluence page**
2. **Select and copy the text** you want to save
3. **Click "Add to Homepage"** in the page actions menu
4. **Paste the text** in the dialog and add a title
5. **Click "Add to Homepage"** to save
6. **View your saved content** in the "My Saved Content" page in your personal space

## Troubleshooting

### Common Issues

1. **App not appearing in Confluence:**
   - Check that your app URL is publicly accessible
   - Verify the app descriptor is valid JSON
   - Check Confluence logs for installation errors

2. **JWT authentication errors:**
   - Ensure your app is properly installed
   - Check that the shared secret is being used correctly

3. **Cannot create pages:**
   - Verify the user has permission to create pages in their personal space
   - Check that the app has WRITE scope

### Logs

The app logs important events to the console:
- App installations/uninstallations
- JWT verification issues
- API call errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details