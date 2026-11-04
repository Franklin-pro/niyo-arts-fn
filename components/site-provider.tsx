"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  addCartItem,
  createCart,
  getCart,
  getCurrentAccount,
  getSavedAccessToken,
  loginAccount,
  registerAccount,
  saveAccessToken,
  setCartItemQuantity,
  clearAccessToken,
  deleteCartItem,
  emptyCart,
} from "@/services/api";
import type { ApiCart, AuthUser } from "@/services/api";

export type CartProduct = {
  slug: string;
  title: string;
  artist: string;
  type: string;
  category: string;
  price: number;
  currency?: string;
  image: string;
  unavailable?: boolean;
};

function getCartStorageKey(userId: string) {
  return `niyo.cartId:${userId}`;
}

const GUEST_CART_STORAGE_KEY = "niyo.guestCart";

function getGuestCartSubtotal(products: CartProduct[]) {
  return products.reduce((sum, product) => sum + product.price, 0);
}

function mapCart(cart: ApiCart): CartProduct[] {
  return cart.items.flatMap((item) => {
    const product = item.product;
    const cartProduct: CartProduct = {
      slug: item.productSlug,
      title: product?.title || "Unavailable artwork",
      artist: product?.artist?.name || "",
      type: product?.type || "",
      category: "",
      price: product?.price || 0,
      currency: product?.currency || cart.currency,
      image: product?.imageUrl || "",
      unavailable: item.unavailable || !product,
    };
    return Array.from({ length: item.quantity }, () => cartProduct);
  });
}

interface AuthContextValue {
  user: AuthUser | null;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { name: string; email: string; phone: string; password: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  authLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

interface CartContextValue {
  items: CartProduct[];
  subtotal: number;
  currency: string;
  loading: boolean;
  error: string;
  add: (product: CartProduct) => Promise<void>;
  remove: (slug: string) => Promise<void>;
  clear: () => Promise<void>;
  orderPlaced: () => void;
  cartId: string | null;
  clearError: () => void;
}

const CartContext = createContext<CartContextValue>({
  items: [],
  subtotal: 0,
  currency: "USD",
  loading: false,
  error: "",
  add: async () => {},
  remove: async () => {},
  clear: async () => {},
  orderPlaced: () => {},
  cartId: null,
  clearError: () => {},
});

export function SiteProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [items, setItems] = useState<CartProduct[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [currency, setCurrency] = useState("USD");
  const [cartId, setCartId] = useState<string | null>(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState("");

  const applyCart = useCallback((cart: ApiCart) => {
    setItems(mapCart(cart));
    setSubtotal(cart.subtotal);
    setCurrency(cart.currency);
  }, []);

  useEffect(() => {
    const expireSession = () => {
      setUser(null);
      setItems([]);
      setSubtotal(0);
      setCartId(null);
      // setCartError("Your session expired. Sign in again to continue.");
    };
    window.addEventListener("niyo:auth-expired", expireSession);
    return () => window.removeEventListener("niyo:auth-expired", expireSession);
  }, []);

  useEffect(() => {
    let active = true;
    const token = getSavedAccessToken();
    if (!token) {
      setAuthLoading(false);
      return () => { active = false; };
    }
    getCurrentAccount()
      .then(({ data }) => {
        if (active) setUser(data);
      })
      .catch(() => {
        clearAccessToken();
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!user) {
      if (authLoading) return;
      setItems([]);
      setSubtotal(0);
      setCurrency("USD");
      setCartId(null);
      try {
        const savedCart = window.localStorage.getItem(GUEST_CART_STORAGE_KEY);
        if (!savedCart) return;
        const parsed: unknown = JSON.parse(savedCart);
        if (!Array.isArray(parsed) || parsed.some((item) =>
          !item || typeof item !== "object" || typeof item.slug !== "string" ||
          typeof item.title !== "string" || typeof item.price !== "number" || !Number.isFinite(item.price)
        )) {
          throw new Error("The saved guest cart has invalid data.");
        }
        const guestItems = parsed as CartProduct[];
        setItems(guestItems);
        setSubtotal(getGuestCartSubtotal(guestItems));
        setCurrency(guestItems[0]?.currency || "USD");
      } catch (reason) {
        setCartError(reason instanceof Error ? reason.message : "Unable to restore your saved cart.");
      }
      return;
    }
    let active = true;
    const savedCartId = window.localStorage.getItem(getCartStorageKey(user.id));
    if (!savedCartId) return;
    setCartLoading(true);
    getCart(savedCartId)
      .then(({ data }) => {
        if (!active) return;
        setCartId(data.id);
        applyCart(data);
      })
      .catch((reason: unknown) => {
        const isMissingOrForbidden = reason instanceof Error &&
          "status" in reason && (reason.status === 403 || reason.status === 404);
        if (isMissingOrForbidden) {
          window.localStorage.removeItem(getCartStorageKey(user.id));
          if (active) setCartId(null);
        }
        if (active) setCartError(reason instanceof Error ? reason.message : "Unable to restore your cart.");
      })
      .finally(() => {
        if (active) setCartLoading(false);
      });
    return () => { active = false; };
  }, [user, authLoading, applyCart]);

  const authenticate = useCallback((authResult: { accessToken: string; user: AuthUser }) => {
    saveAccessToken(authResult.accessToken);
    setCartError("");
    setCartId(null);
    setUser(authResult.user);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginAccount({ email, password });
    authenticate(result.data);
  }, [authenticate]);

  const register = useCallback(async (input: { name: string; email: string; phone: string; password: string }) => {
    const result = await registerAccount(input);
    authenticate(result.data);
  }, [authenticate]);

  const logout = useCallback(() => {
    clearAccessToken();
    setCartError("");
    setUser(null);
    setItems([]);
    setSubtotal(0);
    setCartId(null);
  }, []);

  const runCartOperation = useCallback(async (operation: () => Promise<ApiCart>) => {
    setCartLoading(true);
    setCartError("");
    try {
      const result = await operation();
      applyCart(result);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Unable to update your cart.";
      setCartError(message);
      throw reason;
    } finally {
      setCartLoading(false);
    }
  }, [applyCart]);

  const add = useCallback(async (product: CartProduct) => {
    setCartLoading(true);
    setCartError("");
    try {
      if (!user) {
        const nextItems = [...items, product];
        window.localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(nextItems));
        setItems(nextItems);
        setSubtotal(getGuestCartSubtotal(nextItems));
        setCurrency(nextItems[0]?.currency || "USD");
        return;
      }
      let activeCartId = cartId;
      if (!activeCartId) {
        const created = await createCart();
        activeCartId = created.data.id;
        if (items.length) {
          const quantities = new Map<string, number>();
          items.forEach((item) => quantities.set(item.slug, (quantities.get(item.slug) || 0) + 1));
          for (const [slug, quantity] of quantities) {
            await addCartItem(activeCartId, slug, quantity);
          }
          window.localStorage.removeItem(GUEST_CART_STORAGE_KEY);
        }
        window.localStorage.setItem(getCartStorageKey(user.id), activeCartId);
        setCartId(activeCartId);
      }
      const result = await addCartItem(activeCartId, product.slug, 1);
      applyCart(result.data);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Unable to add artwork to your cart.";
      setCartError(message);
      throw reason;
    } finally {
      setCartLoading(false);
    }
  }, [applyCart, cartId, items, user]);

  const remove = useCallback(async (slug: string) => {
    if (!user) {
      const index = items.findIndex((item) => item.slug === slug);
      if (index < 0) return;
      const nextItems = items.filter((_, itemIndex) => itemIndex !== index);
      window.localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(nextItems));
      setItems(nextItems);
      setSubtotal(getGuestCartSubtotal(nextItems));
      setCurrency(nextItems[0]?.currency || "USD");
      return;
    }
    if (!cartId) return;
    const quantity = items.filter((item) => item.slug === slug).length;
    if (quantity < 1) return;
    await runCartOperation(() => quantity === 1
      ? deleteCartItem(cartId, slug).then(({ data }) => data)
      : setCartItemQuantity(cartId, slug, quantity - 1).then(({ data }) => data));
  }, [cartId, items, runCartOperation, user]);

  const clear = useCallback(async () => {
    if (!user) {
      window.localStorage.removeItem(GUEST_CART_STORAGE_KEY);
      setItems([]);
      setSubtotal(0);
      setCurrency("USD");
      setCartError("");
      return;
    }
    if (!cartId) return;
    setCartLoading(true);
    setCartError("");
    try {
      const { data } = await emptyCart(cartId);
      applyCart(data);
      setItems([]);
      setSubtotal(0);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Unable to empty your cart.";
      setCartError(message);
      throw reason;
    } finally {
      setCartLoading(false);
    }
  }, [applyCart, cartId, user]);

  const orderPlaced = useCallback(() => {
    if (user) window.localStorage.removeItem(getCartStorageKey(user.id));
    window.localStorage.removeItem(GUEST_CART_STORAGE_KEY);
    setItems([]);
    setSubtotal(0);
    setCurrency("USD");
    setCartId(null);
  }, [user]);

  const authValue = useMemo(() => ({ user, authLoading, login, register, logout }), [user, authLoading, login, register, logout]);
  const cartValue = useMemo(() => ({
    items,
    subtotal,
    currency,
    loading: cartLoading,
    error: cartError,
    add,
    remove,
    clear,
    orderPlaced,
    cartId,
    clearError: () => setCartError(""),
  }), [items, subtotal, currency, cartLoading, cartError, add, remove, clear, orderPlaced, cartId]);

  return (
    <AuthContext.Provider value={authValue}>
      <CartContext.Provider value={cartValue}>{children}</CartContext.Provider>
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export const useCart = () => useContext(CartContext);
