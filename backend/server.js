const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { handleUserQuestion, getUserDailyStatus, generateUserKey } = require('./services/supabaseService');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

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

// More restrictive rate limiting for user status endpoint
const statusLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per minute for status checks
  message: 'Too many status requests from this IP, please slow down.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use('/api/chat', limiter);
app.use('/api/user-status', statusLimiter);

// Create dynamic astrology prompt based on user data
const createAstrologyPrompt = (userData, userMessage) => {
  const { firstName, lastName, dateOfBirth, placeOfBirth, timeOfBirth } = userData;
  
  return `You are a highly knowledgeable Vedic Pandit and Astrologer with deep expertise in Jyotish (Vedic Astrology).

Apply traditional Jyotish principles to analyze the birth chart and answer: "${userMessage}"

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

CRITICAL FORMATTING RULES:
1. Keep response SHORT - maximum 3-4 paragraphs total (under 150 words)
2. Start with "Namaste ${firstName} ji!" and brief lagna analysis
3. Use EXACT formatting markers:
   - <green>positive predictions</green>
   - <red>negative predictions</red>
4. Focus on SPECIFIC TIMING (years, periods)
5. NO disclaimers, NO "this is just a glimpse", NO "Jai Shree Krishna" endings
6. Address directly as "you/aap" never third person

EXACT FORMAT TO FOLLOW:
Namaste ${firstName} ji! Brief lagna analysis in 1 line.

<green>Positive prediction with specific timing.</green> Brief planetary logic. <green>Another positive with timing.</green>

<red>Negative aspect with timing.</red> Brief explanation. <red>Another challenge if relevant.</red>

Overall conclusion in 1 line with final <green>positive note.</green>

<green>Summary:</green>
• Brief positive point with timing
• Brief challenge/negative point with timing
• Overall advice/conclusion

INCLUDE:
- Specific years/periods for predictions
- Brief planetary explanations (1 line each)
- Focus on timing and outcomes only
- Keep total response under 150 words`;
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

    // Handle user question tracking in Supabase with daily limit check
    let userLimitInfo = null;
    try {
      console.log('Processing question for user:', userData.firstName);
      userLimitInfo = await handleUserQuestion(userData);
      console.log('User limit info after processing:', userLimitInfo);
      
      // Check if user has exceeded daily limit
      if (userLimitInfo && !userLimitInfo.can_ask_question) {
        console.log('User has exceeded daily limit:', userLimitInfo.daily_questions_count, '/', userLimitInfo.daily_limit);
        return res.status(429).json({ 
          error: 'Daily question limit exceeded',
          limitExceeded: true,
          dailyLimit: userLimitInfo.daily_limit,
          questionsUsed: userLimitInfo.daily_questions_count,
          resetMessage: 'Your daily limit of questions has been reached. Your limit will reset tomorrow.',
          timestamp: new Date().toISOString()
        });
      }
    } catch (dbError) {
      console.error('Error tracking user question in database:', dbError);
      // Continue with request if database tracking fails
    }

    // Create the dynamic prompt with user data
    const fullPrompt = createAstrologyPrompt(userData, message);

    // Generate response using Gemini
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const botReply = response.text();

    // Include limit info in response
    const responseData = { 
      response: botReply,
      timestamp: new Date().toISOString()
    };

    if (userLimitInfo) {
      responseData.userLimitInfo = {
        questionsUsed: userLimitInfo.daily_questions_count,
        dailyLimit: userLimitInfo.daily_limit,
        questionsRemaining: userLimitInfo.questions_remaining,
        canAskQuestion: userLimitInfo.can_ask_question
      };
      console.log('Sending limit info to frontend:', responseData.userLimitInfo);
    }

    res.json(responseData);

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

// Get user's daily limit status endpoint
app.post('/api/user-status', async (req, res) => {
  try {
    const { userData } = req.body;

    // Validate user data
    if (!userData || !userData.firstName || !userData.dateOfBirth) {
      return res.status(400).json({ 
        error: 'User first name and date of birth are required.' 
      });
    }

    const userKey = generateUserKey(userData.dateOfBirth, userData.firstName);
    console.log('Getting status for user key:', userKey);
    
    const status = await getUserDailyStatus(userKey);
    console.log('Status retrieved:', status);
    
    if (!status) {
      // User doesn't exist yet
      const defaultStatus = {
        questionsUsed: 0,
        dailyLimit: 10,
        questionsRemaining: 10,
        canAskQuestion: true
      };
      console.log('Returning default status:', defaultStatus);
      return res.json(defaultStatus);
    }

    const responseStatus = {
      questionsUsed: status.daily_questions_count,
      dailyLimit: status.daily_limit,
      questionsRemaining: status.questions_remaining,
      canAskQuestion: status.can_ask_question
    };
    
    console.log('Returning user status:', responseStatus);
    res.json(responseStatus);

  } catch (error) {
    console.error('User status API Error:', error);
    res.status(500).json({ 
      error: 'Failed to get user status' 
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
