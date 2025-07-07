'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Verify token from URL fragment
    const verifyToken = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error || !data.session?.access_token) {
        setError('Invalid or expired token');
        return;
      }
      
      // If email param doesn't match token's email
      if (email && email !== data.session.user?.email) {
        setError('Email does not match reset token');
      }
    };

    verifyToken();
  }, [email]);

  const handleResetPassword = async () => {
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      
      setSuccess(true);
      setTimeout(() => router.push('/'), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
          Reset Password
        </h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success ? (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            Password updated successfully! Redirecting...
          </div>
        ) : (
          <>
            {email && (
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full p-2 border border-gray-300 rounded dark:bg-gray-700 dark:text-white"
                />
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded dark:bg-gray-700 dark:text-white"
                placeholder="At least 8 characters"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 dark:text-gray-300 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded dark:bg-gray-700 dark:text-white"
                placeholder="Confirm your password"
              />
            </div>
            
            <button
              onClick={handleResetPassword}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}