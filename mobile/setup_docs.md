# SmartMedGuide - Complete Setup Guide

## 📋 Overview

SmartMedGuide is a cross-platform (Android + Web) application that helps users identify medicines, get medical guidance, and communicate with an AI medical assistant in multiple languages.


```

## 🚀 Backend Setup

### 1. Prerequisites

```bash
- Python 3.8 or higher
- pip (Python package manager)
```

### 2. Create Project Structure

```bash
mkdir smartmedguide
cd smartmedguide
mkdir backend
cd backend

```

### 3. Install Dependencies

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install packages
pip install -r requirements.txt
```

### 4. Initialize Database

```bash
python init_database.py
```

This will create `database/medicines.db` with sample medicine data.

### 5. Setup Environment Variables

Create a `.env` file in the backend directory:

```env
HOST=0.0.0.0
PORT=8000
DEBUG=True
DATABASE_PATH=database/medicines.db
```

### 6. Add Your CNN Model

Place your trained medicine classification model in:
```
backend/model/medicine_model.keras
```

If you don't have a model, the system will use mock predictions for testing.

### 7. Run Backend Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: `http://localhost:8000`

API Documentation: `http://localhost:8000/docs`

## 📱 Frontend Setup (React Native)



###  Create Project Structure

```bash
cd ..
mkdir mobile
cd mobile
```



###  Install Dependencies

```bash
npm install
```
npm start
Or:

```bash
yarn install
```

### 6Configure API URL

Edit `src/config.js` and update the `API_URL`:

```javascript
export const API_URL = 'http://YOUR_IP_ADDRESS:8000';
```

**Finding your IP address:**
- Windows: `ipconfig` (look for IPv4 Address)
- Mac/Linux: `ifconfig` or `ip addr`

### Run the Application

**For Android:**
```bash
npm run android
```

**For iOS:**
```bash
npm run ios
```

**For Web:**
```bash
npm run web
```

## 📦 Project Structure

## 🔧 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API information |
| `/health` | GET | Health check |
| `/predict` | POST | Medicine classification |
| `/api/medicine/search/{query}` | GET | Search medicines |
| `/api/medicine/{id}` | GET | Get medicine details |
| `/api/chat` | POST | Chat with AI assistant |
| `/api/translate` | POST | Translate text |
| `/api/tts` | POST | Text-to-speech |

## 🎯 Key Features

### Backend Features

1. **Medicine Classification**
   - CNN-based image recognition
   - Confidence scoring
   - Top-1 prediction

2. **Medical Chatbot**
   - Intent-based responses
   - Medical guidance
   - Safety warnings

3. **Multi-language Support**
   - 10 Indian languages
   - Real-time translation
   - Text-to-speech in multiple languages

4. **Database**
   - SQLite with medicine information
   - Search functionality
   - Detailed medicine data

### Frontend Features

1. **Medicine Scanning**
   - Camera integration
   - Gallery selection
   - Real-time prediction

2. **Voice Search**
   - Speech recognition
   - Voice-activated search
   - Audio responses

3. **AI Chat**
   - Interactive conversation
   - Medical queries
   - Voice output

4. **Medicine Information**
   - Detailed medicine data
   - Usage instructions
   - Side effects
   - Audio playback

5. **User Management**
   - Profile management
   - Settings customization
   - Dark mode support

## 🔐 Security Notes

- Never expose API keys in the code
- Use environment variables for sensitive data
- Implement proper authentication for production
- Add rate limiting to API endpoints
- Validate all user inputs


## 📄 License

This project is for educational purposes.

## ⚠️ Disclaimer

This application is for informational purposes only and should not replace professional medical advice. Always consult healthcare professionals for medical guidance.

## 📧 Support

For issues and questions, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ by the SmartMedGuide Team**