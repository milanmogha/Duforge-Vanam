import axios from 'axios';

// Note: Removed automatic logout on 401/403 to prevent unexpected logouts
// Users should explicitly logout or handle token refresh manually
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    // Auto logout on 401/403 has been disabled
    // Uncomment below if you want to restore this behavior
    /*
    if (status === 401 || status === 403) {
      const skipLogout = error?.config?.headers?.['X-Skip-Logout'] || error?.config?.headers?.['x-skip-logout'];
      if (skipLogout) return Promise.reject(error);
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch (e) {
        // ignore
      }
      console.warn('Unauthorized response - logging out and redirecting to /login');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    */
    return Promise.reject(error);
  }
);

export default axios;
