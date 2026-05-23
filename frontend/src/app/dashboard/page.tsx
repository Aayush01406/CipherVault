"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, FileText, MessageSquare, Trash2, Share2, 
  Shield, Search, Filter, Clock, LayoutGrid, List, Download, 
  MoreHorizontal, ChevronRight, Activity, HardDrive
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
      toast.error("Security handshake failed. Please refresh.");
    } finally {
      setIsFetching(false);
    }
  };

  const deleteFile = async (id: string) => {
    if (!confirm("This action will permanently erase the encrypted blob. Continue?")) return;
    try {
      const token = await getToken();
      await axios.delete(`${API_URL}/files/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFiles(files.filter(f => f._id !== id));
      toast.success("Asset decommissioned");
    } catch (error) {
      toast.error("Decommission failed");
    }
  };

  const filteredFiles = files.filter(file => 
    file.fileName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.originalName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return null;

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#0a0c10] text-slate-900 dark:text-slate-200">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <StatCard icon={<Shield className="w-4 h-4" />} label="Security Status" value="Verified" color="text-emerald-500" />
            <StatCard icon={<FileText className="w-4 h-4" />} label="Total Assets" value={files.length.toString()} />
            <StatCard icon={<HardDrive className="w-4 h-4" />} label="Vault Usage" value={`${(files.length * 1.2).toFixed(1)} MB`} />
            <StatCard icon={<Activity className="w-4 h-4" />} label="Active Links" value="3" />
          </div>

          {/* Action Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search encrypted assets..."
                className="enterprise-input pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex p-1 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/5">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              <Link href="/encrypt" className="primary-button h-10 px-5 text-sm">
                <Plus className="w-4 h-4" />
                New Secure Upload
              </Link>
            </div>
          </div>

          {/* Vault Content */}
          {isFetching ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-48 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 animate-pulse" />
              ))}
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-32 glass-card rounded-2xl">
              <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold mb-2">Vault Empty</h3>
              <p className="text-slate-500 max-w-xs mx-auto mb-8">No encrypted assets found in this environment. Start by uploading your first file.</p>
              <Link href="/encrypt" className="secondary-button inline-flex mx-auto">
                Begin Initialization
              </Link>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredFiles.map((file) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    key={file._id}
                    className="glass-card p-5 rounded-xl group relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-2.5 rounded-lg ${file.fileUrl ? 'bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400' : 'bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400'}`}>
                        {file.fileUrl ? <FileText className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setSharingFile(file) || setIsShareModalOpen(true)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors">
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteFile(file._id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <h4 className="font-bold text-slate-900 dark:text-white truncate mb-1 pr-10">{file.originalName || "Encrypted Message"}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-4 uppercase tracking-wider font-medium">
                      <Clock className="w-3 h-3" />
                      {new Date(file.createdAt).toLocaleDateString()}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {file.fileSize ? `${(file.fileSize / 1024).toFixed(1)} KB` : '128-bit payload'}
                      </span>
                      <Link 
                        href={`/decrypt?id=${file._id}`}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      >
                        Unlock & Details <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="glass-card rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Asset Name</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Type</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Size</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Created</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map((file) => (
                    <tr key={file._id} className="data-row">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span className="font-medium text-slate-900 dark:text-white">{file.originalName || "Secure Blob"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-white/5 text-slate-500 border border-slate-200 dark:border-white/5 uppercase">
                          {file.fileUrl ? 'Binary' : 'String'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{file.fileSize ? `${(file.fileSize / 1024).toFixed(1)} KB` : '--'}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{new Date(file.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          href={`/decrypt?id=${file._id}`}
                          className="p-2 text-slate-400 hover:text-blue-500 transition-colors inline-block"
                          title="View Details & Unlock"
                        >
                          <ChevronRight className="w-5 h-5" />
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

function StatCard({ icon, label, value, color = "text-slate-900 dark:text-white" }: any) {
  return (
    <div className="glass-card p-5 rounded-xl flex items-center gap-4">
      <div className="p-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-slate-400">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">{label}</p>
        <p className={`text-xl font-bold ${color}`}>{value}</p>
      </div>
    </div>
  );
}
