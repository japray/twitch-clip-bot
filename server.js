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

// Main clip creation endpoint
app.get('/clip', async (req, res) => {
  try {
    const clientId = process.env.CLIENT_ID;
    const accessToken = process.env.ACCESS_TOKEN;
    const broadcasterId = process.env.BROADCASTER_ID;

    // Get user info from query parameters (for authorization check)
    const user = req.query.user || 'unknown';
    const userRole = req.query.role || 'viewer'; // Nightbot provides this

    console.log(`🎬 Clip request from: ${user}, role: ${userRole}`);

    // Check if user is authorized (mod, broadcaster, or VIP)
    const allowedRoles = ['mod', 'broadcaster', 'vip', 'owner'];
    const isBroadcaster = user.toLowerCase() === process.env.CHANNEL_NAME?.toLowerCase();
    
    if (allowedRoles.includes(userRole) && isBroadcaster) {
      return res.json({
        message: '❌ Only moderators, VIPs, and the broadcaster can create clips.'
      });
    }

    // Validate required environment variables
    if (!clientId || !accessToken || !broadcasterId) {
      console.error('Missing environment variables');
      return res.status(500).json({
        message: '❌ Server configuration error. Please contact the streamer.'
      });
    }

    console.log('📡 Creating clip via Twitch API...');

    // Create clip using Twitch API
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

    console.log('📊 Twitch API response:', response.status);

    if (response.status === 202 || response.status === 200) {
      const clipData = response.data;
      const clipId = clipData.data[0].id;
      
      // Construct the clip URL
      const clipUrl = `https://clips.twitch.tv/${clipId}`;
      
      console.log(`✅ Clip created: ${clipUrl}`);
      
      res.json({
        message: `✅ Clip created! ${clipUrl}`
      });
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

  } catch (error) {
    console.error('❌ Clip creation error:', error.response?.data || error.message);
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      return res.json({
        message: '❌ Authentication failed. Please contact the streamer.'
      });
    }
    
    if (error.response?.status === 403) {
      return res.json({
        message: '❌ Stream must be live to create clips!'
      });
    }
    
    if (error.response?.data?.message?.includes('channel must be live')) {
      return res.json({
        message: '❌ Stream must be live to create clips!'
      });
    }

    // Generic error response
    res.json({
      message: '❌ Failed to create clip. The stream might be offline.'
    });
  }
});

// Simple endpoint for direct text responses
app.get('/clip/simple', async (req, res) => {
  try {
    const clientId = process.env.CLIENT_ID;
    const accessToken = process.env.ACCESS_TOKEN;
    const broadcasterId = process.env.BROADCASTER_ID;

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

   if (createClipResponse.status === 202 || createClipResponse.status === 200) {
      const clipData = createClipResponse.data;
      const clipId = clipData.data[0].id;
      
      console.log(`📹 Clip ID: ${clipId}`);
      
      // Wait for clip to process
      console.log('⏳ Waiting for clip to process...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Try to get clip details
      try {
        const getClipResponse = await axios.get(
          `https://api.twitch.tv/helix/clips?id=${clipId}`,
          {
            headers: {
              'Client-ID': clientId,
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );


    if (createClipResponse.status === 202 || createClipResponse.status === 200) {
      const clipData = createClipResponse.data;
      const clipId = clipData.data[0].id;
      
      console.log(`📹 Clip ID: ${clipId}`);
      
      // Wait for clip to process
      console.log('⏳ Waiting for clip to process...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Try to get clip details
      try {
        const getClipResponse = await axios.get(
          `https://api.twitch.tv/helix/clips?id=${clipId}`,
          {
            headers: {
              'Client-ID': clientId,
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        if (getClipResponse.status === 200 && getClipResponse.data.data.length > 0) {
          const clipInfo = getClipResponse.data.data[0];
          const clipUrl = clipInfo.url || `https://clips.twitch.tv/${clipId}`;
          
          console.log(`✅ Clip created successfully: ${clipUrl}`);
          
          // Send plain text response instead of JSON
          res.send(`✅ Clip created! ${clipUrl}`);
        } else {
          // If we can't get clip details, still return success with basic URL
          const basicUrl = `https://clips.twitch.tv/${clipId}`;
          console.log(`⚠️ Using basic URL: ${basicUrl}`);
          
          res.send(`✅ Clip created! ${basicUrl}`);
        }
      } catch (clipDetailError) {
        // Even if details fail, the clip was created
        const basicUrl = `https://clips.twitch.tv/${clipId}`;
        console.log(`⚠️ Clip details failed, but clip was created: ${basicUrl}`);
        
        res.send(`✅ Clip created! ${basicUrl}`);
      }
    } else {
      throw new Error(`HTTP ${createClipResponse.status}: ${createClipResponse.statusText}`);
    }

  } catch (error) {
    console.error('❌ Clip creation error:', error.response?.data || error.message);
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      return res.send('❌ Authentication failed. Please contact the streamer.');
    }
    
    if (error.response?.status === 403) {
      return res.send('❌ Stream must be live to create clips!');
    }
    
    if (error.response?.data?.message?.includes('channel must be live')) {
      return res.send('❌ Stream must be live to create clips!');
    }

    // Generic error response
    res.send('❌ Failed to create clip. The stream might be offline or there was an API issue.');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Twitch Clip API running on port ${PORT}`);
  console.log(`📺 Channel: ${process.env.CHANNEL_NAME || 'Not set'}`);
  console.log(`🌐 Host: Render.com`);
});