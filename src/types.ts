export type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
};

export type ExpenseItem = {
  id: number;
  description: string;
  amount: number;
  date: string;
};

export type Transaction = {
  id: number;
  items: CartItem[];
  total: number;
  paymentMethod: 'Tunai' | 'QRIS';
  date: string;
};

export type MenuItem = {
  id: number;
  name: string;
  price: number;
  category: string;
};
