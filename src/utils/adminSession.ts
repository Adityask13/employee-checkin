// Session management utilities for admin authentication

export interface AdminSession {
  isAuthenticated: boolean;
  timestamp: number;
  expiresAt: number;
}

const SESSION_KEY = 'adminSession';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Create a new admin session
export const createAdminSession = (): void => {
  const now = Date.now();
  const session: AdminSession = {
    isAuthenticated: true,
    timestamp: now,
    expiresAt: now + SESSION_DURATION,
  };
  
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  
  // Dispatch custom event to notify other components
  window.dispatchEvent(new Event('adminAuthChange'));
};

// Check if admin session is valid
export const isValidAdminSession = (): boolean => {
  try {
    const sessionData = localStorage.getItem(SESSION_KEY);
    if (!sessionData) return false;
    
    const session: AdminSession = JSON.parse(sessionData);
    const now = Date.now();
    
    // Check if session exists and hasn't expired
    if (session.isAuthenticated && session.expiresAt > now) {
      return true;
    } else {
      // Session expired, clean it up
      destroyAdminSession();
      return false;
    }
  } catch (error) {
    console.error('Error checking admin session:', error);
    destroyAdminSession();
    return false;
  }
};

// Destroy admin session (logout)
export const destroyAdminSession = (): void => {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('adminAuth'); // Remove old auth key if it exists
  
  // Dispatch custom event to notify other components
  window.dispatchEvent(new Event('adminAuthChange'));
};

// Extend session if it's about to expire
export const extendAdminSession = (): void => {
  if (isValidAdminSession()) {
    createAdminSession(); // Create new session with fresh timestamp
  }
};

// Get session info
export const getAdminSessionInfo = (): AdminSession | null => {
  try {
    const sessionData = localStorage.getItem(SESSION_KEY);
    if (!sessionData) return null;
    
    return JSON.parse(sessionData);
  } catch (error) {
    console.error('Error getting session info:', error);
    return null;
  }
};
