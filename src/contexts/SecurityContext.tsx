
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { generateSecureToken, validateSession } from '../utils/security';

interface SecurityContextType {
  isAuthenticated: boolean;
  sessionToken: string | null;
  login: (credentials: { username: string; password: string }) => Promise<boolean>;
  logout: () => void;
  checkPermission: (action: string) => boolean;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSession must be used within a SecurityProvider');
  }
  return context;
};

interface SecurityProviderProps {
  children: ReactNode;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session on mount
    const storedToken = localStorage.getItem('trading_session');
    if (storedToken && validateSession(storedToken)) {
      setSessionToken(storedToken);
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (credentials: { username: string; password: string }): Promise<boolean> => {
    // In production, this would authenticate against a secure backend
    // For demo purposes, we'll simulate authentication
    if (credentials.username && credentials.password.length >= 8) {
      const token = generateSecureToken();
      setSessionToken(token);
      setIsAuthenticated(true);
      localStorage.setItem('trading_session', token);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setSessionToken(null);
    localStorage.removeItem('trading_session');
  };

  const checkPermission = (action: string): boolean => {
    if (!isAuthenticated) return false;
    
    // Basic permission system - in production this would be more sophisticated
    const permissions = ['view_trades', 'execute_trades', 'view_analytics'];
    return permissions.includes(action);
  };

  return (
    <SecurityContext.Provider
      value={{
        isAuthenticated,
        sessionToken,
        login,
        logout,
        checkPermission,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};
