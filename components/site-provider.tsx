"use client";
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
export type CartProduct = {
  slug: string;
  title: string;
  artist: string;
  type: string;
  category: string;
  price: number;
  image: string;
};
const CartContext = createContext<{
  items: CartProduct[];
  add: (p: CartProduct) => void;
  remove: (i: number) => void;
}>({ items: [], add: () => {}, remove: () => {} });
export function SiteProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartProduct[]>([]);
  return (
    <CartContext.Provider
      value={{
        items,
        add: (p) => setItems((c) => [...c, p]),
        remove: (i) => setItems((c) => c.filter((_, n) => n !== i)),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
export const useCart = () => useContext(CartContext);
