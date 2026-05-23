"use client";

import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  FileText, MessageSquare, Shield, Upload, X, Lock, 
  Eye, EyeOff, CheckCircle2, Copy, Download,
  ChevronRight, ArrowLeft, Info, Sparkles, AlertCircle
} from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { encryptData, arrayBufferToBase64 } from "@/utils/crypto";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function EncryptPage() {
  const { user, loading, getToken } = useAuth();
  const router = useRouter();
  
  const [type, setType] = useState<'file' | 'message'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [encryptionResult, setEncryptionResult] = useState<{ salt: string, iv: string, content: string, blob?: Blob } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadEncryptedFile = () => {
    if (!encryptionResult) return;
    const timestamp = Date.now().toString(16);
    const randomPart = Math.random().toString(36).substring(2, 8);
    const obfuscatedName = `vault_${timestamp}_${randomPart}.bin`;

    let blob: Blob;
    if (type === 'file' && encryptionResult.blob) {
      blob = encryptionResult.blob;
    } else {
      try {
        const binaryString = window.atob(encryptionResult.content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        blob = new Blob([bytes], { type: 'application/octet-stream' });
      } catch (e) {
        toast.error("Failed to prepare download");
        return;
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = obfuscatedName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Secure archive exported");
  };

  const handleEncrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return toast.error("Encryption password required");
    if (type === 'file' && !file) return toast.error("Select target asset");
    if (type === 'message' && !message) return toast.error("Enter payload content");

    setIsEncrypting(true);
    try {
      const token = await getToken();
      let payload: any = {
        fileName: displayName || (type === 'file' ? file?.name : 'Encrypted Message'),
        fileType: type,
        mimeType: type === 'file' ? file?.type : 'text/plain',
        size: type === 'file' ? file?.size : new TextEncoder().encode(message).length,
      };

      if (type === 'file' && file) {
        const arrayBuffer = await file.arrayBuffer();
        const res = await encryptData(arrayBuffer, password);
        
        const formData = new FormData();
        formData.append('file', new Blob([res.encryptedContent]), file.name);
        formData.append('fileName', displayName || file.name);
        formData.append('fileType', 'file');
        formData.append('mimeType', file.type);
        formData.append('size', String(file.size));
        formData.append('iv', res.iv);
        formData.append('salt', res.salt);

        await axios.post(`${API_URL}/files/upload`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        
        setEncryptionResult({ ...res, blob: new Blob([res.encryptedContent], { type: 'application/octet-stream' }) });
      } else {
        const res = await encryptData(message, password);
        payload.salt = res.salt;
        payload.iv = res.iv;
        // Convert ArrayBuffer to Base64 for string payloads
        payload.encryptedContent = arrayBufferToBase64(res.encryptedContent);
        
        await axios.post(`${API_URL}/files/upload`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setEncryptionResult({ ...res, content: payload.encryptedContent });
      }

      setIsSuccess(true);
      toast.success("Asset successfully provisioned");
    } catch (error) {
      console.error(error);
      toast.error("Encryption protocol failed");
    } finally {
      setIsEncrypting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#0a0c10] text-slate-900 dark:text-slate-200">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-8 transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            Return to Dashboard
          </button>

          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass-card rounded-xl p-8"
              >
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 rounded-lg bg-blue-600 dark:bg-blue-600/10 text-white dark:text-blue-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h1 className="text-2xl font-bold">New Security Operation</h1>
                </div>

                <div className="flex p-1 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/5 mb-8">
                  <button 
                    onClick={() => setType('file')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all text-sm font-medium ${type === 'file' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
                  >
                    <FileText className="w-4 h-4" /> Binary Asset
                  </button>
                  <button 
                    onClick={() => setType('message')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all text-sm font-medium ${type === 'message' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
                  >
                    <MessageSquare className="w-4 h-4" /> String Payload
                  </button>
                </div>

                <form onSubmit={handleEncrypt} className="space-y-6">
                  {type === 'file' ? (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${file ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-900/5' : 'border-slate-200 dark:border-white/10 hover:border-blue-500 dark:hover:border-blue-500/50'}`}
                    >
                      <input type="file" ref={fileInputRef} onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
                      {file ? (
                        <div className="flex flex-col items-center">
                          <FileText className="w-12 h-12 text-blue-500 mb-4" />
                          <p className="font-bold text-slate-900 dark:text-white">{file.name}</p>
                          <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">{(file.size / 1024 / 1024).toFixed(2)} MB • Ready</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
                          <p className="font-medium text-slate-600 dark:text-slate-400">Drag and drop asset or <span className="text-blue-600 dark:text-blue-400">browse</span></p>
                          <p className="text-xs text-slate-400 mt-2">Maximum deployment size: 50MB</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Payload Content</label>
                      <textarea 
                        className="enterprise-input min-h-[160px] resize-none"
                        placeholder="Enter the sensitive message for encryption..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                    </div>
                  )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Asset Alias</label>
                        <input 
                          type="text"
                          className="enterprise-input"
                          placeholder="e.g. Q1_Financial_Report"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Master Password</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                            <Lock className="w-4 h-4" />
                          </div>
                          <input 
                            type={showPassword ? "text" : "password"}
                            className="enterprise-input pl-12 pr-12"
                            placeholder="Primary encryption key"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                          <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-blue-500 transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                  <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-500/20 rounded-lg p-4 flex gap-3">
                    <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                      This key is used for client-side derivation. If lost, the asset cannot be recovered. CipherVault does not store encryption keys.
                    </p>
                  </div>

                  <button 
                    disabled={isEncrypting}
                    className="primary-button w-full h-12"
                  >
                    {isEncrypting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Running Protocols...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Initialize Encryption
                      </span>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-xl p-12 text-center"
              >
                <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-100 dark:border-emerald-500/20">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Encryption Complete</h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-10 leading-relaxed">
                  The asset has been successfully encrypted and deployed to the secure vault environment.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
                  {type === 'file' && (
                    <button onClick={downloadEncryptedFile} className="primary-button h-11 px-8">
                      <Download className="w-4 h-4" />
                      Export Local Archive
                    </button>
                  )}
                  <button onClick={() => router.push('/dashboard')} className="secondary-button h-11 px-8">
                    View Vault Assets
                  </button>
                </div>

                {encryptionResult && (
                  <div className="space-y-6 text-left max-w-xl mx-auto p-8 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 shadow-2xl">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500 mb-6 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Security Metadata
                    </h3>
                    
                    <div className="space-y-6">
                      {type === 'message' && encryptionResult.content && (
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 block">Encrypted Ciphertext</label>
                          <div className="flex items-start gap-3">
                            <div className="flex-1 p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 font-mono text-xs text-slate-400 break-all leading-relaxed max-h-32 overflow-y-auto">
                              {encryptionResult.content}
                            </div>
                            <button 
                              onClick={() => { navigator.clipboard.writeText(encryptionResult.content!); toast.success("Ciphertext copied"); }}
                              className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-blue-500 transition-all shadow-sm"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 block">Encryption Salt</label>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-[10px] font-mono text-blue-500 break-all">
                              {encryptionResult.salt}
                            </code>
                            <button 
                              onClick={() => { navigator.clipboard.writeText(encryptionResult.salt); toast.success("Salt copied"); }}
                              className="p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-blue-500 transition-all shadow-sm"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 block">Initialization Vector</label>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-[10px] font-mono text-blue-500 break-all">
                              {encryptionResult.iv}
                            </code>
                            <button 
                              onClick={() => { navigator.clipboard.writeText(encryptionResult.iv); toast.success("IV copied"); }}
                              className="p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-blue-500 transition-all shadow-sm"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-white/5">
                      <p className="text-[10px] text-slate-500 leading-relaxed italic text-center">
                        Securely store these parameters. Decryption is mathematically impossible without them.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
