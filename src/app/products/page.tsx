'use client';

import Link from "next/link";
import { useState } from "react";

export default function Products() {

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const categories = [
    {
      name: 'Industrial Chemicals',
      description: 'High-performance chemicals for manufacturing processes',
      image: 'bg-gray-100'
    },
    {
      name: 'Agricultural Solutions',
      description: 'Specialty chemicals for enhanced crop production',
      image: 'bg-gray-100'
    },
    {
      name: 'Pharmaceutical',
      description: 'API intermediates and fine chemicals',
      image: 'bg-gray-100'
    },
    {
      name: 'Water Treatment',
      description: 'Chemicals for purification and waste management',
      image: 'bg-gray-100'
    }
  ];

  return (
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
                ['About', '/about'],
                ['Products', '/products'],
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
              <button className="ml-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
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
                ['About', '/about'],
                ['Products', '/products'],
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
      <main className="flex-1">
        <div className="py-20 bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Our Product Portfolio
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Comprehensive range of chemical solutions for diverse industrial applications
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {categories.map((category, index) => (
                <div key={index} className="group bg-white dark:bg-gray-700 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                  <div className={`${category.image} h-48 rounded-t-xl dark:bg-gray-600`}></div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                      {category.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
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
                {['About Us', 'Products', 'Case Studies', 'Blog'].map((link) => (
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
  );
}