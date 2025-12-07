// pages/api/donations.js
// Handle both:
// - POST: webhook from Saweria
// - GET: data for frontend

let donations = [];

export default async function handler(req, res) {
  // CORS & OPTIONS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ─── POST: Terima donasi dari Saweria ───────────────────────
  if (req.method === 'POST') {
    try {
      const d = req.body;

      // Validasi minimal
      if (!d) {
        return res.status(400).json({ error: 'Invalid payload' });
      }

      const donation = {
        id: d.id || Date.now().toString(),
        donor: d.donator_name || d.donor_name || 'Anonymous',
        amount: d.amount_raw || d.amount || 0,
        message: d.message || d.note || '',
        created_at: d.created_at || new Date().toISOString()
      };

      // Simpan ke cache
      donations.unshift(donation);
      if (donations.length > 20) donations.pop();

      console.log('✅ Donasi diterima:', donation.donor, donation.amount);

      // ─── Kirim ke Roblox MessagingService ─────────────────────
      const ROBLOX_API_KEY = process.env.ROBLOX_API_KEY;
      const UNIVERSE_ID = process.env.UNIVERSE_ID;
      const MESSAGING_TOPIC = process.env.MESSAGING_TOPIC || 'Donations';

      if (ROBLOX_API_KEY && UNIVERSE_ID) {
        try {
          const robloxRes = await fetch(
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
          );

          if (!robloxRes.ok) {
            const errText = await robloxRes.text();
            console.error('❌ Roblox API error:', robloxRes.status, errText);
          } else {
            console.log('📤 Terkirim ke Roblox');
          }
        } catch (e) {
          console.error('❌ Gagal kirim ke Roblox:', e.message);
        }
      }

      // ─── (Opsional) Kirim ke Discord ──────────────────────────
      const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
      if (DISCORD_WEBHOOK_URL) {
        try {
          await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: `🎉 **Donasi Baru!**\nDari: ${donation.donor}\nJumlah: **Rp${donation.amount.toLocaleString('id-ID')}**\nPesan: "${donation.message}"`
            })
          });
        } catch (e) {
          console.error('❌ Gagal kirim ke Discord:', e.message);
        }
      }

      return res.status(200).json({ success: true, donation });
    } catch (err) {
      console.error('❌ Webhook error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ─── GET: Kirim data ke frontend ────────────────────────────
  if (req.method === 'GET') {
    const total = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
    return res.status(200).json({
      success: true,
      count: donations.length,
      total: total,
      donations: donations
    });
  }

  // ─── Method lain: tolak ─────────────────────────────────────
  return res.status(405).json({ error: 'Method not allowed' });
}
