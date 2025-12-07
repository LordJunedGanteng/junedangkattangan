// api/webhook.js
// Endpoint untuk menerima webhook dari Saweria dan kirim ke Roblox MessagingService

export default async function handler(req, res) {
  // Hanya terima POST request
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Ambil data dari Saweria webhook
    const donation = req.body;
    
    console.log('📨 Received donation:', donation);

    // Environment Variables dari Vercel
    const ROBLOX_API_KEY = process.env.ROBLOX_API_KEY;
    const UNIVERSE_ID = process.env.UNIVERSE_ID;
    const MESSAGING_TOPIC = process.env.MESSAGING_TOPIC || 'SaweriaDonations';

    // Validasi env variables
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

    // Format data untuk dikirim ke Roblox
    // Saweria format: donator_name, amount_raw, message
    const messageData = {
      id: donation.id || Date.now(),
      donor: donation.donator_name || donation.donor_name || donation.donor || 'Anonymous',
      amount: donation.amount_raw || donation.amount || 0,
      message: donation.message || donation.note || '',
      timestamp: donation.created_at || new Date().toISOString(),
      type: 'saweria_donation',
      raw: donation // Simpan data asli untuk debugging
    };

    console.log('📤 Sending to Roblox:', messageData);

    // Kirim ke Roblox MessagingService API
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
      console.error('❌ Roblox API Error:', errorText);
      
      return res.status(500).json({ 
        error: 'Failed to send to Roblox',
        status: robloxResponse.status,
        details: errorText
      });
    }

    console.log('✅ Successfully sent to Roblox!');

    // Response sukses
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
