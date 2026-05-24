"use client";

import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect, useRef, Suspense } from "react";
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

function DecryptContent() {
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
                : await axios.get(fileData.fileUrl, { 
                    responseType: 'arraybuffer',
                    // Crucial: Don't send our backend auth token to Cloudinary/External URLs
                    transformRequest: [(data, headers) => {
                      delete headers['Authorization'];
                      return data;
                    }]
                  }).then(res => res.data)
                  .catch(err => {
                    console.error("File download failed:", err);
                    if (err.response?.status === 500) {
                      throw new Error("Storage provider returned 500. The file might be corrupted or temporarily unavailable.");
                    }
                    throw new Error(`Failed to download encrypted file: ${err.message}`);
                  })
              )
          )
        : (manualType === 'file' && manualFile 
            ? await manualFile.arrayBuffer()
            : base64ToArrayBuffer(manualContent)
          );

      if (!encryptedArrayBuffer) throw new Error("Missing encrypted content");

      console.log('Decryption context:', {
        mode,
        fileType: type,
        fileName: name,
        mimeType: mime,
        salt,
        iv,
        contentSize: encryptedArrayBuffer.byteLength
      });

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

      toast.success("Decryption successful");

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
      toast.error(error.message || "Decryption failed", { duration: 6000 });
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
          <div className="relative flex items-center justify-center">
            <div className="w-20 h-20 border-4 border-white/5 border-t-primary rounded-full animate-spin" />
            <div className="absolute">
              <Shield className="w-8 h-8 text-primary animate-pulse" />
            </div>
          </div>
          <p className="text-text-muted font-bold uppercase tracking-widest text-[10px]">Loading Secure Context...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-primary selection:bg-white/10">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <button 
            onClick={() => router.push(fileId ? '/dashboard' : '/')}
            className="flex items-center gap-2 text-sm font-bold text-text-muted hover:text-primary transition-colors mb-8 group uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            {fileId ? 'Command Center' : 'Home'}
          </button>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 text-left">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                  <Key className="w-4 h-4 text-primary" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Decryption Portal</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-primary">
                Unlock Secure Asset
              </h1>
              <p className="text-text-secondary max-w-xl text-base leading-relaxed">
                Client-side cryptographic restoration of binary blobs and string payloads. Raw data is never transmitted.
              </p>
            </div>
            {!decryptedContent && (
              <div className="flex p-1 bg-surface border border-white/5 rounded-2xl">
                <button
                  onClick={() => setMode('vault')}
                  className={`px-6 py-2.5 text-xs font-bold rounded-xl transition-all uppercase tracking-widest ${
                    mode === 'vault' ? 'bg-white/10 text-primary' : 'text-text-muted hover:text-primary'
                  }`}
                >
                  Vault
                </button>
                <button
                  onClick={() => setMode('manual')}
                  className={`px-6 py-2.5 text-xs font-bold rounded-xl transition-all uppercase tracking-widest ${
                    mode === 'manual' ? 'bg-white/10 text-primary' : 'text-text-muted hover:text-primary'
                  }`}
                >
                  Manual
                </button>
              </div>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {decryptedContent ? (
              <motion.div
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card p-12 md:p-16 relative overflow-hidden"
              >
                <div className="flex flex-col md:flex-row items-center md:items-start gap-10 mb-16 relative z-10 text-left">
                    <div className="w-16 h-16 rounded-full bg-security/10 text-security border border-security/20 flex items-center justify-center shrink-0">
                      <Shield className="w-8 h-8" />
                    </div>
                    <div>
                    <h2 className="text-3xl font-bold mb-3 tracking-tight">Decryption Success</h2>
                    <p className="text-text-secondary text-base leading-relaxed max-w-md">
                      Asset has been successfully restored to its original state within the browser context.
                    </p>
                  </div>
                </div>

                <div className="space-y-8 relative z-10 text-left">
                  {fileData.fileType === 'message' ? (
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-2">Original Content</label>
                      <div className="p-8 rounded-3xl bg-background border border-white/5 font-mono text-lg leading-relaxed text-primary/90">
                        {decryptedContent}
                      </div>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(decryptedContent);
                          toast.success("Copied");
                        }}
                        className="secondary-button w-full h-14 text-base"
                      >
                        <Copy className="w-5 h-5" />
                        Copy to Clipboard
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-8">
                          <div className="flex flex-col sm:flex-row items-center justify-between p-8 rounded-3xl bg-white/[0.01] border border-white/5 gap-10 group">
                            <div className="flex items-center gap-6 min-w-0">
                              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary flex-shrink-0">
                                <FileText className="w-8 h-8" />
                              </div>
                              <div className="min-w-0 text-left">
                                <h3 className="font-bold text-xl text-primary truncate mb-1">{fileData.fileName}</h3>
                                <p className="text-text-muted text-[10px] uppercase tracking-widest font-bold truncate">{fileData.mimeType}</p>
                              </div>
                            </div>
                            <button 
                              onClick={downloadFile}
                              className="primary-button w-full sm:w-auto h-14 px-10 text-base"
                            >
                              <Download className="w-5 h-5" />
                              Download
                            </button>
                          </div>

                      {decryptedPreviewUrl && (
                        <div className="rounded-3xl overflow-hidden border border-white/5 bg-background p-4">
                          <img src={decryptedPreviewUrl} alt="Preview" className="w-full h-auto max-h-[600px] object-contain rounded-xl" />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
                    <button onClick={() => router.push('/dashboard')} className="secondary-button h-14">
                      Return to Command Center
                    </button>
                    <button 
                      onClick={() => {
                        setDecryptedContent(null);
                        setDecryptedPreviewUrl(null);
                        setPassword('');
                      }}
                      className="primary-button h-14"
                    >
                      Process Another
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : mode === 'share' && !fileData ? (
              <motion.div
                key="share-auth"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card p-12 text-center"
              >
                <div className="w-16 h-16 bg-white/5 border border-white/10 mx-auto mb-8 rounded-2xl flex items-center justify-center">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-3 tracking-tight text-primary">Protected Resource</h2>
                <p className="text-text-secondary mb-10 max-w-sm mx-auto text-sm">Authentication is required to access metadata for this share link.</p>
                
                <form onSubmit={verifyShare} className="space-y-6 max-w-sm mx-auto">
                  <input 
                    type="password"
                    placeholder="Link password"
                    value={sharePassword}
                    onChange={(e) => setSharePassword(e.target.value)}
                    className="enterprise-input text-center text-lg"
                    required
                  />
                  <button 
                    type="submit" 
                    className="primary-button w-full h-12"
                    disabled={isVerifyingShare}
                  >
                    {isVerifyingShare ? 'Authenticating...' : 'Access Resource'}
                  </button>
                </form>
              </motion.div>
            ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-card p-10 md:p-12 relative overflow-hidden text-left"
                >
                  <div className="space-y-10">
                    {(mode === 'vault' || mode === 'share') && fileData ? (
                      <div className="p-8 rounded-3xl bg-primary/[0.02] border border-border-subtle flex items-center gap-6 mb-10">
                        <div className="w-16 h-16 rounded-2xl bg-primary/5 border border-border-subtle flex items-center justify-center text-primary">
                          {fileData?.fileType === 'file' ? <FileText className="w-8 h-8" /> : <MessageSquare className="w-8 h-8" />}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-2xl font-bold text-primary truncate pr-6 tracking-tight">{fileData?.fileName || 'Asset ID: ' + fileId}</h3>
                          <p className="text-text-muted font-bold uppercase tracking-widest text-[10px] mt-1">Resource Authenticated</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-10">
                        <div className="flex gap-4 p-1 bg-surface border border-border-subtle rounded-2xl w-fit">
                          <button 
                            onClick={() => setManualType('message')}
                            className={`px-8 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${manualType === 'message' ? 'bg-primary/10 text-primary' : 'text-text-muted hover:text-primary'}`}
                          >
                            String
                          </button>
                          <button 
                            onClick={() => setManualType('file')}
                            className={`px-8 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${manualType === 'file' ? 'bg-primary/10 text-primary' : 'text-text-muted hover:text-primary'}`}
                          >
                            Binary
                          </button>
                        </div>

                        {manualType === 'message' ? (
                          <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-1">Ciphertext Payload</label>
                            <textarea
                              value={manualContent}
                              onChange={(e) => setManualContent(e.target.value)}
                              placeholder="Base64 encoded ciphertext..."
                              className="enterprise-input min-h-[220px] resize-none font-mono text-sm leading-relaxed"
                            />
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-1">Encrypted Archive (.enc)</label>
                            <div 
                              onClick={() => fileInputRef.current?.click()}
                              className="group border-2 border-dashed border-border-subtle rounded-3xl p-20 flex flex-col items-center justify-center cursor-pointer hover:border-security/30 hover:bg-primary/[0.01] transition-all"
                            >
                              <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setManualFile(e.target.files?.[0] || null)} />
                              {manualFile ? (
                                <div className="flex flex-col items-center">
                                  <div className="w-16 h-16 bg-primary/5 text-primary rounded-2xl flex items-center justify-center mb-6 border border-border-subtle">
                                    <FileText className="w-8 h-8" />
                                  </div>
                                  <div className="text-primary font-bold text-xl mb-1">{manualFile.name}</div>
                                  <div className="text-text-muted text-[10px] uppercase tracking-widest font-bold">{(manualFile.size / 1024).toFixed(1)} KB</div>
                                </div>
                              ) : (
                                <>
                                  <div className="w-12 h-12 bg-primary/5 text-text-muted rounded-xl flex items-center justify-center mb-6 border border-border-subtle">
                                    <Upload className="w-6 h-6" />
                                  </div>
                                  <span className="text-primary font-bold text-lg mb-1">Load binary asset</span>
                                  <span className="text-text-muted text-xs font-medium">Terminal drop or browse</span>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-8 items-end">
                          <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted block whitespace-nowrap px-1">Salt</label>
                            <input
                              type="text"
                              value={manualSalt}
                              onChange={(e) => setManualSalt(e.target.value)}
                              placeholder="7f3a2b..."
                              className="enterprise-input font-mono text-sm tracking-widest"
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted block whitespace-nowrap px-1">Vector (IV)</label>
                            <input
                              type="text"
                              value={manualIv}
                              onChange={(e) => setManualIv(e.target.value)}
                              placeholder="a1b2c3..."
                              className="enterprise-input font-mono text-sm tracking-widest"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleDecrypt} className="mt-16 pt-16 border-t border-border-subtle space-y-12">
                      <div className="space-y-6">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-2">Master Key</label>
                        <div className="relative group">
                          <input 
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="enterprise-input h-16 text-xl tracking-[0.2em] pr-16"
                            required
                          />
                          <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-6 flex items-center text-text-muted hover:text-primary transition-all"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <button 
                        type="submit"
                        disabled={isDecrypting || !password}
                        className="primary-button w-full h-16 text-lg group overflow-hidden relative"
                      >
                        <div className="relative z-10 flex items-center gap-3">
                          {isDecrypting ? (
                            <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                          ) : (
                            <Shield className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                          )}
                          {isDecrypting ? 'Processing Cipher...' : 'Execute Decryption'}
                        </div>
                      </button>

                      {diagnostics && (
                        <div className="space-y-6">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-2">Runtime Evidence</label>
                          <div className="p-8 rounded-3xl bg-background border border-border-subtle font-mono text-[11px] text-text-muted space-y-4">
                            <div className="flex justify-between border-b border-border-subtle pb-4">
                              <span>PROTOCOL</span>
                              <span className="text-primary font-bold tracking-widest">AES-256-GCM</span>
                            </div>
                            <div className="flex justify-between">
                              <span>PAYLOAD WEIGHT</span>
                              <span className="text-primary font-bold">{diagnostics.size.toLocaleString()} BYTES</span>
                            </div>
                            {diagnostics.signature && (
                              <div className="flex justify-between text-security pt-2 border-t border-border-subtle">
                                <span>MIME SIGNATURE</span>
                                <span className="font-bold">{diagnostics.signature.toUpperCase()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </form>
                  </div>

                  <div className="mt-12 p-8 rounded-3xl bg-primary/5 border border-border-subtle flex gap-6 items-center">
                    <div className="w-12 h-12 rounded-2xl bg-security/10 flex items-center justify-center text-security flex-shrink-0">
                      <Shield className="w-6 h-6" />
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Restoration is processed in the browser&apos;s secure context. Your master key and raw data are never transmitted over the network.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-4 space-y-10 text-left">
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-10"
            >
              <div className="flex items-center gap-4 mb-8 border-b border-border-subtle pb-6">
                <Shield className="w-5 h-5 text-security" />
                <h3 className="font-bold text-primary uppercase tracking-widest text-xs">Security Policy</h3>
              </div>
              <ul className="space-y-8">
                <li className="flex gap-5">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/5 border border-border-subtle flex items-center justify-center text-[10px] font-bold text-primary">1</div>
                  <p className="text-sm text-text-secondary leading-relaxed"><span className="text-primary font-bold">Client-Side:</span> Password never leaves your local context.</p>
                </li>
                <li className="flex gap-5">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/5 border border-border-subtle flex items-center justify-center text-[10px] font-bold text-primary">2</div>
                  <p className="text-sm text-text-secondary leading-relaxed"><span className="text-primary font-bold">Authenticated:</span> GCM mode ensures asset integrity.</p>
                </li>
                <li className="flex gap-5">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/5 border border-border-subtle flex items-center justify-center text-[10px] font-bold text-primary">3</div>
                  <p className="text-sm text-text-secondary leading-relaxed"><span className="text-primary font-bold">Hardened:</span> PBKDF2 with 100k+ secure iterations.</p>
                </li>
              </ul>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-10"
            >
              <div className="flex items-center gap-4 mb-8 border-b border-border-subtle pb-6">
                <Info className="w-5 h-5 text-text-muted" />
                <h3 className="font-bold text-primary uppercase tracking-widest text-xs">Integrity Tip</h3>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                Decryption will fail if the provided salt or vector does not exactly match the values generated during provision.
              </p>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
export default function DecryptPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 border-4 border-white/5 border-t-primary rounded-full animate-spin" />
            <p className="text-text-muted font-bold uppercase tracking-widest text-[10px]">
              Loading...
            </p>
          </div>
        </div>
      }
    >
      <DecryptContent />
    </Suspense>
  );
}