const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const { createProxyMiddleware } = require('http-proxy-middleware');

dotenv.config(); 
const connectDB = require('./config/db'); 

const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notification');
const scanRoutes = require('./routes/scanRoutes');

const app = express();

const PYTHON_API_URL = process.env.PYTHON_API_URL;

connectDB().then(async () => {
  try {
    await mongoose.connection.collection('chats').dropIndex('chatId_1');
  } catch (err) {
    console.log("ℹ️ Index info:", err.message);
  }
});

app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/api/measure', createProxyMiddleware({ 
    target: PYTHON_API_URL, 
    changeOrigin: true,
    pathRewrite: function (path, req) {
        return '/api/measure'; 
    }
}));

app.use('/api/chatbot', createProxyMiddleware({ 
    target: PYTHON_API_URL, 
    changeOrigin: true,
    pathRewrite: function (path, req) {
        return req.originalUrl.replace('/api/chatbot', '/api/training/chatbot'); 
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`🚀 [PROXY] Forwarding to: ${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`);
    }
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/scans', scanRoutes);

app.get('/api/training/vision', (req, res) => {
    res.status(200).json([]);
});

app.get('/', (req, res) => {
  res.send('CRAYAI Node Backend is Running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});