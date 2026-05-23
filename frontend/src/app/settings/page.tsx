"use client";

import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { User, Shield, Moon, Sun, Trash2, LogOut, ChevronRight, Bell, Monitor, Globe, Key } from "lucide-react";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  
  const [sessionLock, setSessionLock] = useState(true);

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
    <div className="flex flex-col min-h-screen bg-[#0a0c10] text-slate-200 selection:bg-blue-500/30">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-3 text-white">Settings</h1>
          <p className="text-slate-400">Configure your security parameters and identity profile.</p>
        </div>

        <div className="space-y-6">
          {/* Account Profile */}
          <section className="glass-card rounded-xl p-8">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-8 flex items-center gap-2">
              <User className="w-4 h-4" />
              Identity Profile
            </h2>
            <div className="flex items-center gap-8">
              <div className="relative group">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-20 h-20 rounded-xl border border-white/10" />
                ) : (
                  <div className="w-20 h-20 bg-slate-900 rounded-xl flex items-center justify-center border border-white/10">
                    <User className="w-8 h-8 text-slate-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1">{user?.displayName}</h3>
                <p className="text-slate-400 text-sm mb-4">{user?.email}</p>
                <div className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-900/10 text-blue-400 border border-blue-500/20">
                  Federated Account
                </div>
              </div>
            </div>
          </section>

          {/* Security Policy */}
          <section className="glass-card rounded-xl p-8">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-8 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Security Protocol
            </h2>
            <div className="space-y-4">
              <SettingItem 
                title="Automatic Session Lock" 
                description="Enforce re-authentication after 15 minutes of terminal inactivity."
                toggle
                checked={sessionLock}
                onClick={toggleSessionLock}
              />
              <SettingItem 
                title="Master Key Rotation" 
                description="Update your local derivation parameters. (Coming soon)"
                disabled
              />
            </div>
          </section>

          {/* Danger Zone */}
          <section className="glass-card rounded-xl p-8 border-rose-500/10">
            <h2 className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-8 flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Critical Actions
            </h2>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h4 className="font-bold text-white">Wipe All Vault Data</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Permanently delete all encrypted blobs and keys. This action is irreversible and requires no confirmation once triggered.
                </p>
              </div>
              <button 
                onClick={() => toast.error("Action restricted for security.")}
                className="px-6 py-2 rounded-lg bg-rose-500/10 text-rose-400 font-bold text-sm border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all"
              >
                Execute Wipe
              </button>
            </div>
          </section>

          <div className="flex flex-col items-center gap-6 pt-12">
            <button 
              onClick={logout}
              className="ghost-button text-sm flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Terminate All Sessions
            </button>
            <div className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.3em]">CipherVault Systems v2.4.0-Enterprise</div>
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
      className={`flex items-center justify-between p-5 rounded-lg bg-white/[0.02] border border-white/5 transition-all ${!disabled && onClick ? 'cursor-pointer hover:border-blue-500/30' : ''} ${disabled ? 'opacity-50' : ''}`}
    >
      <div className="flex-1 pr-8">
        <h4 className="font-bold text-white mb-0.5">{title}</h4>
        <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>
      {toggle && (
        <div className={`w-11 h-6 rounded-full p-1 transition-all ${checked ? 'bg-blue-600' : 'bg-slate-700'}`}>
          <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
        </div>
      )}
      {!toggle && !disabled && (
        <ChevronRight className="w-4 h-4 text-slate-400" />
      )}
    </div>
  );
}
