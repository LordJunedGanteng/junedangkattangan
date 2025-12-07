// api/status.js
// Endpoint untuk cek status dan environment variables

export default function handler(req, res) {
  const hasApiKey = !!process.env.ROBLOX_API_KEY;
  const hasUniverseId = !!process.env.UNIVERSE_ID;
  const messagingTopic = process.env.MESSAGING_TOPIC || 'SaweriaDonations';

  // Status check
  const isConfigured = hasApiKey && hasUniverseId;

  return res.status(200).json({
    status: 'online',
    configured: isConfigured,
    timestamp: new Date().toISOString(),
    environment: {
      ROBLOX_API_KEY: hasApiKey ? '✅ Set' : '❌ Missing',
      UNIVERSE_ID: hasUniverseId ? '✅ Set' : '❌ Missing',
      MESSAGING_TOPIC: messagingTopic,
      NODE_ENV: process.env.NODE_ENV || 'development'
    },
    endpoints: {
      webhook: '/api/webhook - POST only (untuk Saweria)',
      test: '/api/test - POST only (untuk testing)',
      status: '/api/status - GET (endpoint ini)'
    },
    instructions: !isConfigured ? {
      message: 'Please set environment variables in Vercel dashboard',
      required: [
        'ROBLOX_API_KEY',
        'UNIVERSE_ID'
      ],
      optional: [
        'MESSAGING_TOPIC (default: SaweriaDonations)'
      ]
    } : null
  });
}
