import UserRepository from '../repositories/UserRepository.js';
import AppError from '../utils/AppError.js';
import jwt from 'jsonwebtoken';

class AuthService {
  generateAccessToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_for_development_only', {
      expiresIn: '15m' // Short-lived access token
    });
  }

  generateRefreshToken(id) {
    return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret', {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d' 
    });
  }

  async generateAuthData(user) {
    const accessToken = this.generateAccessToken(user._id);
    const refreshToken = this.generateRefreshToken(user._id);

    // Save refresh token in DB
    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push(refreshToken);
    await user.save({ validateBeforeSave: false });

    // Remove sensitive data before returning
    user.password = undefined;
    user.refreshTokens = undefined;

    return { user, accessToken, refreshToken };
  }

  async register(userData) {
    const existingUser = await UserRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new AppError('Email already in use', 400);
    }

    const newUser = await UserRepository.createUser(userData);
    return await this.generateAuthData(newUser);
  }

  async login(email, password) {
    if (!email || !password) {
      throw new AppError('Please provide email and password', 400);
    }

    const user = await UserRepository.findByEmail(email);
    if (!user || !(await user.correctPassword(password, user.password))) {
      throw new AppError('Incorrect email or password', 401);
    }

    return await this.generateAuthData(user);
  }

  async refreshAccessToken(token) {
    if (!token) throw new AppError('No refresh token provided', 401);

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret');
    
    // Check if user exists and has this refresh token
    const user = await UserRepository.findById(decoded.id);
    if (!user || !user.refreshTokens.includes(token)) {
      throw new AppError('Invalid refresh token', 401);
    }

    // Generate fresh tokens using the single source of truth route 
    // Usually a refresh regenerates a refresh token as well for rotation, but we can just generate a new access token
    // For simplicity, we just generate an access token, or use generateAuthData to rotate. Let's rely on standard rotation.
    
    const accessToken = this.generateAccessToken(user._id);
    // Remove sensitive data
    user.password = undefined;
    user.refreshTokens = undefined;

    return { user, accessToken };
  }

  async logout(user, refreshToken) {
    if (user && refreshToken) {
      user.refreshTokens = user.refreshTokens.filter(rt => rt !== refreshToken);
      await user.save({ validateBeforeSave: false });
    }
  }
}

export default new AuthService();
