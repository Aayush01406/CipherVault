"use client";

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Shield, LogOut, User, Menu, X, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  
  return (
    <Link 
      href={href} 
      className={`text-sm font-medium transition-all duration-200 ${
        isActive ? 'text-primary' : 'text-text-secondary hover:text-primary'
      }`}
    >
      {children}
    </Link>
  );
};

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
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      scrolled 
        ? 'py-4 bg-background/80 backdrop-blur-md border-b border-border-subtle shadow-sm' 
        : 'py-6 bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="p-2 rounded-lg bg-white/5 border border-white/10 group-hover:bg-white/10 transition-all duration-200">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight text-primary">
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
                
                <div className="flex items-center space-x-6 ml-6 pl-6 border-l border-white/10">
                  <Link href="/settings" className="relative p-0.5 rounded-full hover:opacity-80 transition-opacity">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-white/10" />
                    ) : (
                      <div className="w-8 h-8 bg-card rounded-full flex items-center justify-center border border-white/10">
                        <User className="w-4 h-4 text-text-secondary" />
                      </div>
                    )}
                  </Link>
                  <button
                    onClick={logout}
                    className="p-2 text-text-secondary hover:text-primary transition-colors"
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
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-white/5"
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
            className="md:hidden bg-surface border-b border-border-subtle overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              <Link href="/#features" className="block px-3 py-2 text-base font-medium text-text-secondary hover:text-primary transition-colors">Solutions</Link>
              {user ? (
                <>
                  <Link href="/dashboard" className="block px-3 py-2 text-base font-medium text-text-secondary hover:text-primary transition-colors">Vault</Link>
                  <Link href="/encrypt" className="block px-3 py-2 text-base font-medium text-text-secondary hover:text-primary transition-colors">Encrypt</Link>
                  <Link href="/decrypt" className="block px-3 py-2 text-base font-medium text-text-secondary hover:text-primary transition-colors">Decrypt</Link>
                  <Link href="/settings" className="block px-3 py-2 text-base font-medium text-text-secondary hover:text-primary transition-colors">Settings</Link>
                  <button 
                    onClick={logout} 
                    className="w-full text-left px-3 py-2 text-base font-medium text-danger hover:opacity-80 transition-opacity"
                  >
                    Sign Out
                  </button>
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
