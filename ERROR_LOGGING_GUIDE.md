# Frontend Error Logging Setup

## Overview

This project now includes automatic error logging to help debug frontend issues. When React errors occur, they are automatically written to a log file.

## How It Works

1. **Error Logger Server**: A lightweight Node.js server (`error-logger-server.js`) runs on port 3001
2. **Error Boundary**: The `ErrorBoundary` component catches React errors and sends them to the logger
3. **Log File**: All errors are written to `logs/frontend-errors.log` with full details

## Usage

### Option 1: Run Both Services Together (Recommended)

```bash
npm run dev:with-logger
```

This starts both the Vite dev server (port 5850) and the error logger (port 3001).

### Option 2: Run Separately

Terminal 1 - Start the error logger:
```bash
npm run logger
```

Terminal 2 - Start the frontend:
```bash
npm run dev
```

## What Gets Logged

Each error entry includes:
- Timestamp
- Error name and message
- Full stack trace
- Component stack (which React component caused the error)
- URL where error occurred
- User agent (browser info)

## Viewing Logs

The log file is located at: `logs/frontend-errors.log`

You can view it in real-time:
```bash
tail -f logs/frontend-errors.log
```

Or just open it in your editor to see all logged errors.

## Example Log Entry

```
================================================================================
[2024-01-15T10:30:45.123Z] FRONTEND ERROR
================================================================================
Error: TypeError
Message: Cannot read property 'map' of undefined
URL: http://localhost:5850/dashboard
User Agent: Mozilla/5.0...

Component Stack:
    at Dashboard (http://localhost:5850/src/pages/Dashboard.jsx:45:12)
    at App (http://localhost:5850/src/App.jsx:20:5)

Stack Trace:
TypeError: Cannot read property 'map' of undefined
    at Dashboard.render (Dashboard.jsx:45)
    ...
================================================================================
```

## Benefits

- **No more lost errors**: All errors are saved to a file
- **Better debugging**: Full context including component stack
- **Development friendly**: Works seamlessly in development mode
- **Non-intrusive**: If the logger isn't running, errors still show in console

## Notes

- The logger server is optional - the app works fine without it
- Errors are always logged to the browser console regardless
- The `logs/` directory is gitignored to avoid committing error logs
- In production, you'd typically use a service like Sentry instead
