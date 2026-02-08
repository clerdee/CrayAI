const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config(); 

const connectDB = require('./config/db'); 

// Route Imports
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notification');
const chatbotProxy = require('./routes/chatbotProxy');

const app = express();

connectDB();

app.use(express.json());
app.use(cors());

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/chatbot', chatbotProxy);

app.get('/', (req, res) => {
  res.send('CRAYAI Backend is Running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});