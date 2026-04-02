import catchAsync from '../utils/catchAsync.js';
import AuthService from '../services/AuthService.js';

const sendTokenResponse = (authData, statusCode, res) => {
  const cookieOptions = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  };

  if (authData.refreshToken) {
    res.cookie('jwt', authData.refreshToken, cookieOptions);
  }

  res.status(statusCode).json({
    status: 'success',
    accessToken: authData.accessToken,
    data: {
      user: authData.user
    }
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
    const refreshToken = req.cookies.jwt;
    const authData = await AuthService.refreshAccessToken(refreshToken);
    // Refresh only mints access token in our current logic
    res.status(200).json({
      status: 'success',
      accessToken: authData.accessToken,
      data: { user: authData.user }
    });
  });

  logout = catchAsync(async (req, res, next) => {
    const refreshToken = req.cookies.jwt;
    await AuthService.logout(req.user, refreshToken);
    
    res.cookie('jwt', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });
    res.status(200).json({ status: 'success' });
  });

  getMe = (req, res) => {
    res.status(200).json({
      status: 'success',
      data: {
        user: req.user
      }
    });
  };
}

export default new AuthController();
