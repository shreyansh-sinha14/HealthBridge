const User = require('../../models/user');
const Patient = require('../../models/patient');
const Doctor = require('../../models/doctor');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// User Registration
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });
    await newUser.save();

    // ✅ Automatically create profile based on role
    let profile = null;
    if (role === 'patient') {
      profile = await Patient.create({ user: newUser._id });
    } else if (role === 'doctor') {
      profile = await Doctor.create({ 
    user: newUser._id,
    specialization: 'General',  // default value
    hospital: 'Not specified',  // default value
  });
    }

    // Create JWT
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '5d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      profile: profile || null,
    });

  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// User Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Create JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '5d' }
    );

    res.status(200).json({ 
    message: 'Login successful', 
    token,
    user: { name: user.name, role: user.role }
});

  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};