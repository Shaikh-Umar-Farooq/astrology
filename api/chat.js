const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Create dynamic astrology prompt based on user data
const createAstrologyPrompt = (userData, userMessage) => {
  const { firstName, lastName, dateOfBirth, placeOfBirth, timeOfBirth } = userData;
  
  return `You are a highly knowledgeable Vedic Pandit and Astrologer with deep expertise in Jyotish (Vedic Astrology).

Apply traditional Jyotish principles — including dashas, nakshatras, planetary strengths/weaknesses, yogas, and current transits — to analyze the birth chart and provide guidance for: "${userMessage}"

Birth Details:
• Name: ${firstName} ${lastName}
• Date of Birth: ${dateOfBirth}
• Time of Birth: ${timeOfBirth}
• Place of Birth: ${placeOfBirth}

LANGUAGE INSTRUCTION:
- DETECT the language of the user's question: "${userMessage}"
- If user asks in Hinglish (mix of Hindi-English), respond in NATURAL Hinglish
- If user asks in Hindi, respond in Hindi with some English terms
- If user asks in English, respond in English
- Use the SAME language style and tone as the user's question

IMPORTANT FORMATTING RULES:
1. Address the person directly as "you/aap" and "your/aapka" (not third person like "${firstName}'s")
2. Break response into 4-5 SHORT paragraphs (2-3 sentences each)
3. Use these EXACT formatting markers:
   - **POSITIVE** for favorable predictions
   - **NEGATIVE** for challenging predictions
   - **NEUTRAL** for general guidance
   - **REMEDY** for solutions and mantras

Format examples:
**POSITIVE** Aapka Jupiter placement bahut achha hai, growth ke liye excellent prospects hain.

**NEGATIVE** Saturn ka current transit thoda delay la sakta hai coming months mein.

**REMEDY** "Om Gam Ganapataye Namaha" 108 times daily japo obstacles remove karne ke liye.

Include:
- Current planetary influences on the queried area
- Specific timing predictions when relevant
- Traditional remedies (mantras, gemstones, rituals)
- Use natural mix of Hindi/English words when responding in Hinglish

Maintain authentic Vedic terminology while keeping language accessible and personal in the user's preferred language style.`;
};

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, userData } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Please provide a valid message' 
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({ 
        error: 'Message too long. Please keep it under 1000 characters.' 
      });
    }

    // Validate user data for Vedic astrology
    if (!userData || !userData.firstName || !userData.dateOfBirth || !userData.placeOfBirth || !userData.timeOfBirth) {
      return res.status(400).json({ 
        error: 'Complete birth details are required for accurate Vedic astrology reading.' 
      });
    }

    // Create the dynamic prompt with user data
    const fullPrompt = createAstrologyPrompt(userData, message);

    // Generate response using Gemini
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const botReply = response.text();

    res.json({ 
      response: botReply,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    
    // Fallback responses if AI fails (mix of English and Hinglish)
    const fallbackResponses = [
      "Cosmic energies abhi thoda clouded hain, but main sense kar raha hun ki aap kuch important guidance chahte hain. Please apne birth details complete kariye accurate Vedic guidance ke liye.",
      "Celestial channels mein thoda interference aa raha hai. Stars aapki help karna chahte hain though! Please ensure kariye ki aapke birth details complete hain.",
      "Universe mujhse keh raha hai ki main aapki energy ke saath reconnect karun. Kya situation hai jo aapke dil mein hai aur Vedic guidance chahiye?",
      "Mercury thoda cosmic static cause kar raha hai! But main aapki energy clearly sense kar sakta hun. Kaunsi life situation mein Jyotish ki wisdom chahiye?",
      "Planetary alignment shift ho raha hai, but aapka question important hai. Batayiye ki aap kya experience kar rahe hain taki main right Vedic guidance de sakun?"
    ];

    const fallbackResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];

    res.json({ 
      response: fallbackResponse,
      timestamp: new Date().toISOString(),
      fallback: true
    });
  }
}
