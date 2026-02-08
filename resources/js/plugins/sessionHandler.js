/**
 * Inertia Session Error Handler
 * 
 * Handles session_not_found and 401 Unauthorized errors gracefully
 * by redirecting to login page with return URL preserved.
 */

/**
 * Initialize session error handling for Inertia
 */
export function initSessionHandler() {
  // Handle session errors on XHR failures
  document.addEventListener('inertia:xhr-error', (event) => {
    const error = event.detail;
    // Debug logging removed for production
    
    // Check for session-related errors
    if (isSessionError(error)) {
      // Debug logging removed for production
      redirectToLogin();
    }
  });
  
  // Handle navigation failures
  document.addEventListener('inertia:navigation-guarded', (event) => {
    // Debug logging removed for production
  });
  
  // Debug logging removed for production
}

/**
 * Check if error is session-related
 */
function isSessionError(error) {
  if (!error) return false;
  
  const errorMessage = error.message || '';
  const statusCode = error.status || error.statusCode || 0;
  
  return (
    errorMessage.includes('session_not_found') ||
    errorMessage.includes('Session expired') ||
    errorMessage.includes('session_not_found') ||
    statusCode === 401 ||
    statusCode === 419
  );
}

/**
 * Redirect to login with return URL
 */
function redirectToLogin() {
  // Store current URL for redirect after login
  const currentUrl = window.location.href;
  sessionStorage.setItem('redirect_after_login', currentUrl);
  
  // Redirect to login
  window.location.href = '/login';
}

/**
 * Force logout and redirect to login
 */
export function forceLogout() {
  // Clear all session storage
  sessionStorage.clear();
  localStorage.clear();
  
  // Redirect to login
  window.location.href = '/login?reason=session_invalid';
}

/**
 * Get redirect URL after login
 */
export function getRedirectAfterLogin() {
  return sessionStorage.getItem('redirect_after_login');
}

/**
 * Clear redirect URL after successful login
 */
export function clearRedirectAfterLogin() {
  sessionStorage.removeItem('redirect_after_login');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  try {
    // Check for auth user data in the page
    const authElement = document.querySelector('[data-auth-user]');
    if (authElement) {
      const authData = JSON.parse(authElement.dataset.authUser || '{}');
      return !!authData && !!authData.id;
    }
    
    // Check if on login page
    if (window.location.pathname.includes('/login')) {
      return false;
    }
    
    // Default to false if we can't determine
    return false;
  } catch (e) {
    // Debug logging removed for production
    return false;
  }
}

/**
 * Validate session is still valid
 */
export function validateSession() {
  const auth = isAuthenticated();
  const hasSession = document.cookie.includes('laravel_session=');
  
  if (!auth && !window.location.pathname.includes('/login')) {
    redirectToLogin();
    return false;
  }
  
  if (!hasSession && !window.location.pathname.includes('/login')) {
    redirectToLogin();
    return false;
  }
  
  return true;
}

// Auto-initialize when module is imported
if (typeof window !== 'undefined') {
  initSessionHandler();
}
