// api/webhook.js
// Endpoint untuk menerima webhook dari Saweria dan kirim ke Roblox MessagingService

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const donation = req.body;
    console.log('📨 Received donation:', donation);

    const ROBLOX_API_KEY = process.env.ROBLOX_API_KEY;
    const UNIVERSE_ID = process.env.UNIVERSE_ID;
    const MESSAGING_TOPIC = process.env.MESSAGING_TOPIC || 'SaweriaDonations';

    if (!ROBLOX_API_KEY || !UNIVERSE_ID) {
      console.error('❌ Missing environment variables');
      return res.status(500).json({ 
        error: 'Server configuration error',
        missing: {
          api_key: !ROBLOX_API_KEY,
          universe_id: !UNIVERSE_ID
        }
      });
    }

    const messageData = {
      id: donation.id || Date.now().toString(),
      donor: donation.donator_name || donation.donor_name || donation.donor || 'Anonymous',
      amount: donation.amount_raw || donation.amount || 0,
      message: donation.message || donation.note || '',
      timestamp: donation.created_at || new Date().toISOString(),
      type: 'saweria_donation',
      raw: donation
    };

    console.log('📤 Sending to Roblox:', messageData);

    // ✅ DIPERBAIKI: HAPUS SPASI DI URL
    const robloxResponse = await fetch(
      `https://apis.roblox.com/messaging-service/v1/universes/${UNIVERSE_ID}/topics/${MESSAGING_TOPIC}`,
      {
        method: 'POST',
        headers: {
          'x-api-key': ROBLOX_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: JSON.stringify(messageData)
        })
      }
    );

    if (!robloxResponse.ok) {
      const errorText = await robloxResponse.text();
      console.error('❌ Roblox API Error:', robloxResponse.status, errorText);
      return res.status(500).json({ 
        error: 'Failed to send to Roblox',
        status: robloxResponse.status,
        details: errorText
      });
    }

    console.log('✅ Successfully sent to Roblox!');
    return res.status(200).json({ 
      success: true,
      message: 'Donation sent to Roblox',
      data: messageData
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}
