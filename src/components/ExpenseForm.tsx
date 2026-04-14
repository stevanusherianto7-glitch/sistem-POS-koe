import React from 'react';
import { ArrowDownCircle } from 'lucide-react';

interface ExpenseFormProps {
  description: string;
  amount: string;
  onChangeDescription: (val: string) => void;
  onChangeAmount: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  description, amount, onChangeDescription, onChangeAmount, onSubmit
}) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
      <div className="flex items-center gap-3 text-rose-600">
        <ArrowDownCircle size={24} className="shrink-0" />
        <h3 className="font-bold text-lg leading-tight">Pengeluaran Petty Cash Harian</h3>
      </div>
      <form onSubmit={onSubmit} className="space-y-3">
        <input 
          type="text"
          placeholder="Keterangan (Contoh: Beli Gas)"
          className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          value={description}
          onChange={e => onChangeDescription(e.target.value)}
          required
        />
        <input 
          type="text"
          inputMode="numeric"
          placeholder="Nominal"
          className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          value={amount}
          onChange={e => onChangeAmount(e.target.value)}
          required
        />
        <button type="submit" className="w-full bg-rose-600 text-white font-bold py-3 rounded-xl active:scale-95 transition-all">
          CATAT PENGELUARAN
        </button>
      </form>
    </div>
  );
};
