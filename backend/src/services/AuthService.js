import UserRepository from '../repositories/UserRepository.js';
import AppError from '../utils/AppError.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const BCRYPT_COST = 10;
const MAX_SESSIONS = 5;

class AuthService {
  generateAccessToken(id) {
    return jwt.sign(
      { id },
      process.env.JWT_SECRET || 'fallback_secret_for_development_only',
      { expiresIn: '15m' }
    );
  }

  generateRefreshToken(id) {
    const jti = crypto.randomUUID(); // unique token id

    return jwt.sign(
      { id, jti },
      process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  async generateAuthData(user) {
    const accessToken = this.generateAccessToken(user._id);
    const refreshToken = this.generateRefreshToken(user._id);

    const hashedRefreshToken = await bcrypt.hash(refreshToken, BCRYPT_COST);

    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push(hashedRefreshToken);

    // enforce session cap
    if (user.refreshTokens.length > MAX_SESSIONS) {
      user.refreshTokens = user.refreshTokens.slice(-MAX_SESSIONS);
    }

    await user.save({ validateBeforeSave: false });

    user.password = undefined;
    user.refreshTokens = undefined;

    return { user, accessToken, refreshToken };
  }

  async register(userData) {
    const existingUser = await UserRepository.findByEmail(userData.email);
    if (existingUser) throw new AppError('Email already in use', 400);

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
    // 1. Verify token
    let decoded;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret'
      );
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    // 2. Load user
    const user = await UserRepository.findById(decoded.id);
    if (!user || !user.refreshTokens || user.refreshTokens.length === 0) {
      throw new AppError('Session not found. Please log in again.', 403);
    }

    // 3. Find matching hash (optimized loop)
    let matchIndex = -1;

    for (let i = 0; i < user.refreshTokens.length; i++) {
      if (await bcrypt.compare(token, user.refreshTokens[i])) {
        matchIndex = i;
        break;
      }
    }

    // 🚨 Reuse detection (basic)
    if (matchIndex === -1) {
      user.refreshTokens = [];
      await user.save({ validateBeforeSave: false });

      throw new AppError(
        'Session compromised. Please log in again.',
        403
      );
    }

    // 4. Remove used token
    user.refreshTokens = user.refreshTokens.filter((_, i) => i !== matchIndex);

    // 🔥 CRITICAL: save BEFORE issuing new token (race condition fix)
    await user.save({ validateBeforeSave: false });

    // 5. Generate new tokens
    const newRefreshToken = this.generateRefreshToken(user._id);
    const hashedNew = await bcrypt.hash(newRefreshToken, BCRYPT_COST);

    user.refreshTokens.push(hashedNew);

    // enforce session cap again
    if (user.refreshTokens.length > MAX_SESSIONS) {
      user.refreshTokens = user.refreshTokens.slice(-MAX_SESSIONS);
    }

    const accessToken = this.generateAccessToken(user._id);

    await user.save({ validateBeforeSave: false });

    user.password = undefined;
    user.refreshTokens = undefined;

    return {
      user,
      accessToken,
      refreshToken: newRefreshToken
    };
  }

  async logout(refreshToken) {
    if (!refreshToken) return;

    let decoded;
    try {
      decoded = jwt.decode(refreshToken);
    } catch {
      return;
    }

    if (!decoded?.id) return;

    const user = await UserRepository.findById(decoded.id);
    if (!user || !user.refreshTokens || user.refreshTokens.length === 0) return;

    let matchResults = [];

    for (let i = 0; i < user.refreshTokens.length; i++) {
      matchResults[i] = await bcrypt.compare(
        refreshToken,
        user.refreshTokens[i]
      );
    }

    user.refreshTokens = user.refreshTokens.filter((_, i) => !matchResults[i]);

    await user.save({ validateBeforeSave: false });
  }
}

export default new AuthService();