"use client";

import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { Shield, Lock, Share2, Eye, Download, Zap, Globe, ChevronRight, ArrowRight, CheckCircle2, Activity } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, signInWithGoogle } = useAuth();

  const fadeIn = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    },
  };

  const stagger = {
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0c10] selection:bg-blue-500/30">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-40 pb-24 overflow-hidden mesh-gradient">
        {/* Animated Security Pulse */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px] animate-pulse pointer-events-none" />
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] animate-blob pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="flex-1 text-left"
            >
              <motion.div 
                variants={fadeIn}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-900/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6 uppercase tracking-wider"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Enterprise Data Protection</span>
              </motion.div>

              <motion.h1 
                variants={fadeIn}
                className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.15] text-white"
              >
                Zero-Knowledge <br />
                <span className="text-blue-500">
                  Vault Infrastructure
                </span>
              </motion.h1>
              
              <motion.p 
                variants={fadeIn}
                className="text-lg text-slate-400 max-w-xl mb-10 leading-relaxed"
              >
                Deploy industrial-grade client-side encryption for your sensitive assets. 
                CipherVault provides a mathematically secure environment for data storage and peer-to-peer sharing.
              </motion.p>

              <motion.div 
                variants={fadeIn}
                className="flex flex-wrap gap-4"
              >
                {user ? (
                  <Link href="/dashboard" className="primary-button h-12 px-8">
                    Access My Vault
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <button onClick={signInWithGoogle} className="primary-button h-12 px-8">
                    Start Secure Deployment
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                <Link href="#features" className="secondary-button h-12 px-8">
                  Technical Overview
                </Link>
              </motion.div>

              <motion.div 
                variants={fadeIn}
                className="mt-12 flex items-center gap-8 border-t border-white/5 pt-8"
              >
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-white">AES-256</span>
                  <span className="text-xs text-slate-500 uppercase tracking-widest">Encryption Standard</span>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-white">100k+</span>
                  <span className="text-xs text-slate-500 uppercase tracking-widest">PBKDF2 Iterations</span>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex-1 relative w-full group"
            >
              {/* Background glow for the illustration */}
              <div className="absolute -inset-4 bg-blue-500/10 blur-3xl rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="relative glass-card rounded-2xl p-1 shadow-2xl border-white/5 bg-slate-900/40 backdrop-blur-3xl overflow-hidden">
                {/* Browser Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 bg-[#0a0c12]/80">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-800" />
                    <div className="w-3 h-3 rounded-full bg-slate-800" />
                    <div className="w-3 h-3 rounded-full bg-slate-800" />
                  </div>
                  <div className="px-4 py-1 rounded-full bg-white/[0.03] border border-white/5 text-[10px] text-slate-500 font-mono tracking-wide flex items-center gap-2">
                    <Lock className="w-3 h-3 text-blue-500/50" />
                    vault.ciphervault.io/terminal
                  </div>
                  <div className="w-12" /> {/* Spacer */}
                </div>

                {/* Dashboard Content */}
                <div className="bg-[#0d111a] p-8 space-y-8">
                  {/* Top Stats Row */}
                  <div className="grid grid-cols-3 gap-5">
                    {[
                      { label: 'Security Score', value: '98%', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                      { label: 'Active Vaults', value: '1,204', color: 'text-blue-400', bg: 'bg-blue-400/10' },
                      { label: 'Threats Blocked', value: '0', color: 'text-slate-400', bg: 'bg-slate-400/10' }
                    ].map((stat, i) => (
                      <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</div>
                        <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Main Content Area */}
                  <div className="grid grid-cols-12 gap-6">
                    {/* Activity Feed */}
                    <div className="col-span-7 space-y-4">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Activity className="w-3 h-3" />
                        Live Security Feed
                      </div>
                      <div className="space-y-3">
                        {[
                          { action: 'AES-256 Key Derivation', time: '2ms ago', status: 'Verified' },
                          { action: 'Vault Asset Provisioned', time: '12s ago', status: 'Success' },
                          { action: 'PBKDF2 Hash Iteration', time: '45s ago', status: 'Complete' }
                        ].map((log, i) => (
                          <div key={i} className="flex items-center justify-between p-3.5 rounded-lg bg-white/[0.01] border border-white/[0.03]">
                            <div className="flex items-center gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                              <span className="text-[11px] font-medium text-slate-300">{log.action}</span>
                            </div>
                            <span className="text-[9px] font-mono text-slate-600 uppercase">{log.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Encryption Visualization */}
                    <div className="col-span-5 flex flex-col justify-between">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Encryption Load</div>
                      <div className="flex-1 flex flex-col justify-center space-y-5">
                        {[65, 42, 88].map((val, i) => (
                          <div key={i} className="space-y-1.5">
                            <div className="flex justify-between text-[9px] font-mono text-slate-500">
                              <span>NODE_{i+1}</span>
                              <span>{val}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${val}%` }}
                                transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                                className={`h-full rounded-full ${i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-indigo-500' : 'bg-purple-500'}`} 
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer status bar */}
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocol Active</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-600">ID: CV-992-PX</div>
                    </div>
                    <div className="p-1 rounded-md bg-blue-500/10 border border-blue-500/20">
                      <Shield className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold text-white mb-4">Architected for Trust</h2>
              <p className="text-slate-400">CipherVault integrates advanced cryptographic protocols with a minimal surface area for potential exploits.</p>
            </div>
            <Link href="/dashboard" className="text-blue-400 font-medium text-sm flex items-center gap-1.5 hover:underline">
              Explore technical docs <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Lock className="w-5 h-5 text-blue-400" />}
              title="End-to-End Encryption"
              description="Payloads are encrypted using AES-GCM-256 before leaving the client environment. Keys never touch our servers."
            />
            <FeatureCard 
              icon={<Share2 className="w-5 h-5 text-blue-400" />}
              title="Transient Linkage"
              description="Secure sharing via temporary, signed URLs with configurable TTL and maximum access counters."
            />
            <FeatureCard 
              icon={<Shield className="w-5 h-5 text-blue-400" />}
              title="Audit Log Infrastructure"
              description="Immutable records of all vault operations, providing a clear chain of custody for enterprise compliance."
            />
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="glass-card p-6 rounded-xl aspect-square flex flex-col justify-center items-center text-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-4" />
                    <span className="font-bold text-white">GDPR Compliant</span>
                  </div>
                  <div className="glass-card p-6 rounded-xl aspect-square flex flex-col justify-center items-center text-center bg-blue-600/10 border-blue-600/20">
                    <Shield className="w-10 h-10 text-blue-400 mb-4" />
                    <span className="font-bold text-blue-400">SOC 2 Type II</span>
                  </div>
                </div>
                <div className="space-y-6 pt-12">
                  <div className="glass-card p-6 rounded-xl aspect-square flex flex-col justify-center items-center text-center">
                    <Globe className="w-10 h-10 text-blue-500 mb-4" />
                    <span className="font-bold text-white">Global Nodes</span>
                  </div>
                  <div className="glass-card p-6 rounded-xl aspect-square flex flex-col justify-center items-center text-center">
                    <Zap className="w-10 h-10 text-amber-500 mb-4" />
                    <span className="font-bold text-white">99.9% Uptime</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <h2 className="text-4xl font-bold text-white mb-8 tracking-tight">Enterprise-Grade <br />Security Framework</h2>
              <div className="space-y-8">
                <div className="flex items-start gap-5 group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/20 transition-all duration-300 shadow-lg shadow-blue-500/5">
                    <Lock className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">Zero-Trust Architecture</h3>
                    <p className="text-slate-400 leading-relaxed text-sm">We assume the network is always compromised. Every transaction requires cryptographic proof of identity.</p>
                  </div>
                </div>
                <div className="flex items-start gap-5 group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/20 transition-all duration-300 shadow-lg shadow-indigo-500/5">
                    <Eye className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">Immutable Audit Trails</h3>
                    <p className="text-slate-400 leading-relaxed text-sm">Full visibility into who accessed what, when, and from where. Perfect for regulatory compliance audits.</p>
                  </div>
                </div>
              </div>
              <button onClick={signInWithGoogle} className="mt-12 primary-button px-10">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-16 border-t border-white/5 bg-[#0a0c10]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2.5 mb-6">
                <div className="p-1 rounded-lg bg-blue-600">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">CipherVault</span>
              </div>
              <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
                The world's most advanced client-side encryption platform for professional data management.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-wider">Product</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Infrastructure</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Security Audit</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Data Privacy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li><Link href="#" className="hover:text-blue-600 transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Compliance</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Trust Center</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-xs text-slate-400 uppercase tracking-widest font-medium">
              © 2026 CipherVault Systems Inc. • ISO 27001 Certified
            </div>
            <div className="flex space-x-8 text-xs text-slate-400 font-medium">
              <Link href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-blue-600 transition-colors">Terms of Use</Link>
              <Link href="#" className="hover:text-blue-600 transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="glass-card p-10 rounded-2xl hover:bg-slate-900/80 group transition-all duration-500 hover:-translate-y-2 border-white/5 hover:border-blue-500/30">
      <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-500 border border-blue-500/20 shadow-lg shadow-blue-500/5">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-4 text-white group-hover:text-blue-400 transition-colors duration-300 tracking-tight">{title}</h3>
      <p className="text-slate-400 leading-relaxed text-sm group-hover:text-slate-300 transition-colors duration-300">{description}</p>
    </div>
  );
}
