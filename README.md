# Kleinanzeigen API

A robust web scraping API for Kleinanzeigen.de with advanced cookie management, automatic login handling, and real-time authentication validation.

## Features

- **Chrome Remote Debugging**: Automated Chrome browser management
- **Smart Cookie Handling**: Automatic cookie validation and refresh
- **Real-time Login Detection**: Uses `#user-email` element for reliable login status
- **Auto-refresh System**: Configurable automatic cookie renewal
- **TypeScript**: Full type safety and modern development experience
- **Fastify Server**: High-performance web framework
- **Puppeteer**: Advanced browser automation with stealth capabilities

## Architecture

```
kleinanzeigenAPI/
├── src/
│   ├── server/          # Fastify server and API endpoints
│   ├── services/        # Business logic services
│   └── workers/         # Background tasks and automation
├── shared/              # Shared utilities and types
├── data/                # Cookie storage and data files
└── dist/                # Compiled TypeScript output
```

## Installation

```bash
# Clone repository
git clone <repository-url>
cd kleinanzeigenAPI

# Install dependencies
npm install

# Build TypeScript
npm run build

# Start server
npm start
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=87
KLEINANZEIGEN_PASSWORD=your_password_here
CHROME_WS_ENDPOINT=ws://localhost:9222/devtools/browser/...
```

### Chrome Setup

The API automatically manages Chrome with remote debugging:

- Debug port: 9222
- User data directory: `C:\temp\chrome-debug`
- Visible browser (non-headless)

## API Endpoints

### Authentication

#### `POST /auth/login`

Perform login with email and optional password.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "status": "login_successful",
  "message": "Login completed successfully - Chrome should be visible now",
  "loggedIn": true,
  "needsLogin": false,
  "cookieFile": "path/to/cookies.json"
}
```

#### `POST /auth/check-login`

Real-time login status check using `#user-email` element validation.

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "status": "logged_in",
  "message": "User is currently logged in",
  "loggedIn": true,
  "cookieCount": 37,
  "lastValidated": "24.08.2025 06:26:10",
  "timestamp": "24.08.2025 06:26:10"
}
```

#### `GET /auth/status/:email`

Check authentication status for specific user.

#### `GET /auth/users`

Get authentication status for all users.

### Cookie Management

#### `GET /cookies/status`

Get validation status for all cookies.

#### `GET /cookies/stats`

Get cookie statistics and overview.

#### `GET /cookies/details/:email`

Get detailed cookie information for specific user.

#### `POST /cookies/test/:email`

Test if cookies are valid for specific user.

#### `POST /cookies/cleanup`

Clean up expired cookies.

#### `GET /cookies/expiring-soon?days=7`

Get cookies expiring within specified days.

### Cookie Refresh

#### `POST /cookies/refresh/:email`

Refresh cookies for specific user.

#### `POST /cookies/refresh-all`

Refresh cookies for all users.

#### `GET /cookies/refresh-status?threshold=6`

Check if cookies need refresh.

#### `POST /cookies/auto-refresh/start`

Start automatic cookie refresh.

**Request Body:**

```json
{
  "interval": 0.25
}
```

#### `POST /cookies/auto-refresh/stop`

Stop automatic cookie refresh.

### Health Check

#### `GET /health`

Server health status.

## Login Detection

The API uses multiple methods to detect login status:

### Primary Method: `#user-email` Element

```html
<span id="user-email" class="text-body-regular">
  angemeldet als: user@example.com
</span>
```

This is the most reliable indicator for login status.

### Fallback Methods

- Text content indicators: "Mein Konto", "Meine Anzeigen", "Abmelden"
- Logout button presence
- User profile elements
- Account-related links
- Login button absence

## Cookie Management

### Automatic Features

- **Expiry Detection**: Checks cookie expiration before login attempts
- **Auto-refresh**: Configurable intervals (default: 15 minutes)
- **Cleanup**: Removes expired cookies automatically
- **Validation**: Real-time login testing

### Cookie Storage

- Location: `data/cookies/`
- Format: `cookies-{email_slug}.json`
- Structure: Array of Puppeteer cookie objects

## Usage Examples

### PowerShell

```powershell
# Check if user is logged in
$body = @{email="user@example.com"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:87/auth/check-login" -Method POST -Body $body -ContentType "application/json"

# Start auto-refresh every 15 minutes
$body = @{interval=0.25} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:87/cookies/auto-refresh/start" -Method POST -Body $body -ContentType "application/json"

# Get cookie details
Invoke-RestMethod -Uri "http://localhost:87/cookies/details/user@example.com" -Method GET
```

### cURL

```bash
# Check login status
curl -X POST http://localhost:87/auth/check-login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'

# Refresh cookies
curl -X POST http://localhost:87/cookies/refresh/user@example.com \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Development

### Scripts

```bash
npm run build      # Compile TypeScript
npm start          # Start production server
npm run dev        # Start development server with hot reload
```

### Code Structure

- **Services**: Business logic and external integrations
- **Workers**: Background tasks and automation
- **Shared**: Utilities, types, and common functions
- **Server**: API endpoints and request handling

## Testing

### Manual Testing

1. Start server: `npm start`
2. Test endpoints using PowerShell or cURL
3. Monitor Chrome browser automation
4. Check cookie files in `data/cookies/`

### API Testing

- Health check: `GET /health`
- Login validation: `POST /auth/check-login`
- Cookie management: Various `/cookies/*` endpoints

## Monitoring

### Console Output

- Chrome setup and management
- Login process status
- Cookie validation results
- Auto-refresh operations

### Log Files

- Fastify request logging
- Error tracking
- Performance metrics

## Security

- Environment variable configuration
- Cookie encryption (browser-managed)
- Secure Chrome debugging setup
- Input validation and sanitization

## Troubleshooting

### Common Issues

1. **Chrome not starting**

   - Check Chrome installation path
   - Verify debug port availability
   - Check user data directory permissions

2. **Login detection failing**

   - Verify `#user-email` element exists
   - Check page load timing
   - Review login indicators

3. **Cookie refresh issues**
   - Verify password in environment
   - Check Chrome connectivity
   - Review auto-refresh configuration

### Debug Mode

Enable detailed logging by setting environment variables:

```env
DEBUG=true
LOG_LEVEL=debug
```

## Performance

- **Response Time**: < 100ms for status checks
- **Login Process**: 3-30 seconds depending on method
- **Cookie Refresh**: 15-60 seconds per user
- **Auto-refresh**: Configurable intervals (minutes to hours)

## Updates

### Auto-refresh Configuration

- Default interval: 15 minutes (0.25 hours)
- Configurable via API endpoint
- Automatic start/stop management
- Background operation

### Cookie Validation

- Real-time testing
- Expiry calculation
- Automatic cleanup
- Detailed reporting

## License

This project is proprietary software. All rights reserved.

## Support

For technical support or feature requests, please contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: August 24, 2025  
**Status**: Production Ready
