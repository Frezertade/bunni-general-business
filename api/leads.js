// Lead capture API — stores to Google Sheets
// Zero npm dependencies — uses built-in fetch + manual OAuth refresh

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, phone, company, notes } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Name is required' });

  try {
    // Refresh Google OAuth token
    const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
        grant_type: 'refresh_token',
      }),
    });
    const tokenData = await tokenResp.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error('Token refresh failed:', tokenData);
      return res.status(500).json({ error: 'Auth failed' });
    }

    // Write to Google Sheet
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Africa/Addis_Ababa' });
    const row = [[timestamp, name, email || '', phone || '', company || '', notes || '']];

    const sheetResp = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Leads!A:F:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: row }),
      }
    );

    const sheetData = await sheetResp.json();
    if (sheetData.error) {
      console.error('Sheets error:', sheetData);
      return res.status(500).json({ error: 'Failed to save lead' });
    }

    res.json({ success: true, message: 'Lead captured! እናመሰግናለን!' });
  } catch (error) {
    console.error('Leads error:', error);
    res.status(500).json({ error: 'Failed to save lead info' });
  }
};
