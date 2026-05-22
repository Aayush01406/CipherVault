"use client";

import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { 
  Plus, FileText, MessageSquare, Trash2, Share2, 
  ExternalLink, Shield, Search, Filter, Clock, 
  ChevronRight, MoreVertical, LayoutGrid, List, Download
} from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import ShareModal from "@/components/ShareModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function Dashboard() {
  const { user, loading, getToken } = useAuth();
  const router = useRouter();
  const [files, setFiles] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sharingFile, setSharingFile] = useState<any>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    } else if (user) {
      fetchFiles();
    }
  }, [user, loading]);

  const fetchFiles = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(`${API_URL}/files`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFiles(response.data);
    } catch (error) {
      console.error("Error fetching files:", error);
      toast.error("Failed to load your vault");
    } finally {
      setIsFetching(false);
    }
  };

  const clearVault = async () => {
    if (!confirm("Delete everything in the testing vault? This cannot be undone.")) return;
    try {
      const token = await getToken();
      await axios.delete(`${API_URL}/files/clear`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFiles([]);
      toast.success("Vault cleared");
    } catch (error) {
      toast.error("Failed to clear vault");
    }
  };

  const deleteFile = async (id: string) => {
    if (!confirm("Are you sure you want to delete this? This action cannot be undone.")) return;
    
    try {
      const token = await getToken();
      await axios.delete(`${API_URL}/files/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFiles(files.filter(f => f._id !== id));
      toast.success("Deleted successfully");
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const shareFile = (file: any) => {
    setSharingFile(file);
    setIsShareModalOpen(true);
  };

  const downloadEncFile = async (file: any) => {
    try {
      let blob: Blob;
      // Obfuscate filename and extension for maximum security during manual transfer
      const timestamp = Date.now().toString(16);
      const randomPart = Math.random().toString(36).substring(2, 8);
      const obfuscatedName = `secure_blob_${timestamp}_${randomPart}.dat`;

      if (file.fileUrl) {
        // If it's a URL (from server)
        const response = await axios.get(file.fileUrl, { responseType: 'arraybuffer' });
        blob = new Blob([response.data], { type: 'application/octet-stream' });
      } else if (file.encryptedContent) {
        // If it's a message (base64)
        const binaryString = window.atob(file.encryptedContent);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        blob = new Blob([bytes], { type: 'application/octet-stream' });
      } else {
        throw new Error("No content found");
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
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download encrypted file");
    }
  };

  const filteredFiles = files.filter(f => 
    f.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    <div className="flex flex-col min-h-screen bg-[#02040c] text-slate-200">
      <Navbar />
      
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] animate-blob" />
        <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px] animate-blob animation-delay-2000" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <main className="flex-1 pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-16 gap-8"
        >
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                <Shield className="w-5 h-5 text-indigo-400" />
              </div>
              <span className="text-sm font-bold uppercase tracking-widest text-indigo-400/80">Secure Repository</span>
            </div>
            <h1 className="text-5xl font-bold tracking-tight mb-4">
              Your <span className="premium-gradient-text">Secure Vault</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-xl leading-relaxed">Everything in this vault is encrypted on your device. Only you hold the keys to unlock your assets.</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button 
              variant="outline" 
              onClick={clearVault} 
              className="flex-1 lg:flex-none border-rose-500/20 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/40 rounded-2xl px-8 h-12 font-bold transition-all active:scale-95"
            >
              Clear Vault
            </Button>
            <Button 
              onClick={() => router.push("/encrypt")} 
              className="flex-1 lg:flex-none premium-button rounded-2xl px-8 h-12 gap-3 shadow-xl active:scale-95"
            >
              <Plus className="w-5 h-5" />
              New Encryption
            </Button>
          </div>
        </motion.div>

        {/* Toolbar Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between"
        >
          <div className="relative w-full md:max-w-lg group">
            <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl blur-md group-focus-within:bg-indigo-500/10 transition-all" />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors z-10" />
            <input 
              type="text"
              placeholder="Search by filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="premium-input pl-14 h-14 relative z-0 text-base"
            />
          </div>
          
          <div className="flex items-center gap-2 bg-slate-900/40 p-1.5 border border-white/5 rounded-2xl backdrop-blur-xl">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
              title="List View"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {files.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-40 glass-card rounded-[3rem] border-dashed"
          >
            <div className="relative mb-10">
              <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full animate-pulse-slow" />
              <div className="relative w-28 h-28 bg-slate-950 rounded-[2rem] flex items-center justify-center shadow-inner border border-white/10">
                <Shield className="w-12 h-12 text-slate-700" />
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-4 text-white">Your Vault is Empty</h3>
            <p className="text-slate-400 mb-12 max-w-sm text-center text-lg leading-relaxed">
              Experience total privacy. Encrypt your first file or message to see it appear here.
            </p>
            <Button onClick={() => router.push("/encrypt")} className="premium-button gap-3 h-14 px-10 rounded-2xl text-lg shadow-2xl">
              <Plus className="w-6 h-6" />
              Create First Encryption
            </Button>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredFiles.map((file, idx) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                    key={file._id}
                    className="group glass-card glass-card-hover rounded-[2rem] p-8 relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-8">
                      <div className={`p-5 rounded-2xl shadow-inner border border-white/5 ${file.fileType === 'file' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-purple-500/10 text-purple-400'}`}>
                        {file.fileType === 'file' ? <FileText className="w-8 h-8" /> : <MessageSquare className="w-8 h-8" />}
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <button 
                          onClick={() => downloadEncFile(file)}
                          className="p-3 text-slate-500 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-xl transition-all border border-transparent hover:border-indigo-400/20"
                          title="Download .enc Archive"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => deleteFile(file._id)}
                          className="p-3 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all border border-transparent hover:border-rose-400/20"
                          title="Delete Permanently"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-bold text-2xl mb-3 truncate pr-4 text-white group-hover:text-indigo-300 transition-colors">{file.fileName}</h3>
                    
                    <div className="flex flex-wrap items-center gap-3 mb-10">
                      <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 text-xs font-bold text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(file.createdAt).toLocaleDateString()}
                      </span>
                      <span className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/10 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                        {file.fileType}
                      </span>
                      {file.size && (
                        <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/10 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="w-full h-12 rounded-2xl border-white/5 bg-white/5 text-slate-300 hover:text-indigo-400 hover:border-indigo-500/30 hover:bg-indigo-500/5 gap-2 font-bold"
                        onClick={() => shareFile(file)}
                      >
                        <Share2 className="w-4.5 h-4.5" />
                        Share
                      </Button>
                      <Button 
                        className="w-full h-12 rounded-2xl premium-button gap-2 shadow-none font-bold"
                        onClick={() => router.push(`/decrypt?id=${file._id}`)}
                      >
                        <ExternalLink className="w-4.5 h-4.5" />
                        Decrypt
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFiles.map((file, idx) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                    key={file._id}
                    className="group glass-card glass-card-hover rounded-2xl p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`p-3 rounded-xl border border-white/5 ${file.fileType === 'file' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-purple-500/10 text-purple-400'}`}>
                        {file.fileType === 'file' ? <FileText className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-lg truncate text-white group-hover:text-indigo-300 transition-colors">{file.fileName}</h3>
                        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(file.createdAt).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span className="uppercase tracking-widest text-[10px]">{file.fileType}</span>
                          {file.size && (
                            <>
                              <span>•</span>
                              <span className="text-indigo-400/70">{(file.size / 1024).toFixed(1)} KB</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-10 rounded-xl border-white/5 bg-white/5 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 gap-2 font-bold px-4"
                        onClick={() => shareFile(file)}
                      >
                        <Share2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Share</span>
                      </Button>
                      <Button 
                        size="sm"
                        className="h-10 rounded-xl premium-button gap-2 shadow-none font-bold px-4"
                        onClick={() => router.push(`/decrypt?id=${file._id}`)}
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="hidden sm:inline">Decrypt</span>
                      </Button>
                      <button 
                        onClick={() => downloadEncFile(file)}
                        className="p-2.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-xl transition-all border border-transparent hover:border-indigo-400/20"
                        title="Download .enc Archive"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => deleteFile(file._id)}
                        className="p-2.5 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all border border-transparent hover:border-rose-400/20"
                        title="Delete Permanently"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        )}
      </main>

      {sharingFile && (
        <ShareModal 
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          file={sharingFile}
          getToken={getToken}
        />
      )}
    </div>
  );
}
