"use client";

import Navbar from "@/components/Navbar";
import { motion, Variants } from "framer-motion";
import { Shield, Lock, Share2, Eye, Download, Zap, Globe, ChevronRight, ArrowRight, CheckCircle2, Activity } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, signInWithGoogle } = useAuth();

  const fadeIn: Variants = {
  hidden: {
    opacity: 0,
    y: 15,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

  const stagger: Variants = {
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

  return (
    <div className="flex flex-col min-h-screen bg-background selection:bg-primary/10">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 overflow-hidden bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="flex flex-col items-center"
          >
            <motion.div
              variants={fadeIn}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-border-subtle text-text-secondary text-[11px] font-bold mb-10 uppercase tracking-[0.15em]"
            >
              <Shield className="w-3.5 h-3.5 text-security" />
              <span>Enterprise Data Protection</span>
            </motion.div>

            <motion.h1
              variants={fadeIn}
              className="text-6xl md:text-8xl font-bold tracking-tight mb-8 leading-[1.05] text-primary max-w-4xl"
            >
              Zero-Knowledge <br />
              Vault Infrastructure
            </motion.h1>

            <motion.p
              variants={fadeIn}
              className="text-xl text-text-secondary max-w-2xl mb-12 leading-relaxed"
            >
              Deploy industrial-grade client-side encryption for your sensitive assets.
              Mathematically secure environment for data storage and peer-to-peer sharing.
            </motion.p>

            <motion.div
              variants={fadeIn}
              className="flex flex-wrap justify-center gap-4"
            >
              {user ? (
                <Link href="/dashboard" className="primary-button h-14 px-10 text-base">
                  Access My Vault
                </Link>
              ) : (
                <button onClick={signInWithGoogle} className="primary-button h-14 px-10 text-base">
                  Start Secure Deployment
                </button>
              )}
              <Link href="#features" className="secondary-button h-14 px-10 text-base">
                Technical Overview
              </Link>
            </motion.div>

            <motion.div
              variants={fadeIn}
              className="mt-20 flex items-center justify-center gap-12"
            >
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-primary tracking-tight">AES-256</span>
                <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold mt-1">Standard</span>
              </div>
              <div className="w-px h-8 bg-border-subtle" />
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-primary tracking-tight">100k+</span>
                <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold mt-1">Iterations</span>
              </div>
              <div className="w-px h-8 bg-border-subtle" />
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-primary tracking-tight">E2EE</span>
                <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold mt-1">Protocol</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 bg-surface border-y border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="order-2 lg:order-1">
              <div className="flex items-center gap-10">
                <div className="space-y-6">
                  <div className="glass-card p-10 aspect-square flex flex-col justify-center items-center text-center bg-primary/5">
                    <Lock className="w-10 h-10 text-text-primary mb-6" />
                    <span className="text-xs font-bold text-text-primary tracking-widest uppercase">GDPR Compliant</span>
                  </div>
                  <div className="glass-card p-10 aspect-square flex flex-col justify-center items-center text-center bg-primary/5">
                    <Shield className="w-10 h-10 text-text-primary mb-6" />
                    <span className="text-xs font-bold text-text-primary tracking-widest uppercase">SOC 2 Type II</span>
                  </div>
                </div>
                <div className="space-y-6 pt-12">
                  <div className="glass-card p-10 aspect-square flex flex-col justify-center items-center text-center bg-primary/5">
                    <Globe className="w-10 h-10 text-text-primary mb-6" />
                    <span className="text-xs font-bold text-text-primary tracking-widest uppercase">Global Nodes</span>
                  </div>
                  <div className="glass-card p-10 aspect-square flex flex-col justify-center items-center text-center bg-primary/5">
                    <Zap className="w-10 h-10 text-text-primary mb-6" />
                    <span className="text-xs font-bold text-text-primary tracking-widest uppercase">99.9% Uptime</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <h2 className="text-4xl font-bold text-text-primary mb-10 tracking-tight leading-tight">Enterprise-Grade <br />Security Framework</h2>
              <div className="space-y-10">
                <FeatureItem 
                  icon={<Lock className="w-6 h-6" />}
                  title="Client-Side Encryption"
                  description="All data is encrypted in the browser using the Web Crypto API. Your master key never leaves your device."
                />
                <FeatureItem 
                  icon={<Share2 className="w-6 h-6" />}
                  title="Secure Key Exchange"
                  description="Share links are protected with PBKDF2-derived keys and unique IVs for every transaction."
                />
                <FeatureItem 
                  icon={<Activity className="w-6 h-6" />}
                  title="Cryptographic Audit Logs"
                  description="Full transparency into vault operations with signed activity logs and real-time monitoring."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-border-subtle bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-10">
            <div className="p-1.5 rounded-lg bg-primary">
              <Shield className="w-5 h-5 text-background" />
            </div>
            <span className="text-xl font-bold text-primary tracking-tight">CipherVault</span>
          </div>
          <div className="flex flex-wrap justify-center gap-10 mb-12 text-sm text-text-secondary">
            <Link href="#" className="hover:text-primary transition-colors">Infrastructure</Link>
            <Link href="#" className="hover:text-primary transition-colors">Compliance</Link>
            <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-primary transition-colors">Trust Center</Link>
          </div>
          <div className="text-[10px] text-text-muted uppercase tracking-[0.3em] font-bold">
            © 2026 CipherVault Systems Inc. • ISO 27001 Certified
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="glass-card p-10 hover:bg-elevated group">
      <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center mb-8 border border-border-subtle">
        {icon}
      </div>
      <h3 className="text-lg font-bold mb-4 text-primary tracking-tight">{title}</h3>
      <p className="text-text-secondary leading-relaxed text-sm">{description}</p>
    </div>
  );
}

function FeatureItem({ icon, title, description }: any) {
  return (
    <div className="flex gap-6 group">
      <div className="w-12 h-12 rounded-xl bg-primary/5 border border-border-subtle flex items-center justify-center text-security group-hover:bg-security/10 transition-all duration-300">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-bold text-text-primary mb-2">{title}</h3>
        <p className="text-text-secondary leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
