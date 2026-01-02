import { Request, Response } from 'express';
import jwt, { SignOptions, Secret, TokenExpiredError } from 'jsonwebtoken';
import { User, UserRole } from '../models/User';
import { LoginHistory } from '../models/LoginHistory';
import { extractDeviceInfo } from '../utils/deviceInfo';
import { sendVerificationEmail, sendPasswordResetEmail, sendPasswordChangeNotification } from '../services/emailService';
import { AuthRequest } from '../middleware/auth';
import crypto from 'crypto';

// Helper function to create tokens
const createTokens = (userId: string, role: UserRole): { token: string; refreshToken: string; expiresIn: number } => {
  const jwtSecret: Secret = process.env.JWT_SECRET || 'your_jwt_secret_key';
  const refreshSecret: Secret = process.env.JWT_REFRESH_SECRET || 'your_refresh_secret_key';

  // 24 hours in seconds
  const tokenExpiry = 24 * 60 * 60;
  
  // 7 days in seconds for refresh token
  const refreshExpiry = 7 * 24 * 60 * 60;

  const token = jwt.sign(
    { userId, role },
    jwtSecret,
    { expiresIn: tokenExpiry }
  );

  const refreshToken = jwt.sign(
    { userId, role },
    refreshSecret,
    { expiresIn: refreshExpiry }
  );

  return { 
    token, 
    refreshToken,
    expiresIn: Date.now() + (tokenExpiry * 1000) // Convert to milliseconds
  };
};

// Helper function to log user login
const logUserLogin = async (userId: string, req: Request): Promise<void> => {
  const { deviceInfo, userAgent, ipAddress } = extractDeviceInfo(req);
  
  await LoginHistory.create({
    userId,
    deviceInfo,
    userAgent,
    ipAddress,
    timestamp: new Date()
  });
};

// Register new user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, fullName, whatsappNumber, role = UserRole.STUDENT } = req.body;

    // Validate required fields
    if (!email || !password || !fullName || !whatsappNumber) {
      res.status(400).json({ 
        message: 'All fields are required: email, password, fullName, whatsappNumber' 
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ message: 'Email already registered' });
      return;
    }

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password,
      fullName,
      whatsappNumber,
      role
    });

    // Generate verification token
    const verificationToken = user.createEmailVerificationToken();
    await user.save();

    // Send verification email (non-blocking - don't fail registration if email fails)
    sendVerificationEmail(user.email, user.fullName, verificationToken)
      .then(() => {
        console.log('Verification email sent successfully to:', user.email);
      })
      .catch((emailError) => {
        console.error('Failed to send verification email (user still registered):', emailError);
        // User is already saved, so we don't throw the error
      });

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.'
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({ 
        message: 'Validation error', 
        errors: messages 
      });
      return;
    }
    
    // Handle duplicate key error (email already exists)
    if (error.code === 11000) {
      res.status(400).json({ 
        message: 'Email already registered' 
      });
      return;
    }
    
    // Handle other errors
    const errorMessage = error.message || 'Error registering user';
    res.status(500).json({ 
      message: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { details: error.toString() })
    });
  }
};

// Verify email
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      res.status(400).json({ message: 'Invalid or expired verification token' });
      return;
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying email', error });
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user and check password
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Check if email is verified
    if (!user.emailVerified) {
      res.status(403).json({ message: 'Please verify your email before logging in' });
      return;
    }

    // Create new tokens
    const { token, refreshToken, expiresIn } = createTokens(user._id, user.role);
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    // Log login activity
    await logUserLogin(user._id, req);

    res.status(200).json({
      token,
      refreshToken,
      expiresIn,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isApproved: user.isApproved,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
};

// Request password reset
export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findOne({ email: req.body.email.toLowerCase() });
    if (!user) {
      // Return success even if user doesn't exist (security)
      res.status(200).json({ message: 'If your email is registered, you will receive a password reset link' });
      return;
    }

    const resetToken = user.createPasswordResetToken();
    await user.save();

    await sendPasswordResetEmail(user.email, user.fullName, resetToken);

    res.status(200).json({ message: 'If your email is registered, you will receive a password reset link' });
  } catch (error) {
    res.status(500).json({ message: 'Error requesting password reset', error });
  }
};

// Reset password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      res.status(400).json({ message: 'Invalid or expired reset token' });
      return;
    }

    // Note: Password validation and confirmation is handled on the frontend
    // The frontend only sends the validated password field

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshToken = undefined; // Invalidate any existing sessions
    await user.save();

    // Notify user about password change
    await sendPasswordChangeNotification(user.email, user.fullName);

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password', error });
  }
};

// Refresh token
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: oldRefreshToken } = req.body;
    if (!oldRefreshToken) {
      res.status(401).json({ message: 'Refresh token required' });
      return;
    }

    const user = await User.findOne({ refreshToken: oldRefreshToken });
    if (!user) {
      res.status(401).json({ message: 'Invalid refresh token' });
      return;
    }

    // Verify refresh token
    jwt.verify(oldRefreshToken, process.env.JWT_REFRESH_SECRET || 'your_refresh_secret_key');

    // Create new tokens
    const { token, refreshToken, expiresIn } = createTokens(user._id, user.role);
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({ token, refreshToken, expiresIn });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Refresh token expired' });
    } else {
      res.status(401).json({ message: 'Invalid refresh token' });
    }
  }
};

// Get current user
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    const user = await User.findById(authReq.user?._id)
      .select('-password -refreshToken');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return Promise.resolve();
    }

    res.status(200).json(user);
    return Promise.resolve();
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error });
    return Promise.resolve();
  }
};

// Logout
export const logout = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthRequest;
  try {
    if (authReq.user?._id) {
      await User.findByIdAndUpdate(authReq.user._id, { $unset: { refreshToken: 1 } });
    }
    res.status(200).json({ message: 'Logged out successfully' });
    return Promise.resolve();
  } catch (error) {
    res.status(500).json({ message: 'Error logging out', error });
    return Promise.resolve();
  }
};
