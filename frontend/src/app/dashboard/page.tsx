"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, FileText, MessageSquare, Trash2, Share2, 
  Shield, Search, Filter, Clock, LayoutGrid, List, Download, 
  MoreHorizontal, ChevronRight, Activity, HardDrive, Lock, Database, Globe
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
      toast.error("Handshake failed");
    } finally {
      setIsFetching(false);
    }
  };

  const deleteFile = async (id: string) => {
    if (!confirm("Permanently decommission this asset?")) return;
    try {
      const token = await getToken();
      await axios.delete(`${API_URL}/files/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFiles(files.filter(f => f._id !== id));
      toast.success("Asset erased");
    } catch (error) {
      toast.error("Operation failed");
    }
  };

  const filteredFiles = files.filter(file => 
    file.fileName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.originalName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return null;

  return (
    <div className="flex flex-col min-h-screen bg-background text-primary selection:bg-primary/10">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/5 border border-border-subtle flex items-center justify-center">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-primary">Command Center</h1>
              </div>
              <p className="text-text-secondary text-lg">Infrastructure monitoring and asset management.</p>
            </div>
            <Link href="/encrypt" className="primary-button h-12 px-8">
              <Plus className="w-4 h-4" />
              Provision Asset
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
            <StatCard icon={<Shield className="w-5 h-5" />} label="Security Level" value="Enterprise" />
            <StatCard icon={<Lock className="w-5 h-5" />} label="Active Assets" value={files.length} />
            <StatCard icon={<Database className="w-5 h-5" />} label="Vault Storage" value={`${(files.reduce((acc, f) => acc + (f.size || 0), 0) / 1024).toFixed(1)} KB`} />
            <StatCard icon={<Globe className="w-5 h-5" />} label="Global Nodes" value="Verified" />
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row items-center gap-4 mb-10">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input 
                type="text" 
                placeholder="Search assets by name or ID..."
                className="w-full bg-surface border border-border-subtle rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-security/50 transition-all text-primary placeholder:text-text-muted"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex p-1 bg-surface border border-border-subtle rounded-xl">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-text-muted hover:text-primary'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-text-muted hover:text-primary'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          {isFetching ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 rounded-[20px] bg-primary/[0.02] border border-border-subtle animate-pulse" />
              ))}
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-40 glass-card border-dashed border-border-subtle">
              <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-border-subtle">
                <Shield className="w-8 h-8 text-text-muted" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-primary">Environment Clear</h3>
              <p className="text-text-secondary max-w-xs mx-auto mb-10 text-sm">No protected assets found. Start by provisioning your first secure context.</p>
              <Link href="/encrypt" className="primary-button inline-flex mx-auto h-12 px-10">
                Initialize Vault
              </Link>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {filteredFiles.map((file) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={file._id}
                    className="glass-card p-8 group relative hover:bg-elevated transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-10 h-10 rounded-xl bg-primary/5 border border-border-subtle flex items-center justify-center text-primary">
                        {file.fileType === 'file' ? <FileText className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setSharingFile(file) || setIsShareModalOpen(true)} 
                          className="p-2 text-text-secondary hover:text-primary transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteFile(file._id)} 
                          className="p-2 text-text-secondary hover:text-danger transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <h4 className="text-lg font-bold text-primary truncate mb-2 group-hover:text-security transition-colors">
                      {file.originalName || "Encrypted Message"}
                    </h4>
                    
                    <div className="flex items-center gap-4 mb-8">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted uppercase tracking-widest">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(file.createdAt).toLocaleDateString()}
                      </div>
                      <div className="badge-muted">
                        {file.fileType.toUpperCase()}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-border-subtle">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                        {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Payload'}
                      </span>
                      <Link 
                        href={`/decrypt?id=${file._id}`}
                        className="text-xs font-bold text-primary flex items-center gap-1 hover:text-security transition-colors"
                      >
                        Unlock Asset <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-primary/[0.02] border-b border-border-subtle">
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">Asset</th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">Type</th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">Deployment</th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted text-right">Operation</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map((file) => (
                    <tr key={file._id} className="border-b border-primary/[0.02] hover:bg-primary/[0.01] transition-colors group">
                      <td className="px-8 py-5 font-bold text-primary group-hover:text-security transition-colors">{file.originalName || "Secure Blob"}</td>
                      <td className="px-8 py-5 text-xs text-text-secondary uppercase font-mono tracking-widest">{file.fileType}</td>
                      <td className="px-8 py-5 text-xs text-text-secondary">{new Date(file.createdAt).toLocaleDateString()}</td>
                      <td className="px-8 py-5 text-right">
                        <Link href={`/decrypt?id=${file._id}`} className="text-xs font-bold text-primary hover:text-security transition-colors">
                          Execute Unlock
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        file={sharingFile} 
      />
    </div>
  );
}

function StatCard({ icon, label, value, color = "text-primary" }: any) {
  return (
    <div className="glass-card p-6 flex items-center gap-5 hover:bg-elevated transition-colors">
      <div className="w-10 h-10 rounded-xl bg-primary/5 border border-border-subtle flex items-center justify-center text-text-muted">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">{label}</p>
        <p className={`text-xl font-bold tracking-tight ${color}`}>{value}</p>
      </div>
    </div>
  );
}
