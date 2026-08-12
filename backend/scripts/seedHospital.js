// scripts/seedHospital.js
require('dotenv').config();
const mongoose = require('mongoose');
const Hospital = require('../src/models/hospital');
const User = require('../src/models/user');
const bcrypt = require('bcrypt');

async function seed() {
  await mongoose.connect(process.env.DB_PATH);
  console.log('Connected...');

  // Create hospital user
  const hashedPw = await bcrypt.hash('hospital123', 10);
  const hospitalUser = await User.findOneAndUpdate(
    { email: 'apollo@hospital.com' },
    { 
      name: 'Apollo Admin', 
      email: 'apollo@hospital.com', 
      password: hashedPw, 
      role: 'hospital' 
    },
    { upsert: true, new: true }
  );

  // Create hospital profile
  await Hospital.findOneAndUpdate(
    { user: hospitalUser._id },
    {
      user: hospitalUser._id,
      name: 'Apollo Hospitals',
      phone: '+91 80 2660 4050',
      address: '154/11 Bannerghatta Road, Bengaluru',
      emergencySupport: true,
      location: { 
        latitude: 12.9716, 
        longitude: 77.5946 
      },
      resources: {
        totalBeds: 200,
        availableBeds: 48,
        icuBeds: 20,
        icuAvailable: 4,
        ventilators: 10,
      }
    },
    { upsert: true, new: true }
  );

  // Second hospital
  const hashedPw2 = await bcrypt.hash('hospital123', 10);
  const hospitalUser2 = await User.findOneAndUpdate(
    { email: 'manipal@hospital.com' },
    { 
      name: 'Manipal Admin', 
      email: 'manipal@hospital.com', 
      password: hashedPw2, 
      role: 'hospital' 
    },
    { upsert: true, new: true }
  );

  await Hospital.findOneAndUpdate(
    { user: hospitalUser2._id },
    {
      user: hospitalUser2._id,
      name: 'Manipal Hospital',
      phone: '+91 80 2502 4444',
      address: '98 HAL Airport Road, Bengaluru',
      emergencySupport: true,
      location: { 
        latitude: 12.9592, 
        longitude: 77.6408 
      },
      resources: {
        totalBeds: 150,
        availableBeds: 12,
        icuBeds: 15,
        icuAvailable: 2,
        ventilators: 6,
      }
    },
    { upsert: true, new: true }
  );

  console.log('2 hospitals seeded successfully!');
  process.exit();
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});