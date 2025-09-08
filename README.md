# Astro Chat 🌟

An AI-powered astrology chat application built with React.js frontend and Node.js backend, integrated with Google's Gemini AI for personalized astrological guidance.

## Features

- 🌟 **AI Astrologer**: Chat with an AI that provides astrological insights and guidance
- 🎨 **Beautiful UI**: Clean, modern design with golden/orange theme
- 📱 **Responsive**: Works perfectly on desktop, tablet, and mobile
- 🚀 **Fast**: Real-time chat with typing indicators
- 🛡️ **Secure**: Rate limiting and input validation
- 💾 **Fallback**: Graceful handling when AI is unavailable

## Technology Stack

### Frontend
- **React.js** - Modern UI library
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client for API calls

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Google Gemini AI** - AI model for astrological responses
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Google Gemini API key

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo-url>
   cd astro-chat
   npm install
   npm run install-all
   ```

2. **Setup environment variables:**
   ```bash
   cd backend
   cp env.example .env
   ```
   
   Edit `.env` and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=5000
   NODE_ENV=development
   ```

3. **Get your Gemini API key:**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy it to your `.env` file

### Running the Application

**Development mode (both frontend and backend):**
```bash
npm run dev
```

**Frontend only:**
```bash
npm run frontend
```

**Backend only:**
```bash
npm run backend
```

**Production build:**
```bash
npm run build
npm start
```

### URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Project Structure

```
astro-chat/
├── frontend/                 # React.js frontend
│   ├── public/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── services/         # API services
│   │   └── ...
│   └── package.json
├── backend/                  # Node.js backend
│   ├── server.js            # Main server file
│   ├── .env.example         # Environment variables template
│   └── package.json
├── package.json             # Root package.json
└── README.md
```

## API Endpoints

- `POST /api/chat` - Send message to AI astrologer
- `GET /api/health` - Health check endpoint

## Environment Variables

### Backend (.env)
- `GEMINI_API_KEY` - Your Google Gemini API key (required)
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment mode (development/production)

### Frontend (.env.local)
- `REACT_APP_API_URL` - Backend API URL (default: http://localhost:5000)

## Features in Detail

### Chat Interface
- Real-time messaging with the AI astrologer
- Typing indicators
- Message timestamps
- Auto-scrolling chat history

### Responsive Design
- **Desktop**: Three-column layout with ads on sides
- **Tablet**: Condensed three-column layout
- **Mobile**: Single-column chat-focused view

### AI Integration
- Powered by Google's Gemini AI
- Specialized astrology prompts
- Fallback responses for reliability
- Rate limiting for API protection

## Customization

### Changing Colors
Edit `frontend/tailwind.config.js` to modify the color scheme:
```javascript
colors: {
  primary: '#ff6b35',        // Main orange color
  'primary-hover': '#e55a2b', // Darker orange for hover
  'bot-bg': '#fff9e6',       // Bot message background
  'bot-border': '#ffe066',   // Bot message border
}
```

### Adding Features
- Modify `backend/server.js` for backend changes
- Add components in `frontend/src/components/`
- Update API calls in `frontend/src/services/api.js`

## Deployment

### Frontend (Netlify/Vercel)
1. Build the frontend: `cd frontend && npm run build`
2. Deploy the `build` folder
3. Set environment variable: `REACT_APP_API_URL=your-backend-url`

### Backend (Railway/Render/Heroku)
1. Deploy the `backend` folder
2. Set environment variables in your hosting platform
3. Update CORS settings in `server.js` for production

## Troubleshooting

### Common Issues

1. **API Key Error**: Make sure your Gemini API key is correctly set in `.env`
2. **CORS Error**: Check that the frontend URL is allowed in backend CORS settings
3. **Port Conflicts**: Change ports in package.json scripts if needed

### Getting Help
- Check the browser console for frontend errors
- Check the terminal/server logs for backend errors
- Ensure all dependencies are installed with `npm run install-all`

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Happy chatting with the stars! 🌟✨**
# astrology
