# Remote Control Setup

## Security Configuration

The remote control requires a local configuration file that is NOT committed to git.

### Setup Instructions

1. Copy the configuration template:
   ```bash
   cp docs/assets/js/app.local.js.example docs/assets/js/app.local.js
   ```

2. Edit `docs/assets/js/app.local.js` with your settings:
   ```javascript
   const PASSWORD_HASH = 'your-password-hash';
   const SERVER_URL = 'http://your-tailscale-ip:8080';
   const API_KEY = 'your-api-key';
   ```

3. This file is gitignored and will not be pushed to GitHub

### For GitHub Pages Deployment

Since GitHub Pages serves static files, you need to manually upload your `app.local.js` file:

1. Build your local configuration
2. Deploy to a private hosting solution, or
3. Use environment variables in a serverless function

**Note:** The public GitHub Pages site will not work without the local configuration file.
