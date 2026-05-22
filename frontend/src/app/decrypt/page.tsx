"use client";

import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { 
  Shield, Lock, Eye, EyeOff, Download, FileText, 
  MessageSquare, AlertCircle, Upload, Key, 
  ChevronRight, ArrowLeft, RefreshCw, Copy, CheckCircle2,
  Info
} from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { decryptData, base64ToArrayBuffer } from "@/utils/crypto";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function DecryptPage() {
  const { user, loading, getToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileId = searchParams.get('id');
  const shareId = searchParams.get('shareId');

  const [mode, setMode] = useState<'vault' | 'manual' | 'share'>(
    shareId ? 'share' : (fileId ? 'vault' : 'manual')
  );
  const [fileData, setFileData] = useState<any>(null);
  const [shareData, setShareData] = useState<any>(null);
  const [sharePassword, setSharePassword] = useState('');
  const [isVerifyingShare, setIsVerifyingShare] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedContent, setDecryptedContent] = useState<any>(null);
  const [decryptedPreviewUrl, setDecryptedPreviewUrl] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [diagnostics, setDiagnostics] = useState<{ size: number, type: string, signature?: string } | null>(null);

  // Manual input states
  const [manualType, setManualType] = useState<'message' | 'file'>('message');
  const [manualContent, setManualContent] = useState('');
  const [manualFile, setManualFile] = useState<File | null>(null);
  const [manualSalt, setManualSalt] = useState('');
  const [manualIv, setManualIv] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // If we have a shareId, we don't necessarily need to be logged in
    if (!loading) {
      if (shareId) {
        setMode('share');
        fetchShareMetadata();
      } else if (!user) {
        router.push("/");
      } else if (fileId) {
        setMode('vault');
        fetchFileMetadata();
      } else {
        setIsFetching(false);
      }
    }
  }, [fileId, shareId, user, loading]);

  const fetchShareMetadata = async () => {
    try {
      const response = await axios.get(`${API_URL}/share/${shareId}`);
      setShareData(response.data);
      if (!response.data.requiresPassword) {
        setFileData(response.data.encryptedFile);
      }
    } catch (error) {
      console.error("Error fetching share:", error);
      toast.error("Share link invalid or expired");
      setMode('manual');
    } finally {
      setIsFetching(false);
    }
  };

  const verifyShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifyingShare(true);
    try {
      const response = await axios.post(`${API_URL}/share/verify`, {
        shareId,
        password: sharePassword
      });
      setFileData(response.data.encryptedFile);
      toast.success("Link verified");
    } catch (error) {
      toast.error("Incorrect link password");
    } finally {
      setIsVerifyingShare(false);
    }
  };

  const fetchFileMetadata = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(`${API_URL}/files`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const file = response.data.find((f: any) => f._id === fileId);
      if (!file) {
        toast.error("File not found in your vault");
        setMode('manual');
        return;
      }
      setFileData(file);
    } catch (error) {
      console.error("Error fetching file:", error);
      toast.error("Failed to load file metadata");
      setMode('manual');
    } finally {
      setIsFetching(false);
    }
  };

  const handleDecrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return toast.error("Password is required");

    setIsDecrypting(true);
    try {
      let salt: string;
      let iv: string;
      let type: 'message' | 'file';
      let name: string;
      let mime: string;

      if ((mode === 'vault' || mode === 'share') && fileData) {
        salt = fileData.salt;
        iv = fileData.iv;
        type = fileData.fileType;
        name = fileData.fileName;
        mime = fileData.mimeType;
      } else {
        if (!manualSalt || !manualIv) throw new Error("Salt and IV are required for manual decryption");
        salt = manualSalt;
        iv = manualIv;
        type = manualType;
        name = manualType === 'file' ? (manualFile?.name || 'decrypted-file') : 'Decrypted Message';
        mime = manualType === 'file' ? (manualFile?.type || 'application/octet-stream') : 'text/plain';
      }

      const encryptedArrayBuffer = (mode === 'vault' || mode === 'share') && fileData
        ? (fileData.encryptedContent 
            ? base64ToArrayBuffer(fileData.encryptedContent)
            : (fileData.fileUrl?.startsWith('data:') 
                ? base64ToArrayBuffer(fileData.fileUrl.split(',')[1])
                : await axios.get(fileData.fileUrl, { responseType: 'arraybuffer' }).then(res => res.data)
              )
          )
        : (manualType === 'file' && manualFile 
            ? await manualFile.arrayBuffer()
            : base64ToArrayBuffer(manualContent)
          );

      if (!encryptedArrayBuffer) throw new Error("Missing encrypted content");

      // Check for common file signatures
      const header = new Uint8Array(encryptedArrayBuffer.slice(0, 8));
      const headerHex = Array.from(header).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
      
      const signatures: Record<string, string> = {
        '89504E47': 'PNG image',
        'FFD8FF': 'JPEG image',
        '25504446': 'PDF document',
        'D0CF11E0': 'Legacy MS Office doc',
        '504B0304': 'ZIP/Office document',
        'EFBBBF': 'UTF-8 Text file',
      };

      let detectedSignature = '';
      for (const [sig, label] of Object.entries(signatures)) {
        if (headerHex.startsWith(sig)) {
          detectedSignature = label;
          console.warn(`Warning: File appears to be an unencrypted ${label}`);
        }
      }

      setDiagnostics({ size: encryptedArrayBuffer.byteLength, type: type, signature: detectedSignature });

      if (detectedSignature && mode === 'manual') {
        toast.error(`This file looks like a ${detectedSignature}, not an encrypted file.`, { duration: 5000 });
      }

      const decrypted = await decryptData(
        encryptedArrayBuffer,
        password,
        salt,
        iv
      );

      // Clean filename for download
      let finalName = name;
      // If the filename has .enc at the end, remove it to get the original extension
      if (finalName.toLowerCase().endsWith('.enc')) {
        finalName = finalName.slice(0, -4);
      }

      // MIME Type Strategy:
      // 1. If we have a specific MIME type from metadata (Vault mode), use it.
      // 2. Only fallback to "Magic Byte" detection if MIME is generic or we're in Manual mode.
      let finalMime = mime;
      const isGenericMime = !mime || mime === 'application/octet-stream';

      const decryptedHeader = new Uint8Array(decrypted.slice(0, 16));
      const decryptedHeaderHex = Array.from(decryptedHeader).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
      
      const mimeSignatures: Record<string, { mime: string, ext: string }> = {
        '89504E47': { mime: 'image/png', ext: '.png' },
        'FFD8FF': { mime: 'image/jpeg', ext: '.jpg' },
        '25504446': { mime: 'application/pdf', ext: '.pdf' },
        '47494638': { mime: 'image/gif', ext: '.gif' },
        '504B0304': { mime: 'application/zip', ext: '.zip' },
        'D0CF11E0': { mime: 'application/vnd.ms-office', ext: '.doc' },
        '213C6172': { mime: 'application/x-rar-compressed', ext: '.rar' },
        '377ABCAF': { mime: 'application/x-7z-compressed', ext: '.7z' },
        '1F8B08': { mime: 'application/gzip', ext: '.gz' },
        '00000018': { mime: 'video/mp4', ext: '.mp4' },
        '00000020': { mime: 'video/mp4', ext: '.mp4' },
        '494433': { mime: 'audio/mpeg', ext: '.mp3' },
        '2321': { mime: 'text/plain', ext: '.sh' },
        '7B22': { mime: 'application/json', ext: '.json' },
        '3C3F786D': { mime: 'application/xml', ext: '.xml' },
        '2521': { mime: 'application/postscript', ext: '.ai' },
        'D7CDC6': { mime: 'image/vnd.adobe.photoshop', ext: '.psd' },
      };

      let detectedExt = '';
      for (const [sig, info] of Object.entries(mimeSignatures)) {
        if (decryptedHeaderHex.startsWith(sig)) {
          if (isGenericMime || mode === 'manual') {
            finalMime = info.mime;
          }
          detectedExt = info.ext;
          
          // Deep inspection for ZIP-based Office files (DOCX, PPTX, XLSX)
          if (sig === '504B0304') {
            const peekSize = Math.min(decrypted.byteLength, 4000);
            const peekBuffer = new Uint8Array(decrypted.slice(0, peekSize));
            const peekString = new TextDecoder().decode(peekBuffer);
            
            if (peekString.includes('ppt/')) {
              finalMime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
              detectedExt = '.pptx';
            } else if (peekString.includes('xl/')) {
              finalMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
              detectedExt = '.xlsx';
            } else if (peekString.includes('word/')) {
              finalMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
              detectedExt = '.docx';
            }
          }
          break;
        }
      }

      // Final refinement: Ensure Office extensions map to correct MIME types
      const officeMimeMap: Record<string, string> = {
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.doc': 'application/msword',
        '.ppt': 'application/vnd.ms-powerpoint',
        '.xls': 'application/vnd.ms-excel'
      };

      // If we detected a PKZip header but the filename says it's a specific office type, use that
      for (const [ext, m] of Object.entries(officeMimeMap)) {
        if (finalName.toLowerCase().endsWith(ext)) {
          finalMime = m;
          detectedExt = ext;
          break;
        }
      }

      // If we are in manual mode and decrypted a file but it still has an obfuscated name,
      // try to give it a better name with the detected extension
      if (mode === 'manual' && (finalName.startsWith('vault_') || finalName.startsWith('secure_blob_'))) {
        finalName = `decrypted_file_${Date.now().toString(16)}${detectedExt || '.dat'}`;
      } else if (detectedExt && !finalName.toLowerCase().endsWith(detectedExt)) {
        // If we detected an extension but the file doesn't have it, add it
        // But first check if it has a different extension
        const hasExtension = /\.[a-z0-9]+$/i.test(finalName);
        if (!hasExtension) {
          finalName += detectedExt;
        }
      }

      if (type === 'message') {
        const text = new TextDecoder().decode(decrypted);
        setDecryptedContent(text);
      } else {
        setDecryptedContent(decrypted);
        // Create preview URL for images
        if (finalMime.startsWith('image/')) {
          const blob = new Blob([decrypted], { type: finalMime });
          setDecryptedPreviewUrl(URL.createObjectURL(blob));
        }
      }
      
      setFileData({ fileName: finalName, fileType: type, mimeType: finalMime });
      toast.success("Decryption successful!");
    } catch (error: any) {
      console.error("Decryption error:", error);
      toast.error(error.message || "Decryption failed. Incorrect password?");
    } finally {
      setIsDecrypting(false);
    }
  };

  const downloadFile = () => {
    if (!decryptedContent || fileData.fileType !== 'file') return;
    
    const blob = new Blob([decryptedContent], { type: fileData.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileData.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading || isFetching) {
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
            onClick={() => router.push(fileId ? '/dashboard' : '/')}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-400 transition-all mb-8 group uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to {fileId ? 'Vault' : 'Home'}
          </button>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                  <Key className="w-5 h-5 text-indigo-400" />
                </div>
                <span className="text-sm font-bold uppercase tracking-widest text-indigo-400/80">Decryption Portal</span>
              </div>
              <h1 className="text-5xl font-bold tracking-tight mb-4">
                Unlock <span className="premium-gradient-text">Anything</span>
              </h1>
              <p className="text-slate-400 max-w-xl text-lg leading-relaxed">
                Restore any file—Office docs, ZIP archives, or Images—to its original state instantly with your secure password.
              </p>
            </div>
            {!decryptedContent && (
              <div className="flex p-1.5 bg-slate-900/40 border border-white/5 rounded-2xl backdrop-blur-xl">
                <button
                  onClick={() => setMode('vault')}
                  className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${
                    mode === 'vault' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Vault
                </button>
                <button
                  onClick={() => setMode('manual')}
                  className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${
                    mode === 'manual' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Manual
                </button>
              </div>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {decryptedContent ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-[2.5rem] p-10 md:p-14 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-12 opacity-5">
                  <CheckCircle2 className="w-48 h-48 text-indigo-500" />
                </div>

                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12 relative z-10">
                    <motion.div 
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", duration: 0.6, delay: 0.1 }}
                      className="professional-icon-container bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-indigo-500/10"
                    >
                      <Shield className="w-10 h-10 md:w-12 md:h-12" />
                    </motion.div>
                    <div className="text-center md:text-left">
                    <h2 className="text-4xl font-bold mb-3">Decryption Complete</h2>
                    <p className="text-slate-400 text-lg leading-relaxed">
                      Your asset has been successfully decrypted. You can now view or download the original content.
                    </p>
                  </div>
                </div>

                <div className="space-y-6 relative z-10">
                  {fileData.fileType === 'message' ? (
                    <div className="space-y-4">
                      <label className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1">Decrypted Message</label>
                      <div className="p-8 rounded-[2rem] bg-slate-950/50 border border-white/5 font-mono text-lg leading-relaxed text-indigo-200">
                        {decryptedContent}
                      </div>
                      <Button 
                        onClick={() => {
                          navigator.clipboard.writeText(decryptedContent);
                          toast.success("Message copied!");
                        }}
                        variant="outline"
                        className="w-full h-14 rounded-2xl border-white/5 bg-white/5 text-slate-200 hover:bg-white/10 text-lg font-bold gap-3"
                      >
                        <Copy className="w-5 h-5" />
                        Copy Message
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                          <div className="flex flex-col sm:flex-row items-center justify-between p-6 md:p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 gap-8 shadow-2xl relative group">
                            <div className="absolute inset-0 bg-indigo-500/5 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex items-center gap-6 min-w-0 relative z-10">
                              <div className="w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] bg-indigo-500/10 flex items-center justify-center text-indigo-400 flex-shrink-0 shadow-inner">
                                <FileText className="w-8 h-8 md:w-10 md:h-10" />
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-bold text-xl md:text-2xl text-white truncate mb-1">{fileData.fileName}</h3>
                                <p className="text-slate-500 text-xs md:text-sm uppercase tracking-[0.2em] font-black truncate">{fileData.mimeType}</p>
                              </div>
                            </div>
                            <Button 
                              onClick={downloadFile}
                              className="w-full sm:w-auto h-14 md:h-16 px-10 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white text-lg font-bold gap-3 flex-shrink-0 shadow-2xl shadow-indigo-500/20 active:scale-95 transition-all relative z-10"
                            >
                              <Download className="w-6 h-6" />
                              <span className="whitespace-nowrap">Download File</span>
                            </Button>
                          </div>

                      {decryptedPreviewUrl && (
                        <div className="rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl">
                          <img src={decryptedPreviewUrl} alt="Preview" className="w-full h-auto max-h-[500px] object-contain bg-slate-950/50 p-4" />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row gap-4 pt-4">
                    <Button 
                      onClick={() => router.push('/dashboard')}
                      variant="outline"
                      className="w-full md:flex-1 h-14 rounded-2xl border-white/5 bg-white/5 text-slate-200 hover:bg-white/10 text-lg font-bold active:scale-[0.98] transition-all"
                    >
                      Return to Vault
                    </Button>
                    <Button 
                      onClick={() => {
                        setDecryptedContent(null);
                        setDecryptedPreviewUrl(null);
                        setPassword('');
                      }}
                      className="w-full md:flex-1 h-14 rounded-2xl premium-button text-lg font-bold active:scale-[0.98] transition-all"
                    >
                      Decrypt Another
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : mode === 'share' && !fileData ? (
              <motion.div
                key="share-auth"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden text-center"
              >
                <div className="professional-icon-container bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-indigo-500/10 mx-auto mb-8">
                  <Lock className="w-10 h-10 md:w-12 md:h-12" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Link Protected</h2>
                <p className="text-slate-400 mb-8 max-w-sm mx-auto">This share link requires a password to access the encrypted metadata.</p>
                
                <form onSubmit={verifyShare} className="space-y-6 max-w-sm mx-auto">
                  <input 
                    type="password"
                    placeholder="Enter link password"
                    value={sharePassword}
                    onChange={(e) => setSharePassword(e.target.value)}
                    className="premium-input h-14 rounded-2xl px-6 text-center text-lg"
                    required
                  />
                  <Button 
                    type="submit" 
                    isLoading={isVerifyingShare}
                    className="w-full h-14 rounded-2xl premium-button text-lg gap-2"
                  >
                    Access Link
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </form>
              </motion.div>
            ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden"
                >
                  <div className="glass-card rounded-3xl p-8 md:p-10">
                    {(mode === 'vault' || mode === 'share') && fileData ? (
                      <div className="p-8 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 flex items-center gap-6 mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shadow-inner">
                          {fileData?.fileType === 'file' ? <FileText className="w-8 h-8" /> : <MessageSquare className="w-8 h-8" />}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-2xl font-bold text-white truncate pr-4">{fileData?.fileName || 'Loading asset...'}</h3>
                          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Ready for decryption</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        <div className="flex gap-4 p-1 bg-slate-950 rounded-xl border border-slate-800 w-fit">
                          <button 
                            onClick={() => setManualType('message')}
                            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${manualType === 'message' ? 'bg-slate-800 text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                          >
                            Secret Message
                          </button>
                          <button 
                            onClick={() => setManualType('file')}
                            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${manualType === 'file' ? 'bg-slate-800 text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                          >
                            Encrypted File
                          </button>
                        </div>

                        {manualType === 'message' ? (
                          <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Encrypted Payload</label>
                            <textarea
                              value={manualContent}
                              onChange={(e) => setManualContent(e.target.value)}
                              placeholder="Paste the encrypted base64 payload here..."
                              className="premium-input h-32 resize-none font-mono text-xs leading-relaxed"
                            />
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Source Archive (.enc)</label>
                            <div 
                              onClick={() => fileInputRef.current?.click()}
                              className="group border-2 border-dashed border-slate-800 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all relative overflow-hidden"
                            >
                              <div className="absolute inset-0 bg-shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
                              <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setManualFile(e.target.files?.[0] || null)} />
                              {manualFile ? (
                                <div className="flex flex-col items-center">
                                  <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center mb-3">
                                    <FileText className="w-6 h-6" />
                                  </div>
                                  <div className="text-indigo-400 font-bold">{manualFile.name}</div>
                                  <div className="text-slate-500 text-xs mt-1">{(manualFile.size / 1024).toFixed(1)} KB ready</div>
                                </div>
                              ) : (
                                <>
                                  <div className="w-12 h-12 bg-slate-900 text-slate-500 rounded-xl flex items-center justify-center mb-4 group-hover:text-indigo-400 transition-colors">
                                    <Upload className="w-6 h-6" />
                                  </div>
                                  <span className="text-slate-300 font-semibold">Drop archive here</span>
                                  <span className="text-slate-500 text-sm mt-1">or click to browse local storage</span>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Salt ID</label>
                            <input
                              type="text"
                              value={manualSalt}
                              onChange={(e) => setManualSalt(e.target.value)}
                              placeholder="Encryption Salt (Hex)"
                              className="premium-input font-mono text-xs"
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">IV Tag</label>
                            <input
                              type="text"
                              value={manualIv}
                              onChange={(e) => setManualIv(e.target.value)}
                              placeholder="Init Vector (Hex)"
                              className="premium-input font-mono text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleDecrypt} className="mt-10 pt-10 border-t border-slate-800/50 space-y-8">
                      <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Master Password</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-600 group-focus-within:text-indigo-400 transition-colors">
                            <Lock className="w-5 h-5" />
                          </div>
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter the password used to encrypt this data"
                            className="premium-input pl-12 pr-12"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-600 hover:text-slate-300 transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row gap-4">
                        <Button 
                          type="submit" 
                          className="premium-button w-full md:flex-1 h-14 text-lg active:scale-[0.98] transition-all" 
                          isLoading={isDecrypting}
                        >
                          <RefreshCw className={`w-5 h-5 mr-3 ${isDecrypting ? 'animate-spin' : ''}`} />
                          Decrypt Now
                        </Button>
                      </div>

                      {diagnostics && (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800/50 font-mono text-[11px] text-slate-500 space-y-2"
                        >
                          <div className="flex justify-between border-b border-slate-900 pb-2">
                            <span className="text-slate-600">PROTOCOL</span>
                            <span className="text-indigo-400 font-bold tracking-widest">AES-256-GCM</span>
                          </div>
                          <div className="flex justify-between">
                            <span>MODE / TYPE</span>
                            <span className="text-slate-300">{mode.toUpperCase()} / {diagnostics.type.toUpperCase()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>PAYLOAD SIZE</span>
                            <span className="text-slate-300">{diagnostics.size.toLocaleString()} BYTES</span>
                          </div>
                          {diagnostics.signature && (
                            <div className="flex justify-between text-amber-500/80 pt-1">
                              <span>DETECTED FORMAT</span>
                              <span className="font-bold">{diagnostics.signature.toUpperCase()}</span>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </form>
                  </div>

                  <div className="glass-card rounded-2xl p-5 border-amber-500/10 flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      <strong className="text-amber-500/90">Privacy Protocol:</strong> Decryption is processed entirely in your browser's secure memory. Your password and raw data are never transmitted over the network.
                    </p>
                  </div>
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
