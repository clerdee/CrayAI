const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
dotenv.config(); 

const connectDB = require('./config/db'); 
const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://127.0.0.1:5001';

// Route Imports
const { createProxyMiddleware } = require('http-proxy-middleware');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notification');
const chatbotProxy = require('./routes/chatbotProxy');
const scanRoutes = require('./routes/scanRoutes');

const app = express();

connectDB().then(async () => {
  try {
    await mongoose.connection.collection('chats').dropIndex('chatId_1');
  } catch (err) {
    console.log("ℹ️ Index info:", err.message);
  }
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cors());

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/chatbot', chatbotProxy);
app.use('/api/scans', scanRoutes);

app.use('/api/measure', createProxyMiddleware({ 
    target: PYTHON_API_URL, 
    changeOrigin: true,
    pathRewrite: function (path, req) {
        return '/api/measure'; 
    }
}));

app.get('/api/training/vision', (req, res) => {
    // Later, we will fetch actual images from MongoDB here.
    // For now, return an empty array so the frontend table says "No images found" instead of crashing!
    res.status(200).json([]);
});

app.get('/', (req, res) => {
  res.send('CRAYAI Backend is Running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT,"0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});