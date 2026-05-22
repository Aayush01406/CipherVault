"use client";

import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { 
  FileText, MessageSquare, Shield, Upload, X, Lock, 
  Eye, EyeOff, CheckCircle2, Copy, ExternalLink, Download,
  ChevronRight, ArrowLeft, Info, Sparkles
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
    
    let blob: Blob;
    // Professional Obfuscation: Use a random hash-like string instead of original filename
    // This prevents hackers from knowing what the file is even if they intercept the download
    const timestamp = Date.now().toString(16);
    const randomPart = Math.random().toString(36).substring(2, 8);
    const obfuscatedName = `vault_${timestamp}_${randomPart}.bin`;

    if (type === 'file' && encryptionResult.blob) {
      blob = encryptionResult.blob;
    } else {
      // For messages, convert base64 content to blob
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
    toast.success("Encrypted archive downloaded");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleEncrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return toast.error("Password is required for encryption");
    if (type === 'file' && !file) return toast.error("Please select a file");
    if (type === 'message' && !message) return toast.error("Please enter a message");

    setIsEncrypting(true);
    try {
      const token = await getToken();
      let encryptedDataResult;
      let payload: any = {
        fileName: displayName || (type === 'file' ? file?.name : 'Encrypted Message'),
        fileType: type,
        mimeType: type === 'file' ? file?.type : 'text/plain',
        size: type === 'file' ? file?.size : new TextEncoder().encode(message).length,
      };

      if (type === 'file' && file) {
        const arrayBuffer = await file.arrayBuffer();
        console.log('Original file size:', arrayBuffer.byteLength);
        
        encryptedDataResult = await encryptData(arrayBuffer, password);
        console.log('Encrypted file size:', encryptedDataResult.encryptedContent.byteLength);
        
        const encryptedBlob = new Blob([encryptedDataResult.encryptedContent], { type: 'application/octet-stream' });
        
        const formData = new FormData();
        formData.append('fileName', displayName || file.name);
        formData.append('fileType', 'file');
        formData.append('mimeType', file.type);
        formData.append('size', file.size.toString());
        formData.append('iv', encryptedDataResult.iv);
        formData.append('salt', encryptedDataResult.salt);
        formData.append('file', encryptedBlob, (displayName || file.name) + '.enc');

        await axios.post(`${API_URL}/files/upload`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`
          }
        });
        
        setEncryptionResult({
          salt: encryptedDataResult.salt,
          iv: encryptedDataResult.iv,
          content: 'File encrypted and stored in vault',
          blob: encryptedBlob
        });
      } else {
        encryptedDataResult = await encryptData(message, password);
        const base64Content = arrayBufferToBase64(encryptedDataResult.encryptedContent);
        
        payload.encryptedContent = base64Content;
        payload.iv = encryptedDataResult.iv;
        payload.salt = encryptedDataResult.salt;

        await axios.post(`${API_URL}/files/upload`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setEncryptionResult({
          salt: encryptedDataResult.salt,
          iv: encryptedDataResult.iv,
          content: base64Content,
          blob: undefined
        });
      }
      setIsSuccess(true);
      toast.success("Encryption successful!");
    } catch (error) {
      console.error("Encryption error:", error);
      toast.error("Encryption failed");
    } finally {
      setIsEncrypting(false);
    }
  };

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

  if (!user) {
    router.push("/");
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#02040c] text-slate-200 selection:bg-indigo-500/30">
      <Navbar />
      
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] animate-blob" />
        <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px] animate-blob animation-delay-2000" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <main className="flex-1 pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-400 transition-all mb-8 group uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Vault
          </button>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                  <Lock className="w-5 h-5 text-indigo-400" />
                </div>
                <span className="text-sm font-bold uppercase tracking-widest text-indigo-400/80">Military-Grade Security</span>
              </div>
              <h1 className="text-5xl font-bold tracking-tight mb-4">
                Encrypt <span className="premium-gradient-text">Anything</span>
              </h1>
              <p className="text-slate-400 max-w-xl text-lg leading-relaxed">
                Secure any file format—Docs, PPT, Excel, ZIP, or Images—with military-grade AES-256 encryption.
              </p>
            </div>
            {!isSuccess && (
              <div className="flex p-1.5 bg-slate-900/40 border border-white/5 rounded-2xl backdrop-blur-xl">
                <button
                  onClick={() => setType('file')}
                  className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${
                    type === 'file' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  File
                </button>
                <button
                  onClick={() => setType('message')}
                  className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${
                    type === 'message' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Message
                </button>
              </div>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {isSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-card rounded-[2.5rem] p-10 md:p-14 overflow-hidden relative"
                >
                  <div className="absolute top-0 right-0 p-12 opacity-5">
                    <CheckCircle2 className="w-48 h-48 text-emerald-500" />
                  </div>
                  
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12 relative z-10">
                    <motion.div 
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", duration: 0.6, delay: 0.1 }}
                      className="professional-icon-container bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-emerald-500/10"
                    >
                      <CheckCircle2 className="w-10 h-10 md:w-12 md:h-12" />
                    </motion.div>
                    <div className="text-center md:text-left">
                      <h2 className="text-4xl font-bold mb-3">Vaulted Successfully</h2>
                      <p className="text-slate-400 text-lg leading-relaxed">
                        Your {type} has been encrypted and stored in your secure vault. 
                        You can now share it or decrypt it anytime.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-10 relative z-10">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">Encrypted Signature</label>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(encryptionResult?.content || '');
                            toast.success("Signature copied");
                          }}
                          className="text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          Copy
                        </button>
                      </div>
                      <div className="p-8 rounded-[2rem] bg-slate-950/50 border border-white/5 font-mono text-xs break-all text-slate-400 leading-loose max-h-32 overflow-hidden relative group">
                        {encryptionResult?.content}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1">Security Salt</label>
                        <div className="relative group">
                          <div className="p-5 rounded-2xl bg-slate-950/50 border border-white/5 font-mono text-xs text-indigo-300 break-all">
                            {encryptionResult?.salt}
                          </div>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(encryptionResult?.salt || '');
                              toast.success("Salt copied");
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-indigo-400 transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1">Initialization Vector</label>
                        <div className="relative group">
                          <div className="p-5 rounded-2xl bg-slate-950/50 border border-white/5 font-mono text-xs text-purple-300 break-all">
                            {encryptionResult?.iv}
                          </div>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(encryptionResult?.iv || '');
                              toast.success("IV copied");
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-purple-400 transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 pt-4">
                      <Button 
                        onClick={downloadEncryptedFile}
                        className="w-full md:flex-1 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-lg font-bold gap-3 shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all"
                      >
                        <Download className="w-5 h-5" />
                        Download .enc File
                      </Button>
                      <Button 
                        onClick={() => router.push('/dashboard')}
                        variant="outline"
                        className="w-full md:flex-1 h-14 rounded-2xl border-white/5 bg-white/5 text-slate-200 hover:bg-white/10 text-lg font-bold active:scale-[0.98] transition-all"
                      >
                        Go to Vault
                      </Button>
                      <Button 
                        onClick={() => {
                          setIsSuccess(false);
                          setFile(null);
                          setMessage('');
                          setPassword('');
                          setDisplayName('');
                        }}
                        className="w-full md:flex-1 h-14 rounded-2xl premium-button text-lg font-bold active:scale-[0.98] transition-all"
                      >
                        Encrypt More
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden"
                >
                  <form onSubmit={handleEncrypt} className="space-y-8">
                    {type === 'file' ? (
                      <div className="space-y-4">
                        <label className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Source File</label>
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className={`relative group cursor-pointer rounded-[2rem] border-2 border-dashed transition-all duration-500 py-16 flex flex-col items-center justify-center gap-4 ${
                            file ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-white/10 hover:border-indigo-500/30 hover:bg-white/[0.02]'
                          }`}
                        >
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            className="hidden" 
                          />
                          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-500 ${
                            file ? 'bg-indigo-500 text-white shadow-2xl shadow-indigo-500/40' : 'bg-slate-900 text-slate-500 group-hover:text-indigo-400 group-hover:bg-slate-800'
                          }`}>
                            {file ? <FileText className="w-10 h-10" /> : <Upload className="w-10 h-10" />}
                          </div>
                          <div className="text-center">
                            <p className="text-xl font-bold text-white mb-1">
                              {file ? file.name : 'Drop your file here'}
                            </p>
                            <p className="text-slate-500 text-sm">
                              {file ? `${(file.size / 1024).toFixed(1)} KB` : 'or click to browse from computer'}
                            </p>
                          </div>
                          {file && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setFile(null); }}
                              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900 text-slate-500 hover:text-rose-400 transition-colors border border-white/5"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <label className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Secure Message</label>
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Type your sensitive information here..."
                          className="premium-input min-h-[240px] resize-none rounded-[2rem] p-8 text-lg leading-relaxed"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Display Name (Optional)</label>
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder={type === 'file' ? "Filename in vault" : "Message label"}
                          className="premium-input h-14 rounded-2xl px-6"
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Encryption Password</label>
                        <div className="relative group">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter a strong password"
                            className="premium-input h-14 rounded-2xl pl-6 pr-14"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-400 transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      isLoading={isEncrypting}
                      className="w-full h-16 rounded-2xl premium-button text-xl gap-3 shadow-2xl"
                    >
                      <Shield className="w-6 h-6" />
                      {isEncrypting ? 'Processing Security...' : 'Start Encryption'}
                    </Button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card rounded-[2rem] p-8 border-indigo-500/10"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-indigo-500/10">
                  <Shield className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="font-bold text-white uppercase tracking-widest text-sm">Security Policy</h3>
              </div>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center text-[10px] font-bold text-indigo-400 border border-indigo-500/20">1</div>
                  <p className="text-sm text-slate-400 leading-relaxed"><span className="text-slate-200 font-bold">Local-Only:</span> Your password never leaves your browser.</p>
                </li>
                <li className="flex gap-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center text-[10px] font-bold text-indigo-400 border border-indigo-500/20">2</div>
                  <p className="text-sm text-slate-400 leading-relaxed"><span className="text-slate-200 font-bold">AES-256-GCM:</span> We use the most secure encryption standard available.</p>
                </li>
                <li className="flex gap-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center text-[10px] font-bold text-indigo-400 border border-indigo-500/20">3</div>
                  <p className="text-sm text-slate-400 leading-relaxed"><span className="text-slate-200 font-bold">PBKDF2:</span> Passwords are strengthened with 100k iterations.</p>
                </li>
              </ul>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card rounded-[2rem] p-8 border-purple-500/10"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Info className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="font-bold text-white uppercase tracking-widest text-sm">Best Practices</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                For maximum security, use a unique password of at least 16 characters with a mix of symbols and numbers.
              </p>
              <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 text-xs text-purple-300 font-medium">
                Tip: Use a passphrase of 4-5 random words for high entropy.
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
