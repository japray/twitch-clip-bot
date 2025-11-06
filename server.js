const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Root endpoint - for testing if server is running
app.get('/', (req, res) => {
  res.json({ 
    status: '✅ Server is running on Render',
    message: 'Twitch Clip API for Nightbot',
    endpoints: {
      clip: '/clip',
      status: '/status',
      test: '/test'
    }
  });
});

// Status endpoint - check if credentials are working
app.get('/status', async (req, res) => {
  try {
    const clientId = process.env.CLIENT_ID;
    const accessToken = process.env.ACCESS_TOKEN;
    const broadcasterId = process.env.BROADCASTER_ID;

    // Validate required environment variables
    if (!clientId || !accessToken || !broadcasterId) {
      return res.status(500).json({
        error: 'Missing environment variables',
        hasClientId: !!clientId,
        hasAccessToken: !!accessToken,
        hasBroadcasterId: !!broadcasterId
      });
    }

    // Test Twitch API connection
    const response = await axios.get('https://api.twitch.tv/helix/users', {
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${accessToken}`
      }
    });

    res.json({
      status: '✅ All systems operational',
      channel: process.env.CHANNEL_NAME,
      twitchApi: '✅ Connected',
      broadcasterId: broadcasterId,
      hosting: 'Render.com'
    });

  } catch (error) {
    console.error('Status check error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Status check failed',
      details: error.response?.data || error.message
    });
  }
});

// Test endpoint - simple response for Nightbot testing
app.get('/test', (req, res) => {
  res.json({
    message: '✅ Twitch Clip Bot is working!',
    user: req.query.user || 'unknown',
    role: req.query.role || 'unknown'
  });
});

// Simple endpoint for direct text responses
// Add this endpoint for clean URL responses
app.get('/clip/url', async (req, res) => {
  try {
    const clientId = process.env.CLIENT_ID;
    const accessToken = process.env.ACCESS_TOKEN;
    const broadcasterId = process.env.BROADCASTER_ID;

    // Authorization check
    const user = req.query.user || 'unknown';
    const userRole = req.query.role || 'viewer';
    
    const allowedRoles = ['mod', 'broadcaster', 'vip', 'owner'];
    const isBroadcaster = user.toLowerCase() === process.env.CHANNEL_NAME?.toLowerCase();
    
    if (!allowedRoles.includes(userRole) && !isBroadcaster) {
      return res.send('Unauthorized');
    }

    // Create clip
    const response = await axios.post(
      `https://api.twitch.tv/helix/clips?broadcaster_id=${broadcasterId}`,
      {},
      {
        headers: {
          'Client-ID': clientId,
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (response.status === 202) {
      const clipId = response.data.data[0].id;
      const clipUrl = `https://clips.twitch.tv/${clipId}`;
      
      // URL only response
      res.send(clipUrl);
    } else {
      res.send('Error: Stream might be offline');
    }

  } catch (error) {
    res.send('Error creating clip');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Twitch Clip API running on port ${PORT}`);
  console.log(`📺 Channel: ${process.env.CHANNEL_NAME || 'Not set'}`);
  console.log(`🌐 Host: Render.com`);
});