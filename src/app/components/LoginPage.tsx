import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LoginCredentials, SignUpData } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

/**
 * Login/Sign Up Page
 * Strictly black and white design
 * Minimal, professional, trustworthy
 */
export function LoginPage() {
  const { login, signup, isLoading } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (mode === 'login') {
        const credentials: LoginCredentials = {
          email: formData.email,
          password: formData.password
        };
        await login(credentials);
      } else {
        const data: SignUpData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        };
        await signup(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        
        {/* Logo/Brand */}
        <div className="text-center mb-12">
          <h1 className="text-4xl mb-2 tracking-tight" style={{ fontWeight: 700 }}>
            BTEC GENERATOR
          </h1>
          <p className="text-base text-gray-600">
            AI-Powered Academic Assignment Platform
          </p>
        </div>

        {/* Form Container */}
        <div className="border-2 border-black p-8">
          <h2 className="text-2xl mb-6" style={{ fontWeight: 600 }}>
            {mode === 'login' ? 'Log In' : 'Create Account'}
          </h2>

          {/* Error Message */}
          {error && (
            <div className="bg-black text-white p-3 mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Name (Sign Up Only) */}
            {mode === 'signup' && (
              <div>
                <Label htmlFor="name" className="block mb-2 text-sm">
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full border-2 border-black px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Enter your full name"
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <Label htmlFor="email" className="block mb-2 text-sm">
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full border-2 border-black px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="your.email@example.com"
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password" className="block mb-2 text-sm">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full border-2 border-black px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="••••••••"
                disabled={isLoading}
              />
              {mode === 'signup' && (
                <p className="text-xs text-gray-600 mt-1">
                  Minimum 8 characters
                </p>
              )}
            </div>

            {/* Confirm Password (Sign Up Only) */}
            {mode === 'signup' && (
              <div>
                <Label htmlFor="confirmPassword" className="block mb-2 text-sm">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full border-2 border-black px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white py-3 hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors border-0"
            >
              {isLoading ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Create Account'}
            </Button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError('');
                setFormData({ name: '', email: '', password: '', confirmPassword: '' });
              }}
              className="text-sm underline hover:no-underline"
              disabled={isLoading}
            >
              {mode === 'login' 
                ? "Don't have an account? Sign up" 
                : 'Already have an account? Log in'}
            </button>
          </div>
        </div>

        {/* Footer Notice */}
        <div className="mt-8 text-center text-xs text-gray-600">
          <p>For academic use only. Submissions must be manually reviewed.</p>
          <p className="mt-2">Made by Ajax Manson</p>
        </div>
      </div>
    </div>
  );
}
