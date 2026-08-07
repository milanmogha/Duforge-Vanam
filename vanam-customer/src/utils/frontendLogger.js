/**
 * Frontend Error Logger Utility
 * Centralizes error logging for the customer-facing application
 */

const getTimestamp = () => new Date().toISOString();

export const frontendLogger = {
  // Log generic errors
  error: (title, data = {}) => {
    const errorLog = {
      type: '❌ FRONTEND_ERROR',
      title,
      timestamp: getTimestamp(),
      url: window.location.href,
      ...data
    };
    console.error(JSON.stringify(errorLog));
    return errorLog;
  },

  // Log API request errors
  apiError: (endpoint, method, status, errorMessage) => {
    return frontendLogger.error('API_REQUEST_FAILED', {
      endpoint,
      method,
      status,
      errorMessage
    });
  },

  // Log authentication errors
  authError: (action, errorMessage) => {
    return frontendLogger.error('AUTH_ERROR', {
      action,
      errorMessage
    });
  },

  // Log payment/checkout errors
  checkoutError: (step, errorMessage) => {
    return frontendLogger.error('CHECKOUT_ERROR', {
      step,
      errorMessage
    });
  },

  // Log network errors
  networkError: (errorMessage) => {
    return frontendLogger.error('NETWORK_ERROR', {
      errorMessage,
      isOnline: navigator.onLine
    });
  },

  // Info logging
  info: (title, data = {}) => {
    const infoLog = {
      type: 'ℹ️ INFO',
      title,
      timestamp: getTimestamp(),
      ...data
    };
    console.log(JSON.stringify(infoLog));
    return infoLog;
  }
};

export default frontendLogger;
