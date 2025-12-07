// api/test.js
// Endpoint untuk testing - kirim donasi dummy ke Roblox

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ROBLOX_API_KEY = process.env.ROBLOX_API_KEY;
  const UNIVERSE_ID = process.env.UNIVERSE_ID;
  const MESSAGING_TOPIC = process.env.MESSAGING_TOPIC || 'SaweriaDonations';

  // Validasi env variables
  if (!ROBLOX_API_KEY || !UNIVERSE_ID) {
    return res.status(500).json({ 
      error: 'Server not configured',
      missing: {
        api_key: !ROBLOX_API_KEY,
        universe_id: !UNIVERSE_ID
      }
    });
  }

  // Donasi dummy untuk testing
  const testDonation = {
    id: Date.now(),
    donor: req.body.donor || 'Test Donor',
    amount: req.body.amount || 50000,
    message: req.body.message || 'Test donation from Vercel!',
    timestamp: new Date().toISOString(),
    type: 'test_donation'
  };

  console.log('🧪 Sending test donation:', testDonation);

  try {
    const robloxResponse = await fetch(
      `https://apis.roblox.com/messaging-service/v1/universes/${UNIVERSE_ID}/topics/${MESSAGING_TOPIC}`,
      {
        method: 'POST',
        headers: {
          'x-api-key': ROBLOX_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: JSON.stringify(testDonation)
        })
      }
    );

    if (!robloxResponse.ok) {
      const errorText = await robloxResponse.text();
      console.error('❌ Roblox API Error:', errorText);
      
      return res.status(500).json({ 
        error: 'Failed to send to Roblox',
        status: robloxResponse.status,
        details: errorText
      });
    }

    console.log('✅ Test donation sent successfully!');

    return res.status(200).json({ 
      success: true,
      message: 'Test donation sent to Roblox!',
      data: testDonation
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ 
      error: error.message
    });
  }
}
