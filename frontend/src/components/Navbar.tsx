"use client";

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Shield, LogOut, User, Menu, X, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link 
    href={href} 
    className="text-sm font-medium text-slate-400 hover:text-white transition-colors duration-200 py-2 relative group"
  >
    {children}
    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full" />
  </Link>
);

const Navbar = () => {
  const { user, signInWithGoogle, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      scrolled 
        ? 'py-3 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 shadow-lg' 
        : 'py-6 bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="p-2 rounded-xl bg-blue-600/10 border border-blue-600/20 group-hover:bg-blue-600/20 transition-all">
              <Shield className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              CipherVault
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <NavLink href="/#features">Solutions</NavLink>
            {user ? (
              <>
                <NavLink href="/dashboard">Vault</NavLink>
                <NavLink href="/encrypt">Encrypt</NavLink>
                <NavLink href="/decrypt">Decrypt</NavLink>
                
                <div className="flex items-center space-x-5 ml-4 pl-8 border-l border-white/10">
                  <Link href="/settings" className="relative p-0.5 rounded-full hover:ring-2 hover:ring-blue-500/20 transition-all">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-white/10" />
                    ) : (
                      <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center border border-white/10">
                        <User className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                  </Link>
                  <button
                    onClick={logout}
                    className="p-2 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4.5 h-4.5" />
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="primary-button h-10 px-6"
              >
                Sign In
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-slate-900 border-b border-white/5 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              <Link href="/#features" className="block px-3 py-2 text-base font-medium text-slate-400 hover:text-white">Features</Link>
              {user ? (
                <>
                  <Link href="/dashboard" className="block px-3 py-2 text-base font-medium text-slate-400 hover:text-white">Vault</Link>
                  <Link href="/encrypt" className="block px-3 py-2 text-base font-medium text-slate-400 hover:text-white">Encrypt</Link>
                  <Link href="/decrypt" className="block px-3 py-2 text-base font-medium text-slate-400 hover:text-white">Decrypt</Link>
                  <Link href="/settings" className="block px-3 py-2 text-base font-medium text-slate-400 hover:text-white">Settings</Link>
                  <button onClick={logout} className="w-full text-left px-3 py-2 text-base font-medium text-rose-400">Sign Out</button>
                </>
              ) : (
                <button onClick={signInWithGoogle} className="w-full mt-4 primary-button">Sign In</button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
