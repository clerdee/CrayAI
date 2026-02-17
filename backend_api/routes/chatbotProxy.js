const express = require('express');
const router = express.Router();
const axios = require('axios');

router.post('/ask', async (req, res) => {
  try {
    const pythonResponse = await axios.post('http://127.0.0.1:5001/api/training/chatbot/ask', req.body);
    
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