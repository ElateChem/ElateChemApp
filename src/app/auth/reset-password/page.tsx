'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Wrapper component to handle suspense
function ResetPasswordContent() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenChecked, setTokenChecked] = useState(false);

  useEffect(() => {
    // Get email from URL query parameters
    const queryParams = new URLSearchParams(window.location.search);
    const emailParam = queryParams.get('email');
    if (emailParam) setEmail(decodeURIComponent(emailParam));

    // Verify password reset token
    const verifyToken = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error || !data.session?.access_token) {
          setError('Invalid or expired token');
          setTokenValid(false);
          return;
        }
        
        // If email param doesn't match token's email
        if (emailParam && emailParam !== data.session.user?.email) {
          setError('Email does not match reset token');
          setTokenValid(false);
        } else {
          setTokenValid(true);
        }
      } catch (err) {
        setError('Error verifying token');
        setTokenValid(false);
      } finally {
        setTokenChecked(true);
      }
    };

    verifyToken();
  }, []);

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

  if (!tokenChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying reset token...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md w-full max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Invalid Token</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Your password reset link is invalid or has expired.
          </p>
          <button
            onClick={() => router.push('/forgot-password')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Request New Reset Link
          </button>
        </div>
      </div>
    );
  }

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
            Password updated successfully! Redirecting to homepage...
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
                  className="w-full p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-white"
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
                className="w-full p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-white"
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
                className="w-full p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-white"
                placeholder="Confirm your password"
              />
            </div>
            
            <button
              onClick={handleResetPassword}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function ResetPassword() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reset page...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}