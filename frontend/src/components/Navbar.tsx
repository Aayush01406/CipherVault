"use client";

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Shield, LogOut, User, Menu, X, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NavLink = ({ href, children }) => (
  <Link 
    href={href} 
    className="text-sm font-medium text-slate-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white transition-all duration-300 relative group"
  >
    {children}
    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 transition-all duration-300 group-hover:w-full" />
  </Link>
);

const Navbar = () => {
  const { user, signInWithGoogle, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
      scrolled 
        ? 'py-3 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 shadow-2xl dark:shadow-black/40' 
        : 'py-6 bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-3 group relative">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/30 blur-2xl rounded-full group-hover:bg-indigo-500/50 transition-all duration-500 opacity-0 group-hover:opacity-100" />
              <div className="relative p-1.5 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 group-hover:border-indigo-500/30 transition-all duration-500 shadow-xl">
                <Shield className="w-6 h-6 text-indigo-500 dark:text-indigo-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-transform group-hover:scale-110 duration-500" />
              </div>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-200 transition-colors duration-500">
              CipherVault
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <NavLink href="/#features">Features</NavLink>
            {user ? (
              <>
                <NavLink href="/dashboard">Vault</NavLink>
                <NavLink href="/encrypt">Encrypt</NavLink>
                <NavLink href="/decrypt">Decrypt</NavLink>
                
                <div className="flex items-center space-x-4 ml-4 pl-8 border-l border-slate-200 dark:border-white/10">
                  <Link href="/settings" className="relative group p-0.5 rounded-full transition-all duration-500 hover:ring-2 hover:ring-indigo-500/30">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-slate-200 dark:border-white/10 shadow-lg" />
                    ) : (
                      <div className="w-8 h-8 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center border border-slate-200 dark:border-white/10">
                        <User className="w-4 h-4 text-slate-400 dark:text-slate-400" />
                      </div>
                    )}
                  </Link>
                  <button
                    onClick={logout}
                    className="p-2 text-slate-400 hover:text-rose-500 transition-all duration-300 hover:bg-rose-500/10 rounded-lg group"
                    title="Logout"
                  >
                    <LogOut className="w-4.5 h-4.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="premium-button py-2 px-6 text-sm flex items-center gap-2 group h-10"
              >
                Sign In
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>


          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400 hover:text-white transition-all"
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
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-full left-0 w-full bg-[#030712]/95 backdrop-blur-2xl border-b border-slate-800/50 overflow-hidden shadow-2xl"
          >
            <div className="px-6 py-8 space-y-4">
              <Link
                href="/#features"
                className="flex items-center justify-between px-4 py-4 rounded-2xl bg-slate-900/50 text-base font-bold text-slate-300 hover:text-white border border-slate-800/50"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
                <ChevronRight className="w-4 h-4" />
              </Link>
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="flex items-center justify-between px-4 py-4 rounded-2xl bg-slate-900/50 text-base font-bold text-slate-300 hover:text-white border border-slate-800/50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Vault
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/encrypt"
                    className="flex items-center justify-between px-4 py-4 rounded-2xl bg-slate-900/50 text-base font-bold text-slate-300 hover:text-white border border-slate-800/50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Encrypt
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/decrypt"
                    className="flex items-center justify-between px-4 py-4 rounded-2xl bg-slate-900/50 text-base font-bold text-slate-300 hover:text-white border border-slate-800/50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Decrypt
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center justify-between w-full px-4 py-4 rounded-2xl bg-red-500/5 text-base font-bold text-red-400 border border-red-500/10"
                  >
                    Logout
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    signInWithGoogle();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center justify-between w-full px-4 py-4 rounded-2xl bg-indigo-600 text-base font-bold text-white shadow-lg shadow-indigo-500/20"
                >
                  Sign In
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
