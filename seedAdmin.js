const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

// Import the User model
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    // Check for required .env variables
    if (!process.env.MONGO_URI) {
      console.error('Error: MONGO_URI is not defined in .env');
      process.exit(1);
    }
    
    // Connect to database
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    // Define admin credentials from .env, or use defaults
    const adminName = process.env.ADMIN_NAME || 'Super Admin';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@admin.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // Check if an admin already exists based on email
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log(`Admin user with email "${adminEmail}" already exists. No action taken.`);
      process.exit(0);
    }

    // Check if any admin exists at all
    const anyAdmin = await User.findOne({ role: 'admin' });
    if (anyAdmin) {
      console.log(`An admin user already exists (${anyAdmin.email}). No new admin was seeded.`);
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Create the admin user
    const admin = new User({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
    });

    await admin.save();
    console.log(`\nAdmin user seeded successfully!`);
    console.log(`Name:     ${adminName}`);
    console.log(`Email:    ${adminEmail}`);
    console.log(`Password: ${process.env.ADMIN_PASSWORD ? '******** (From .env)' : 'admin123 (Default)'}`);
    console.log(`Role:     admin\n`);

  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  } finally {
    // Disconnect from database
    await mongoose.disconnect();
    console.log('Database connection closed.');
    process.exit(0);
  }
};

seedAdmin();
