import { createServer } from 'http';
import { appendFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 3001;
const LOG_DIR = join(__dirname, 'logs');
const LOG_FILE = join(LOG_DIR, 'frontend-errors.log');

// Ensure logs directory exists
await mkdir(LOG_DIR, { recursive: true });

const server = createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/log-error') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const errorData = JSON.parse(body);
        const timestamp = new Date().toISOString();
        
        const logEntry = `
${'='.repeat(80)}
[${timestamp}] FRONTEND ERROR
${'='.repeat(80)}
Error: ${errorData.error}
Message: ${errorData.message}
URL: ${errorData.url}
User Agent: ${errorData.userAgent}

Component Stack:
${errorData.componentStack || 'N/A'}

Stack Trace:
${errorData.stack || 'N/A'}
${'='.repeat(80)}

`;

        await appendFile(LOG_FILE, logEntry);
        console.log(`✓ Error logged at ${timestamp}`);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Error logged' }));
      } catch (error) {
        console.error('Failed to log error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Failed to log error' }));
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Error Logger Server running on http://localhost:${PORT}`);
  console.log(`📝 Logging errors to: ${LOG_FILE}`);
  console.log(`\nWaiting for errors to log...\n`);
});
