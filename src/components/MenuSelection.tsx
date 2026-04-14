import React from 'react';
import { Utensils, ShoppingBag, Plus, Minus } from 'lucide-react';
import { MenuItem, CartItem } from '../types';
import { formatIDR } from '../utils/formatters';

interface MenuSelectionProps {
  menuItems: MenuItem[];
  cart: CartItem[];
  addToCart: (item: MenuItem, isTakeAway: boolean) => void;
  removeFromCart: (id: number, isTakeAway: boolean) => void;
  updateCartNote: (id: number, isTakeAway: boolean, note: string) => void;
}

export const MenuSelection: React.FC<MenuSelectionProps> = ({ 
  menuItems, cart, addToCart, removeFromCart, updateCartNote 
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {menuItems.map(item => {
        const dineInItem = cart.find(c => c.id === item.id && !c.isTakeAway);
        const takeAwayItem = cart.find(c => c.id === item.id && c.isTakeAway);
        const dineInQty = dineInItem?.quantity || 0;
        const takeAwayQty = takeAwayItem?.quantity || 0;
        const hasInCart = dineInQty > 0 || takeAwayQty > 0;

        return (
          <div 
            key={item.id}
            className={`bg-white p-3 rounded-xl shadow-sm border transition-all flex flex-col justify-between min-h-[160px] relative ${hasInCart ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200'}`}
          >
            <div>
              <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">{item.category}</p>
              <p className="font-bold text-slate-800 leading-tight mb-1 text-sm line-clamp-2">{item.name}</p>
              <p className="text-blue-600 font-bold text-xs">{formatIDR(item.price)}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-1.5 mt-2">
              <div className="flex flex-col gap-1">
                {dineInQty > 0 && (
                  <input 
                    type="text"
                    placeholder="Catatan..."
                    className="w-full p-1 border border-emerald-200 rounded text-[9px] outline-none focus:border-emerald-400 bg-emerald-50/30"
                    value={dineInItem?.note || ''}
                    onChange={(e) => updateCartNote(item.id, false, e.target.value)}
                  />
                )}
                {dineInQty > 0 ? (
                  <div className="flex items-center justify-between bg-emerald-50 text-emerald-700 rounded-lg p-1 border border-emerald-100">
                    <button onClick={() => removeFromCart(item.id, false)} className="p-0.5 hover:bg-emerald-100 rounded transition-colors"><Minus size={10}/></button>
                    <span className="text-[10px] font-black">{dineInQty}</span>
                    <button onClick={() => addToCart(item, false)} className="p-0.5 hover:bg-emerald-100 rounded transition-colors"><Plus size={10}/></button>
                  </div>
                ) : (
                  <button 
                    onClick={() => addToCart(item, false)}
                    className="w-full py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-[8px] font-bold uppercase hover:bg-emerald-600 hover:text-white transition-all active:scale-95 flex flex-col items-center justify-center"
                  >
                    <Utensils size={10} className="mb-0.5" /> Dine In
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-1">
                {takeAwayQty > 0 && (
                  <input 
                    type="text"
                    placeholder="Catatan..."
                    className="w-full p-1 border border-orange-200 rounded text-[9px] outline-none focus:border-orange-400 bg-orange-50/30"
                    value={takeAwayItem?.note || ''}
                    onChange={(e) => updateCartNote(item.id, true, e.target.value)}
                  />
                )}
                {takeAwayQty > 0 ? (
                  <div className="flex items-center justify-between bg-orange-50 text-orange-700 rounded-lg p-1 border border-orange-100">
                    <button onClick={() => removeFromCart(item.id, true)} className="p-0.5 hover:bg-orange-100 rounded transition-colors"><Minus size={10}/></button>
                    <span className="text-[10px] font-black">{takeAwayQty}</span>
                    <button onClick={() => addToCart(item, true)} className="p-0.5 hover:bg-orange-100 rounded transition-colors"><Plus size={10}/></button>
                  </div>
                ) : (
                  <button 
                    onClick={() => addToCart(item, true)}
                    className="w-full py-1.5 rounded-lg bg-orange-50 text-orange-600 text-[8px] font-bold uppercase hover:bg-orange-600 hover:text-white transition-all active:scale-95 flex flex-col items-center justify-center"
                  >
                    <ShoppingBag size={10} className="mb-0.5" /> Take Away
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {menuItems.length === 0 && (
        <div className="col-span-full py-12 text-center text-slate-400">
          <p>Belum ada menu. Klik ikon gerigi untuk menambah menu.</p>
        </div>
      )}
    </div>
  );
};
