import React from 'react';
import { ArrowDownCircle, Trash2 } from 'lucide-react';
import { ExpenseItem } from '../types';
import { formatIDR, formatDate } from '../utils/formatters';

interface ExpenseListProps {
  expenses: ExpenseItem[];
  onDelete: (id: number) => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onDelete }) => {
  return (
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
                <p className="text-xs text-slate-400">{formatDate(new Date(e.date) instanceof Date && !isNaN(new Date(e.date).getTime()) ? new Date(e.date) : new Date())}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-bold text-rose-600">-{formatIDR(e.amount)}</span>
              <button onClick={() => onDelete(e.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
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
  );
};
