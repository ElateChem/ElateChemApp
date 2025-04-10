'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient, User } from '@supabase/supabase-js';
import SeoProvider from "@/components/seo-provider";

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
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showDropdown, setShowDropdown] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  // Auth form states
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const [formRequest, setFormRequest] = useState({
    chemicalName: '',
    casNumber: '',
    contactInfo: ''
  });
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  const [isAuthLoading, setIsAuthLoading] = useState(false);


  // Add this handler function
  const handleNotFoundRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingRequest(true);
    try {
      const { error } = await supabase
        .from('search_requests') // Create this table in your Supabase
        .insert([{
          chemical_name: formRequest.chemicalName,
          cas_number: formRequest.casNumber,
          contact_info: formRequest.contactInfo,
          searched_query: searchQuery,
          requested_at: new Date().toISOString()
        }]);

      if (error) throw error;

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

  // Auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'SIGNED_IN') setShowAuthModal(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Auth form handlers
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsAuthLoading(true);
    // Common validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (authMode === 'login') {
      // Login validations
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
    } else {
      // Registration validations
      if (!formData.company.trim()) {
        setError('Company name is required');
        return;
      }

      if (formData.mobile.length !== 10) {
        setError('Mobile number must be 10 digits');
        return;
      }

      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    if (authMode === 'register' && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
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
    } finally {
      setIsAuthLoading(false); // Stop loading regardless of success/failure
    }

  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowDropdown(false);
    router.refresh();
  };

  // 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<ChemicalResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error, count } = await supabase
          .from('vendors_list')
          .select('*', { count: 'exact' })
          .or(`Chemicalname.ilike.%${searchQuery}%,Casno.ilike.%${searchQuery}%`)
          .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

        if (error) throw error;

        setResults(data as ChemicalResult[] || []);
        if (count) {
          setTotalPages(Math.ceil(count / itemsPerPage));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, currentPage]);

  // Auth Modal
  const authModal = showAuthModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl w-full max-w-md relative">
        {/* Close Button */}
        <button
          onClick={() => setShowAuthModal(false)}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

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
                const value = e.target.value.replace(/\D/g, ''); // Remove non-digit characters
                setFormData({ ...formData, mobile: value.slice(0, 10) });
              }}
              maxLength={10}
            />
          )}

          <input
            type="password"
            placeholder="Password"
            required
            disabled={isAuthLoading}
            className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />

          {authMode === 'register' && (
            <input
              type="password"
              placeholder="Confirm Password"
              required
              disabled={isAuthLoading}
              className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
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
      </div>
    </div>
  );

  const categories = [
    {
      name: 'Industrial Chemicals',
      description: 'High-performance chemicals for manufacturing processes',
      image: '/industry.jpg'
    },
    {
      name: 'Agricultural Solutions',
      description: 'Specialty chemicals for enhanced crop production',
      image: '/agriculture.jpg'
    },
    {
      name: 'Pharmaceutical',
      description: 'API intermediates and fine chemicals',
      image: '/pharmaceautical.jpg'
    },
    {
      name: 'Water Treatment',
      description: 'Chemicals for purification and waste management',
      image: '/watertreatment.jpg'
    }
  ];


  // Pagination controls component
  const PaginationControls = () => (
    <div className="flex justify-center items-center gap-4 mt-8">
      <button
        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
        disabled={currentPage === 1}
        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg disabled:opacity-50"
      >
        Previous
      </button>
      <span className="text-gray-600 dark:text-gray-300">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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
              </div>
            )}
          </div>
        </nav>

        {authModal}

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
                      Innovating
                    </span>
                    <span className="relative mx-2">
                      <span className="absolute -inset-1 bg-blue-100 dark:bg-blue-900 rounded-lg transform -skew-x-12 opacity-75"></span>
                      <span className="relative text-white dark:text-white">Chemical Solutions</span>
                    </span>
                    <span className="bg-gradient-to-r text-blue-600 dark:text-blue-400">
                      Worldwide
                    </span>
                  </h1>
                  <p className="text-lg text-white dark:text-white mb-8 leading-relaxed">
                    Pioneering sustainable chemistry through cutting-edge innovation and global expertise.
                    Partner with us for tailored solutions that drive your industrial success.
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
                  <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
                    Global Supplier Network
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
                    Connect with certified chemical suppliers across 150+ countries
                  </p>
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
                <div className="mt-8 space-y-4">
                  {isLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : results.length > 0 ? (
                    <>
                      {results.slice(0, user ? results.length : 1).map((result) => (
                        <div key={result.Srno} className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column */}
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Chemical:</span>
                                <span className="font-medium">{result.Chemicalname}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Category:</span>
                                <span>{result.Category}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">CAS Number:</span>
                                <span className="font-mono">{result.Casno}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Business Status:</span>
                                <span className={`px-2 py-1 rounded ${result.Businessstatus === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {result.Businessstatus}
                                </span>
                              </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Supplier:</span>
                                <span className="font-medium">{result.Suppliername}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Country:</span>
                                <span>{result.Country}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Contact:</span>
                                <div className="flex flex-col items-end">
                                  <a href={`mailto:${result["Email&link"]}`} className="text-blue-600 hover:underline">
                                    {result["Email&link"]}
                                  </a>
                                  <a href={`tel:${result.Phoneno}`} className="text-gray-600 dark:text-gray-300">
                                    {result.Phoneno}
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      <PaginationControls />

                      {!user && results.length > 1 && (
                        <div className="text-center py-8">
                          <div className="bg-white dark:bg-gray-700 p-8 rounded-xl shadow-md">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                              Unlock Full Supplier Access
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                              Sign-up Now to view all {results.length} matching suppliers
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

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {categories.map((category, index) => (
                    <div key={index} className="group bg-white dark:bg-gray-700 rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                      {/* Image Container with proper aspect ratio */}
                      <div className="relative h-48 bg-gray-100 dark:bg-gray-600 overflow-hidden">
                        <img
                          src={category.image} // Update with your actual image path
                          alt={category.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>

                      {/* Card Content */}
                      <div className="p-6">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                          {category.name}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                          {category.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="py-20">
                  <div className="bg-blue-600 dark:bg-blue-700 rounded-2xl p-8 text-center text-white">
                    <h2 className="text-3xl font-bold mb-4">Custom Formulations</h2>
                    <p className="text-lg mb-8">Need a specialized chemical solution? Our R&D team can develop custom formulations tailored to your requirements.</p>
                    <button className="bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors">
                      Request Formulation
                    </button>
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
                  Pioneering chemical solutions for a sustainable future
                </p>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
                <div className="space-y-2">
                  {['Home', 'About', 'Contact'].map((link) => (
                    <a key={link} href="#" className="block text-gray-400 hover:text-white transition-colors">
                      {link}
                    </a>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Legal</h4>
                <div className="space-y-2">
                  {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((link) => (
                    <a key={link} href="#" className="block text-gray-400 hover:text-white transition-colors">
                      {link}
                    </a>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Connect</h4>
                <div className="flex space-x-4">
                  {['LinkedIn', 'Twitter', 'YouTube'].map((platform) => (
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