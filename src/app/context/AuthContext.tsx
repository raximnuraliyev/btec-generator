import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState, LoginCredentials, SignUpData, UserRole } from '../types';
import { authApi, ApiError } from '../services/api';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignUpData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isVIP: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication Context Provider
 * Manages user authentication state and operations
 * 
 * Connects to backend API for production use
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('btec_token');

      if (storedToken) {
        try {
          // Verify token with backend
          const response = await authApi.getProfile();
          if (!response || !response.user) {
            throw new Error('Invalid response from server');
          }
          const user: User = {
            id: response.user.id,
            email: response.user.email,
            name: response.user.name,
            role: response.user.role as UserRole,
            createdAt: new Date()
          };
          
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error) {
          console.error('Token validation failed:', error);
          localStorage.removeItem('btec_user');
          localStorage.removeItem('btec_token');
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkAuth();
  }, []);

  /**
   * Login user with credentials
   * Calls POST /api/auth/login
   */
  const login = async (credentials: LoginCredentials): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      // Validate inputs
      if (!credentials.email || !credentials.password) {
        throw new Error('Email and password are required');
      }

      if (!credentials.email.includes('@')) {
        throw new Error('Invalid email format');
      }

      // Call backend API
      const response = await authApi.login(credentials.email, credentials.password);

      const user: User = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        role: response.user.role as UserRole,
        createdAt: new Date()
      };

      // Store token
      localStorage.setItem('btec_user', JSON.stringify(user));
      localStorage.setItem('btec_token', response.token);

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false
      });

    } catch (error) {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
      
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw error;
    }
  };

  /**
   * Sign up new user
   * Calls POST /api/auth/signup
   */
  const signup = async (data: SignUpData): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      // Validate inputs
      if (!data.email || !data.password || !data.name) {
        throw new Error('All fields are required');
      }

      if (!data.email.includes('@')) {
        throw new Error('Invalid email format');
      }

      if (data.password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      if (data.password !== data.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Call backend API
      const response = await authApi.signup(data.email, data.password, data.name);

      const user: User = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        role: response.user.role as UserRole,
        createdAt: new Date()
      };

      // Store token
      localStorage.setItem('btec_user', JSON.stringify(user));
      localStorage.setItem('btec_token', response.token);

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false
      });

    } catch (error) {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
      
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw error;
    }
  };

  /**
   * Logout current user
   * Calls POST /api/auth/logout
   */
  const logout = (): void => {
    // Try to call logout endpoint (don't wait for it)
    authApi.logout().catch(() => {});
    
    localStorage.removeItem('btec_user');
    localStorage.removeItem('btec_token');
    
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
  };

  /**
   * Refresh user data from server
   */
  const refreshUser = async (): Promise<void> => {
    try {
      const response = await authApi.getProfile();
      if (response && response.user) {
        const user: User = {
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          role: response.user.role as UserRole,
          createdAt: new Date()
        };
        
        setAuthState(prev => ({
          ...prev,
          user
        }));
        
        localStorage.setItem('btec_user', JSON.stringify(user));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const isAdmin = authState.user?.role === 'ADMIN';
  const isVIP = authState.user?.role === 'VIP' || authState.user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        signup,
        logout,
        refreshUser,
        isAdmin,
        isVIP,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access authentication context
 * Must be used within AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  
  return context;
}
