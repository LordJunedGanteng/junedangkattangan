// api/donations.js
// Endpoint untuk fetch donasi dari Saweria API

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const SAWERIA_JWT = process.env.SAWERIA_JWT_TOKEN;

    if (!SAWERIA_JWT) {
      return res.status(500).json({ 
        error: 'SAWERIA_JWT_TOKEN not configured',
        instructions: 'Set SAWERIA_JWT_TOKEN in Vercel environment variables'
      });
    }

    // Fetch transactions dari Saweria API
    const response = await fetch('https://api.saweria.co/user/transactions?page=1&pageSize=10', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SAWERIA_JWT}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Saweria API Error:', errorText);
      
      return res.status(response.status).json({ 
        error: 'Failed to fetch from Saweria',
        status: response.status,
        details: errorText
      });
    }

    const data = await response.json();
    
    // Transform data untuk frontend
    const donations = (data.data || []).map(item => ({
      id: item.id,
      donor: item.donator_name || item.donor_name || 'Anonymous',
      amount: item.amount_raw || item.amount || 0,
      message: item.message || '',
      created_at: item.created_at,
      type: item.type || 'donation'
    }));

    return res.status(200).json({
      success: true,
      count: donations.length,
      donations: donations
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}
