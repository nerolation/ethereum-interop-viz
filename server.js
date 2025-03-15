const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'frontend/build')));

// Determine the backend URL based on the environment
const backendUrl = process.env.NODE_ENV === 'production' 
  ? 'https://ethereum-interop-viz.herokuapp.com' 
  : 'http://localhost:5000';

// Proxy API requests to the backend
app.use('/api', createProxyMiddleware({ 
  target: backendUrl,
  changeOrigin: true,
}));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 