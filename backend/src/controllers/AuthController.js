import catchAsync from '../utils/catchAsync.js';
import AuthService from '../services/AuthService.js';
import AppError from '../utils/AppError.js';

const COOKIE_NAME = 'refreshToken';

const cookieOptions = () => ({
  maxAge:
    (process.env.JWT_COOKIE_EXPIRES_IN || 7) * 24 * 60 * 60 * 1000,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/' // 🔥 FIX: allow cookie on ALL routes
});

const sendTokenResponse = (authData, statusCode, res) => {
  if (authData.refreshToken) {
    res.cookie(COOKIE_NAME, authData.refreshToken, cookieOptions());
  }

  res.status(statusCode).json({
    status: 'success',
    accessToken: authData.accessToken,
    data: { user: authData.user }
  });
};

class AuthController {
  register = catchAsync(async (req, res, next) => {
    const authData = await AuthService.register(req.body);
    sendTokenResponse(authData, 201, res);
  });

  login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    const authData = await AuthService.login(email, password);
    sendTokenResponse(authData, 200, res);
  });

  refresh = catchAsync(async (req, res, next) => {
    const refreshToken = req.cookies[COOKIE_NAME];

    if (!refreshToken) {
      return next(new AppError('No refresh token provided', 401));
    }

    try {
      const authData = await AuthService.refreshAccessToken(refreshToken);
      sendTokenResponse(authData, 200, res);
    } catch (err) {
      res.clearCookie(COOKIE_NAME, cookieOptions());
      return next(err);
    }
  });

  logout = catchAsync(async (req, res, next) => {
    const refreshToken = req.cookies[COOKIE_NAME];

    await AuthService.logout(refreshToken);

    res.clearCookie(COOKIE_NAME, cookieOptions());

    res.status(200).json({ status: 'success' });
  });

  getMe = (req, res) => {
    res.status(200).json({
      status: 'success',
      data: { user: req.user }
    });
  };
}

export default new AuthController();