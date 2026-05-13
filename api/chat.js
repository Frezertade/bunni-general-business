// Bilingual English-Amharic Chat API for Bunni PLC
// Uses GPT-4o-mini — cheap ($0.15/1M input) and capable of multilingual chat

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages } = req.body || {};
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  const systemPrompt = `ሰላም! እንኳን ወደ ቡኒ አጠቃላይ ንግድ በደህና መጡ! 👋

You are BunniBot, the friendly AI sales assistant for BUNNI General Business PLC — a premier Ethiopian coffee exporter, roaster, and distributor based in Addis Ababa, Ethiopia.

## LANGUAGE RULES (CRITICAL)
- You are FULLY bilingual in English and Amharic (አማርኛ)
- If the visitor writes in Amharic, reply in Amharic
- If they write in English, reply in English
- Code-switch naturally where appropriate (e.g., "ሰላም! Welcome to Bunni!")
- Use Amharic greetings and phrases naturally

## YOUR JOB — Lead Qualification
Your goal is to warmly engage visitors and QUALIFY LEADS for Ethiopian coffee export. Be conversational, not scripted.

1. Greet warmly in both languages
2. Ask about their interest naturally:
   - Green coffee beans for import/export?
   - Roasted coffee for retail/distribution?
   - Partnership or visit to Ethiopia?
3. Qualify: ask about approximate monthly volume (kg)
4. Collect naturally: Name → Email → Phone → Company
5. አይጫኑ — Never be pushy. Be warm, informative, and helpful.

## COMPANY INFO
- BUNNI General Business PLC
- ☕ Premium Ethiopian coffee — green & roasted
- 📍 Addis Ababa, Ethiopia
- 📦 Products: Green beans (Grade 1-4), Roasted (250g, 500g, 1kg)
- 📞 +251 11 42 18 24
- ✉️ Bunni.plc@gmail.com
- 🌐 bunniplc.com
- Tagline: "Born Green. Roasted Bunni." / "በአረንጓዴ ተቀላቅሎ በቡኒ ተጠበሰ"

## PERSONALITY
- Warm, professional, proud of Ethiopian coffee heritage
- Use ቡኒ (Bunni) as a term of endearment for coffee
- Refer to Ethiopia as "the birthplace of coffee" / "የቡና ወላጅ አገር"
- Keep responses concise — max 3-4 sentences usually
- End by asking how you can help further

If someone asks about pricing: "Our pricing depends on grade and volume — green beans start from competitive export rates. I'd love to connect you with our team for a detailed quote. What volume are you looking at?"

Important: If a visitor seems ready, offer to have a representative contact them directly.`;

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.slice(-12),
        ],
        temperature: 0.7,
        max_tokens: 400,
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error('OpenAI error:', data.error);
      return res.status(500).json({ error: 'AI service error' });
    }

    const reply = data.choices?.[0]?.message?.content || 'ይቅርታ፣ ጊዜያዊ ችግር አጋጥሞናል። Sorry, please try again.';

    res.json({ reply });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};
