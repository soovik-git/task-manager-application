import catchAsync from '../utils/catchAsync.js';
import AuthService from '../services/AuthService.js';
import AppError from '../utils/AppError.js';

// WHY "refreshToken" NOT "jwt"?
// "jwt" is ambiguous — the access token is also a JWT. Naming the cookie "refreshToken"
// makes the codebase self-documenting and prevents accidental reads of the wrong cookie.
const COOKIE_NAME = 'refreshToken';

const cookieOptions = () => ({
  expires: new Date(
    Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN || 7) * 24 * 60 * 60 * 1000
  ),
  httpOnly: true,  // Inaccessible to JavaScript — prevents XSS token theft
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
});

const sendTokenResponse = (authData, statusCode, res) => {
  if (authData.refreshToken) {
    // Set the rotated refresh token as an HttpOnly cookie
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

    // WHY VALIDATE BEFORE CALLING SERVICE?
    // If we pass undefined to the service, it throws an unhandled path.
    // Early validation here returns a clean 401 and prevents unnecessary
    // async stack traces in the service layer.
    if (!refreshToken) {
      return next(new AppError('No refresh token provided', 401));
    }

    const authData = await AuthService.refreshAccessToken(refreshToken);
    // Rotation: push the new refresh token cookie and return new access token
    sendTokenResponse(authData, 200, res);
  });

  logout = catchAsync(async (req, res, next) => {
    const refreshToken = req.cookies[COOKIE_NAME];

    // WHY TOKEN-BASED LOGOUT (NO authMiddleware.protect)?
    // The access token may already be expired when the user logs out.
    // Requiring a valid access token for logout is a UX anti-pattern —
    // users must be able to log out regardless of access token state.
    // We identify the session via the refresh token cookie instead.
    await AuthService.logout(refreshToken);

    // Instantly clear the cookie — expires: new Date(0) is supported across all browsers
    res.cookie(COOKIE_NAME, '', {
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });

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
