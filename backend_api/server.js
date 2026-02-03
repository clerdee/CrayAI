const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const app = express();
const connectDB = require('./config/db');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notification');

// 1. Load Environment Variables
dotenv.config();

// 2. Connect to Database
connectDB();

// 3. Middleware (Allows app to send JSON data)
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notification', notificationRoutes);

// 4. Test Route (To check if server is alive)
app.get('/', (req, res) => {
  res.send('CRAYAI Backend is Running!');
});

// 5. Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});