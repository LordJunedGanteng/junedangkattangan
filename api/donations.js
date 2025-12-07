// api/donations.js
import { donations } from './webhook';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=5, stale-while-revalidate');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const total = donations.reduce((sum, d) => sum + d.amount, 0);

  res.status(200).json({
    success: true,
    count: donations.length,
    total: total,
    donations: donations
  });
}
