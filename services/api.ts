export interface ApiArtist {
  id?: string;
  slug: string;
  name: string;
  location: string;
  medium: string;
  bio?: string;
  imageUrl: string;
  products: ApiProduct[];
  workCount?: number;
  startingPrice?: number | null;
}

export interface ApiCollection {
  slug: string;
  title: string;
  line: string;
  description: string;
  imageUrl: string;
  products: ApiProduct[];
}

export interface ApiProduct {
  id: string;
  slug: string;
  title: string;
  artist: Pick<ApiArtist, "slug" | "name" | "location" | "medium" | "imageUrl">;
  type: string;
  category: string;
  price: number;
  currency: string;
  imageUrl: string;
  description: string;
}

export interface ProductQuery {
  q?: string;
  category?: string;
  sort?: "featured" | "price_asc" | "price_desc";
  page?: number;
  limit?: number;
}

interface ApiResponse<T> {
  data: T;
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly validationErrors: { path: string; message: string }[] = [],
    readonly status?: number,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

const ACCESS_TOKEN_KEY = "niyo.accessToken";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "user" | "admin";
}

export interface AuthResult {
  user: AuthUser;
  accessToken: string;
}

export interface ApiCart {
  id: string;
  items: {
    productSlug: string;
    quantity: number;
    product: (Pick<ApiProduct, "slug" | "title" | "price" | "currency"> & Partial<ApiProduct>) | null;
    unavailable: boolean;
  }[];
  itemCount: number;
  subtotal: number;
  currency: string;
}

export interface ApiOrder {
  reference: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentProvider?: string;
  total: number;
  currency: string;
  email?: string;
  confirmationEmail?: "sent" | "failed";
  createdAt: string;
  items?: { productSlug: string; quantity: number; product?: ApiProduct }[];
}

function getApiBaseUrl() {
  return "/api";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  const headers = new Headers(init?.headers);
  if (init?.body) headers.set("Content-Type", "application/json");
  if (typeof window !== "undefined") {
    const accessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY);
    if (accessToken && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${accessToken}`);
  }
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new Error("Unable to reach the Niyo Arts API. Check that the backend is running.");
  }

  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => null) as {
    message?: string;
    errors?: { path: string; message: string }[];
  } | null;
  if (!response.ok) {
    if (response.status === 401 && headers.has("Authorization") && typeof window !== "undefined") {
      clearAccessToken();
      window.dispatchEvent(new Event("niyo:auth-expired"));
    }
    throw new ApiRequestError(
      body?.message || `The API request failed (${response.status}).`,
      body?.errors || [],
      response.status,
    );
  }
  if (body === null) {
    throw new Error("The API returned an invalid JSON response.");
  }
  return body as T;
}

export function saveAccessToken(accessToken: string) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
}

export function clearAccessToken() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function getSavedAccessToken() {
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function registerAccount(input: { name: string; email: string; phone: string; password: string }) {
  return request<{ data: AuthResult }>("/auth/register", { method: "POST", body: JSON.stringify(input) });
}

export async function loginAccount(input: { email: string; password: string }) {
  return request<{ data: AuthResult }>("/auth/login", { method: "POST", body: JSON.stringify(input) });
}

export async function getCurrentAccount() {
  return request<{ data: AuthUser }>("/auth/me");
}

export async function requestPasswordReset(email: string) {
  return request<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, password: string) {
  return request<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

export async function getHealth() {
  return request<{ status: string; service: string; timestamp: string }>("/health");
}

export async function getProducts(query: ProductQuery = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const queryString = params.toString();
  const suffix = queryString ? `?${queryString}` : "";
  return request<{ data: ApiProduct[]; pagination: { page: number; limit: number; total: number; pages: number } }>(
    `/products${suffix}`,
  );
}

export async function getProduct(slug: string) {
  return request<ApiResponse<ApiProduct>>(`/products/${encodeURIComponent(slug)}`);
}

export async function getArtists() {
  return request<ApiResponse<ApiArtist[]>>("/artists");
}

export async function getArtist(slug: string) {
  return request<ApiResponse<ApiArtist>>(`/artists/${encodeURIComponent(slug)}`);
}

export async function getCollections() {
  return request<ApiResponse<ApiCollection[]>>("/collections");
}

export async function getCollection(slug: string) {
  return request<ApiResponse<ApiCollection>>(`/collections/${encodeURIComponent(slug)}`);
}

export interface CreateOrderInput {
  cartId?: string;
  items?: { productSlug: string; quantity: number }[];
  shippingAddress: { address: string; city: string; country: string; postcode?: string };
  payment:
    | { method: "mobile_money"; provider: "MTN Mobile Money" | "Airtel Money"; phone: string }
    | { method: "card"; provider?: string };
}

export interface CreatedOrder {
  reference: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentProvider: string;
  total: number;
  currency: string;
  email: string;
  createdAt: string;
  confirmationEmail?: "sent" | "failed";
}

export async function createOrder(order: CreateOrderInput) {
  return request<ApiResponse<CreatedOrder>>("/orders", {
    method: "POST",
    body: JSON.stringify(order),
  });
}

export async function createCart() {
  return request<ApiResponse<{ id: string }>>("/carts", { method: "POST", body: "{}" });
}

export async function getCart(cartId: string) {
  return request<ApiResponse<ApiCart>>(`/carts/${encodeURIComponent(cartId)}`);
}

export async function addCartItem(cartId: string, productSlug: string, quantity: number) {
  return request<ApiResponse<ApiCart>>(`/carts/${encodeURIComponent(cartId)}/items`, {
    method: "POST",
    body: JSON.stringify({ productSlug, quantity }),
  });
}

export async function setCartItemQuantity(cartId: string, productSlug: string, quantity: number) {
  return request<ApiResponse<ApiCart>>(`/carts/${encodeURIComponent(cartId)}/items/${encodeURIComponent(productSlug)}`, {
    method: "PUT",
    body: JSON.stringify({ quantity }),
  });
}

export async function deleteCartItem(cartId: string, productSlug: string) {
  return request<ApiResponse<ApiCart>>(`/carts/${encodeURIComponent(cartId)}/items/${encodeURIComponent(productSlug)}`, {
    method: "DELETE",
  });
}

export async function emptyCart(cartId: string) {
  return request<ApiResponse<ApiCart>>(`/carts/${encodeURIComponent(cartId)}/items`, { method: "DELETE" });
}

export async function deleteCart(cartId: string) {
  return request<void>(`/carts/${encodeURIComponent(cartId)}`, { method: "DELETE" });
}

export async function getOrders() {
  return request<ApiResponse<ApiOrder[]>>("/orders");
}

export async function getOrder(reference: string) {
  return request<ApiResponse<ApiOrder>>(`/orders/${encodeURIComponent(reference)}`);
}

export async function createFlutterwaveCheckout(reference: string) {
  return request<ApiResponse<{ paymentUrl: string }>>(
    `/payments/orders/${encodeURIComponent(reference)}/flutterwave`,
    { method: "POST" },
  );
}

export interface AdminProductInput {
  slug: string;
  title: string;
  artistId: string;
  type: string;
  category: string;
  price: number;
  currency: string;
  imageUrl: string;
  description: string;
}

export interface AdminArtistInput {
  slug: string;
  name: string;
  location: string;
  medium: string;
  bio: string;
  imageUrl: string;
}

export interface AdminCollectionInput {
  slug: string;
  title: string;
  line: string;
  description: string;
  imageUrl: string;
  productSlugs: string[];
}

async function adminRequest<T>(path: string, method = "GET", body?: unknown) {
  return request<T>(`/admin${path}`, {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

export const adminApi = {
  products: {
    list: () => adminRequest<ApiResponse<ApiProduct[]>>("/products"),
    create: (input: AdminProductInput) => adminRequest<ApiResponse<ApiProduct>>("/products", "POST", input),
    update: (slug: string, input: Partial<AdminProductInput>) =>
      adminRequest<ApiResponse<ApiProduct>>(`/products/${encodeURIComponent(slug)}`, "PUT", input),
    remove: (slug: string) => adminRequest<void>(`/products/${encodeURIComponent(slug)}`, "DELETE"),
  },
  artists: {
    list: () => adminRequest<ApiResponse<ApiArtist[]>>("/artists"),
    create: (input: AdminArtistInput) => adminRequest<ApiResponse<ApiArtist>>("/artists", "POST", input),
    update: (slug: string, input: Partial<AdminArtistInput>) =>
      adminRequest<ApiResponse<ApiArtist>>(`/artists/${encodeURIComponent(slug)}`, "PUT", input),
    remove: (slug: string) => adminRequest<void>(`/artists/${encodeURIComponent(slug)}`, "DELETE"),
  },
  collections: {
    list: () => adminRequest<ApiResponse<ApiCollection[]>>("/collections"),
    create: (input: AdminCollectionInput) =>
      adminRequest<ApiResponse<ApiCollection>>("/collections", "POST", input),
    update: (slug: string, input: Partial<AdminCollectionInput>) =>
      adminRequest<ApiResponse<ApiCollection>>(`/collections/${encodeURIComponent(slug)}`, "PUT", input),
    remove: (slug: string) => adminRequest<void>(`/collections/${encodeURIComponent(slug)}`, "DELETE"),
  },
  orders: {
    list: () => adminRequest<ApiResponse<ApiOrder[]>>("/orders"),
    updateStatus: (reference: string, fulfillmentStatus: "processing" | "shipped" | "delivered" | "cancelled") =>
      adminRequest<ApiResponse<ApiOrder>>(`/orders/${encodeURIComponent(reference)}`, "PATCH", { fulfillmentStatus }),
  },
  contacts: {
    list: () => adminRequest<ApiResponse<{ id: string; name: string; email: string; subject?: string; message: string; status: "new" | "read" | "replied" }[]>>("/contacts"),
    updateStatus: (id: string, status: "new" | "read" | "replied") =>
      adminRequest<ApiResponse<unknown>>(`/contacts/${encodeURIComponent(id)}`, "PATCH", { status }),
    remove: (id: string) => adminRequest<void>(`/contacts/${encodeURIComponent(id)}`, "DELETE"),
  },
};

export interface ContactInput {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

export async function submitContact(message: ContactInput) {
  return request<{ message: string; data: { id: string; status: string; notificationEmail?: "sent" | "failed" } }>("/contact", {
    method: "POST",
    body: JSON.stringify(message),
  });
}
