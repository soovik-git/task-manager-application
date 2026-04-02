import UserRepository from '../repositories/UserRepository.js';
import AppError from '../utils/AppError.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// WHY HASH REFRESH TOKENS?
// If the database is ever breached, storing raw refresh tokens is as dangerous as
// storing plaintext passwords — an attacker could immediately impersonate any user.
// Hashing with bcrypt makes DB contents useless without the original cookie value.
const BCRYPT_COST = 10;

// WHY LIMIT SESSIONS?
// Unbounded refreshTokens arrays grow indefinitely (one entry per login).
// At scale this bloats every user document and slows all DB reads on the user record.
// Capping at 5 covers realistic device usage (phone, laptop, tablet, work PC, spare)
// while preventing memory bloat. We keep the NEWEST 5 by always pushing then slicing tail.
const MAX_SESSIONS = 5;

class AuthService {
  generateAccessToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_for_development_only', {
      expiresIn: '15m'
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

    // Hash the raw refresh token before persisting.
    // Raw token travels to the browser via HttpOnly cookie only — never touches the DB.
    const hashedRefreshToken = await bcrypt.hash(refreshToken, BCRYPT_COST);

    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push(hashedRefreshToken);

    // Keep only the most recent MAX_SESSIONS hashes.
    // We push to the end so slice(-N) always returns the newest N entries.
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
    if (!email || !password) throw new AppError('Please provide email and password', 400);

    const user = await UserRepository.findByEmail(email);
    if (!user || !(await user.correctPassword(password, user.password))) {
      throw new AppError('Incorrect email or password', 401);
    }

    return await this.generateAuthData(user);
  }

  async refreshAccessToken(token) {
    // Step 1: Verify JWT signature & expiry — fast cryptographic check, no DB call yet
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret');
    } catch (err) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    // Step 2: Load user and their stored hashes
    const user = await UserRepository.findById(decoded.id);
    if (!user || !user.refreshTokens || user.refreshTokens.length === 0) {
      throw new AppError('Session not found. Please log in again.', 403);
    }

    // Step 3: Find which stored hash matches the incoming raw token.
    // WHY bcrypt.compare() IN A LOOP?
    // We cannot reverse a bcrypt hash, so we must test the incoming token
    // against each stored hash until a match is found. With MAX_SESSIONS = 5
    // this is at most 5 comparisons — negligible overhead.
    const matchResults = await Promise.all(
      user.refreshTokens.map(hash => bcrypt.compare(token, hash))
    );
    const matchIndex = matchResults.findIndex(Boolean);

    if (matchIndex === -1) {
      // Token not present in DB — it was already used or explicitly revoked.
      // WHY 403 (not 401)?
      // 401 means "not authenticated, try again". 403 means "we know who you are
      // but this specific action is forbidden" — more accurate for a revoked token.
      throw new AppError('Refresh token already used or revoked. Please log in again.', 403);
    }

    // Step 4: Remove the used hash BEFORE issuing a new one.
    // WHY REMOVE FIRST?
    // This prevents replay attacks: if we issued a new token first and THEN tried
    // to remove the old one, a network failure between those steps would leave the
    // old token valid. Removing first is the safe, atomic-style approach — even if
    // the save fails, no new token has been issued yet.
    user.refreshTokens = user.refreshTokens.filter((_, i) => i !== matchIndex);

    // Step 5: Rotate — generate a new refresh token and hash it for storage
    const newRefreshToken = this.generateRefreshToken(user._id);
    const hashedNew = await bcrypt.hash(newRefreshToken, BCRYPT_COST);
    user.refreshTokens.push(hashedNew);

    // Enforce session cap after rotation
    if (user.refreshTokens.length > MAX_SESSIONS) {
      user.refreshTokens = user.refreshTokens.slice(-MAX_SESSIONS);
    }

    const accessToken = this.generateAccessToken(user._id);
    await user.save({ validateBeforeSave: false });

    user.password = undefined;
    user.refreshTokens = undefined;

    // Return new refresh token so the controller can push the rotated cookie
    return { user, accessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshToken) {
    // WHY LOGOUT MUST BE TOKEN-BASED, NOT USER-BASED?
    // If the access token is already expired, req.user cannot be populated by
    // authMiddleware, making the logout endpoint unreachable. Identifying the
    // user through the refresh token cookie makes logout always work — even
    // after the access token has expired or been cleared from memory.
    if (!refreshToken) return;

    // Decode without verifying — we only need the user ID, not proof of validity.
    // The token may be expired but we still want to clean up the DB record.
    let decoded;
    try {
      decoded = jwt.decode(refreshToken);
    } catch {
      return;
    }
    if (!decoded?.id) return;

    const user = await UserRepository.findById(decoded.id);
    if (!user || !user.refreshTokens || user.refreshTokens.length === 0) return;

    // Compare incoming token against each stored hash to find the one to remove
    const matchResults = await Promise.all(
      user.refreshTokens.map(hash => bcrypt.compare(refreshToken, hash))
    );
    user.refreshTokens = user.refreshTokens.filter((_, i) => !matchResults[i]);
    await user.save({ validateBeforeSave: false });
  }
}

export default new AuthService();
