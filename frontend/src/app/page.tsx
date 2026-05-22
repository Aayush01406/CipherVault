"use client";

import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { Shield, Lock, Share2, Eye, Download, Zap, Globe } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, signInWithGoogle } = useAuth();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    },
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#02040c]">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-44 pb-32 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] animate-blob" />
          <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px] animate-blob animation-delay-2000" />
          <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-blue-600/10 blur-[120px] animate-blob animation-delay-4000" />
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center"
          >
            <motion.div 
              variants={itemVariants}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-indigo-500/5 border border-indigo-500/10 text-indigo-400 text-sm font-medium mb-8 backdrop-blur-sm"
            >
              <Zap className="w-4 h-4 fill-indigo-400" />
              <span>Next-Generation File Security</span>
            </motion.div>

            <motion.h1 
              variants={itemVariants}
              className="text-6xl md:text-8xl font-bold tracking-tight mb-8 leading-[1.1]"
            >
              Security that <br />
              <span className="premium-gradient-text">
                cannot be compromised.
              </span>
            </motion.h1>
            
            <motion.p 
              variants={itemVariants}
              className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed"
            >
              CipherVault uses military-grade client-side encryption to ensure your sensitive data 
              remains yours. No backdoors. No compromises.
            </motion.p>

            <motion.div 
              variants={itemVariants}
              className="flex flex-wrap justify-center gap-6"
            >
              {user ? (
                <Link href="/dashboard">
                  <Button size="lg" className="h-14 px-10 rounded-2xl text-lg">
                    Enter the Vault
                  </Button>
                </Link>
              ) : (
                <Button size="lg" className="h-14 px-10 rounded-2xl text-lg" onClick={signInWithGoogle}>
                  Get Started for Free
                </Button>
              )}
              <Link href="#features">
                <Button variant="outline" size="lg" className="h-14 px-10 rounded-2xl text-lg border-white/5 bg-white/5 backdrop-blur-sm">
                  View Features
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Dashboard Preview Mockup */}
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-32 relative mx-auto max-w-5xl"
          >
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000" />
              <div className="relative rounded-2xl border border-white/10 bg-slate-950/40 p-2 backdrop-blur-2xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500/40" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/40" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/40" />
                  </div>
                  <div className="px-3 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] text-slate-500 font-mono">
                    vault.ciphervault.io/secure
                  </div>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-40 rounded-2xl bg-white/[0.03] border border-white/[0.05] animate-pulse relative overflow-hidden">
                      <div className="absolute inset-0 shimmer" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Designed for Absolute Privacy</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">We've built CipherVault with a security-first mindset, ensuring your data is protected at every step.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Lock className="w-6 h-6 text-indigo-400" />}
              title="AES-256 Encryption"
              description="Your data is encrypted using the Advanced Encryption Standard with a 256-bit key length, the same standard used by governments."
            />
            <FeatureCard 
              icon={<Share2 className="w-6 h-6 text-purple-400" />}
              title="Secure Links"
              description="Share files with time-limited links that automatically expire. You have complete control over who sees what and for how long."
            />
            <FeatureCard 
              icon={<Shield className="w-6 h-6 text-emerald-400" />}
              title="Zero-Knowledge"
              description="We never store your passwords or keys. Decryption only happens on your device, meaning we can't access your files even if we wanted to."
            />
          </div>
        </div>
      </section>

      {/* Security Explanation */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 opacity-30">
          <div className="absolute top-0 right-0 w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px]" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="flex-1">
              <h2 className="text-4xl font-bold mb-12">Security by Design</h2>
              <div className="space-y-12">
                <Step 
                  number="01"
                  title="Zero-Knowledge Architecture"
                  description="Everything is encrypted locally in your browser. We never see your password, and we never have access to your keys."
                />
                <Step 
                  number="02"
                  title="Advanced Key Derivation"
                  description="We use PBKDF2 with 100,000 iterations to derive strong encryption keys from your password, protecting against brute-force attacks."
                />
                <Step 
                  number="03"
                  title="Secure Cloud Storage"
                  description="Your encrypted blobs are stored in secure, redundant data centers. Even in the event of a breach, your data remains unreadable."
                />
              </div>
            </div>
            <div className="flex-1 relative">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-[40px] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000" />
                <div className="relative aspect-square rounded-[40px] bg-slate-900/50 flex items-center justify-center border border-white/10 backdrop-blur-xl">
                  <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full animate-pulse-slow" />
                    <Shield className="w-40 h-40 text-indigo-500 relative animate-float" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-12 border-t border-slate-800 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-indigo-500" />
              <span className="text-lg font-bold">CipherVault</span>
            </div>
            <div className="flex space-x-6 text-sm text-slate-400">
              <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="#" className="hover:text-white transition-colors">Documentation</Link>
            </div>
            <div className="flex items-center space-x-4">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Globe className="w-5 h-5" />
              </a>
            </div>
          </div>
          <div className="mt-8 text-center text-xs text-slate-500">
            © 2026 CipherVault. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="p-10 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-md hover:bg-white/[0.04] hover:border-indigo-500/20 transition-all duration-500 group"
    >
      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-500">
        {icon}
      </div>
      <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-indigo-300 transition-colors">{title}</h3>
      <p className="text-slate-400 leading-relaxed text-lg">{description}</p>
    </motion.div>
  );
}

function Step({ number, title, description }: { number: string, title: string, description: string }) {
  return (
    <div className="flex gap-8 group">
      <div className="flex-shrink-0 w-12 h-12 rounded-full border border-indigo-500/20 bg-indigo-500/5 flex items-center justify-center text-indigo-400 font-mono font-bold group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500">
        {number}
      </div>
      <div>
        <h4 className="text-xl font-bold mb-2 text-white group-hover:text-indigo-300 transition-colors">{title}</h4>
        <p className="text-slate-400 text-lg leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
