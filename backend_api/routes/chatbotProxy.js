// backend_api/routes/chatbotProxy.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

// 1. Receive request from Mobile App (POST /api/chatbot/ask)
router.post('/ask', async (req, res) => {
  try {
    // 2. Forward the question to the Python AI Engine (Port 5001)
    // The Python route is defined in app.py as '/api/training/chatbot' + '/ask' from the controller
    const pythonResponse = await axios.post('http://127.0.0.1:5001/api/training/chatbot/ask', req.body);
    
    // 3. Send the AI's answer back to the Mobile App
    res.status(200).json(pythonResponse.data);
  } catch (error) {
    console.error('AI Service Error:', error.message);
    res.status(503).json({ 
      success: false, 
      answer: "My brain is currently offline. Please ensure the Python server is running!" 
    });
  }
});

module.exports = router;