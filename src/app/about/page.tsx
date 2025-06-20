'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import SeoProvider from "@/components/seo-provider";
import { type User as SupabaseUser } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function About() {

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  // Check existing session
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    getSession();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowDropdown(false);
    router.refresh();
    setUser(null);
    window.location.href = '/';  // Redirect to home page
  };

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

                {user ? (
                  <div className="relative ml-4">
                    <button
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <span className="text-sm text-gray-600 dark:text-gray-300">Welcome, {user.email}</span>
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

                    {showDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1">
                        <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                          You are logged-in
                        </div>
                        <button
                          onClick={handleLogout}
                          className="block w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button className="ml-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">

                  </button>
                )}
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

                {user && (
                  <div className="px-4 py-3">
                    <div className="flex items-center space-x-2">
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
                      <span className="text-gray-700 dark:text-gray-300 text-sm">Logged in as {user.email}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="mt-2 w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>

        <main className="flex-1">
          {/* Hero Section */}
          <div className="py-20 bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-3xl mx-auto text-center mb-20">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                  About
                  <span className="relative mx-2">
                    <span className="absolute -inset-1 bg-blue-100 dark:bg-blue-900 rounded-lg transform -skew-x-12 opacity-75"></span>
                    <span className="relative text-blue-600 dark:text-blue-400">Elate Chem</span>
                  </span>
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                  Effective & user-friendly chemical sourcing platform for buyers.
                </p>
              </div>

              {/* Content Sections */}
              <div className="space-y-16">
                <section className="grid md:grid-cols-2 gap-12 items-center">
                  <div className="space-y-4">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Our Story</h2>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      Being Procurement Professional, we are aware how important is sourcing to get right product from right source. We are providing data of all relevant suppliers from India, China, Japan, Korea, Taiwan, US and other countries which help you to add more value at your work. we are providing vendor data base for all key materials like Petrochemicals, Bulk materials, Agrochemicals, Specialty chemicals.
                    </p>
                  </div>
                  <img
                    src="/mission.jpg"
                    alt="aboutelatechem"
                    className="bg-gray-100 dark:bg-gray-700 h-64 rounded-xl object-cover w-full"
                  />
                </section>

                <section className="grid md:grid-cols-2 gap-12 items-center">
                  <img
                    src="/aboutelatechem.jpg"
                    alt="aboutelatechem"
                    className="bg-gray-100 dark:bg-gray-700 h-64 rounded-xl object-cover w-full"
                  />
                  <div className="space-y-4">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Vision</h2>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      To provide Effective & user-friendly chemical sourcing platform for buyers.
                    </p>
                  </div>
                </section>
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