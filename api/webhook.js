// api/webhook.js
let donations = [];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const d = req.body;

    // Format donasi
    const donation = {
      id: d.id || Date.now().toString(),
      donor: d.donator_name || 'Anonymous',
      amount: d.amount_raw || d.amount || 0,
      message: d.message || '',
      created_at: d.created_at || new Date().toISOString()
    };

    // Simpan ke cache (max 20)
    donations.unshift(donation);
    if (donations.length > 20) donations.pop();

    console.log('✅ Donasi diterima:', donation.donor, donation.amount);

    // === KIRIM KE ROBLOX ===
    const ROBLOX_API_KEY = process.env.ROBLOX_API_KEY;
    const UNIVERSE_ID = process.env.UNIVERSE_ID;
    const MESSAGING_TOPIC = process.env.MESSAGING_TOPIC || 'Donations';

    if (ROBLOX_API_KEY && UNIVERSE_ID) {
      await fetch(
        `https://apis.roblox.com/messaging-service/v1/universes/${UNIVERSE_ID}/topics/${MESSAGING_TOPIC}`,
        {
          method: 'POST',
          headers: {
            'x-api-key': ROBLOX_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: JSON.stringify(donation)
          })
        }
      ).catch(e => console.error('❌ Roblox send error:', e.message));
    }

    // === OPSIONAL: Kirim ke Discord notif ===
    const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
    if (DISCORD_WEBHOOK_URL) {
      await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `🎉 **Donasi Baru!**\nDari: ${donation.donor}\nJumlah: **Rp${donation.amount.toLocaleString('id-ID')}**\nPesan: "${donation.message}"`
        })
      }).catch(e => console.error('❌ Discord send error:', e.message));
    }

    res.status(200).json({ success: true, donation });
  } catch (err) {
    console.error('❌ Webhook error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
}

// Ekspor cache untuk /api/donations
export { donations };
