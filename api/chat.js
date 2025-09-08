const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Generate a unique key from user's DOB and first name
 */
const generateUserKey = (dateOfBirth, firstName) => {
  const combinedString = `${firstName.toLowerCase().trim()}_${dateOfBirth}`;
  return crypto.createHash('sha256').update(combinedString).digest('hex');
};

/**
 * Handle user question tracking with daily limits
 */
const handleUserQuestion = async (userData) => {
  try {
    const userKey = generateUserKey(userData.dateOfBirth, userData.firstName);
    const today = new Date().toISOString().split('T')[0];
    
    // Check if user exists
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
      // User doesn't exist, create new one
      const newUser = {
        user_key: userKey,
        first_name: userData.firstName,
        last_name: userData.lastName,
        date_of_birth: userData.dateOfBirth,
        place_of_birth: userData.placeOfBirth,
        time_of_birth: userData.timeOfBirth,
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

      if (createError) {
        throw createError;
      }

      user = {
        ...createdUser,
        can_ask_question: true,
        questions_remaining: 9,
        allowed_this_message: true
      };
    } else {
      // User exists - check if we need to reset daily count
      const isNewDay = existingUser.last_question_date !== today;
      
      if (isNewDay) {
        // Reset daily count for new day
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

        if (updateError) {
          throw updateError;
        }

        user = {
          ...updatedUser,
          can_ask_question: true,
          questions_remaining: updatedUser.daily_limit - 1,
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
          console.log('[HANDLE USER] Incrementing counters for existing user:', {
            currentDaily: existingUser.daily_questions_count,
            currentTotal: existingUser.questions_count
          });
          
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

          if (updateError) {
            console.error('[HANDLE USER] Update error:', updateError);
            throw updateError;
          }

          console.log('[HANDLE USER] User updated successfully:', {
            newDaily: updatedUser.daily_questions_count,
            newTotal: updatedUser.questions_count
          });

          user = {
            ...updatedUser,
            can_ask_question: updatedUser.daily_questions_count < updatedUser.daily_limit,
            questions_remaining: updatedUser.daily_limit - updatedUser.daily_questions_count,
            // This message was allowed since we only reached here when under the limit
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
    // Check environment variables first
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('[CHAT API] Missing environment variables:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceRoleKey,
        hasGemini: !!process.env.GEMINI_API_KEY
      });
      return res.status(500).json({ 
        error: 'Server configuration error - missing environment variables' 
      });
    }

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
      console.log('[CHAT API] Processing question for user:', userData.firstName);
      userLimitInfo = await handleUserQuestion(userData);
      console.log('[CHAT API] User limit info after processing:', {
        questionsUsed: userLimitInfo.daily_questions_count,
        dailyLimit: userLimitInfo.daily_limit,
        canAsk: userLimitInfo.can_ask_question,
        allowedThisMessage: userLimitInfo.allowed_this_message
      });
      
      // Check if user has exceeded daily limit
      // IMPORTANT: Only block when THIS message is not allowed. If this
      // was the last allowed one (bringing count to the limit), we allow it
      // and only block the next one.
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
}
