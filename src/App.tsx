/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Minus, ShoppingCart, Printer, FileText, 
  Trash2, Wallet, QrCode, History, Utensils,
  Settings, X, Save, LayoutDashboard, Receipt,
  ArrowUpCircle, ArrowDownCircle, Coins
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// --- MOCK DATA ---
const MENU_DATA = [
  { id: 1, name: 'Ayam Goreng Sambal', price: 18000, category: 'Makanan' },
  { id: 2, name: 'Nasi Putih', price: 5000, category: 'Makanan' },
  { id: 3, name: 'Lele Bakar', price: 15000, category: 'Makanan' },
  { id: 4, name: 'Es Teh Manis', price: 5000, category: 'Minuman' },
  { id: 5, name: 'Jeruk Hangat', price: 7000, category: 'Minuman' },
];

// --- UTILS ---
const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount).replace('Rp', 'Rp\u00A0');
};

const formatDate = (date: Date) => {
  const formatter = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '00';
  return `${getPart('day')}/${getPart('month')}/${getPart('year')}, ${getPart('hour')}:${getPart('minute')}:${getPart('second')}`;
};

// --- TYPES ---
interface MenuItem {
  id: number;
  name: string;
  price: number;
  category: string;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface Expense {
  id: number;
  description: string;
  amount: number;
  timestamp: Date;
}

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'kasir' | 'pengeluaran' | 'laporan'>('kasir');

  // State
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'QRIS'>('Tunai');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [isBillingOpen, setIsBillingOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Petty Cash & Expenses State
  const [pettyCash, setPettyCash] = useState<number>(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newExpense, setNewExpense] = useState({ description: '', amount: '' });

  // Form State for New Menu
  const [newItem, setNewItem] = useState({ name: '', price: '', category: 'Makanan' });

  // Load Data
  useEffect(() => {
    const savedMenu = localStorage.getItem('pos_menu');
    if (savedMenu) {
      setMenuItems(JSON.parse(savedMenu));
    } else {
      setMenuItems(MENU_DATA);
    }

    const savedTransactions = localStorage.getItem('pos_transactions');
    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions).map((t: any) => ({
        ...t,
        timestamp: new Date(t.timestamp)
      })));
    }

    const savedPettyCash = localStorage.getItem('pos_petty_cash');
    if (savedPettyCash) setPettyCash(Number(savedPettyCash));

    const savedExpenses = localStorage.getItem('pos_expenses');
    if (savedExpenses) {
      setExpenses(JSON.parse(savedExpenses).map((e: any) => ({
        ...e,
        timestamp: new Date(e.timestamp)
      })));
    }
  }, []);

  // Save Data
  useEffect(() => {
    if (menuItems.length > 0) localStorage.setItem('pos_menu', JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem('pos_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('pos_petty_cash', pettyCash.toString());
  }, [pettyCash]);

  useEffect(() => {
    localStorage.setItem('pos_expenses', JSON.stringify(expenses));
  }, [expenses]);

  // Perhitungan
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const change = cashReceived > totalAmount ? cashReceived - totalAmount : 0;
  
  const totalIncome = transactions.reduce((sum, t) => sum + t.total, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const currentBalance = pettyCash + totalIncome - totalExpense;

  // Logika Menu
  const handleAddMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) return;
    
    const item: MenuItem = {
      id: Date.now(),
      name: newItem.name,
      price: Number(newItem.price),
      category: newItem.category
    };
    
    setMenuItems([...menuItems, item]);
    setNewItem({ name: '', price: '', category: 'Makanan' });
  };

  const handleDeleteMenu = (id: number) => {
    setMenuItems(menuItems.filter(item => item.id !== id));
  };

  // Logika Pengeluaran
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.description || !newExpense.amount) return;

    const expense: Expense = {
      id: Date.now(),
      description: newExpense.description,
      amount: Number(newExpense.amount),
      timestamp: new Date()
    };

    setExpenses([expense, ...expenses]);
    setNewExpense({ description: '', amount: '' });
  };

  const handleDeleteExpense = (id: number) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  // Logika Penjumlahan
  const addToCart = (menuItem: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === menuItem.id);
      if (existing) {
        return prev.map(item => 
          item.id === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...menuItem, quantity: 1 }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === id);
      if (existing && existing.quantity > 1) {
        return prev.map(item => 
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prev.filter(item => item.id !== id);
    });
  };

  // --- LOGIKA CETAK THERMAL (HIDDEN IFRAME) ---
  const handlePrint = () => {
    const printContent = document.getElementById('receipt-thermal');
    if (!printContent) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <html>
          <head>
            <style>
              @page { size: 57mm auto; margin: 0; }
              body { 
                width: 57mm; margin: 0; padding: 5px; 
                font-family: 'FontB', 'Font B', 'Terminal', 'Courier New', Courier, monospace; 
                letter-spacing: -0.5px;
                font-stretch: condensed;
                font-size: 10px; color: #000000;
              }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .bold { font-weight: bold; }
              .dashed { border-top: 1px dashed #000; margin: 5px 0; }
              .item-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
            </style>
          </head>
          <body>${printContent.innerHTML}</body>
        </html>
      `);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        document.body.removeChild(iframe);
      }, 500);
    }
  };

  // --- LOGIKA EXPORT PDF CLOSING (MOBILE OPTIMIZED) ---
  const handleExportPDF = async () => {
    const element = document.getElementById('receipt-thermal');
    if (!element) return;

    window.scrollTo(0, 0);
    element.style.display = 'block';
    element.style.width = '200px'; 

    try {
      const canvas = await html2canvas(element, {
        scale: 2, // Statis 2 untuk kestabilan mobile
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = 58; 
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: [pdfWidth, pdfHeight],
        putOnlyUsedFonts: true,
        floatPrecision: 16
      });

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      // OTOMATISASI UNTUK ANDROID:
      // Alih-alih hanya .save(), kita buat Blob dan buka di tab baru untuk auto-print
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      
      // Buka di tab baru dan pemicu print otomatis
      const printWindow = window.open(blobUrl);
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          // Opsional: Beri nama file jika user memilih 'Save as PDF'
          pdf.save(`Struk_BudeSri_${Date.now()}.pdf`);
        };
      } else {
        // Fallback jika popup diblokir
        pdf.save(`Struk_BudeSri_${Date.now()}.pdf`);
        alert("PDF telah diunduh. Silakan buka file untuk mencetak.");
      }

    } catch (error) {
      console.error("Gagal cetak PDF:", error);
    } finally {
      element.style.display = 'none';
    }
  };

  const handleCheckout = () => {
    if (totalAmount === 0) return;
    const newTransaction = {
      id: Date.now(),
      total: totalAmount,
      items: [...cart],
      paymentMethod,
      timestamp: new Date()
    };
    setTransactions([newTransaction, ...transactions]);
    setShowReceipt(true);
  };

  const resetOrder = () => {
    setCart([]);
    setCashReceived(0);
    setShowReceipt(false);
    setIsBillingOpen(false);
  };

  const BillingSection = () => (
    <div className="bg-white rounded-t-3xl md:rounded-xl shadow-2xl md:shadow-lg border border-slate-200 p-6 md:sticky md:top-4 h-full md:h-auto overflow-y-auto touch-none md:touch-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold flex items-center gap-2 text-lg text-slate-800">Pembayaran</h2>
        <div className="flex items-center gap-3">
          <button onClick={() => setCart([])} className="text-rose-600 flex items-center gap-1 text-sm font-bold active:scale-95">
            <Trash2 size={16}/> RESET
          </button>
          <button onClick={() => setIsBillingOpen(false)} className="md:hidden text-slate-400 p-1">
            <Minus size={24} />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* MINI CART LIST */}
        {cart.length > 0 && (
          <div className="space-y-2 max-h-32 overflow-y-auto border-b border-slate-100 pb-4 pr-1">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <button onClick={() => removeFromCart(item.id)} className="text-rose-500 p-1 shrink-0 active:scale-90 transition-transform"><Minus size={14}/></button>
                  <span className="font-medium truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <span className="text-slate-400 text-[11px] font-medium">x{item.quantity}</span>
                  <div className="flex justify-between w-[90px] font-bold text-slate-700">
                    <span>Rp</span>
                    <span>{(item.price * item.quantity).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <p className="text-xs text-blue-600 font-bold uppercase mb-1">Total Bayar</p>
          <p className="text-3xl font-black text-blue-700">{formatIDR(totalAmount)}</p>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase">Metode Pembayaran</p>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => setPaymentMethod('Tunai')}
              className={`min-h-[50px] rounded-xl flex flex-col items-center justify-center gap-1 text-xs font-bold border transition-all active:scale-95 ${paymentMethod === 'Tunai' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 active:bg-slate-50'}`}
            >
              <Wallet size={20}/> TUNAI
            </button>
            <button 
              onClick={() => setPaymentMethod('QRIS')}
              className={`min-h-[50px] rounded-xl flex flex-col items-center justify-center gap-1 text-xs font-bold border transition-all active:scale-95 ${paymentMethod === 'QRIS' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 active:bg-slate-50'}`}
            >
              <QrCode size={20}/> QRIS
            </button>
          </div>
        </div>

        {paymentMethod === 'Tunai' && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Uang Tunai Diterima</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>
              <input 
                type="number"
                inputMode="numeric"
                className="w-full pl-10 p-3 border border-slate-300 rounded-xl font-bold text-xl text-blue-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all min-h-[50px]"
                placeholder="0"
                value={cashReceived || ''}
                onChange={(e) => setCashReceived(Number(e.target.value))}
              />
            </div>
            <div className="flex justify-between items-center bg-emerald-50 p-3 rounded-xl border border-emerald-100">
              <span className="text-xs text-emerald-600 font-bold uppercase">Kembalian</span>
              <span className="text-lg font-bold text-emerald-700">{formatIDR(change)}</span>
            </div>
          </div>
        )}

        <button 
          disabled={totalAmount === 0}
          onClick={handleCheckout}
          className="w-full bg-blue-600 active:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 text-lg active:scale-95 min-h-[56px]"
        >
          PROSES BAYAR
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-24 md:pb-0">
      {/* TOP NAVIGATION BAR */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
              <Utensils size={24} /> <span className="hidden sm:inline">Kedai Soto Bude Sri</span>
            </h1>
            
            <div className="flex items-center gap-1 sm:gap-4">
              <button 
                onClick={() => setActiveTab('kasir')}
                className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'kasir' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <LayoutDashboard size={18} /> <span className="hidden md:inline">Kasir</span>
              </button>
              <button 
                onClick={() => setActiveTab('pengeluaran')}
                className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'pengeluaran' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <ArrowDownCircle size={18} /> <span className="hidden md:inline">Pengeluaran</span>
              </button>
              <button 
                onClick={() => setActiveTab('laporan')}
                className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'laporan' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <FileText size={18} /> <span className="hidden md:inline">Laporan</span>
              </button>
              <div className="w-px h-6 bg-slate-200 mx-1"></div>
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
              >
                <Settings size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {activeTab === 'kasir' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* LEFT: MENU SELECTION */}
            <div className="md:col-span-8 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {menuItems.map(item => (
                  <button 
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-left transition-all active:scale-95 active:bg-slate-50 min-h-[100px] flex flex-col justify-between"
                  >
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">{item.category}</p>
                      <p className="font-bold text-slate-800 leading-tight mb-1 text-sm sm:text-base">{item.name}</p>
                    </div>
                    <p className="text-blue-600 font-bold text-sm">{formatIDR(item.price)}</p>
                  </button>
                ))}
                {menuItems.length === 0 && (
                  <div className="col-span-full py-12 text-center text-slate-400">
                    <p>Belum ada menu. Klik ikon gerigi untuk menambah menu.</p>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: BILLING (DESKTOP ONLY) */}
            <div className="hidden md:block md:col-span-4">
              {BillingSection()}
            </div>
          </div>
        )}

        {activeTab === 'pengeluaran' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-4 space-y-6">
              {/* PETTY CASH CARD */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                <div className="flex items-center gap-3 text-blue-600">
                  <Coins size={24} />
                  <h3 className="font-bold text-lg">Modal Awal (Petty Cash)</h3>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>
                  <input 
                    type="number"
                    className="w-full pl-10 p-3 border border-slate-300 rounded-xl font-bold text-xl text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={pettyCash || ''}
                    onChange={(e) => setPettyCash(Number(e.target.value))}
                    placeholder="0"
                  />
                </div>
                <p className="text-xs text-slate-400 italic">Modal awal yang ada di laci kasir setiap pagi.</p>
              </div>

              {/* ADD EXPENSE FORM */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                <div className="flex items-center gap-3 text-rose-600">
                  <ArrowDownCircle size={24} />
                  <h3 className="font-bold text-lg">Tambah Pengeluaran</h3>
                </div>
                <form onSubmit={handleAddExpense} className="space-y-3">
                  <input 
                    type="text"
                    placeholder="Keterangan (Contoh: Beli Gas)"
                    className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newExpense.description}
                    onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                    required
                  />
                  <input 
                    type="number"
                    placeholder="Nominal"
                    className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newExpense.amount}
                    onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                    required
                  />
                  <button type="submit" className="w-full bg-rose-600 text-white font-bold py-3 rounded-xl active:scale-95 transition-all">
                    CATAT PENGELUARAN
                  </button>
                </form>
              </div>
            </div>

            <div className="md:col-span-8">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="font-bold text-lg">Riwayat Pengeluaran</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {expenses.map(e => (
                    <div key={e.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center">
                          <ArrowDownCircle size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{e.description}</p>
                          <p className="text-xs text-slate-400">{formatDate(e.timestamp)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-rose-600">-{formatIDR(e.amount)}</span>
                        <button onClick={() => handleDeleteExpense(e.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {expenses.length === 0 && (
                    <div className="p-12 text-center text-slate-400 italic">Belum ada catatan pengeluaran.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'laporan' && (
          <div className="space-y-6">
            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 text-blue-600 mb-2">
                  <ArrowUpCircle size={20} />
                  <span className="text-xs font-bold uppercase">Total Pemasukan</span>
                </div>
                <p className="text-2xl font-black text-emerald-600">{formatIDR(totalIncome)}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 text-rose-600 mb-2">
                  <ArrowDownCircle size={20} />
                  <span className="text-xs font-bold uppercase">Total Pengeluaran</span>
                </div>
                <p className="text-2xl font-black text-rose-600">{formatIDR(totalExpense)}</p>
              </div>
              <div className="p-6 rounded-2xl shadow-sm bg-blue-600 text-white border-none">
                <div className="flex items-center gap-3 mb-2 opacity-80">
                  <LayoutDashboard size={20} />
                  <span className="text-xs font-bold uppercase">Saldo Akhir (Cash on Hand)</span>
                </div>
                <p className="text-2xl font-black">{formatIDR(currentBalance)}</p>
              </div>
            </div>

            {/* TRANSACTION HISTORY */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-lg">Riwayat Transaksi Penjualan</h3>
                <button onClick={() => setTransactions([])} className="text-rose-600 text-sm font-bold flex items-center gap-1">
                  <Trash2 size={16} /> Hapus Semua
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {transactions.map(t => (
                  <div key={t.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-slate-800">Transaksi #{t.id.toString().slice(-6)}</p>
                        <p className="text-xs text-slate-400">{formatDate(t.timestamp)} • {t.paymentMethod}</p>
                      </div>
                      <span className="font-bold text-emerald-600">{formatIDR(t.total)}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {t.items?.map((item: any, idx: number) => (
                        <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded">
                          {item.name} x{item.quantity}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <div className="p-12 text-center text-slate-400 italic">Belum ada riwayat transaksi.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MOBILE STICKY BOTTOM BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex items-center justify-between shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-40">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 font-bold uppercase">Total Bayar</span>
          <span className="text-xl font-black text-blue-700">{formatIDR(totalAmount)}</span>
        </div>
        <button 
          onClick={() => setIsBillingOpen(true)}
          className="bg-blue-600 active:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 active:scale-95"
        >
          <ShoppingCart size={20} /> BAYAR
        </button>
      </div>

      {/* MOBILE BILLING MODAL (BOTTOM SHEET) */}
      {isBillingOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="w-full animate-in slide-in-from-bottom duration-300">
            {BillingSection()}
          </div>
        </div>
      )}

      {/* SETTINGS MODAL (MANAGE MENU) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Settings className="text-blue-600" /> Pengaturan Menu
              </h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-rose-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* ADD FORM */}
              <form onSubmit={handleAddMenu} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <h3 className="font-bold text-sm uppercase text-slate-500">Tambah Menu Baru</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input 
                    type="text" 
                    placeholder="Nama Menu"
                    className="p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newItem.name}
                    onChange={e => setNewItem({...newItem, name: e.target.value})}
                    required
                  />
                  <input 
                    type="number" 
                    placeholder="Harga"
                    className="p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newItem.price}
                    onChange={e => setNewItem({...newItem, price: e.target.value})}
                    required
                  />
                  <select 
                    className="p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={newItem.category}
                    onChange={e => setNewItem({...newItem, category: e.target.value})}
                  >
                    <option value="Makanan">Makanan</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Pelengkap">Pelengkap</option>
                  </select>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <Plus size={18} /> TAMBAH KE DAFTAR
                </button>
              </form>

              {/* MENU LIST */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm uppercase text-slate-500">Daftar Menu Saat Ini</h3>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                  {menuItems.map(item => (
                    <div key={item.id} className="p-4 bg-white flex justify-between items-center hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="font-bold text-slate-800">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.category} • {formatIDR(item.price)}</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteMenu(item.id)}
                        className="text-rose-500 p-2 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {menuItems.length === 0 && (
                    <div className="p-8 text-center text-slate-400 text-sm italic">
                      Belum ada menu yang terdaftar.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Save size={18} /> SIMPAN & SELESAI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- RECEIPT TEMPLATE (REFINED AUTHENTIC VERSION) --- */}
      <div style={{ position: 'absolute', left: '-9999px', top: '0' }}>
        <div id="receipt-thermal" style={{ 
          width: '200px',
          padding: '15px 10px', 
          backgroundColor: '#ffffff',
          color: '#000000',
          fontFamily: '"Courier New", Courier, monospace',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          lineHeight: '1.2'
        }}>
          {/* HEADER */}
          <div style={{ textAlign: 'center', marginBottom: '6px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase', lineHeight: '1.1' }}>
              KEDAI SOTO AYAM
            </div>
            <div style={{ fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase', lineHeight: '1.1' }}>
              "BUDE SRI"
            </div>
            <div style={{ fontSize: '9px', marginTop: '4px', lineHeight: '1.2' }}>
              Jl. Pertanian Raya 11<br />
              Lebak Bulus, Jakarta Selatan
            </div>
          </div>

          <div style={{ borderTop: '0.5px solid #444', width: '100%', margin: '8px 0' }}></div>

          {/* INFO TRANSAKSI */}
          <div style={{ fontSize: '9px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <span>{new Date().toLocaleDateString('id-ID')}</span>
              <span>Kasir: Admin</span>
            </div>
            <div style={{ width: '100%' }}>{new Date().toLocaleTimeString('id-ID').replace(/\./g, ':')}</div>
          </div>

          <div style={{ borderTop: '0.5px solid #444', width: '100%', margin: '10px 0' }}></div>

          {/* RINCIAN ITEM (BODY) */}
          <div style={{ fontSize: '9px', display: 'flex', flexDirection: 'column', gap: '4px', margin: '2px 0' }}>
            {cart.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                <span style={{ flex: '1', wordBreak: 'break-word', paddingRight: '4px' }}>{item.name}</span>
                <span style={{ width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                <div style={{ width: '60px', display: 'flex', justifyContent: 'space-between', marginLeft: '4px' }}>
                  <span>Rp</span>
                  <span>{(item.price * item.quantity).toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '0.5px solid #444', width: '100%', margin: '10px 0' }}></div>

          {/* TOTAL UTAMA */}
          <div style={{ margin: '8px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <div style={{ fontSize: '10px', fontWeight: 'bold' }}>TOTAL BELANJA</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', whiteSpace: 'nowrap', paddingBottom: '8px' }}>
              Rp {totalAmount.toLocaleString('id-ID')}
            </div>
          </div>

          <div style={{ borderTop: '0.5px solid #444', width: '100%', margin: '10px 0' }}></div>

          {/* RINCIAN PEMBAYARAN */}
          <div style={{ fontSize: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <span>Metode:</span>
              <span>{paymentMethod}</span>
            </div>
            {paymentMethod === 'Tunai' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span>Bayar:</span>
                  <div style={{ width: '75px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Rp</span>
                    <span>{cashReceived.toLocaleString('id-ID')}</span>
                  </div>
                </div>
                <div style={{ borderTop: '0.5px solid #444', margin: '6px 0' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span>Kembali:</span>
                  <div style={{ width: '75px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                    <span>Rp</span>
                    <span>{change.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* WHITESPACE UNTUK KESAN STRUK PANJANG */}
          <div style={{ height: '30px' }}></div>

          <div style={{ borderTop: '0.5px solid #444', width: '100%', margin: '12px 0 10px 0' }}></div>

          {/* FOOTER */}
          <div style={{ textAlign: 'center', fontSize: '9px', display: 'flex', flexDirection: 'column', gap: '4px', fontWeight: 'normal' }}>
            <div>Terima Kasih</div>
            <div>Atas Pembelian Anda</div>
            <div>Kami tunggu kembali</div>
            <div>Kedatangannya</div>
          </div>

          {/* Extra space untuk sobekan kertas */}
          <div style={{ height: '20mm' }}></div>
        </div>
      </div>

      {/* --- MODAL RECEIPT SUCCESS --- */}
      {showReceipt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Printer size={32} />
              </div>
              <h2 className="text-xl font-bold">Pembayaran Berhasil!</h2>
              <p className="text-slate-500 text-sm">Silahkan pilih opsi cetak di bawah.</p>
            </div>

            <div className="space-y-2">
              <button 
                onClick={handlePrint}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-bold"
              >
                <Printer size={18} /> CETAK STRUK (THERMAL)
              </button>
              <button 
                onClick={handleExportPDF}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white py-3 rounded-xl font-bold"
              >
                <FileText size={18} /> SIMPAN PDF (CLOSING)
              </button>
              <button 
                onClick={resetOrder}
                className="w-full text-slate-500 text-sm font-bold py-2"
              >
                Tutup & Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
