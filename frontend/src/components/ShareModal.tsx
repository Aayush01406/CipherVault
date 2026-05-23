"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Shield, Link as LinkIcon, Calendar, Lock, 
  CheckCircle2, Copy, Send, ChevronRight, Zap
} from "lucide-react";
import { Button } from "./ui/Button";
import axios from "axios";
import { toast } from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: any;
  getToken: () => Promise<string | null>;
}

export default function ShareModal({ isOpen, onClose, file, getToken }: ShareModalProps) {
  const [password, setPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [shareResult, setShareResult] = useState<any>(null);
  const [oneTime, setOneTime] = useState(false);
  const [expiry, setExpiry] = useState("never");

  const createLink = async () => {
    setIsCreating(true);
    try {
      const token = await getToken();
      const expiresAt = expiry === "never" ? null : new Date(Date.now() + parseInt(expiry) * 60 * 60 * 1000);
      
      const response = await axios.post(`${API_URL}/share/create`, {
        fileId: file._id,
        password: password || undefined,
        expiresAt,
        oneTimeDownload: oneTime
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShareResult(response.data);
      toast.success("Share link generated!");
    } catch (error) {
      console.error("Share error:", error);
      toast.error("Failed to create share link");
    } finally {
      setIsCreating(false);
    }
  };

  const copyLink = () => {
    const url = `${window.location.origin}/decrypt?shareId=${shareResult.shareId}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg glass-card p-8 md:p-10 shadow-2xl border-white/10 overflow-hidden"
        >
          <div className="flex justify-between items-center mb-8 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                <LinkIcon className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Share Securely</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <X className="w-5 h-5 text-text-muted" />
            </button>
          </div>

          {!shareResult ? (
            <div className="space-y-6 relative z-10">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 mb-6">
                <p className="text-sm text-text-muted mb-1">Sharing asset:</p>
                <p className="font-bold text-white truncate">{file.fileName}</p>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1 flex items-center gap-2">
                  <Lock className="w-3 h-3" /> Access Password (Optional)
                </label>
                <input 
                  type="password"
                  placeholder="Leave empty for public access"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="enterprise-input h-12 rounded-xl px-4"
                />
                <p className="text-[10px] text-text-muted px-1 italic">Recipient will need this password to even SEE the metadata.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1 flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> Expiry
                  </label>
                  <select 
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="enterprise-input h-12 rounded-xl px-4 appearance-none"
                  >
                    <option value="never">Never</option>
                    <option value="1">1 Hour</option>
                    <option value="24">24 Hours</option>
                    <option value="168">7 Days</option>
                  </select>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1 flex items-center gap-2">
                    <Zap className="w-3 h-3" /> One-Time Use
                  </label>
                  <button 
                    onClick={() => setOneTime(!oneTime)}
                    className={`w-full h-12 rounded-xl border transition-all flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest ${
                      oneTime 
                        ? 'bg-security/10 border-security/50 text-security' 
                        : 'bg-white/[0.02] border-white/5 text-text-muted hover:bg-white/5'
                    }`}
                  >
                    {oneTime ? <CheckCircle2 className="w-3 h-3" /> : null}
                    {oneTime ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>

              <Button 
                onClick={createLink} 
                isLoading={isCreating}
                className="w-full h-14 rounded-2xl gap-2 mt-4"
              >
                <Send className="w-5 h-5" />
                Generate Secure Link
              </Button>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 relative z-10"
            >
              <div className="flex flex-col items-center text-center py-4">
                <div className="w-20 h-20 bg-security/10 text-security rounded-3xl flex items-center justify-center border border-security/20 shadow-premium mb-6">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Link Ready!</h3>
                <p className="text-text-secondary text-sm">Anyone with this link can now attempt to decrypt the file.</p>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1">Shareable URL</label>
                <div className="flex gap-2">
                  <div className="flex-1 h-12 bg-black border border-white/5 rounded-xl px-4 flex items-center font-mono text-xs text-white overflow-hidden truncate">
                    {window.location.origin}/decrypt?shareId={shareResult.shareId}
                  </div>
                  <button 
                    onClick={copyLink}
                    className="p-3 bg-white text-black rounded-xl shadow-premium hover:opacity-90 transition-all"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
                <Shield className="w-5 h-5 text-security" />
                <p className="text-xs text-text-secondary leading-relaxed">
                  <span className="text-white font-bold">Important:</span> You still need to give the recipient the <span className="text-white">Decryption Password</span> you used when encrypting the file. This link only provides access to the encrypted data.
                </p>
              </div>

              <Button 
                variant="outline"
                onClick={onClose}
                className="w-full h-12 rounded-xl border-white/5 bg-white/5 text-white font-bold"
              >
                Close Modal
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
