import React from 'react';
import { ArrowUpCircle, Trash2 } from 'lucide-react';
import { ExpenseItem } from '../types';
import { formatIDR, formatDate } from '../utils/formatters';

interface IncomeListProps {
  incomes: ExpenseItem[];
  onDelete: (id: number) => void;
}

export const IncomeList: React.FC<IncomeListProps> = ({ incomes, onDelete }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h3 className="font-bold text-lg">Riwayat Pemasukan</h3>
      </div>
      <div className="divide-y divide-slate-100">
        {incomes.map(i => (
          <div key={i.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                <ArrowUpCircle size={20} />
              </div>
              <div>
                <p className="font-bold text-slate-800">{i.description}</p>
                <p className="text-xs text-slate-400">{formatDate(new Date(i.date) instanceof Date && !isNaN(new Date(i.date).getTime()) ? new Date(i.date) : new Date())}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-bold text-emerald-600">+{formatIDR(i.amount)}</span>
              <button onClick={() => onDelete(i.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
        {incomes.length === 0 && (
          <div className="p-12 text-center text-slate-400 italic">Belum ada catatan pemasukan.</div>
        )}
      </div>
    </div>
  );
};
