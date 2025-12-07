// api/donations.js
// Endpoint untuk fetch donasi dari Saweria API dengan caching

let cache = {
  data: null,
  timestamp: 0
};

const CACHE_DURATION = 30000; // 30 detik cache

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check cache
    const now = Date.now();
    if (cache.data && (now - cache.timestamp) < CACHE_DURATION) {
      console.log('✅ Returning cached data');
      return res.status(200).json(cache.data);
    }

    const SAWERIA_JWT = process.env.SAWERIA_JWT_TOKEN;

    if (!SAWERIA_JWT) {
      return res.status(500).json({ 
        error: 'SAWERIA_JWT_TOKEN not configured',
        instructions: 'Set SAWERIA_JWT_TOKEN in Vercel environment variables'
      });
    }

    console.log('🔄 Fetching fresh data from Saweria...');

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
      console.error('❌ Saweria API Error:', response.status, errorText);
      
      // Return cached data if available
      if (cache.data) {
        console.log('⚠️ Returning stale cache due to API error');
        return res.status(200).json({
          ...cache.data,
          warning: 'Using cached data due to API error'
        });
      }
      
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

    const result = {
      success: true,
      count: donations.length,
      donations: donations,
      cached_at: new Date().toISOString()
    };

    // Update cache
    cache = {
      data: result,
      timestamp: now
    };

    console.log('✅ Fresh data cached');

    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ Error:', error);
    
    // Return cached data if available
    if (cache.data) {
      console.log('⚠️ Returning stale cache due to error');
      return res.status(200).json({
        ...cache.data,
        warning: 'Using cached data due to error'
      });
    }
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}
