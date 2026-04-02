import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // 🔥 REQUIRED
  headers: {
    'Content-Type': 'application/json',
  },
});

let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

// Attach access token
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Mutex lock
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token) => {
  refreshSubscribers.forEach((cb) => cb(token));
};

const onRefreshFailed = (err) => {
  refreshSubscribers.forEach((cb) => cb(err));
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const res = await api.get('/auth/refresh');
          const newToken = res.data.accessToken;

          setAccessToken(newToken);
          onRefreshed(newToken);
          refreshSubscribers = [];

          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch (err) {
          setAccessToken(null);
          localStorage.clear();

          onRefreshFailed(err);
          refreshSubscribers = [];

          window.location.href = '/login';
          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      }

      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((tokenOrError) => {
          if (typeof tokenOrError === 'string') {
            originalRequest.headers.Authorization = `Bearer ${tokenOrError}`;
            resolve(api(originalRequest));
          } else {
            reject(tokenOrError);
          }
        });
      });
    }

    return Promise.reject(error);
  }
);

export default api;