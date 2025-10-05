// Simple wrapper to start the backend server when running `node server.js` from project root.

try {
  require('./backend/server'); // starts the server (backend/server.js does app.listen)
} catch (err) {
  console.error('Failed to start backend/server.js:', err);
  process.exit(1);
}