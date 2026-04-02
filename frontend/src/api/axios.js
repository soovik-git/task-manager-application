import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // Allows sending HTTP-only cookies (refresh token)
  headers: {
    'Content-Type': 'application/json',
  },
});

let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

// Request Interceptor: Attach Access Token to every request
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// In-memory Mutex Lock variables
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (accessToken) => {
  refreshSubscribers.forEach((cb) => cb(accessToken));
};

const onRefreshFailed = (error) => {
  refreshSubscribers.forEach((cb) => cb(error));
};

// Response Interceptor: Handle 401s and Refresh Token Queue
api.interceptors.response.use(
  (response) => response,
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
          const newAccessToken = res.data.accessToken;
          
          setAccessToken(newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          
          // Allow all held parallel requests to fire again using the new token
          onRefreshed(newAccessToken);
          refreshSubscribers = [];
          
          return api(originalRequest);
        } catch (refreshError) {
          // WHY CLEAR THE QUEUE BEFORE REDIRECTING?
          // If we redirect while subscribers are still waiting on a Promise,
          // those Promises never resolve or reject — the callbacks hang in memory
          // and the app visually freezes (spinners stuck, buttons unresponsive).
          // Rejecting all queued requests FIRST ensures every caller gets a clean
          // rejection it can handle, then we navigate away safely.
          setAccessToken(null);
          localStorage.removeItem('isLoggedIn');
          localStorage.removeItem('user');

          onRefreshFailed(refreshError); // Reject all queued requests
          refreshSubscribers = [];       // Clear the queue

          // Hard redirect to login — session is unrecoverable at this point
          window.location.href = '/login';

          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // If a refresh is already in progress, suspend this request into the holding queue
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((tokenOrError) => {
            if (typeof tokenOrError === 'string') {
               originalRequest.headers.Authorization = `Bearer ${tokenOrError}`;
               resolve(api(originalRequest));
            } else {
               // Reject hanging requests
               reject(tokenOrError); 
            }
          });
        });
      }
    }

    return Promise.reject(error);
  }
);

export default api;
