const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const connectDB = require('../config/db');

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany();
    await Product.deleteMany();

    // Demo Users across both campuses
    const user1 = await User.create({
      name: 'Rohan Sharma',
      email: 'rohan.sharma@nitp.ac.in',
      password: 'password123',
      campus: 'Patna Campus',
      hostel: 'Brahmaputra Hostel',
      hostelName: 'Brahmaputra Hostel',
      roomNumber: '314',
      phoneNumber: '+91 9876543210',
    });

    const user2 = await User.create({
      name: 'Ananya Verma',
      email: 'ananya@nitp.ac.in',
      password: 'password123',
      campus: 'Patna Campus',
      hostel: 'Ganga Girls Hostel',
      hostelName: 'Ganga Girls Hostel',
      roomNumber: '108',
      phoneNumber: '+91 9811223344',
    });

    const user3 = await User.create({
      name: 'Aditya Raj',
      email: 'aditya.raj@nitp.ac.in',
      password: 'password123',
      campus: 'Bihta Campus',
      hostel: 'Aryabhatta Hostel',
      hostelName: 'Aryabhatta Hostel',
      roomNumber: '205',
      phoneNumber: '+91 9771122334',
    });

    const user4 = await User.create({
      name: 'Priya Singh',
      email: 'priya@nitp.ac.in',
      password: 'password123',
      campus: 'Bihta Campus',
      hostel: 'Sarojini Girls Hostel',
      hostelName: 'Sarojini Girls Hostel',
      roomNumber: '412',
      phoneNumber: '+91 9662233445',
    });

    // Sample Products distributed across both Patna and Bihta Campuses
    const products = [
      {
        title: 'Casio fx-991EX ClassWiz Scientific Calculator',
        description: 'Advanced non-programmable engineering calculator. Solves matrices, equations, vectors. Ideal for semester exams.',
        price: 750,
        category: 'Stationery & Accessories',
        condition: 'Like New',
        campus: 'Patna Campus',
        hostel: 'Brahmaputra Hostel',
        hostelName: 'Brahmaputra Hostel',
        roomNumber: '314',
        contactNumber: '+91 9876543210',
        pickupLocation: 'Patna Campus • Brahmaputra Hostel - Rm 314',
        images: ['https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80'],
        seller: user1._id,
      },
      {
        title: 'Bajaj 1.5L Electric Kettle (Stainless Steel)',
        description: 'Used for 1 semester during winter exams. Perfect condition, clean heating element. Quick boil in 2 mins.',
        price: 550,
        category: 'Hostel Appliances',
        condition: 'Like New',
        campus: 'Patna Campus',
        hostel: 'Brahmaputra Hostel',
        hostelName: 'Brahmaputra Hostel',
        roomNumber: '314',
        contactNumber: '+91 9876543210',
        pickupLocation: 'Patna Campus • Brahmaputra Common Room / Gate',
        images: ['https://images.unsplash.com/photo-1576402187878-974f70c890a5?auto=format&fit=crop&w=800&q=80'],
        seller: user1._id,
      },
      {
        title: 'Milton 1000ml Thermosteel Insulated Water Bottle',
        description: 'Keeps water chilled for 24 hours in summer. Leakproof cap, clean interior.',
        price: 320,
        category: 'Bottles & Sippers',
        condition: 'Gently Used',
        campus: 'Patna Campus',
        hostel: 'Ganga Girls Hostel',
        hostelName: 'Ganga Girls Hostel',
        roomNumber: '108',
        contactNumber: '+91 9811223344',
        pickupLocation: 'Patna Campus • Ganga Girls Hostel Reception',
        images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80'],
        seller: user2._id,
      },
      {
        title: 'Hero Sprint 21-Speed Mountain Bicycle',
        description: 'Well-maintained cycle with mudguards, bell, and heavy-duty lock. Great for commuting between hostels and departments.',
        price: 3200,
        category: 'Cycles & Mobility',
        condition: 'Gently Used',
        campus: 'Bihta Campus',
        hostel: 'Aryabhatta Hostel',
        hostelName: 'Aryabhatta Hostel',
        roomNumber: '205',
        contactNumber: '+91 9771122334',
        pickupLocation: 'Bihta Campus • Aryabhatta Cycle Stand',
        images: ['https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80'],
        seller: user3._id,
      },
      {
        title: 'Data Structures & Algorithms Handwritten Revision Notes (C++)',
        description: 'Comprehensive handwritten semester exam revision notes with solved LeetCode patterns & diagrams.',
        price: 180,
        category: 'Notes',
        condition: 'Gently Used',
        campus: 'Bihta Campus',
        hostel: 'Sarojini Girls Hostel',
        hostelName: 'Sarojini Girls Hostel',
        roomNumber: '412',
        contactNumber: '+91 9662233445',
        pickupLocation: 'Bihta Campus • Sarojini Hostel Gate or Academic Block',
        images: ['https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80'],
        seller: user4._id,
      },
      {
        title: 'Higher Engineering Mathematics - B.S. Grewal (44th Ed)',
        description: 'Standard NITP textbook for 1st & 2nd year. Well-preserved with all pages intact.',
        price: 380,
        category: 'Books',
        condition: 'Gently Used',
        campus: 'Patna Campus',
        hostel: 'Kosi Hostel',
        hostelName: 'Kosi Hostel',
        roomNumber: '112',
        contactNumber: '+91 9876543210',
        pickupLocation: 'Patna Campus • Kosi Hostel Entrance',
        images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'],
        seller: user1._id,
      },
    ];

    await Product.insertMany(products);

    console.log('Seed data successfully loaded with Patna & Bihta campus mappings!');
    process.exit();
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
