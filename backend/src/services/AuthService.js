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

    // Enforce rigorous max-session limit
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }

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

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret');
    } catch (err) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    // Verify token exists in DB — this allows revocation on logout
    const user = await UserRepository.findById(decoded.id);
    if (!user || !user.refreshTokens || !user.refreshTokens.includes(token)) {
      throw new AppError('Refresh token has been revoked. Please log in again.', 401);
    }

    // Issue a fresh short-lived access token only.
    // We do NOT rotate the refresh token here — doing so causes race conditions
    // when the user reloads rapidly (both requests arrive with the same cookie
    // before the browser receives the new Set-Cookie from the first response).
    const accessToken = this.generateAccessToken(user._id);

    // Strip sensitive fields before returning
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
