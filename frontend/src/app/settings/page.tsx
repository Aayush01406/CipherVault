"use client";

import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { User, Shield, Moon, Sun, Trash2, LogOut, ChevronRight } from "lucide-react";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";

import { useState, useEffect } from "react";

export default function SettingsPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  
  const [sessionLock, setSessionLock] = useState(true);
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const savedLock = localStorage.getItem("sessionLock");
    const savedTheme = localStorage.getItem("theme");
    if (savedLock !== null) setSessionLock(savedLock === "true");
    if (savedTheme !== null) setTheme(savedTheme);
  }, []);

  const toggleSessionLock = () => {
    const newVal = !sessionLock;
    setSessionLock(newVal);
    localStorage.setItem("sessionLock", String(newVal));
    toast.success(`Session lock ${newVal ? "enabled" : "disabled"}`);
  };

  const toggleTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    toast.success(`Theme set to ${newTheme}`);
  };

  if (!loading && !user) {
    router.push("/");
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#02040c]">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Shield className="w-8 h-8 text-indigo-500 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#02040c] dark:text-slate-200 selection:bg-indigo-500/30 transition-colors duration-300">
      <Navbar />
      
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] animate-blob" />
        <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px] animate-blob animation-delay-2000" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <main className="flex-1 pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <User className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="text-sm font-bold uppercase tracking-widest text-indigo-400/80">User Preferences</span>
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-4 text-slate-900 dark:text-white">
            Account <span className="premium-gradient-text">Settings</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl leading-relaxed">
            Manage your account security, personal preferences, and vault accessibility.
          </p>
        </motion.div>

        <div className="space-y-8">
          {/* Profile Section */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-[2rem] p-8 md:p-10"
          >
            <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-10 flex items-center gap-3">
              <User className="w-5 h-5 text-indigo-400" />
              Account Identity
            </h2>
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-500" />
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="relative w-28 h-28 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl" />
                ) : (
                  <div className="relative w-28 h-28 bg-white dark:bg-slate-900 rounded-3xl flex items-center justify-center border border-slate-200 dark:border-white/10 shadow-2xl">
                    <User className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                  </div>
                )}
              </div>
              <div className="text-center md:text-left flex-1">
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{user?.displayName}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-lg mb-4">{user?.email}</p>
                <div className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Google Verified Identity
                </div>
              </div>
            </div>
          </motion.section>

          {/* Security Section */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-[2rem] p-8 md:p-10"
          >
            <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-10 flex items-center gap-3">
              <Shield className="w-5 h-5 text-purple-400" />
              Privacy Infrastructure
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <SettingItem 
                title="Managed Authentication" 
                description="Encryption keys are linked to your identity provider."
                badge="Immutable"
              />
              <SettingItem 
                title="Automatic Session Lock" 
                description="Securely terminates your session after 15 minutes of inactivity."
                toggle
                checked={sessionLock}
                onClick={toggleSessionLock}
              />
            </div>
          </motion.section>

          {/* Preferences Section */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-[2rem] p-8 md:p-10"
          >
            <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-10 flex items-center gap-3">
              <Sun className="w-5 h-5 text-amber-400" />
              Interface Settings
            </h2>
            <div className="flex items-center justify-between p-6 rounded-2xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
              <div>
                <h4 className="font-bold text-lg text-slate-900 dark:text-white">Visual Theme</h4>
                <p className="text-slate-500">Currently optimized for {theme === 'dark' ? 'deep-dark professional' : 'light clean'} aesthetic.</p>
              </div>
              <div className="flex bg-white dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-inner">
                <button 
                  onClick={() => toggleTheme("light")}
                  className={`p-3 transition-colors rounded-xl ${theme === 'light' ? 'bg-indigo-500 text-white shadow-xl shadow-indigo-500/30' : 'text-slate-400 dark:text-slate-500 hover:text-indigo-500'}`}
                >
                  <Sun className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => toggleTheme("dark")}
                  className={`p-3 transition-colors rounded-xl ${theme === 'dark' ? 'bg-indigo-500 text-white shadow-xl shadow-indigo-500/30' : 'text-slate-400 dark:text-slate-500 hover:text-indigo-500'}`}
                >
                  <Moon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.section>

          {/* Danger Zone */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-[2rem] p-8 md:p-10 border border-rose-500/10 bg-rose-500/5 backdrop-blur-sm"
          >
            <h2 className="text-sm font-bold text-rose-400 uppercase tracking-widest mb-10 flex items-center gap-3">
              <Trash2 className="w-5 h-5" />
              Permanent Actions
            </h2>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h4 className="font-bold text-xl text-rose-200">Decommission Vault</h4>
                <p className="text-rose-400/60 leading-relaxed max-w-md mt-1">
                  Permanently erase all encrypted blobs and account records. This action is mathematically irreversible.
                </p>
              </div>
              <Button variant="danger" className="h-14 px-8 rounded-2xl font-bold text-lg shadow-xl shadow-rose-500/10" onClick={() => toast.error("Action restricted for demonstration.")}>
                Erase Everything
              </Button>
            </div>
          </motion.section>

          <div className="flex flex-col items-center gap-8 pt-10">
            <Button variant="ghost" className="gap-3 h-14 px-10 rounded-2xl text-lg font-bold hover:bg-white/5" onClick={logout}>
              <LogOut className="w-5 h-5" />
              Secure Logout
            </Button>
            <p className="text-slate-600 text-xs font-mono uppercase tracking-[0.2em]">CipherVault v2.4.0 • Enterprise Edition</p>
          </div>
        </div>
      </main>
    </div>
  );
}

function SettingItem({ title, description, onClick, badge, toggle, checked }: any) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center justify-between p-6 rounded-2xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 transition-all duration-500 group ${onClick ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:border-indigo-500/30' : ''}`}
    >
      <div className="flex-1 pr-8">
        <div className="flex items-center gap-3 mb-1">
          <h4 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">{title}</h4>
          {badge && (
            <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-950 text-slate-500 border border-slate-200 dark:border-white/5">
              {badge}
            </span>
          )}
        </div>
        <p className="text-slate-500 leading-relaxed">{description}</p>
      </div>
      {toggle ? (
        <div className={`w-14 h-8 rounded-full p-1.5 transition-all duration-500 cursor-pointer ${checked ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-800'}`}>
          <div className={`w-5 h-5 rounded-full bg-white shadow-lg transition-transform duration-500 ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
        </div>
      ) : onClick ? (
        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/5 flex items-center justify-center group-hover:border-indigo-500/30 transition-all">
          <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
        </div>
      ) : null}
    </div>
  );
}
