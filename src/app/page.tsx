'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient, User } from '@supabase/supabase-js';
import SeoProvider from "@/components/seo-provider";
import { useRef } from 'react';
import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend("re_hMvhwhwJ_2xhfSzgLWtJwFsXLUVoriSgo")

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ChemicalResult {
  Srno: string,
  Chemicalname: string;
  Category: string;
  Casno: string;
  Suppliername: string;
  "Email&link": string;
  Phoneno: string;
  Businessstatus: string;
  Country: string;
  count?: number; // For pagination
}

export default function Home() {
  const router = useRouter(); //Router for page linking
  const [user, setUser] = useState<User | null>(null);  //state for setting up user session
  const [showAuthModal, setShowAuthModal] = useState(false); //state for display Modal for login ^ register
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login'); //state for authmode ( modal form reg / login )
  const [showDropdown, setShowDropdown] = useState(false); //state for login & logout dropdown
  const [currentPage, setCurrentPage] = useState(1); //state for setting current page in search
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0); //state for setting total pages of data
  const [showPassword, setShowPassword] = useState(false); //state for visiblity of pass
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); //state for visiblity of confirm pass

  //all states is for forgot password logics and form
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isForgotPasswordLoading, setIsForgotPasswordLoading] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);

  // Add cookie consent state
  const [showCookiePopup, setShowCookiePopup] = useState(false);

  // New state for Applications dropdown
  const [showApplicationsDropdown, setShowApplicationsDropdown] = useState(false);
  const [showMobileApplications, setShowMobileApplications] = useState(false);

  // Chemical list for dropdown
  const chemicals = [
    "Sulphuric Acid", "Nitric Acid", "Caustic Soda", "Hydrogen Peroxide",
    "Chlorine", "Bromine", "Hydrobromic Acid", "Ethanol", "Acetone",
    "Ammonia", "Hydrochloric Acid", "Formaldehyde", "Acetic Acid",
    "Sodium Hypochlorite", "Phosphoric Acid", "Methanol", "Toluene",
    "Xylene", "Ethylene Glycol", "Propylene Glycol", "Butanol",
    "Isopropyl Alcohol", "Methyl Ethyl Ketone", "Sodium Carbonate",
    "Potassium Hydroxide", "Calcium Chloride", "Aluminum Chloride",
    "Sodium Sulfate", "Potassium Permanganate", "Hydrogen Fluoride"
  ];

  // Check if user has already accepted cookies
  useEffect(() => {
    const hasAcceptedCookies = localStorage.getItem('cookiesAccepted');
    if (!hasAcceptedCookies) {
      // Show popup after a small delay for better UX
      const timer = setTimeout(() => {
        setShowCookiePopup(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Handle cookie acceptance
  const handleAcceptCookies = () => {
    localStorage.setItem('cookiesAccepted', 'true');
    setShowCookiePopup(false);
  };

  //Forgot password modal form
  const ForgotPasswordForm = () => {
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
      // Focus input when component mounts
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, []);
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Reset Your Password
        </h2>

        {forgotPasswordSuccess ? (
          <div className="text-green-600 dark:text-green-400 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            Password reset link sent to your email! Please check your inbox.
          </div>
        ) : (
          <>
            <p className="text-gray-600 dark:text-gray-300">
              Enter your email to receive a password reset link
            </p>

            <input
              ref={inputRef}
              type="email"
              placeholder="Your registered email"
              required
              value={forgotPasswordEmail}
              onChange={(e) => setForgotPasswordEmail(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
            />

            {forgotPasswordError && (
              <div className="text-red-500 text-sm">{forgotPasswordError}</div>
            )}

            <button
              onClick={handlePasswordReset}
              disabled={isForgotPasswordLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium relative"
            >
              {isForgotPasswordLoading ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Sending...
                </div>
              ) : 'Send Reset Link'}
            </button>
          </>
        )}

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setIsForgotPassword(false);
              setForgotPasswordError('');
              setForgotPasswordSuccess(false);
            }}
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  };

  //Handle password reset functionlity
  const handlePasswordReset = async () => {
    setForgotPasswordError('');
    setIsForgotPasswordLoading(true);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotPasswordEmail)) {
      setForgotPasswordError('Please enter a valid email address');
      setIsForgotPasswordLoading(false);
      return;
    }
    try {
      // Check if email exists in users table
      const { data, error } = await supabase
        .from('users')
        .select('email')
        .eq('email', forgotPasswordEmail)
        .single();

      // Fixed URL with https
      const redirectUrl = "https://www.elatechem.com/auth/reset-password";

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        forgotPasswordEmail,
        { redirectTo: `https://www.elatechem.com/auth/reset-password?email=${encodeURIComponent(forgotPasswordEmail)}` }
      );

      if (resetError) {
        console.error("Password reset error:", resetError);
        throw resetError;
      }

      setForgotPasswordSuccess(true);
    } catch (err) {
      setForgotPasswordError(
        err instanceof Error ? err.message : "Failed to send reset link"
      );
    } finally {
      setIsForgotPasswordLoading(false);
    }
  };

  // Auth form states of register account form
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: ''
  });

  // Error Array
  const [error, setError] = useState('');

  // Auth form states of send chemical request
  const [formRequest, setFormRequest] = useState({
    chemicalName: '',
    casNumber: '',
    contactInfo: ''
  });
  // States for submission of chemical request
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  const [isAuthLoading, setIsAuthLoading] = useState(false);//state for loading text in register and login button

  //handler function for chemical request
  const handleNotFoundRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingRequest(true);
    try {
      const { error } = await supabase
        .from('search_requests')
        .insert([{
          chemical_name: formRequest.chemicalName,
          cas_number: formRequest.casNumber,
          contact_info: formRequest.contactInfo,
          searched_query: searchQuery,
          requested_at: new Date().toISOString()
        }]);

      if (error) throw error;

      // Send email notification
      await resend.emails.send({
        from: 'ElateChem Request <noreply@elatechem.com>',
        to: ['elatechem@gmail.com'],
        subject: `New Chemical Request: ${formRequest.chemicalName}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Chemical Request Submitted</h2>
          <p>A user has requested a chemical that wasn't found in our database:</p>
          
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Chemical Name:</strong> ${formRequest.chemicalName}</p>
            ${formRequest.casNumber ? `<p><strong>CAS Number:</strong> ${formRequest.casNumber}</p>` : ''}
            <p><strong>Contact Info:</strong> ${formRequest.contactInfo}</p>
            <p><strong>Searched Query:</strong> ${searchQuery}</p>
            <p><strong>Requested At:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <p style="margin-top: 24px;">
            <a href="https://www.elatechem.com/admin/requests" 
               style="background-color: #2563eb; color: white; padding: 10px 20px; 
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              View in Admin Dashboard
            </a>
          </p>
        </div>
      `
      });

      setRequestSubmitted(true);
      setFormRequest({ chemicalName: '', casNumber: '', contactInfo: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Check existing session
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    getSession();
  }, []);

  // Auth state listener for login
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'SIGNED_IN') setShowAuthModal(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Auth resgister form handlers
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsAuthLoading(true);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      setIsAuthLoading(false);
      return;
    }

    if (authMode === 'login') {
      // Login validations
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters');
        setIsAuthLoading(false);
        return;
      }
    } else {
      // Registration validations
      if (!formData.company.trim()) {
        setError('Company name is required');
        setIsAuthLoading(false);
        return;
      }
      if (formData.mobile.length !== 10) {
        setError('Mobile number must be 10 digits');
        setIsAuthLoading(false);
        return;
      }
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters');
        setIsAuthLoading(false);
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setIsAuthLoading(false);
        return;
      }
    }
    if (authMode === 'register' && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsAuthLoading(false);
      return;
    }

    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });
        if (error) throw error;
      } else {
        // Create auth user
        const { error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (authError) throw authError;

        // Insert into public.users table
        const { error } = await supabase
          .from('users')
          .insert([{
            company_name: formData.company,
            full_name: formData.name,
            email: formData.email,
            mobile: formData.mobile
          }])
          .select();
        if (error) throw error;
        // Clear form on success
        setFormData({
          name: '',
          company: '',
          email: '',
          mobile: '',
          password: '',
          confirmPassword: ''
        });
        setError('Registration successful! Please check your email for verification.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setIsAuthLoading(false);
    } finally {
      setIsAuthLoading(false); // Stop loading regardless of success/failure
    }

  };

  // Auth Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowDropdown(false);
    router.refresh();
  };

  // Navigation and home page function state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<ChemicalResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modified the useEffect that fetches results
  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true);
      try {
        if (!searchQuery.trim()) {
          setResults([]);
          setTotalPages(0);
          return;
        }

        const { data, error, count } = await supabase
          .from('vendors_data')
          .select('*', { count: 'exact' })
          .or(`Chemicalname.ilike.%${searchQuery}%,Casno.ilike.%${searchQuery}%`)
          .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

        if (error) throw error;

        setResults(data as ChemicalResult[] || []);
        if (count) setTotalPages(Math.ceil(count / itemsPerPage));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    const debounceTimer = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, currentPage, itemsPerPage]);

  // This useEffect to reset current page when search query changes
  useEffect(() => {
    // Reset to first page whenever search query changes
    setCurrentPage(1);
  }, [searchQuery]);


  // Auth Modal
  const authModal = showAuthModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl w-full max-w-md relative">
        <button
          onClick={() => {
            setShowAuthModal(false);
            setIsForgotPassword(false);
            setForgotPasswordError('');
            setForgotPasswordSuccess(false);
          }}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {isForgotPassword ? (
          <ForgotPasswordForm />
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
              {authMode === 'login' ? 'Login' : 'Register'}
            </h2>

            {error && <div className="text-red-500 mb-4 text-sm">{error}</div>}

            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === 'register' && (
                <>
                  <input
                    type="text"
                    placeholder="Company Name"
                    required
                    disabled={isAuthLoading}
                    className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Full Name"
                    required
                    disabled={isAuthLoading}
                    className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </>
              )}

              <input
                type="email"
                placeholder="Email"
                required
                disabled={isAuthLoading}
                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />

              {authMode === 'register' && (
                <input
                  type="tel"
                  placeholder="Mobile Number"
                  required
                  disabled={isAuthLoading}
                  className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                  value={formData.mobile}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setFormData({ ...formData, mobile: value.slice(0, 10) });
                  }}
                  maxLength={10}
                />
              )}

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  required
                  disabled={isAuthLoading}
                  className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 pr-10"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>

              {authMode === 'register' && (
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    required
                    disabled={isAuthLoading}
                    className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 pr-10"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>

                </div>
              )}

              {/* Terms after the confirm password field */}
              {authMode === 'register' && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  <p>
                    After creating account you accept our{' '}
                    <Link href="/privacy&policy" className="text-blue-600 dark:text-blue-400 hover:underline">
                      Privacy & Policy
                    </Link>{' '}
                    and{' '}
                    <Link href="/termsofservice" className="text-blue-600 dark:text-blue-400 hover:underline">
                      Terms of Service
                    </Link>
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium relative"
              >
                {isAuthLoading ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </div>
                ) : (
                  authMode === 'login' ? 'Login' : 'Create Account'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                {authMode === 'login'
                  ? "Don't have an account? Register here"
                  : "Already have an account? Login here"}
              </button>
            </div>

            {authMode === 'login' && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setIsForgotPassword(true)}
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                >
                  Forgot Password?
                </button>
              </div>
            )}


          </>
        )}
      </div>
    </div>
  );

  // Pagination controls component
  const PaginationControls = () => (
    <div className="flex justify-center items-center gap-4 mt-8">
      <button
        onClick={() => {
          setCurrentPage(p => Math.max(1, p - 1));
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        disabled={currentPage === 1}
        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg disabled:opacity-50"
      >
        Previous
      </button>
      <span className="text-gray-600 dark:text-gray-300">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => {
          setCurrentPage(p => Math.min(totalPages, p + 1));
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        disabled={currentPage === totalPages}
        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );

  return (
    <SeoProvider>
      <div className="min-h-screen flex flex-col">
        {/* Enhanced Navigation */}
        <nav className="bg-white dark:bg-gray-900 shadow-sm backdrop-blur-lg bg-opacity-90 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              {/* Logo */}
              <Link href="/" className="flex items-center space-x-2 group">
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                  Elate Chem
                </span>
                <span className="w-2 h-2 bg-purple-600 rounded-full group-hover:animate-pulse dark:bg-purple-400"></span>
              </Link>

              {/* Desktop Menu + Profile */}
              <div className="flex items-center gap-6">
                {/* Desktop Menu */}
                <div className="hidden md:flex items-center space-x-8">
                  {[
                    ['Home', '/'],
                    ['About', '/about'],
                    ['Contact', '/contact'],
                  ].map(([title, url]) => (
                    <Link
                      key={title}
                      href={url}
                      className="relative px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors group"
                    >
                      {title}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full"></span>
                    </Link>
                  ))}

                  {/* NEW: Applications Dropdown */}
                  <div
                    className="relative"
                    onMouseEnter={() => setShowApplicationsDropdown(true)}
                    onMouseLeave={() => setShowApplicationsDropdown(false)}
                  >
                    <button
                      onClick={() => setShowApplicationsDropdown(!showApplicationsDropdown)}
                      className="relative px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors group flex items-center"
                    >
                      Applications
                      <svg
                        className={`w-4 h-4 ml-1 transition-transform ${showApplicationsDropdown ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full"></span>
                    </button>

                    {showApplicationsDropdown && (
                      <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 border border-gray-200 dark:border-gray-700">
                        <div className="max-h-80 overflow-y-auto custom-scrollbar py-2">
                          {chemicals.map((chemical, index) => (
                            <Link
                              key={index}
                              href={`/applications/${chemical.toLowerCase().replace(/\s+/g, '-')}`}
                              className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              onClick={() => setShowApplicationsDropdown(false)}
                            >
                              {chemical}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Profile Section */}
                <div className="flex items-center gap-4">
                  {user && (
                    <span className="hidden md:block text-gray-600 dark:text-gray-300 text-sm">
                      Welcome, {user.email}
                    </span>
                  )}
                  <div className="relative">
                    <button
                      onClick={() => user ? setShowDropdown(!showDropdown) : setShowAuthModal(true)}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <svg
                        className="w-6 h-6 text-gray-600 dark:text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {showDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1">
                        <button
                          onClick={handleLogout}
                          className="block w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile Menu Button */}
                <div className="md:hidden flex items-center">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {isMenuOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      )}
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Enhanced Mobile Menu */}
            {isMenuOpen && (
              <div className="md:hidden pb-4 space-y-2 animate-fade-in">
                {[
                  ['Home', '/'],
                  ['About', '/about'],
                  ['Contact', '/contact'],
                ].map(([title, url]) => (
                  <Link
                    key={title}
                    href={url}
                    className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    {title}
                  </Link>
                ))}
                {/* NEW: Mobile Applications Dropdown */}
                <div>
                  <button
                    onClick={() => setShowMobileApplications(!showMobileApplications)}
                    className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex justify-between items-center"
                  >
                    <span>Applications</span>
                    <svg
                      className={`w-5 h-5 transition-transform ${showMobileApplications ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showMobileApplications && (
                    <div className="pl-6 max-h-60 overflow-y-auto custom-scrollbar">
                      {chemicals.map((chemical, index) => (
                        <Link
                          key={index}
                          href={`/applications/${chemical.toLowerCase().replace(/\s+/g, '-')}`}
                          className="block px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setShowMobileApplications(false);
                          }}
                        >
                          {chemical}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </nav>

        {authModal}

        {/* Cookie Consent Popup */}
        {showCookiePopup && (
          <div className="fixed inset-x-0 bottom-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
              <div className="bg-gray-800 rounded-lg shadow-xl p-4 flex flex-col md:flex-row items-center justify-between">
                <div className="flex-1 mb-4 md:mb-0">
                  <p className="text-white text-sm md:text-base">
                    We use cookies to optimize user experience and content.
                    By continuing to use this site, you agree to our use of cookies.
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowCookiePopup(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                  >
                    Decline
                  </button>
                  <button
                    onClick={handleAcceptCookies}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Accept Cookies
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1">
          {/* Enhanced Hero Section */}
          <div>
            <div className="py-10 relative overflow-hidden">
              {/* Video Background */}
              <div className="absolute inset-0 z-0">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                >
                  <source src="/bg.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/30 dark:bg-black/60"></div>
              </div>

              <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto text-center mb-20">
                  <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                    <span className="bg-gradient-to-r text-white dark:text-white bg-clip-text text-transparent">
                      Welcome to El­­ate Chem
                    </span>
                  </h1>
                  <p className="text-lg text-white dark:text-white mb-8 leading-relaxed">
                    Effective & user-friendly chemical sourcing platform for buyers.
                  </p>
                  <button className="group bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-all transform hover:-translate-y-0.5 shadow-2xl hover:shadow-blue-500/30 relative overflow-hidden">
                    <div className="flex items-center space-x-2">
                      <span className="relative z-10">Scroll Down</span>
                      <svg
                        className="w-4 h-4 relative z-10 transition-transform group-hover:translate-y-1 animate-bounce-infinite"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 14l-7 7m0 0l-7-7m7 7V3"
                        />
                      </svg>
                    </div>
                    {/* Button Hover Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                  </button>
                </div>
              </div>
            </div>

            {/* Enhanced Search Section */}
            <div className="w-screen relative left-1/2 right-1/2 -mx-[50vw] bg-white dark:bg-gray-800 py-16 shadow-xl">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
                    Global Supplier Network
                  </h2>
                </div>

                <div className="relative mx-auto max-w-2xl">
                  <div className="flex items-center bg-white dark:bg-gray-700 rounded-xl shadow-lg px-4 py-2 border border-gray-200 dark:border-gray-600">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by Chemical Name or CAS.NO"
                      className="w-full py-2 bg-transparent focus:outline-none dark:text-white placeholder-gray-400"
                    />
                    <button className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Enhanced Results Section */}
                <div className="mt-8">
                  {isLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : results.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {results.slice(0, user ? results.length : 2).map((result) => (
                          <div key={result.Srno} className="border rounded-lg p-4 shadow-sm bg-white dark:bg-gray-800">
                            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                              <span className="font-semibold dark:text-gray-300">Chemical Name:</span>
                              <span className="truncate dark:text-gray-200">{result.Chemicalname}</span>

                              <span className="font-semibold dark:text-gray-300">Category:</span>
                              <span className="truncate dark:text-gray-200">{result.Category}</span>

                              <span className="font-semibold dark:text-gray-300">CAS No:</span>
                              <span className="truncate dark:text-gray-200">{result.Casno}</span>

                              <span className="font-semibold dark:text-gray-300">Supplier:</span>
                              <span className="truncate dark:text-gray-200">{result.Suppliername}</span>

                              <span className="font-semibold dark:text-gray-300">Email & Link:</span>
                              <div className="min-w-0">
                                <a
                                  href={`mailto:${result["Email&link"]}`}
                                  className="truncate hover:text-clip hover:overflow-visible hover:whitespace-normal text-blue-600 dark:text-blue-400"
                                >
                                  {result["Email&link"]}
                                </a>
                              </div>

                              <span className="font-semibold dark:text-gray-300">Phone No:</span>
                              <a
                                href={`tel:${result.Phoneno}`}
                                className="truncate dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400"
                              >
                                {result.Phoneno}
                              </a>

                              <span className="font-semibold dark:text-gray-300">Business Status:</span>
                              <span className={`truncate ${result.Businessstatus === 'Active' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {result.Businessstatus}
                              </span>

                              <span className="font-semibold dark:text-gray-300">Country:</span>
                              <span className="truncate dark:text-gray-200">{result.Country}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {user && totalPages > 1 && <PaginationControls />}

                      {!user && results.length > 1 && (
                        <div className="mt-8 text-center py-8">
                          <div className="bg-white dark:bg-gray-700 p-8 rounded-xl shadow-md">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                              Unlock Full Supplier Access
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                              Sign-up Now to get Complete Access to the Suppliers Data
                            </p>
                            <button
                              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                              onClick={() => {
                                setShowAuthModal(true);
                                setAuthMode('register');
                              }}
                            >
                              Sign-up Now
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    searchQuery && !isLoading && (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <svg className="mx-auto w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="mb-8">No suppliers found matching your criteria</p>

                        <div className="bg-white dark:bg-gray-700 p-8 rounded-xl shadow-md max-w-md mx-auto">
                          <h3 className="text-lg font-semibold mb-4 dark:text-white">Not Found What You're Searching?</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                            Let us know your requirement and we'll help you find it
                          </p>

                          {requestSubmitted ? (
                            <div className="text-green-600 dark:text-green-400 text-sm">
                              Request submitted successfully! We'll contact you shortly.
                            </div>
                          ) : (
                            <form onSubmit={handleNotFoundRequest} className="space-y-4">
                              <input
                                type="text"
                                placeholder="Chemical Name"
                                required
                                className="w-full p-2 rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                value={formRequest.chemicalName}
                                onChange={(e) => setFormRequest({ ...formRequest, chemicalName: e.target.value })}
                              />

                              <input
                                type="text"
                                placeholder="CAS Number"
                                className="w-full p-2 rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                value={formRequest.casNumber}
                                onChange={(e) => setFormRequest({ ...formRequest, casNumber: e.target.value })}
                              />

                              <input
                                type="text"
                                placeholder="Email / Mobile No."
                                required
                                className="w-full p-2 rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                value={formRequest.contactInfo}
                                onChange={(e) => setFormRequest({ ...formRequest, contactInfo: e.target.value })}
                              />

                              <button
                                type="submit"
                                disabled={isSubmittingRequest}
                                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-blue-400"
                              >
                                {isSubmittingRequest ? 'Submitting...' : 'Submit Request'}
                              </button>
                            </form>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Products Section */}
            <div className="py-20 bg-white dark:bg-gray-800">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-20">
                  <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
                    Why Choose Us
                  </h2>
                </div>

                {/* Updated Benefits Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-20">
                  <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-start space-x-4">
                      <span className="text-2xl">🔍</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          Supplier Database Access
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          Instantly get data of verified suppliers for your required products
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-start space-x-4">
                      <span className="text-2xl">📩</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          Direct Contact Details
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          Access email & contact information to connect directly with suppliers
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-start space-x-4">
                      <span className="text-2xl">🧪</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          Chemical Applications
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          Detailed information about applications of major Chemical Categories
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-start space-x-4">
                      <span className="text-2xl">📦</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          Clear Classification
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          Easy differentiation between manufacturers and traders
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rest of the section remains same */}
                <div className="py-20">
                  <div className="bg-blue-600 dark:bg-blue-700 rounded-2xl p-8 text-center text-white">
                    <h2 className="text-3xl font-bold mb-4">Search Chemical suppliers in easy way</h2>
                    <p className="text-lg mb-8">Any business related enquiry. Feel free to contact us</p>
                    <Link href="/contact">
                      <button className="bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors">
                        Contact Now
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Enhanced Footer */}
        <footer className="bg-gray-900 text-white pt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <h4 className="text-lg font-semibold mb-4">Elate Chem</h4>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Effective & user-friendly chemical sourcing platform for buyers.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
                <div className="space-y-2">
                  {[
                    ['Home', '/'],
                    ['About', '/about'],
                    ['Contact', '/contact'],
                  ].map(([title, url]) => (
                    <a key={title} href={url} className="block text-gray-400 hover:text-white transition-colors">
                      {title}
                    </a>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Legal</h4>
                <div className="space-y-2">
                  {[
                    ['Privacy & Policy', '/privacy&policy'],
                    ['Terms of Service', '/termsofservice'],
                  ].map(([title, url]) => (
                    <a key={title} href={url} className="block text-gray-400 hover:text-white transition-colors">
                      {title}
                    </a>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Socials Connect</h4>
                <div className="flex space-x-4">
                  {['Coming Soon'].map((platform) => (
                    <a key={platform} href="#" className="text-gray-400 hover:text-white transition-colors">
                      {platform}
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <div className="border-t border-gray-800 py-8 text-center">
              <p className="text-gray-400 text-sm">
                © {new Date().getFullYear()} Elate Chem. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </SeoProvider>
  );
}