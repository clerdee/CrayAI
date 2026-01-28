const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const transport = require('../config/mailtrap'); 
const { createNotification } = require('../utils/notificationHelper');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 1. REGISTER USER & SEND OTP
exports.registerUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password (Security!)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // Expires in 10 mins

    // Create the user in MongoDB
    user = new User({
      email,
      password: hashedPassword,
      otpCode: otp,
      otpExpires: otpExpiry
    });

    await user.save();

    // Send Email using Mailtrap
    await transport.sendMail({
      from: '"CrayAI Team" <no-reply@crayai.com>',
      to: email,
      subject: 'Your CrayAI Verification Code',
      text: `Welcome! Your verification code is: ${otp}`,
      html: `<b>Welcome!</b><br>Your verification code is: <h2>${otp}</h2>`
    });

    res.status(201).json({ message: 'OTP sent to email. Please verify.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// 2. VERIFY OTP & COMPLETE PROFILE
exports.verifyOTP = async (req, res) => {
  const { email, otp, profileData } = req.body; // <--- Now accepting profileData

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.otpCode !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Success! Update User Status
    user.isVerified = true;
    user.accountStatus = 'Active';
    user.otpCode = null;
    user.otpExpires = null;

    // Save the extra profile data if provided
    if (profileData) {
      user.firstName = profileData.firstName;
      user.lastName = profileData.lastName;
      user.phone = profileData.phone;
      user.street = profileData.street;
      user.city = profileData.city;
      user.country = profileData.country;
      user.profilePic = profileData.profilePic;
      user.bio = profileData.bio || '';
    }

    await user.save();

    // Generate JWT Token for Auto-Login
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({ 
      message: 'Account verified and profile saved!',
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profilePic: user.profilePic,
        phone: user.phone,
        street: user.street,
        city: user.city,
        country: user.country,
        bio: user.bio
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// 3. RESEND OTP
exports.resendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Account is already verified. Please Login.' });
    }

    // Generate NEW OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 Minutes

    // Update Database
    user.otpCode = otp;
    user.otpExpires = otpExpiry;
    await user.save();

    // Send Email Again
    await transport.sendMail({
      from: '"CrayAI Team" <no-reply@crayai.com>',
      to: email,
      subject: 'New Verification Code',
      text: `Your new code is: ${otp}`,
      html: `<b>New Code Requested:</b><br>Your verification code is: <h2>${otp}</h2>`
    });

    res.json({ message: 'New OTP sent to your email.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};
// 4. LOGIN USER
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // 2. Check Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // 3. Check Verified Status
    if (!user.isVerified) {
      return res.status(400).json({ message: 'Please verify your email first.' });
    }

    // 4. Generate JWT Token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 5. Success
    res.status(200).json({
      message: 'Login successful',
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profilePic: user.profilePic,
        phone: user.phone,
        street: user.street,
        city: user.city,
        country: user.country
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// 5. GET CURRENT USER PROFILE (Protected Route)
exports.getMe = async (req, res) => {
  try {
    // JWT middleware should attach userId to req.user
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized. No token provided.' });
    }

    const user = await User.findById(userId).select('-password -otpCode -otpExpires');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone,
        street: user.street,
        city: user.city,
        country: user.country,
        profilePic: user.profilePic,
        bio: user.bio,
        role: user.role,
        accountStatus: user.accountStatus,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// 6. JWT MIDDLEWARE (Helper function)
exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// 7. UPDATE USER PROFILE
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { firstName, lastName, phone, street, city, country, profilePic, bio } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        firstName,
        lastName,
        phone,
        street,
        city,
        country,
        profilePic,
        bio
      },
      { new: true }
    ).select('-password -otpCode -otpExpires');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        street: user.street,
        city: user.city,
        country: user.country,
        profilePic: user.profilePic,
        bio: user.bio
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// 8. CHANGE PASSWORD
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// 9. UPDATE EMAIL
exports.updateEmail = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { newEmail, password } = req.body;

    if (!newEmail || !password) {
      return res.status(400).json({ message: 'New email and password are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Password is incorrect' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser && existingUser._id.toString() !== userId) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Update email
    user.email = newEmail;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email updated successfully. Please verify your new email.'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// 10. GET PUBLIC PROFILE (Fixed)
exports.getUserPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.userId; // From JWT

    const user = await User.findById(id)
      .select('firstName lastName profilePic bio role city country following followers');

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if I am already following this person
    const isFollowing = user.followers.includes(currentUserId);

    res.status(200).json({ 
      success: true, 
      user: {
        _id: user._id,
        id: user._id,
        fullName: `${user.firstName} ${user.lastName}`,
        profilePic: user.profilePic,
        bio: user.bio,
        role: user.role,
        city: user.city,
        following: user.following || [],
        followers: user.followers || []
      },
      isFollowing // <--- Sending this boolean is crucial for the UI
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// 11. FOLLOW / UNFOLLOW TOGGLE (New)
exports.followUser = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { id: targetUserId } = req.params;

    if (currentUserId === targetUserId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already following
    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // --- UNFOLLOW LOGIC ---
      currentUser.following = currentUser.following.filter(id => id.toString() !== targetUserId);
      targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUserId);
      
      await currentUser.save();
      await targetUser.save();

      return res.json({ 
        success: true, 
        message: 'Unfollowed', 
        isFollowing: false,
        following: currentUser.following 
      });

    } else {
      // --- FOLLOW LOGIC ---
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);

      await currentUser.save();
      await targetUser.save();

      // Trigger Notification
      await createNotification({
        recipient: targetUserId,
        sender: currentUserId,
        type: 'follow',
        text: 'started following you.'
      });

      return res.json({ 
        success: true, 
        message: 'Followed', 
        isFollowing: true,
        following: currentUser.following 
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};