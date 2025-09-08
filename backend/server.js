const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000']
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

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

// Chat endpoint
app.post('/api/chat', async (req, res) => {
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
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Astro Chat Backend'
  });
});

// Default route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Astro Chat Backend API',
    version: '1.0.0',
    endpoints: {
      chat: 'POST /api/chat',
      health: 'GET /api/health'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Something went wrong. The stars are realigning...' 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found in this cosmic realm' 
  });
});

app.listen(PORT, () => {
  console.log(`🌟 Astro Chat Backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  Warning: GEMINI_API_KEY not set in environment variables');
  }
});
