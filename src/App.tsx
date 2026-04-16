/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Plus, Minus, ShoppingCart, Printer, FileText, 
  Trash2, Wallet, QrCode, History, Utensils, ShoppingBag,
  Settings, X, Save, LayoutDashboard, Receipt,
  ArrowUpCircle, ArrowDownCircle, Coins, CreditCard, TrendingUp
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { MenuSelection } from './components/MenuSelection';
import { BillingSection } from './components/BillingSection';
import { ExpenseForm } from './components/ExpenseForm';
import { IncomeForm } from './components/IncomeForm';
import { ExpenseList } from './components/ExpenseList';
import { IncomeList } from './components/IncomeList';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from './lib/supabase';

// --- MOCK DATA ---
const MENU_DATA = [
  { id: 1, name: 'Ayam Goreng Sambal', price: 18000, category: 'Makanan' },
  { id: 2, name: 'Nasi Putih', price: 5000, category: 'Makanan' },
  { id: 3, name: 'Lele Bakar', price: 15000, category: 'Makanan' },
  { id: 4, name: 'Es Teh Manis', price: 5000, category: 'Minuman' },
  { id: 5, name: 'Jeruk Hangat', price: 7000, category: 'Minuman' },
];

// --- UTILS ---
import { formatIDR, formatDate } from './utils/formatters';

const formatTransactionNumber = (date: Date | string, orderNum: number) => {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const bill = orderNum.toString().padStart(4, '0');
  return `${day}${month}${bill}`;
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
  note?: string;
  isTakeAway?: boolean;
}

interface Expense {
  id: number;
  description: string;
  amount: number;
  timestamp: Date;
}

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'kasir' | 'pengeluaran' | 'pemasukan' | 'laporan'>('kasir');
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [filterMonth, setFilterMonth] = useState<string>(currentMonthStr);
  const [pengeluaranSubTab, setPengeluaranSubTab] = useState<'harian' | 'bulanan'>('harian');
  const [pemasukanSubTab, setPemasukanSubTab] = useState<'harian' | 'bulanan'>('harian');

  // State
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'QRIS' | 'Debet'>('Tunai');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [cashReceivedDisplay, setCashReceivedDisplay] = useState<string>('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [isBillingOpen, setIsBillingOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Petty Cash & Expenses State
  const [pettyCash, setPettyCash] = useState<number>(0);
  const [pettyCashDisplay, setPettyCashDisplay] = useState<string>('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newExpense, setNewExpense] = useState({ description: '', amount: '' });

  // Additional Financial Metrics
  const [monthlyExpense, setMonthlyExpense] = useState<number>(0);
  const [monthlyExpenseDisplay, setMonthlyExpenseDisplay] = useState<string>('');
  const [tenantIncome, setTenantIncome] = useState<number>(0);
  const [tenantIncomeDisplay, setTenantIncomeDisplay] = useState<string>('');
  const [dailyIncomes, setDailyIncomes] = useState<Expense[]>([]);
  const [newDailyIncome, setNewDailyIncome] = useState({ description: '', amount: '' });

  // Form State for New Menu
  const [newItem, setNewItem] = useState({ name: '', price: '', category: 'Makanan' });

  // Customer Info State
  const [customerName, setCustomerName] = useState('');
  const [customerWA, setCustomerWA] = useState('');

  // Order Counter State
  const [orderCounter, setOrderCounter] = useState(1);
  const [currentOrderNumber, setCurrentOrderNumber] = useState<number | null>(null);

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      if (supabase) {
        try {
          const [
            { data: menuData },
            { data: txData },
            { data: expData },
            { data: incData },
            { data: settingsData }
          ] = await Promise.all([
            supabase.from('menu_items').select('*'),
            supabase.from('transactions').select('*'),
            supabase.from('expenses').select('*'),
            supabase.from('daily_incomes').select('*'),
            supabase.from('store_settings').select('*')
          ]);

          if (menuData && menuData.length > 0) setMenuItems(menuData);
          else setMenuItems(MENU_DATA);

          if (txData) setTransactions(txData.map(t => ({ 
            id: t.id, items: t.items, total: t.total, paymentMethod: t.payment_method, timestamp: new Date(t.timestamp), orderNumber: t.order_number 
          })));

          if (expData) setExpenses(expData.map(e => ({ ...e, timestamp: new Date(e.timestamp) })));
          if (incData) setDailyIncomes(incData.map(i => ({ ...i, timestamp: new Date(i.timestamp) })));

          const today = new Date().toDateString();
          if (settingsData) {
            const pettyCashSetting = settingsData.find(s => s.key === 'petty_cash');
            if (pettyCashSetting) {
              const val = Number(pettyCashSetting.value);
              setPettyCash(val);
              setPettyCashDisplay(val === 0 ? '' : val.toLocaleString('id-ID').replace(/,/g, '.'));
            }
            const orderCounterSetting = settingsData.find(s => s.key === 'order_counter');
            const orderCounterDateSetting = settingsData.find(s => s.key === 'order_counter_date');
            
            if (orderCounterDateSetting && orderCounterDateSetting.value === today) {
              if (orderCounterSetting) setOrderCounter(Number(orderCounterSetting.value));
            } else {
              setOrderCounter(1);
              supabase.from('store_settings').upsert([
                { key: 'order_counter', value: '1' },
                { key: 'order_counter_date', value: today }
              ]);
            }
          }
          return;
        } catch (error) {
          console.error('Supabase load error:', error);
        }
      }

      const savedMenu = localStorage.getItem('pos_menu');
      if (savedMenu) {
        setMenuItems(JSON.parse(savedMenu));
      } else {
        setMenuItems(MENU_DATA);
      }

      const savedCounter = localStorage.getItem('pos_order_counter');
      const savedCounterDate = localStorage.getItem('pos_order_counter_date');
      const today = new Date().toDateString();

      if (savedCounterDate === today) {
        if (savedCounter) setOrderCounter(Number(savedCounter));
      } else {
        setOrderCounter(1);
        localStorage.setItem('pos_order_counter', '1');
        localStorage.setItem('pos_order_counter_date', today);
      }

      const savedTransactions = localStorage.getItem('pos_transactions');
      if (savedTransactions) {
        setTransactions(JSON.parse(savedTransactions).map((t: any) => ({
          ...t,
          timestamp: new Date(t.timestamp)
        })));
      }

      const savedPettyCash = localStorage.getItem('pos_petty_cash');
      if (savedPettyCash) {
        const val = Number(savedPettyCash);
        setPettyCash(val);
        setPettyCashDisplay(val === 0 ? '' : val.toLocaleString('id-ID').replace(/,/g, '.'));
      }

      const savedExpenses = localStorage.getItem('pos_expenses');
      if (savedExpenses) {
        setExpenses(JSON.parse(savedExpenses).map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp)
        })));
      }

      const savedDailyIncomes = localStorage.getItem('pos_daily_incomes');
      if (savedDailyIncomes) {
        setDailyIncomes(JSON.parse(savedDailyIncomes).map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp)
        })));
      } else {
        const oldParkingIncome = localStorage.getItem('parkingIncome');
        if (oldParkingIncome && parseInt(oldParkingIncome) > 0) {
          setDailyIncomes([{
            id: Date.now(),
            description: 'Parkiran Kendaraan',
            amount: parseInt(oldParkingIncome),
            timestamp: new Date()
          }]);
        }
      }
    };
    loadData();
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
    if (supabase) {
      const timeoutId = setTimeout(() => {
        supabase.from('store_settings').upsert({ key: 'petty_cash', value: pettyCash.toString() });
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [pettyCash]);

  useEffect(() => {
    localStorage.setItem('pos_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('pos_daily_incomes', JSON.stringify(dailyIncomes));
  }, [dailyIncomes]);

  useEffect(() => {
    localStorage.setItem('pos_order_counter', orderCounter.toString());
    localStorage.setItem('pos_order_counter_date', new Date().toDateString());
    if (supabase) {
      supabase.from('store_settings').upsert([
        { key: 'order_counter', value: orderCounter.toString() },
        { key: 'order_counter_date', value: new Date().toDateString() }
      ]);
    }
  }, [orderCounter]);

  // Perhitungan
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const change = cashReceived > totalAmount ? cashReceived - totalAmount : 0;
  
  const totalIncome = transactions.reduce((sum, t) => sum + t.total, 0);
  const totalProfit = totalIncome * 0.5; // Margin profit 50%
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalParkingIncome = dailyIncomes.reduce((sum, i) => sum + i.amount, 0);
  const currentBalance = pettyCash + totalIncome + tenantIncome + totalParkingIncome - totalExpense - monthlyExpense;

  // Perhitungan Detail untuk Laporan Closing
  const itemsSold = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach(t => {
      t.items.forEach((item: any) => {
        map[item.name] = (map[item.name] || 0) + item.quantity;
      });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [transactions]);

  const incomeByMethod = useMemo(() => {
    const methods = { QRIS: 0, Debet: 0, Tunai: 0 };
    transactions.forEach(t => {
      if (t.paymentMethod === 'QRIS') methods.QRIS += t.total;
      else if (t.paymentMethod === 'Debet') methods.Debet += t.total;
      else if (t.paymentMethod === 'Tunai') methods.Tunai += t.total;
    });
    return methods;
  }, [transactions]);

  const totalPorsi = itemsSold.reduce((sum, [_, qty]) => sum + qty, 0);

  // --- FILTER BULAN UNTUK LAPORAN ---
  const isSameMonth = (date: Date, filter: string) => {
    if (!filter) return true;
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}` === filter;
  };

  const filteredTransactions = transactions.filter(t => isSameMonth(t.timestamp, filterMonth));
  const filteredExpenses = expenses.filter(e => isSameMonth(e.timestamp, filterMonth));
  const filteredDailyIncomes = dailyIncomes.filter(i => isSameMonth(i.timestamp, filterMonth));

  const filteredTotalIncome = filteredTransactions.reduce((sum, t) => sum + t.total, 0);
  const filteredTotalExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const filteredTotalParkingIncome = filteredDailyIncomes.reduce((sum, i) => sum + i.amount, 0);

  const filteredItemsSold = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTransactions.forEach(t => {
      t.items.forEach((item: any) => {
        map[item.name] = (map[item.name] || 0) + item.quantity;
      });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredTransactions]);

  const filteredIncomeByMethod = useMemo(() => {
    const methods = { QRIS: 0, Debet: 0, Tunai: 0 };
    filteredTransactions.forEach(t => {
      if (t.paymentMethod === 'QRIS') methods.QRIS += t.total;
      else if (t.paymentMethod === 'Debet') methods.Debet += t.total;
      else if (t.paymentMethod === 'Tunai') methods.Tunai += t.total;
    });
    return methods;
  }, [filteredTransactions]);

  const filteredTotalPorsi = filteredItemsSold.reduce((sum, [_, qty]) => sum + qty, 0);

  // --- UTILS UNTUK INPUT FORMATTING ---
  const formatInputNumber = (val: string) => {
    const clean = val.replace(/\D/g, '');
    if (!clean) return '';
    return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const parseInputNumber = (val: string) => {
    return Number(val.replace(/\./g, '')) || 0;
  };

  // Logika Menu
  const handleAddMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) return;
    
    const item: MenuItem = {
      id: Date.now(),
      name: newItem.name,
      price: parseInputNumber(newItem.price),
      category: newItem.category
    };
    
    setMenuItems([...menuItems, item]);
    setNewItem({ name: '', price: '', category: 'Makanan' });
    
    if (supabase) {
      await supabase.from('menu_items').insert([item]);
    }
  };

  const handleDeleteMenu = async (id: number) => {
    setMenuItems(menuItems.filter(item => item.id !== id));
    if (supabase) {
      await supabase.from('menu_items').delete().eq('id', id);
    }
  };

  // Logika Pengeluaran
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.description || !newExpense.amount) return;

    const expense: Expense = {
      id: Date.now(),
      description: newExpense.description,
      amount: parseInputNumber(newExpense.amount),
      timestamp: new Date()
    };

    setExpenses([expense, ...expenses]);
    setNewExpense({ description: '', amount: '' });
    
    if (supabase) {
      await supabase.from('expenses').insert([{
        id: expense.id,
        description: expense.description,
        amount: expense.amount,
        timestamp: expense.timestamp.toISOString()
      }]);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    setExpenses(expenses.filter(e => e.id !== id));
    if (supabase) {
      await supabase.from('expenses').delete().eq('id', id);
    }
  };

  const handleAddDailyIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDailyIncome.description || !newDailyIncome.amount) return;
    
    const income: Expense = {
      id: Date.now(),
      description: newDailyIncome.description,
      amount: parseInputNumber(newDailyIncome.amount),
      timestamp: new Date()
    };
    
    setDailyIncomes([income, ...dailyIncomes]);
    setNewDailyIncome({ description: '', amount: '' });
    
    if (supabase) {
      await supabase.from('daily_incomes').insert([{
        id: income.id,
        description: income.description,
        amount: income.amount,
        timestamp: income.timestamp.toISOString()
      }]);
    }
  };

  const handleDeleteDailyIncome = async (id: number) => {
    setDailyIncomes(dailyIncomes.filter(i => i.id !== id));
    if (supabase) {
      await supabase.from('daily_incomes').delete().eq('id', id);
    }
  };

  // Logika Penjumlahan
  const addToCart = (menuItem: any, isTakeAway: boolean = false) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === menuItem.id && !!item.isTakeAway === isTakeAway);
      if (existing) {
        return prev.map(item => 
          (item.id === menuItem.id && !!item.isTakeAway === isTakeAway) ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...menuItem, quantity: 1, isTakeAway }];
    });
  };

  const removeFromCart = (id: number, isTakeAway: boolean = false) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === id && !!item.isTakeAway === isTakeAway);
      if (existing && existing.quantity > 1) {
        return prev.map(item => 
          (item.id === id && !!item.isTakeAway === isTakeAway) ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prev.filter(item => !(item.id === id && !!item.isTakeAway === isTakeAway));
    });
  };

  const updateCartNote = (id: number, isTakeAway: boolean, note: string) => {
    setCart(prev => prev.map(item => 
      (item.id === id && !!item.isTakeAway === isTakeAway) ? { ...item, note } : item
    ));
  };

  // --- LOGIKA CETAK (REUSABLE) ---
  const executePrint = (elementId: string) => {
    const printContent = document.getElementById(elementId);
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

  const handlePrintCustomer = () => executeExportPDF('receipt-thermal', 'Struk_Customer');
  const handlePrintKitchen = () => executeExportPDF('receipt-kitchen', 'Pesanan_Dapur');

  // --- LOGIKA EXPORT PDF (CORPORATE A4) ---
  const handleExportCorporateReport = () => {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('REKAPITULASI KEUANGAN BULANAN', pageWidth / 2, margin, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('KEDAI ELVERA 57', pageWidth / 2, margin + 6, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, pageWidth / 2, margin + 12, { align: 'center' });

    // Summary Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('RINGKASAN KEUANGAN', margin, margin + 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    doc.text('TOTAL OMSET KOTOR :', margin, margin + 32);
    doc.text(formatIDR(totalIncome), pageWidth - margin, margin + 32, { align: 'right' });
    
    doc.text('TOTAL OMSET BERSIH 50% :', margin, margin + 38);
    doc.text(formatIDR(totalProfit), pageWidth - margin, margin + 38, { align: 'right' });
    
    doc.text('Gaji + Listrik + Air + Internet :', margin, margin + 44);
    doc.text(formatIDR(totalExpense), pageWidth - margin, margin + 44, { align: 'right' });
    
    doc.text('SALDO AKHIR (Cash on Hand) :', margin, margin + 50);
    doc.text(formatIDR(currentBalance), pageWidth - margin, margin + 50, { align: 'right' });

    // Transactions Table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Rincian Transaksi Penjualan', margin, margin + 65);

    const tableData = transactions.map(t => [
      `#${formatTransactionNumber(t.timestamp, t.orderNumber)}`,
      formatDate(t.timestamp),
      t.paymentMethod,
      formatIDR(t.total)
    ]);

    autoTable(doc, {
      startY: margin + 70,
      head: [['No. Transaksi', 'Waktu', 'Metode', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      columnStyles: {
        3: { halign: 'right' }
      },
      margin: { left: margin, right: margin },
      didDrawPage: function (data) {
        // Footer
        const str = 'Halaman ' + (doc as any).internal.getNumberOfPages();
        doc.setFontSize(10);
        doc.text(str, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY || margin + 75;

    // Expenses Table
    if (expenses.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Rincian Pengeluaran', margin, finalY + 15);

      const expenseData = expenses.map(e => [
        formatDate(e.timestamp),
        e.description,
        formatIDR(e.amount)
      ]);

      autoTable(doc, {
        startY: finalY + 20,
        head: [['Waktu', 'Keterangan', 'Jumlah']],
        body: expenseData,
        theme: 'grid',
        headStyles: { fillColor: [192, 57, 43] },
        columnStyles: {
          2: { halign: 'right' }
        },
        margin: { left: margin, right: margin },
        didDrawPage: function (data) {
          // Footer
          const str = 'Halaman ' + (doc as any).internal.getNumberOfPages();
          doc.setFontSize(10);
          doc.text(str, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }
      });
    }

    // Save
    doc.save(`Laporan_Closing_${Date.now()}.pdf`);
  };

  // --- LOGIKA EXPORT PDF (REUSABLE) ---
  const executeExportPDF = async (elementId: string, fileName: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    window.scrollTo(0, 0);
    const originalDisplay = element.style.display;
    const originalWidth = element.style.width;
    const originalPadding = element.style.padding;
    
    element.style.display = 'block';
    element.style.width = '215px'; // Approx 57mm at 96 DPI
    element.style.padding = '8px';

    try {
      console.log(`Memulai ekspor PDF untuk: ${elementId}`);
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = 58; // Strict 58mm
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: [pdfWidth, pdfHeight],
        putOnlyUsedFonts: true,
        floatPrecision: 16
      });

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      
      const printWindow = window.open(blobUrl);
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          pdf.save(`${fileName}_${Date.now()}.pdf`);
        };
      } else {
        pdf.save(`${fileName}_${Date.now()}.pdf`);
        alert("PDF telah diunduh. Silakan buka file untuk mencetak.");
      }

    } catch (error) {
      console.error("Gagal cetak PDF:", error);
    } finally {
      element.style.display = originalDisplay;
      element.style.width = originalWidth;
    }
  };

  const handleExportClosing = () => executeExportPDF('report-closing', 'Laporan_Closing');
  const handleExportCustomerPDF = () => executeExportPDF('receipt-thermal', 'Struk_Customer');

  const handleCheckout = async () => {
    if (totalAmount === 0) return;
    const orderNum = orderCounter;
    const newTransaction = {
      id: Date.now(),
      orderNumber: orderNum,
      customerName,
      customerWA,
      total: totalAmount,
      items: [...cart],
      paymentMethod,
      timestamp: new Date()
    };
    setTransactions([newTransaction, ...transactions]);
    setCurrentOrderNumber(orderNum);
    setOrderCounter(prev => prev + 1);
    setShowReceipt(true);

    if (supabase) {
      await supabase.from('transactions').insert([{
        id: newTransaction.id,
        items: newTransaction.items,
        total: newTransaction.total,
        payment_method: newTransaction.paymentMethod,
        timestamp: newTransaction.timestamp.toISOString(),
        order_number: newTransaction.orderNumber
      }]);
    }
  };

  const resetOrder = () => {
    setCart([]);
    setCashReceived(0);
    setCashReceivedDisplay('');
    setCustomerName('');
    setCustomerWA('');
    setShowReceipt(false);
    setIsBillingOpen(false);
    setCurrentOrderNumber(null);
  };


  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-24 md:pb-0">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} setIsSettingsOpen={setIsSettingsOpen} />

      <div className="max-w-6xl mx-auto p-4">
        {activeTab === 'kasir' && (
          <div className="flex flex-col md:grid md:grid-cols-12 gap-4">
            {/* LEFT: MENU SELECTION */}
            <div className="col-span-1 md:col-span-8 space-y-4 order-1">
              <MenuSelection 
                menuItems={menuItems}
                cart={cart}
                addToCart={addToCart}
                removeFromCart={removeFromCart}
                updateCartNote={updateCartNote}
              />
            </div>

            {/* RIGHT: BILLING (ALWAYS VISIBLE, BELOW MENU ON MOBILE) */}
            <div className="col-span-1 md:col-span-4 order-2">
              <BillingSection 
                cart={cart}
                totalAmount={totalAmount}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                cashReceivedDisplay={cashReceivedDisplay}
                change={change}
                customerName={customerName}
                customerWA={customerWA}
                setCart={setCart}
                setIsBillingOpen={setIsBillingOpen}
                setCashReceivedDisplay={setCashReceivedDisplay}
                setCashReceived={setCashReceived}
                setCustomerName={setCustomerName}
                setCustomerWA={setCustomerWA}
                handleCheckout={handleCheckout}
                removeFromCart={removeFromCart}
                formatInputNumber={formatInputNumber}
                parseInputNumber={parseInputNumber}
              />
            </div>
          </div>
        )}

        {activeTab === 'pengeluaran' && (
          <div className="space-y-6">
            <div className="flex gap-2 border-b border-slate-200 pb-2">
              <button
                onClick={() => setPengeluaranSubTab('harian')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${pengeluaranSubTab === 'harian' ? 'bg-rose-100 text-rose-600' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                Pengeluaran Petty Cash Harian
              </button>
              <button
                onClick={() => setPengeluaranSubTab('bulanan')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${pengeluaranSubTab === 'bulanan' ? 'bg-rose-100 text-rose-600' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                Pengeluaran Bulanan
              </button>
            </div>

            {pengeluaranSubTab === 'harian' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-5 space-y-6">
                  <ExpenseForm 
                    description={newExpense.description}
                    amount={newExpense.amount}
                    onChangeDescription={(val) => setNewExpense({...newExpense, description: val})}
                    onChangeAmount={(val) => setNewExpense({...newExpense, amount: formatInputNumber(val)})}
                    onSubmit={handleAddExpense}
                  />
                </div>

                <div className="md:col-span-7">
                  <ExpenseList expenses={expenses} onDelete={handleDeleteExpense} />
                </div>
              </div>
            )}

            {pengeluaranSubTab === 'bulanan' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-4 space-y-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                    <div className="flex items-center gap-3 text-rose-600">
                      <Wallet size={24} />
                      <h3 className="font-bold text-lg">Pengeluaran Bulanan</h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Gaji, Listrik, Air, Internet, dll</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>
                          <input 
                            type="text"
                            inputMode="numeric"
                            className="w-full pl-10 p-2 border border-slate-300 rounded-lg font-bold text-rose-600 focus:ring-2 focus:ring-rose-500 outline-none"
                            value={monthlyExpenseDisplay === '0' ? '' : monthlyExpenseDisplay}
                            onChange={(e) => {
                              const formatted = formatInputNumber(e.target.value);
                              setMonthlyExpenseDisplay(formatted);
                              setMonthlyExpense(parseInputNumber(formatted));
                            }}
                            placeholder=""
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'pemasukan' && (
          <div className="space-y-6">
            <div className="flex gap-2 border-b border-slate-200 pb-2">
              <button
                onClick={() => setPemasukanSubTab('harian')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${pemasukanSubTab === 'harian' ? 'bg-emerald-100 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                Pemasukan Harian
              </button>
              <button
                onClick={() => setPemasukanSubTab('bulanan')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${pemasukanSubTab === 'bulanan' ? 'bg-emerald-100 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                Pemasukan Bulanan
              </button>
            </div>

            {pemasukanSubTab === 'harian' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-5 space-y-6">
                  <IncomeForm 
                    description={newDailyIncome.description}
                    amount={newDailyIncome.amount}
                    onChangeDescription={(val) => setNewDailyIncome({...newDailyIncome, description: val})}
                    onChangeAmount={(val) => setNewDailyIncome({...newDailyIncome, amount: formatInputNumber(val)})}
                    onSubmit={handleAddDailyIncome}
                  />
                </div>

                <div className="md:col-span-7">
                  <IncomeList incomes={dailyIncomes} onDelete={handleDeleteDailyIncome} />
                </div>
              </div>
            )}

            {pemasukanSubTab === 'bulanan' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-4 space-y-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                    <div className="flex items-center gap-3 text-emerald-600">
                      <Wallet size={24} />
                      <h3 className="font-bold text-lg">Pemasukan Bulanan</h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Sewa Lapak Tenant</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>
                          <input 
                            type="text"
                            inputMode="numeric"
                            className="w-full pl-10 p-2 border border-slate-300 rounded-lg font-bold text-emerald-600 focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={tenantIncomeDisplay === '0' ? '' : tenantIncomeDisplay}
                            onChange={(e) => {
                              const formatted = formatInputNumber(e.target.value);
                              setTenantIncomeDisplay(formatted);
                              setTenantIncome(parseInputNumber(formatted));
                            }}
                            placeholder=""
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'laporan' && (
          <div className="space-y-6">
            {/* FILTER BULAN */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-blue-600">
                <History size={24} />
                <h2 className="font-bold text-lg">Laporan Rekapitulasi</h2>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <label className="text-sm font-bold text-slate-500">Pilih Bulan:</label>
                <input 
                  type="month" 
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="p-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none flex-1 sm:flex-none"
                />
              </div>
            </div>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 text-blue-600 mb-2">
                  <ArrowUpCircle size={20} />
                  <span className="text-xs font-bold uppercase">Omset Kotor Bulanan</span>
                </div>
                <p className="text-2xl font-black text-emerald-600">{formatIDR(filteredTotalIncome)}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 text-emerald-600 mb-2">
                  <TrendingUp size={20} />
                  <span className="text-xs font-bold uppercase">Omset Bersih (50%) Bulanan</span>
                </div>
                <p className="text-2xl font-black text-emerald-600">{formatIDR(filteredTotalIncome * 0.5)}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 text-emerald-600 mb-2">
                  <ArrowUpCircle size={20} />
                  <span className="text-xs font-bold uppercase">Pemasukan Sewa Lapak Tenant Bulanan</span>
                </div>
                <p className="text-2xl font-black text-emerald-600">{formatIDR(tenantIncome)}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 text-emerald-600 mb-2">
                  <ArrowUpCircle size={20} />
                  <span className="text-xs font-bold uppercase">Pemasukan Parkiran Kendaraan Bulanan</span>
                </div>
                <p className="text-2xl font-black text-emerald-600">{formatIDR(filteredTotalParkingIncome)}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 text-rose-600 mb-2">
                  <ArrowDownCircle size={20} />
                  <span className="text-xs font-bold uppercase">Pengeluaran Petty Cash Bulanan</span>
                </div>
                <p className="text-2xl font-black text-rose-600">{formatIDR(filteredTotalExpense)}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 text-rose-600 mb-2">
                  <ArrowDownCircle size={20} />
                  <span className="text-xs font-bold uppercase">Pengeluaran Bulanan (Gaji, Listrik, Air, Internet)</span>
                </div>
                <p className="text-2xl font-black text-rose-600">{formatIDR(monthlyExpense)}</p>
              </div>
              
              {/* PETTY CASH CARD (MOVED TO LAPORAN) */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sm:col-span-1 lg:col-span-1 xl:col-span-2">
                <div className="flex items-center gap-3 text-blue-600 mb-2">
                  <Coins size={20} />
                  <span className="text-xs font-bold uppercase">Modal Awal (Petty Cash) Hari Ini</span>
                </div>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>
                  <input 
                    type="text"
                    inputMode="numeric"
                    className="w-full pl-10 p-2 border border-slate-300 rounded-lg font-bold text-xl text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={pettyCashDisplay === '0' ? '' : pettyCashDisplay}
                    onChange={(e) => {
                      const formatted = formatInputNumber(e.target.value);
                      setPettyCashDisplay(formatted);
                      setPettyCash(parseInputNumber(formatted));
                    }}
                    placeholder=""
                  />
                </div>
              </div>

              <div className="p-6 rounded-2xl shadow-sm bg-blue-600 text-white border-none sm:col-span-1 lg:col-span-2 xl:col-span-2">
                <div className="flex items-center gap-3 mb-2 opacity-80">
                  <LayoutDashboard size={20} />
                  <span className="text-xs font-bold uppercase">Saldo Akhir Hari Ini</span>
                </div>
                <p className="text-2xl font-black">{formatIDR(currentBalance)}</p>
              </div>
            </div>

            {/* TRANSACTION HISTORY */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-lg">Riwayat Transaksi Penjualan</h3>
                <button onClick={handleExportCorporateReport} className="text-blue-600 hover:text-blue-700 transition-colors text-sm font-bold flex items-center gap-1 active:scale-95">
                  <FileText size={16} /> Cetak Laporan
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {filteredTransactions.map(t => (
                  <div key={t.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-slate-800">Transaksi #{formatTransactionNumber(t.timestamp, t.orderNumber)}</p>
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
                {filteredTransactions.length === 0 && (
                  <div className="p-12 text-center text-slate-400 italic">Belum ada riwayat transaksi untuk bulan ini.</div>
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
                    type="text" 
                    inputMode="numeric"
                    placeholder="Harga"
                    className="p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newItem.price}
                    onChange={e => setNewItem({...newItem, price: formatInputNumber(e.target.value)})}
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
        {/* CUSTOMER RECEIPT */}
        <div id="receipt-thermal" style={{ 
          width: '215px',
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
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase' }}>
              KEDAI ELVERA 57
            </div>
            <div style={{ fontSize: '9px' }}>
              Jl. Pertanian No. 57
            </div>
            <div style={{ fontSize: '9px' }}>
              Lebak Bulus, Jakarta Selatan
            </div>
            <div style={{ fontSize: '9px' }}>
              WA: 0812-3456-7890
            </div>
            <div style={{ fontWeight: 'bold', fontSize: '14px', marginTop: '5px' }}>
              {currentOrderNumber ? `#${currentOrderNumber.toString().padStart(3, '0')}` : ''}
            </div>
          </div>

          <div style={{ borderTop: '1px dashed #000', width: '100%', margin: '4px 0' }}></div>

          {/* INFO TRANSAKSI */}
          <div style={{ fontSize: '9px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Tgl: {new Date().toLocaleDateString('id-ID')}</span>
              <span>Jam: {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(/\./g, ':')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>No. Bill: {transactions.length > 0 ? formatTransactionNumber(transactions[0].timestamp, transactions[0].orderNumber) : '01010001'}</span>
              <span>Pelayan: Admin</span>
            </div>
          </div>

          <div style={{ borderTop: '1px dashed #000', width: '100%', marginTop: '10px' }}></div>

          {/* TABLE HEADER */}
          <div style={{ fontSize: '9px', display: 'flex', justifyContent: 'space-between', fontWeight: 'normal', marginTop: '3px', marginBottom: '10px', lineHeight: '1' }}>
            <span style={{ width: '70px' }}>Transaksi</span>
            <span style={{ width: '25px', textAlign: 'center' }}>Qty</span>
            <span style={{ width: '40px', textAlign: 'right' }}>Harga</span>
            <span style={{ width: '45px', textAlign: 'right' }}>Total</span>
          </div>

          <div style={{ borderTop: '1px dashed #000', width: '100%' }}></div>

          {/* RINCIAN ITEM (BODY) */}
          <div style={{ fontSize: '9px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {cart.map(item => (
              <div key={`${item.id}-${item.isTakeAway}`} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ width: '70px', wordBreak: 'break-word' }}>{item.name}</span>
                  <span style={{ width: '25px', textAlign: 'center' }}>{item.quantity}</span>
                  <span style={{ width: '40px', textAlign: 'right' }}>{item.price.toLocaleString('id-ID')}</span>
                  <span style={{ width: '45px', textAlign: 'right' }}>{(item.price * item.quantity).toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px dashed #000', width: '100%', marginTop: '10px' }}></div>

          {/* SUMMARY */}
          <div style={{ fontSize: '9px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '3px', marginBottom: '10px', lineHeight: '1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>TOTAL</span>
              <span>{totalAmount.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div style={{ borderTop: '1px dashed #000', width: '100%' }}></div>

          <div style={{ fontSize: '9px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Metode Bayar</span>
              <span>{paymentMethod}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Bayar</span>
              <span>{cashReceived.toLocaleString('id-ID')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Kembali</span>
              <span>{change.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div style={{ borderTop: '1px dashed #000', width: '100%', margin: '10px 0' }}></div>

          {/* FOOTER */}
          <div style={{ textAlign: 'center', fontSize: '9px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div>Terima Kasih,</div>
            <div>Ditunggu Kembali Kedatangannya!</div>
          </div>

          <div style={{ height: '15mm' }}></div>
        </div>

        {/* KITCHEN RECEIPT */}
        <div id="receipt-kitchen" style={{ 
          width: '215px',
          padding: '15px 10px', 
          backgroundColor: '#ffffff',
          color: '#000000',
          fontFamily: '"Courier New", Courier, monospace',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          lineHeight: '1.2'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '10px', borderBottom: '1px dashed #000', paddingBottom: '5px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>PESANAN KITCHEN</div>
            <div style={{ fontWeight: 'bold', fontSize: '20px', margin: '5px 0' }}>
              {currentOrderNumber ? `#${currentOrderNumber.toString().padStart(3, '0')}` : `#${orderCounter.toString().padStart(3, '0')}`}
            </div>
            <div style={{ fontSize: '10px' }}>{new Date().toLocaleDateString('id-ID')} {new Date().toLocaleTimeString('id-ID').replace(/\./g, ':')}</div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {cart.map(item => (
              <div key={`${item.id}-${item.isTakeAway}`} style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '0.5px solid #eee', paddingBottom: '6px', marginTop: '4px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', minWidth: '40px', lineHeight: '1' }}>{item.quantity}x</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', wordBreak: 'break-word', lineHeight: '1.2' }}>{item.name}</div>
                    {item.isTakeAway ? (
                      <div style={{ fontSize: '14px', fontWeight: 'black', color: '#000', marginTop: '2px' }}>
                        [ TAKE AWAY ]
                      </div>
                    ) : (
                      <div style={{ fontSize: '14px', fontWeight: 'black', color: '#000', marginTop: '2px' }}>
                        [ DINE IN ]
                      </div>
                    )}
                  </div>
                </div>
                {item.note && (
                  <div style={{ 
                    fontSize: '12px', 
                    fontWeight: 'bold', 
                    fontStyle: 'italic', 
                    color: '#000', 
                    marginLeft: '50px', 
                    marginTop: '2px',
                    lineHeight: '1.2',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <span style={{ fontSize: '9px', textTransform: 'uppercase', marginBottom: '1px', opacity: 0.8 }}>Catatan:</span>
                    <span style={{ textTransform: 'uppercase' }}>{item.note}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px dashed #000', margin: '15px 0' }}></div>
          
          {(customerName || customerWA) && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' }}>
                <span style={{ textAlign: 'left', textTransform: 'uppercase' }}>{customerName || '-'}</span>
                <span style={{ textAlign: 'right' }}>{customerWA || '-'}</span>
              </div>
              <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }}></div>
            </>
          )}

          <div style={{ textAlign: 'center', fontSize: '10px', fontWeight: 'bold' }}>--- SEGERA DIPROSES ---</div>
          <div style={{ height: '20mm' }}></div>
        </div>

        {/* CLOSING REPORT (AUTHENTIC REFERENCE STYLE) */}
        <div id="report-closing" style={{ 
          width: '215px',
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
          <div style={{ textAlign: 'center', marginBottom: '10px', lineHeight: '1.2' }}>
            <div style={{ fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase', marginBottom: '0px' }}>KEDAI ELVERA 57</div>
            <div style={{ fontSize: '8px', marginTop: '4px', lineHeight: '1.2' }}>
              Jl. Pertanian No. 57, Lebak Bulus<br />
              Jakarta Selatan
            </div>
          </div>

          <div style={{ fontSize: '9px', marginBottom: '10px', lineHeight: '1.4' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '2px' }}>LAPORAN REKAPITULASI</div>
            <div>Bulan: {filterMonth || 'Semua Waktu'}</div>
            <div style={{ marginTop: '4px' }}>Kasir: Admin</div>
            <div>Mulai: {filteredTransactions.length > 0 ? formatDate(filteredTransactions[filteredTransactions.length - 1].timestamp) : '-'}</div>
            <div>Selesai: {filteredTransactions.length > 0 ? formatDate(filteredTransactions[0].timestamp) : '-'}</div>
            <div style={{ marginTop: '4px' }}>Terjual {filteredItemsSold.length} Item</div>
            <div>Terjual {filteredTotalPorsi} Porsi</div>
          </div>

          <div style={{ borderTop: '1px dashed #000', marginTop: '15px' }}></div>
          <div style={{ fontSize: '9px', fontWeight: 'bold', textAlign: 'left', marginTop: '3px', marginBottom: '10px', lineHeight: '1' }}>DETAIL TRANSAKSI</div>
          <div style={{ borderTop: '1px dashed #000' }}></div>

          <div style={{ fontSize: '9px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {filteredItemsSold.map(([name, qty]) => (
              <div key={name} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ flex: 1, paddingRight: '4px' }}>{name}</span>
                <span>x {qty}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px dashed #000', marginTop: '15px' }}></div>
          <div style={{ fontSize: '9px', fontWeight: 'bold', textAlign: 'left', marginTop: '3px', marginBottom: '10px', lineHeight: '1' }}>DETAIL PEMASUKAN</div>
          <div style={{ borderTop: '1px dashed #000' }}></div>

          <div style={{ fontSize: '9px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>QRIS</span>
              <span>Rp {filteredIncomeByMethod.QRIS.toLocaleString('id-ID')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>DEBIT CARD</span>
              <span>Rp {filteredIncomeByMethod.Debet.toLocaleString('id-ID')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>TUNAI</span>
              <span>Rp {filteredIncomeByMethod.Tunai.toLocaleString('id-ID')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '2px' }}>
              <span>TOTAL PEMASUKAN</span>
              <span>Rp {filteredTotalIncome.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div style={{ borderTop: '1px dashed #000', marginTop: '15px' }}></div>
          <div style={{ fontSize: '9px', fontWeight: 'bold', textAlign: 'left', marginTop: '3px', marginBottom: '10px', lineHeight: '1' }}>DETAIL KAS KECIL</div>
          <div style={{ borderTop: '1px dashed #000' }}></div>

          <div style={{ fontSize: '9px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>KAS AWAL</span>
              <span>Rp {pettyCash.toLocaleString('id-ID')}</span>
            </div>
            {filteredExpenses.map(e => (
              <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{e.description}</span>
                <span>(Rp {e.amount.toLocaleString('id-ID')})</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span>SALDO</span>
              <span>Rp {(filteredTotalIncome + pettyCash - filteredTotalExpense).toLocaleString('id-ID')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>TOTAL KAS</span>
              <span>Rp {(filteredTotalIncome + pettyCash - filteredTotalExpense).toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div style={{ borderTop: '0.5px dashed #000', margin: '15px 0' }}></div>
          <div style={{ textAlign: 'center', fontSize: '8px' }}>
            <div>Diterbitkan Oleh</div>
            <div style={{ fontWeight: 'bold' }}>Kedai Elvera 57 POS App</div>
            <div style={{ fontSize: '7px' }}>Jl. Pertanian No. 57</div>
            <div style={{ fontSize: '7px' }}>Lebak Bulus, Jakarta Selatan</div>
          </div>
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
                onClick={handlePrintKitchen}
                className="w-full flex items-center justify-center gap-2 bg-rose-600 text-white py-3 rounded-xl font-bold active:scale-95 transition-all"
              >
                <Utensils size={18} /> CETAK KITCHEN
              </button>
              <button 
                onClick={handlePrintCustomer}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-bold active:scale-95 transition-all"
              >
                <Printer size={18} /> CETAK CUSTOMER
              </button>
              <button 
                onClick={handleExportClosing}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white py-3 rounded-xl font-bold active:scale-95 transition-all"
              >
                <FileText size={18} /> LAPORAN CLOSING
              </button>
              <button 
                onClick={resetOrder}
                className="w-full text-slate-500 text-sm font-bold py-2 mt-2"
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
