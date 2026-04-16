import React from 'react';
import { Utensils, LayoutDashboard, ArrowDownCircle, ArrowUpCircle, FileText, Settings } from 'lucide-react';

interface NavbarProps {
  activeTab: 'kasir' | 'pengeluaran' | 'pemasukan' | 'laporan';
  setActiveTab: (tab: 'kasir' | 'pengeluaran' | 'pemasukan' | 'laporan') => void;
  setIsSettingsOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, setIsSettingsOpen }) => {
  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2 whitespace-nowrap">
            <Utensils size={24} className="shrink-0" /> <span className="hidden sm:inline">Kedai Elvera 57</span>
          </h1>
          
          <div className="flex items-center gap-1 sm:gap-2">
            <button 
              onClick={() => setActiveTab('kasir')}
              className={`px-2 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'kasir' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <LayoutDashboard size={18} className="shrink-0" /> <span className="hidden md:inline">Kasir</span>
            </button>
            <button 
              onClick={() => setActiveTab('pengeluaran')}
              className={`px-2 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'pengeluaran' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <ArrowDownCircle size={18} className="shrink-0" /> <span className="hidden md:inline">Pengeluaran</span>
            </button>
            <button 
              onClick={() => setActiveTab('pemasukan')}
              className={`px-2 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'pemasukan' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <ArrowUpCircle size={18} className="shrink-0" /> <span className="hidden md:inline">Pemasukan</span>
            </button>
            <button 
              onClick={() => setActiveTab('laporan')}
              className={`px-2 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'laporan' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <FileText size={18} className="shrink-0" /> <span className="hidden md:inline">Laporan</span>
            </button>
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shrink-0"
              title="Pengaturan Menu"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
