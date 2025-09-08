require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5001;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production'
      ? ['https://your-domain.com']
      : ['http://localhost:3000', 'http://127.0.0.1:3000']
  })
);
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});

// More restrictive rate limiting for user status endpoint
const statusLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  message: 'Too many status requests from this IP, please slow down.',
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/chat', limiter);
app.use('/api/user-status', statusLimiter);

/**
 * Generate a unique key from user's DOB and first name
 */
const generateUserKey = (dateOfBirth, firstName) => {
  const combinedString = `${firstName.toLowerCase().trim()}_${dateOfBirth}`;
  return crypto.createHash('sha256').update(combinedString).digest('hex');
};

/**
 * Get user's daily status from Supabase
 */
const getUserDailyStatus = async (userKey) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_key', userKey)
    .single();

  if (error) {
    // If user not found, return null to indicate 'new user'
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
};

/**
 * Handle user question tracking with daily limits
 */
const handleUserQuestion = async (userData) => {
  try {
    const userKey = generateUserKey(userData.dateOfBirth, userData.firstName);
    const today = new Date().toISOString().split('T')[0];

    // Try to fetch existing user
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('user_key', userKey)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    let user;

    if (!existingUser) {
      // User doesn't exist, create new one with initial counters
      const newUser = {
        user_key: userKey,
        first_name: userData.firstName,
        last_name: userData.lastName || null,
        date_of_birth: userData.dateOfBirth,
        place_of_birth: userData.placeOfBirth || null,
        time_of_birth: userData.timeOfBirth || null,
        questions_count: 1,
        daily_questions_count: 1,
        last_question_date: today,
        daily_limit: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: createdUser, error: createError } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single();

      if (createError) throw createError;

      user = {
        ...createdUser,
        can_ask_question: true,
        questions_remaining: createdUser.daily_limit - createdUser.daily_questions_count,
        allowed_this_message: true
      };
    } else {
      // Existing user - determine if day rolled over
      const isNewDay = existingUser.last_question_date !== today;

      if (isNewDay) {
        // Reset daily count for new day and increment total
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            daily_questions_count: 1,
            last_question_date: today,
            questions_count: existingUser.questions_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('user_key', userKey)
          .select()
          .single();

        if (updateError) throw updateError;

        user = {
          ...updatedUser,
          can_ask_question: true,
          questions_remaining: updatedUser.daily_limit - updatedUser.daily_questions_count,
          allowed_this_message: true
        };
      } else {
        // Same day - check daily limit
        if (existingUser.daily_questions_count >= existingUser.daily_limit) {
          // Limit exceeded
          user = {
            ...existingUser,
            can_ask_question: false,
            questions_remaining: 0,
            allowed_this_message: false
          };
        } else {
          // Increment counters
          const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({
              daily_questions_count: existingUser.daily_questions_count + 1,
              questions_count: existingUser.questions_count + 1,
              updated_at: new Date().toISOString()
            })
            .eq('user_key', userKey)
            .select()
            .single();

          if (updateError) throw updateError;

          user = {
            ...updatedUser,
            can_ask_question: updatedUser.daily_questions_count < updatedUser.daily_limit,
            questions_remaining: updatedUser.daily_limit - updatedUser.daily_questions_count,
            allowed_this_message: true
          };
        }
      }
    }

    return user;
  } catch (error) {
    console.error('Error in handleUserQuestion:', error);
    throw error;
  }
};

// Create dynamic astrology prompt based on user data
const createAstrologyPrompt = (userData, userMessage) => {
  const { firstName, lastName, dateOfBirth, placeOfBirth, timeOfBirth } = userData;

  return `You are a highly knowledgeable Vedic Pandit and Astrologer with deep expertise in Jyotish (Vedic Astrology).\n\nApply traditional Jyotish principles to analyze the birth chart and answer: "${userMessage}"\n\nBirth Details:\n• Name: ${firstName} ${lastName || ''}\n• Date of Birth: ${dateOfBirth}\n• Time of Birth: ${timeOfBirth}\n• Place of Birth: ${placeOfBirth}\n\nLANGUAGE INSTRUCTION:\n- DETECT the language of the user's question: "${userMessage}"\n- If user asks in Hinglish (mix of Hindi-English), respond in NATURAL Hinglish\n- If user asks in Hindi, respond in Hindi with some English terms\n- If user asks in English, respond in English\n- Use the SAME language style and tone as the user's question\n\nCRITICAL FORMATTING RULES:\n1. Keep response SHORT - maximum 3-4 paragraphs total (under 150 words)\n2. Start with "Namaste ${firstName} ji!" and brief lagna analysis\n3. Use EXACT formatting markers:\n   - <green>positive predictions</green>\n   - <red>negative predictions</red>\n4. Focus on SPECIFIC TIMING (years, periods)\n5. NO disclaimers, NO "this is just a glimpse", NO "Jai Shree Krishna" endings\n6. Address directly as "you/aap" never third person\n\nEXACT FORMAT TO FOLLOW:\nNamaste ${firstName} ji! Brief lagna analysis in 1 line.\n\n<green>Positive prediction with specific timing.</green> Brief planetary logic. <green>Another positive with timing.</green>\n\n<red>Negative aspect with timing.</red> Brief explanation. <red>Another challenge if relevant.</red>\n\nOverall conclusion in 1 line with final <green>positive note.</green>\n\n<green>Summary:</green>\n• Brief positive point with timing\n• Brief challenge/negative point with timing\n• Overall advice/conclusion\n\nINCLUDE:\n- Specific years/periods for predictions\n- Brief planetary explanations (1 line each)\n- Focus on timing and outcomes only\n- Keep total response under 150 words`;
};

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, userData } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Please provide a valid message' });
    }

    if (message.length > 1000) {
      return res.status(400).json({ error: 'Message too long. Please keep it under 1000 characters.' });
    }

    // Validate user data for Vedic astrology
    if (!userData || !userData.firstName || !userData.dateOfBirth || !userData.placeOfBirth || !userData.timeOfBirth) {
      return res.status(400).json({ error: 'Complete birth details are required for accurate Vedic astrology reading.' });
    }

    // Handle user question tracking in Supabase with daily limit check
    let userLimitInfo = null;
    try {
      console.log('[CHAT API] Processing question for user:', userData.firstName);
      userLimitInfo = await handleUserQuestion(userData);
      console.log('[CHAT API] User limit info after processing:', {
        questionsUsed: userLimitInfo.daily_questions_count,
        dailyLimit: userLimitInfo.daily_limit,
        canAsk: userLimitInfo.can_ask_question,
        allowedThisMessage: userLimitInfo.allowed_this_message
      });

      // Block only if this message was explicitly disallowed
      if (userLimitInfo && userLimitInfo.allowed_this_message === false) {
        console.log('[CHAT API] User has exceeded daily limit');

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
        canAskQuestion: userLimitInfo.can_ask_question,
        allowedThisMessage: userLimitInfo.allowed_this_message
      };
      console.log('[CHAT API] Sending limit info to frontend:', responseData.userLimitInfo);
    }

    console.log('[CHAT API] Response sent successfully');
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
      return res.status(400).json({ error: 'User first name and date of birth are required.' });
    }

    const userKey = generateUserKey(userData.dateOfBirth, userData.firstName);
    const status = await getUserDailyStatus(userKey);

    if (!status) {
      // User doesn't exist yet
      return res.json({
        questionsUsed: 0,
        dailyLimit: 10,
        questionsRemaining: 10,
        canAskQuestion: true
      });
    }

    res.json({
      questionsUsed: status.daily_questions_count,
      dailyLimit: status.daily_limit,
      questionsRemaining: status.questions_remaining,
      canAskQuestion: status.can_ask_question
    });

  } catch (error) {
    console.error('User status API Error:', error);
    res.status(500).json({ error: 'Failed to get user status' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), service: 'Astro Chat Backend' });
});

// Default route
app.get('/', (req, res) => {
  res.json({
    message: 'Astro Chat Backend API',
    version: '1.0.0',
    endpoints: {
      chat: 'POST /api/chat',
      health: 'GET /api/health',
      userStatus: 'POST /api/user-status'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Something went wrong. The stars are realigning...' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found in this cosmic realm' });
});

app.listen(PORT, () => {
  console.log(`🌟 Astro Chat Backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  Warning: GEMINI_API_KEY not set in environment variables');
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠️  Warning: Supabase config missing (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)');
  }
});
