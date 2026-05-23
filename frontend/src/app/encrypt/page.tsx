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
        
        console.log('Encryption context (File):', {
          fileName: displayName || file.name,
          originalSize: file.size,
          encryptedSize: res.encryptedContent.byteLength,
          salt: res.salt,
          iv: res.iv
        });

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

        console.log('Encryption context (Message):', {
          originalSize: new TextEncoder().encode(message).length,
          encryptedSize: res.encryptedContent.byteLength,
          salt: res.salt,
          iv: res.iv
        });

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
    <div className="flex flex-col min-h-screen bg-background text-text-primary selection:bg-primary/10">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-text-secondary hover:text-primary mb-10 transition-colors text-sm font-bold uppercase tracking-widest group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Command Center
          </button>

          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass-card p-10 md:p-12 relative overflow-hidden"
              >
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 border border-border-subtle text-primary flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-primary">Provision Asset</h1>
                    <p className="text-text-secondary text-sm">Securely deploy a new encrypted context.</p>
                  </div>
                </div>

                <div className="flex p-1 bg-surface border border-border-subtle rounded-2xl mb-10">
                  <button 
                    onClick={() => setType('file')}
                    className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl transition-all text-sm font-bold ${type === 'file' ? 'bg-primary/10 text-primary' : 'text-text-muted hover:text-primary'}`}
                  >
                    <FileText className="w-4 h-4" /> Binary
                  </button>
                  <button 
                    onClick={() => setType('message')}
                    className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl transition-all text-sm font-bold ${type === 'message' ? 'bg-primary/10 text-primary' : 'text-text-muted hover:text-primary'}`}
                  >
                    <MessageSquare className="w-4 h-4" /> Payload
                  </button>
                </div>

                <form onSubmit={handleEncrypt} className="space-y-8">
                  {type === 'file' ? (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={`group border-2 border-dashed rounded-3xl p-16 text-center transition-all cursor-pointer relative overflow-hidden ${file ? 'border-security bg-security/5' : 'border-border-subtle hover:border-security/30 hover:bg-primary/[0.01]'}`}
                    >
                      <input type="file" ref={fileInputRef} onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
                      {file ? (
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-primary/5 text-primary rounded-2xl flex items-center justify-center mb-6 border border-border-subtle">
                            <FileText className="w-8 h-8" />
                          </div>
                          <p className="text-lg font-bold text-primary mb-1">{file.name}</p>
                          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 bg-primary/5 text-text-muted rounded-xl flex items-center justify-center mb-6 border border-border-subtle">
                            <Upload className="w-6 h-6" />
                          </div>
                          <p className="text-base font-bold text-primary mb-1">Upload binary asset</p>
                          <p className="text-xs text-text-muted font-medium">Maximum size: 100MB</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-1">Payload Content</label>
                      <textarea 
                        className="enterprise-input min-h-[200px] resize-none font-mono text-sm leading-relaxed"
                        placeholder="Enter sensitive message content..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-1">Asset Name</label>
                      <input 
                        type="text"
                        className="enterprise-input"
                        placeholder="e.g. secure_data_01"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-1">Master Password</label>
                      <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"}
                          className="enterprise-input pr-12"
                          placeholder="Decryption key"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-muted hover:text-primary transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/5 border border-border-subtle rounded-2xl p-6 flex gap-4">
                    <Info className="w-5 h-5 text-text-muted mt-0.5" />
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Encryption is processed client-side. CipherVault does not store master keys. Loss of password results in permanent data loss.
                    </p>
                  </div>

                  <button 
                    disabled={isEncrypting}
                    className="primary-button w-full h-14 text-base"
                  >
                    {isEncrypting ? (
                      <span className="flex items-center gap-3">
                        <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        Running Protocols...
                      </span>
                    ) : (
                      <span className="flex items-center gap-3">
                        <Shield className="w-4 h-4" />
                        Execute Encryption
                      </span>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card p-12 text-center"
              >
                <div className="w-16 h-16 bg-security/10 text-security rounded-full flex items-center justify-center mx-auto mb-8 border border-security/20">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-bold mb-3 tracking-tight text-primary">Deployment Success</h2>
                <p className="text-text-secondary max-w-sm mx-auto mb-12 text-base leading-relaxed">
                  Asset has been encrypted and stored in the secure node network.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                  {type === 'file' && (
                    <button onClick={downloadEncryptedFile} className="primary-button h-12 px-10 text-base">
                      <Download className="w-4 h-4" />
                      Export Archive
                    </button>
                  )}
                  <button onClick={() => router.push('/dashboard')} className="secondary-button h-12 px-10 text-base">
                    Return to Center
                  </button>
                </div>

                {encryptionResult && (
                  <div className="space-y-8 text-left max-w-xl mx-auto p-8 rounded-3xl bg-primary/[0.01] border border-border-subtle">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-8 flex items-center gap-3">
                      <Shield className="w-3.5 h-3.5 text-security" />
                      Security Metadata
                    </h3>
                    
                    <div className="space-y-8">
                      {type === 'message' && encryptionResult.content && (
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1">Ciphertext</label>
                          <div className="flex items-start gap-4">
                            <div className="flex-1 p-4 rounded-xl bg-background border border-border-subtle font-mono text-xs text-text-secondary break-all leading-relaxed max-h-40 overflow-y-auto custom-scrollbar">
                              {encryptionResult.content}
                            </div>
                            <button 
                              onClick={() => { navigator.clipboard.writeText(encryptionResult.content!); toast.success("Copied"); }}
                              className="p-3.5 rounded-xl bg-surface border border-border-subtle text-text-muted hover:text-primary transition-all"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1">Salt</label>
                          <div className="flex items-center gap-3">
                            <code className="flex-1 p-3 rounded-xl bg-background border border-border-subtle text-[11px] font-mono text-primary/80 break-all">
                              {encryptionResult.salt}
                            </code>
                            <button 
                              onClick={() => { navigator.clipboard.writeText(encryptionResult.salt); toast.success("Copied"); }}
                              className="p-3 rounded-xl bg-surface border border-border-subtle text-text-muted hover:text-primary transition-all"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1">Vector (IV)</label>
                          <div className="flex items-center gap-3">
                            <code className="flex-1 p-3 rounded-xl bg-background border border-border-subtle text-[11px] font-mono text-primary/80 break-all">
                              {encryptionResult.iv}
                            </code>
                            <button 
                              onClick={() => { navigator.clipboard.writeText(encryptionResult.iv); toast.success("Copied"); }}
                              className="p-3 rounded-xl bg-surface border border-border-subtle text-text-muted hover:text-primary transition-all"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
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
