"use client";

import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "next/navigation";
import { User, Shield, Moon, Sun, Trash2, LogOut, ChevronRight, Bell, Monitor, Globe, Key, Settings, Eye, Lock, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const { user, loading, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  
  const [sessionLock, setSessionLock] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');

  useEffect(() => {
    const savedLock = localStorage.getItem("sessionLock");
    if (savedLock !== null) setSessionLock(savedLock === "true");
  }, []);

  const toggleSessionLock = () => {
    const newVal = !sessionLock;
    setSessionLock(newVal);
    localStorage.setItem("sessionLock", String(newVal));
    toast.success(`Security policy updated`);
  };

  if (!loading && !user) {
    router.push("/");
    return null;
  }

  if (loading) return null;

  return (
    <div className="flex flex-col min-h-screen bg-background text-primary selection:bg-security/30">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/5 border border-border-subtle flex items-center justify-center">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-primary">Environment Configuration</h1>
            </div>
            <p className="text-text-secondary text-lg">Manage your identity, security protocols, and session behavior.</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Sidebar Nav */}
            <div className="lg:col-span-3 space-y-2">
              {[
                { id: 'profile', icon: <User className="w-4 h-4" />, label: 'Profile' },
                { id: 'security', icon: <Shield className="w-4 h-4" />, label: 'Security' },
                { id: 'preferences', icon: <Eye className="w-4 h-4" />, label: 'Preferences' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 border-l-2 ${
                    activeTab === item.id 
                      ? 'bg-primary/5 text-primary border-security' 
                      : 'text-text-muted hover:text-primary hover:bg-primary/[0.03] border-transparent'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="lg:col-span-9">
              <AnimatePresence mode="wait">
                {activeTab === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="glass-card p-10"
                  >
                    <h2 className="text-xl font-bold mb-8 flex items-center gap-3 text-primary">
                      <User className="w-5 h-5 text-primary" />
                      Profile Identity
                    </h2>
                    
                    <div className="p-8 rounded-3xl bg-surface border border-border-subtle mb-10">
                      <div className="flex items-center gap-8">
                        <div className="relative group">
                          {user?.photoURL ? (
                            <img src={user.photoURL} alt="Profile" className="w-24 h-24 rounded-3xl border-2 border-border-subtle group-hover:border-security/50 transition-all" />
                          ) : (
                            <div className="w-24 h-24 bg-elevated rounded-3xl flex items-center justify-center border-2 border-border-subtle group-hover:border-security/50 transition-all">
                              <User className="w-10 h-10 text-text-muted" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-2xl font-bold text-primary">{user?.displayName}</h3>
                          <p className="text-text-secondary flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-security animate-pulse" />
                            Verified Security Principal
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5">
                      <div className="p-6 rounded-2xl bg-surface border border-border-subtle">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3 block px-1">Network Address</label>
                        <p className="text-primary font-mono text-sm">{user?.email}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'security' && (
                  <motion.div
                    key="security"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="glass-card p-10"
                  >
                    <h2 className="text-xl font-bold mb-8 flex items-center gap-3 text-primary">
                      <Shield className="w-5 h-5 text-primary" />
                      Security Protocols
                    </h2>

                    <div className="space-y-4">
                      <SettingItem 
                        title="Automatic Session Lock"
                        description="Locks the vault after 15 minutes of inactivity."
                        toggle
                        checked={sessionLock}
                        onClick={toggleSessionLock}
                      />
                      <SettingItem 
                        title="Two-Factor Authentication"
                        description="Add an extra layer of protection to your account."
                        disabled
                      />
                      <div className="pt-8">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-6 px-1">Destructive Operations</h3>
                        <button 
                          onClick={() => { if(confirm("Permanently erase all vault data?")) toast.error("Operation restricted") }}
                          className="flex items-center justify-between w-full p-5 rounded-lg bg-danger/5 border border-danger/20 text-danger hover:bg-danger/10 transition-all group"
                        >
                          <div className="text-left">
                            <h4 className="font-bold text-sm">Decommission Vault</h4>
                            <p className="text-xs opacity-70">Permanently delete all encrypted assets and node metadata.</p>
                          </div>
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'preferences' && (
                  <motion.div
                    key="preferences"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="glass-card p-10"
                  >
                    <h2 className="text-xl font-bold mb-8 flex items-center gap-3 text-primary">
                      <Eye className="w-5 h-5 text-primary" />
                      Environment Preferences
                    </h2>

                    <div className="space-y-8">
                      <div className="p-8 rounded-3xl bg-primary/[0.02] border border-border-subtle">
                        <h3 className="font-bold text-primary mb-6">Visual Environment</h3>
                        <div className="grid grid-cols-2 gap-5">
                          <button 
                            onClick={() => setTheme('dark')}
                            className={`p-6 rounded-2xl transition-all flex flex-col items-center gap-3 ${theme === 'dark' ? 'bg-primary/10 border border-border-subtle text-primary shadow-premium' : 'bg-primary/[0.02] border border-transparent text-text-muted hover:bg-primary/5'}`}
                          >
                            <div className="w-full h-12 bg-[#050505] rounded-lg border border-border-subtle flex items-center px-3">
                              <div className={`w-3 h-3 rounded-full ${theme === 'dark' ? 'bg-security' : 'bg-primary/20'}`} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest">Premium Dark</span>
                          </button>
                          <button 
                            onClick={() => setTheme('light')}
                            className={`p-6 rounded-2xl transition-all flex flex-col items-center gap-3 ${theme === 'light' ? 'bg-primary/10 border border-border-subtle text-primary shadow-premium' : 'bg-primary/[0.02] border border-transparent text-text-muted hover:bg-primary/5'}`}
                          >
                            <div className="w-full h-12 bg-slate-100 rounded-lg border border-black/10 flex items-center px-3">
                              <div className={`w-3 h-3 rounded-full ${theme === 'light' ? 'bg-security' : 'bg-black/10'}`} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest">Executive Light</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function SettingItem({ title, description, onClick, toggle, checked, disabled }: any) {
  return (
    <div 
      onClick={!disabled ? onClick : undefined}
      className={`flex items-center justify-between p-5 rounded-lg bg-primary/[0.02] border border-border-subtle transition-all ${!disabled && onClick ? 'cursor-pointer hover:border-security/30' : ''} ${disabled ? 'opacity-50' : ''}`}
    >
      <div>
        <h4 className="font-bold text-primary text-sm">{title}</h4>
        <p className="text-xs text-text-muted">{description}</p>
      </div>
      {toggle ? (
        <div className={`w-11 h-6 rounded-full p-1 transition-all ${checked ? 'bg-security' : 'bg-primary/10'}`}>
          <div className={`w-4 h-4 rounded-full bg-white transition-all ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
        </div>
      ) : (
        <ChevronRight className="w-4 h-4 text-text-muted" />
      )}
    </div>
  );
}
