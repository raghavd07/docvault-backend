const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

// Import models to register schemas
require('./models/User');
require('./models/Department');
require('./models/Course');
require('./models/File');
require('./models/Submission');
require('./models/ActivityLog');
require('./models/Notification');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/departments', require('./routes/departmentRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/files', require('./routes/fileRoutes'));
app.use('/api/share', require('./routes/shareRoutes'));
app.use('/api/submissions', require('./routes/submissionRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
// Test route
app.get('/', (req, res) => {
  res.json({ message: 'File Sharing System API is running!' });
});

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log('MongoDB connection error:', err);
  });