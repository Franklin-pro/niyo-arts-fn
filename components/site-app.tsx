"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/components/site-provider";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  Heart,
  Lock,
  LoaderCircle,
  Menu,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Truck,
  UserRound,
  X,
} from "lucide-react";

const image = (id: string, width = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;

const products = [
  { slug: "after-the-rain", title: "After the Rain", artist: "Amara Okafor", type: "Limited edition print", category: "Abstract", price: 420, image: image("photo-1549490349-8643362247b5") },
  { slug: "soft-geometry", title: "Soft Geometry", artist: "Milo Hart", type: "Original painting", category: "Painting", price: 1850, image: image("photo-1579783902614-a3fb3927b6a5") },
  { slug: "shape-of-light", title: "The Shape of Light", artist: "Nia Wambui", type: "Digital artwork", category: "Digital", price: 180, image: image("photo-1541701494587-cb58502866ab") },
  { slug: "quiet-forms", title: "Quiet Forms", artist: "Leah Kim", type: "Original painting", category: "Painting", price: 920, image: image("photo-1577083288073-40892c0860a4") },
  { slug: "blue-hour", title: "Blue Hour", artist: "Jon Bell", type: "Limited edition print", category: "Photography", price: 280, image: image("photo-1541961017774-22349e4a1262") },
  { slug: "sun-warmed", title: "Sun-Warmed", artist: "Amara Okafor", type: "Original painting", category: "Abstract", price: 1240, image: image("photo-1549490349-8643362247b5") },
];
type Product = (typeof products)[number];

const collections = [
  {
    title: "New perspectives",
    line: "The world, reframed.",
    text: "Work that changes how a familiar place, shape or light is seen — across photography, digital art and bold abstraction.",
    image: image("photo-1577083288073-40892c0860a4", 1600),
    slugs: ["after-the-rain", "shape-of-light", "blue-hour"],
  },
  {
    title: "Slow looking",
    line: "For rooms that breathe.",
    text: "Quiet, layered paintings that reward time. Chosen for calm spaces where a work can be lived with, not just noticed.",
    image: image("photo-1541961017774-22349e4a1262", 1600),
    slugs: ["quiet-forms", "soft-geometry"],
  },
  {
    title: "Warm abstractions",
    line: "Colour with a pulse.",
    text: "Rich, sun-soaked abstraction that brings energy and warmth to a wall without asking for attention.",
    image: image("photo-1549490349-8643362247b5", 1600),
    slugs: ["sun-warmed", "after-the-rain"],
  },
];

const artists = [
  { name: "Amara Okafor", location: "Lagos", medium: "Abstract painting and prints", bio: "Builds layered colour fields from memory and weather.", image: image("photo-1549490349-8643362247b5") },
  { name: "Milo Hart", location: "London", medium: "Oil painting", bio: "Paints soft, geometric compositions in slow, thin layers.", image: image("photo-1579783902614-a3fb3927b6a5") },
  { name: "Nia Wambui", location: "Nairobi", medium: "Digital art", bio: "Explores light and form through generative digital work.", image: image("photo-1541701494587-cb58502866ab") },
  { name: "Leah Kim", location: "Seoul", medium: "Painting", bio: "Makes quiet, restrained canvases about balance and space.", image: image("photo-1577083288073-40892c0860a4") },
  { name: "Jon Bell", location: "Cape Town", medium: "Photography", bio: "Photographs the edges of the day, when the light turns.", image: image("photo-1541961017774-22349e4a1262") },
];

const nav = [
  ["Gallery", "/gallery"],
  ["Shop", "/shop"],
  ["Collections", "/collections"],
  ["Artists", "/artists"],
  ["About", "/about"],
];

function groupCartItems(items: Product[]) {
  const groups = new Map<string, { product: Product; quantity: number; firstIndex: number }>();
  items.forEach((product, index) => {
    const g = groups.get(product.slug);
    if (g) g.quantity += 1;
    else groups.set(product.slug, { product, quantity: 1, firstIndex: index });
  });
  return Array.from(groups.values());
}

function Header({ cart, open, onMenu }: { cart: number; open: boolean; onMenu: () => void }) {
  return (
    <header className="site-header">
      <Link className="wordmark" href="/">
        niyo<span>.</span>
      </Link>
      <nav className="main-nav" aria-label="Main">
        {nav.map(([label, href]) => (
          <Link key={href} href={href}>{label}</Link>
        ))}
      </nav>
      <div className="header-actions">
        <Link href="/search" aria-label="Search"><Search /></Link>
        <Link href="/account" aria-label="Account"><UserRound /></Link>
        <Link href="/account/wishlist" aria-label="Wishlist"><Heart /></Link>
        <Link href="/cart" aria-label="Cart">
          <ShoppingBag />
          <small>{cart}</small>
        </Link>
        <button className="menu-toggle" onClick={onMenu} aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <Link className="wordmark footer-wordmark" href="/">
          niyo<span>.</span>
        </Link>
        <p>Art for the way you live.</p>
      </div>
      <div className="footer-links">
        <div>
          <p>Explore</p>
          {nav.slice(0, 4).map(([l, h]) => (
            <Link key={h} href={h}>{l}</Link>
          ))}
        </div>
        <div>
          <p>Info</p>
          <Link href="/about">About Niyo</Link>
          <Link href="/shipping">Shipping & returns</Link>
          <Link href="/contact">Contact</Link>
        </div>
        <div>
          <p>Follow</p>
          <Link href="#">Instagram</Link>
          <Link href="#">Twitter</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>&copy; {new Date().getFullYear()} Niyo Arts all rights reserved</span>
        <span>Rwanda · Kigali · Everywhere</span>
        <span>USD / EN</span>
      </div>
    </footer>
  );
}

function ProductCard({ p, onAdd }: { p: Product; onAdd: (p: Product) => void }) {
  const [liked, setLiked] = useState(false);
  const artist = artists.find((a) => a.name === p.artist);
  return (
    <article className="art-card">
      <Link href={`/shop/${p.slug}`}>
        <div className="art-image">
          <img className="art-img-main" src={p.image} alt={p.title} loading="lazy" decoding="async" />
          {artist && (
            <img
              className="art-img-artist"
              src={artist.image}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
            />
          )}
          <span className="art-artist-overlay" aria-hidden="true">
            <small>Artwork by</small>
            <strong>{p.artist}</strong>
          </span>
          <button
            className={liked ? "liked" : ""}
            onClick={(e) => {
              e.preventDefault();
              setLiked(!liked);
            }}
            aria-label="Add to wishlist"
            aria-pressed={liked}
          >
            <Heart />
          </button>
        </div>
        <p className="art-type">{p.type}</p>
        <div className="art-meta">
          <div>
            <h3>{p.title}</h3>
            <p>{p.artist}</p>
          </div>
          <strong>${p.price.toLocaleString()}</strong>
        </div>
      </Link>
      <button className="quick-add" onClick={() => onAdd(p)}>
        Add to cart <ArrowUpRight />
      </button>
    </article>
  );
}

function Listing({ mode = "shop", onAdd }: { mode?: string; onAdd: (p: Product) => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("Featured");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const filtered = useMemo(
    () =>
      products
        .filter(
          (p) =>
            (category === "All" || p.category === category) &&
            `${p.title} ${p.artist}`.toLowerCase().includes(query.toLowerCase()),
        )
        .sort((a, b) =>
          sort === "Price: low to high" ? a.price - b.price : sort === "Price: high to low" ? b.price - a.price : 0,
        ),
    [query, category, sort],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visibleProducts = filtered.slice((page - 1) * pageSize, page * pageSize);
  return (
    <>
      <section className="page-intro">
        <p className="section-kicker">Niyo Arts / {mode}</p>
        <h1>{mode === "gallery" ? "A living archive." : "Find something to live with."}</h1>
        <p>Explore original works, limited editions, and digital pieces from artists shaping how we see the world.</p>
      </section>
      <section className="listing">
        <div className="toolbar">
          <label className="search-field">
            <Search />
            <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search works or artists" />
          </label>
          <div className="filter-row">
            {["All", "Abstract", "Painting", "Digital", "Photography"].map((x) => (
              <button className={category === x ? "active" : ""} onClick={() => { setCategory(x); setPage(1); }} key={x}>
                {x}
              </button>
            ))}
            <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} aria-label="Sort artwork">
              <option>Featured</option>
              <option>Price: low to high</option>
              <option>Price: high to low</option>
            </select>
          </div>
        </div>
        {filtered.length ? (
          <>
            <div className={`art-grid ${mode === "gallery" ? "gallery-masonry" : ""}`}>
              {visibleProducts.map((p) => (
                <ProductCard key={p.slug} p={p} onAdd={onAdd} />
              ))}
            </div>
            <nav className="art-pagination" aria-label="Artwork pages">
              <p>
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} works
              </p>
              <div>
                <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} aria-label="Previous page">
                  Previous
                </button>
                <span aria-current="page">Page {page} of {pageCount}</span>
                <button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount} aria-label="Next page">
                  Next
                </button>
              </div>
            </nav>
          </>
        ) : (
          <div className="empty-state">
            <SlidersHorizontal />
            <h2>No works found.</h2>
            <p>Try another search or remove a filter.</p>
          </div>
        )}
      </section>
    </>
  );
}

function ProductPage({ slug, onAdd }: { slug: string; onAdd: (p: Product) => void }) {
  const p = products.find((x) => x.slug === slug) || products[0];
  const [size, setSize] = useState("Medium");
  return (
    <section className="product-page">
      <Link className="back-link" href="/shop">
        <ArrowLeft /> Back to shop
      </Link>
      <div className="product-layout">
        <div className="product-gallery">
          <img src={p.image} alt={p.title} />
          <img src={p.image} alt={`${p.title} detail`} />
        </div>
        <div className="product-info">
          <p className="section-kicker">{p.type}</p>
          <h1>{p.title}</h1>
          <p className="artist-name">
            by <Link href="/artists">{p.artist}</Link>
          </p>
          <p className="product-price">
            ${p.price.toLocaleString()} <span>USD</span>
          </p>
          <p className="product-description">
            A considered work made to reward slow looking. Each piece is selected for its presence, materiality, and the
            story it carries into your space.
          </p>
          <label className="field-label">
            Format
            <select value={size} onChange={(e) => setSize(e.target.value)}>
              <option>Small</option>
              <option>Medium</option>
              <option>Large</option>
            </select>
          </label>
          <button className="button-link add-button" onClick={() => onAdd(p)}>
            Add to cart <ArrowUpRight />
          </button>
          <div className="accordions">
            <details open>
              <summary>Details <ChevronDown /></summary>
              <p>Archival pigment print · Signed and numbered · Ships worldwide</p>
            </details>
            <details>
              <summary>Delivery & returns <ChevronDown /></summary>
              <p>Carefully packed and dispatched within 3–5 business days.</p>
            </details>
          </div>
        </div>
      </div>
    </section>
  );
}

function Cart({ items, remove }: { items: Product[]; remove: (i: number) => void }) {
  const total = items.reduce((s, p) => s + p.price, 0);
  const grouped = groupCartItems(items);
  return (
    <section className="cart-page">
      <div className="page-heading">
        <p className="section-kicker">Your selection</p>
        <h1>Cart</h1>
      </div>
      {items.length ? (
        <div className="cart-layout">
          <div>
            {grouped.map(({ product, quantity, firstIndex }) => (
              <div className="cart-item" key={product.slug}>
                <img src={product.image} alt={product.title} />
                <div>
                  <p className="art-type">{product.type}</p>
                  <h3>{product.title}</h3>
                  <p>{product.artist}</p>
                  <p>Quantity: {quantity}</p>
                </div>
                <strong>${(product.price * quantity).toLocaleString()}</strong>
                <button onClick={() => remove(firstIndex)} aria-label={`Remove one ${product.title}`}>
                  <X />
                </button>
              </div>
            ))}
          </div>
          <aside className="summary">
            <p>Subtotal <strong>${total.toLocaleString()}</strong></p>
            <p>Shipping <strong>Calculated at checkout</strong></p>
            <hr />
            <p className="total">Total <strong>${total.toLocaleString()}</strong></p>
            <Link className="button-link" href="/checkout">
              Continue to checkout <ArrowUpRight />
            </Link>
          </aside>
        </div>
      ) : (
        <div className="empty-state">
          <ShoppingBag />
          <h2>Your cart is quiet.</h2>
          <p>Find a work that changes the room.</p>
          <Link className="button-link" href="/shop">
            Explore the shop <ArrowUpRight />
          </Link>
        </div>
      )}
    </section>
  );
}

function CheckoutField({
  label,
  className = "",
  error,
  errorId,
  children,
}: {
  label: string;
  className?: string;
  error?: string;
  errorId?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`co-field ${className}${error ? " has-error" : ""}`}>
      <span>{label}</span>
      {children}
      {error && <small id={errorId} className="field-error">{error}</small>}
    </label>
  );
}

function Checkout({ items }: { items: Product[] }) {
  const [method, setMethod] = useState<"mobile" | "card">("mobile");
  const [network, setNetwork] = useState("MTN Mobile Money");
  const [contact, setContact] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postcode: "",
    country: "Rwanda",
  });
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvc: "" });
  const [momo, setMomo] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [order, setOrder] = useState<{ ref: string; total: number; email: string; method: string } | null>(null);

  const total = items.reduce((sum, p) => sum + p.price, 0);
  const grouped = groupCartItems(items);
  const count = items.length;

  const onContact =
    (key: keyof typeof contact) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setContact({ ...contact, [key]: e.target.value });
      setErrors((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    };

  const formatCardNumber = (v: string) =>
    v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d;
  };

  if (order)
    return (
      <section className="checkout-page">
        <div className="checkout-success">
          <span className="success-mark">
            <Check />
          </span>
          <p className="section-kicker">Order confirmed</p>
          <h1>Thank you for choosing art.</h1>
          <p className="success-copy">
            Your order is reserved. A confirmation with payment and delivery details is on its way to{" "}
            <strong>{order.email}</strong>.
          </p>
          <dl className="co-receipt">
            <div>
              <dt>Order reference</dt>
              <dd>{order.ref}</dd>
            </div>
            <div>
              <dt>Payment</dt>
              <dd>{order.method}</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd>${order.total.toLocaleString()} USD</dd>
            </div>
          </dl>
          <div className="success-actions">
            <Link className="button-link" href="/shop">
              Continue exploring <ArrowUpRight />
            </Link>
            <Link className="text-link" href="/gallery">
              Visit the gallery <ArrowUpRight />
            </Link>
          </div>
        </div>
      </section>
    );

  if (!count)
    return (
      <section className="checkout-page">
        <div className="empty-state">
          <ShoppingBag />
          <h2>Nothing to check out yet.</h2>
          <p>Add a work to your cart to continue.</p>
          <Link className="button-link" href="/shop">
            Explore the shop <ArrowUpRight />
          </Link>
        </div>
      </section>
    );

  return (
    <section className="checkout-page">
      <nav className="checkout-steps" aria-label="Checkout progress">
        <Link href="/cart"><span>1</span> Cart</Link>
        <strong aria-current="step"><span>2</span> Checkout</strong>
        <em><span>3</span> Confirmation</em>
      </nav>

      <div className="checkout-heading">
        <h1>Checkout</h1>
        <p className="checkout-secure">
          <Lock /> Secure, encrypted checkout
        </p>
      </div>

      <div className="checkout-layout">
        <form
          className="checkout-form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            const nextErrors: Record<string, string> = {};
            if (!contact.name.trim()) nextErrors.name = "Enter your full name.";
            if (!contact.email.trim()) nextErrors.email = "Enter your email address.";
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) nextErrors.email = "Enter a valid email address.";
            if (!contact.phone.trim()) nextErrors.phone = "Enter your phone number.";
            if (!contact.address.trim()) nextErrors.address = "Enter your street address.";
            if (!contact.city.trim()) nextErrors.city = "Enter your city.";
            if (!contact.country) nextErrors.country = "Choose your country.";
            if (method === "mobile" && !momo.trim()) nextErrors.momo = "Enter your mobile money number.";
            if (method === "card") {
              if (card.number.replace(/\D/g, "").length < 12) nextErrors.cardNumber = "Enter a valid card number.";
              if (!card.name.trim()) nextErrors.cardName = "Enter the name on your card.";
              if (card.expiry.replace(/\D/g, "").length !== 4) nextErrors.expiry = "Enter expiry as MM / YY.";
              if (card.cvc.length < 3) nextErrors.cvc = "Enter a valid security code.";
            }
            setErrors(nextErrors);
            if (Object.keys(nextErrors).length) return;

            setIsSubmitting(true);
            window.setTimeout(() => {
              setOrder({
                ref: `NY-${Date.now().toString(36).toUpperCase().slice(-6)}`,
                total,
                email: contact.email,
                method: method === "mobile" ? network : "Card",
              });
              setIsSubmitting(false);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }, 600);
          }}
        >
          {/* Contact */}
          <div className="checkout-block">
            <h2>Contact</h2>
            <div className="co-grid">
              <CheckoutField label="Full name" className="span-2">
                <input aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} autoComplete="name" placeholder="Your full name" value={contact.name} onChange={onContact("name")} />
                {errors.name && <small id="name-error" className="field-error">{errors.name}</small>}
              </CheckoutField>
              <CheckoutField label="Email address">
                <input aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} type="email" autoComplete="email" placeholder="you@example.com" value={contact.email} onChange={onContact("email")} />
                {errors.email && <small id="email-error" className="field-error">{errors.email}</small>}
              </CheckoutField>
              <CheckoutField label="Phone number">
                <input aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "phone-error" : undefined} type="tel" inputMode="tel" autoComplete="tel" placeholder="+250 78X XXX XXX" value={contact.phone} onChange={onContact("phone")} />
                {errors.phone && <small id="phone-error" className="field-error">{errors.phone}</small>}
              </CheckoutField>
            </div>
          </div>

          {/* Delivery */}
          <div className="checkout-block">
            <h2>Delivery address</h2>
            <div className="co-grid">
              <CheckoutField label="Street address" className="span-2">
                <input aria-invalid={Boolean(errors.address)} aria-describedby={errors.address ? "address-error" : undefined} autoComplete="street-address" placeholder="Street and house number" value={contact.address} onChange={onContact("address")} />
                {errors.address && <small id="address-error" className="field-error">{errors.address}</small>}
              </CheckoutField>
            </div>
            <div className="co-grid delivery-grid">
              <CheckoutField label="City" error={errors.city} errorId="city-error">
                <input aria-invalid={Boolean(errors.city)} aria-describedby={errors.city ? "city-error" : undefined} autoComplete="address-level2" placeholder="Kigali" value={contact.city} onChange={onContact("city")} />
              </CheckoutField>
              <CheckoutField label="Postal code (optional)">
                <input autoComplete="postal-code" placeholder="Postal code" value={contact.postcode} onChange={onContact("postcode")} />
              </CheckoutField>
              <CheckoutField label="Country" error={errors.country} errorId="country-error">
                <select aria-invalid={Boolean(errors.country)} aria-describedby={errors.country ? "country-error" : undefined} autoComplete="country-name" value={contact.country} onChange={onContact("country")}>
                  <option value="Rwanda">Rwanda</option>
                  <option value="Kenya">Kenya</option>
                  <option value="Uganda">Uganda</option>
                  <option value="Tanzania">Tanzania</option>
                  <option value="Nigeria">Nigeria</option>
                  <option value="South Africa">South Africa</option>
                  <option value="Australia">Australia</option>
                  <option value="Canada">Canada</option>
                  <option value="France">France</option>
                  <option value="Germany">Germany</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="United States">United States</option>
                </select>
              </CheckoutField>
            </div>
          </div>

          {/* Payment */}
          <div className="checkout-block">
            <h2>Payment</h2>
            <div className="pay-options" role="radiogroup" aria-label="Payment method">
              <label className="pay-option">
                <input type="radio" name="method" checked={method === "mobile"} onChange={() => setMethod("mobile")} />
                <span className="pay-option-body">
                  <strong>Mobile money</strong>
                  <small className="payment-brands"><span className="brand-mtn">MTN</span><span className="brand-airtel">Airtel</span></small>
                </span>
              </label>
              <label className="pay-option">
                <input type="radio" name="method" checked={method === "card"} onChange={() => setMethod("card")} />
                <span className="pay-option-body">
                  <strong>Card</strong>
                  <small className="payment-brands"><span className="brand-visa">VISA</span><span className="brand-mastercard"><i></i><i></i><b>mastercard</b></span></small>
                </span>
              </label>
            </div>

            <div key={method} className="pay-details-panel">
            {method === "mobile" ? (
              <div className="co-grid pay-details">
                <div className="co-field span-2">
                  <span>Network</span>
                  <div className="segmented" role="radiogroup" aria-label="Mobile money network">
                    {["MTN Mobile Money", "Airtel Money"].map((n) => (
                      <label key={n}>
                        <input type="radio" name="network" checked={network === n} onChange={() => setNetwork(n)} />
                        <span>{n}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <CheckoutField label="Mobile money number" className="span-2">
                  <span className="phone-input">
                    <span aria-hidden="true">+250</span>
                    <input aria-label="Mobile money number" aria-invalid={Boolean(errors.momo)} aria-describedby={errors.momo ? "momo-error" : undefined} type="tel" inputMode="tel" autoComplete="tel-national" placeholder="78X XXX XXX" value={momo} onChange={(e) => { setMomo(e.target.value); setErrors((current) => { const next = { ...current }; delete next.momo; return next; }); }} />
                  </span>
                  {errors.momo && <small id="momo-error" className="field-error">{errors.momo}</small>}
                </CheckoutField>
                <p className="payment-note span-2">
                  You&apos;ll receive a prompt on your phone to approve the payment. Keep your phone nearby.
                </p>
              </div>
            ) : (
              <div className="co-grid pay-details">
                <CheckoutField label="Card number" className="span-2">
                  <input
                    aria-invalid={Boolean(errors.cardNumber)}
                    aria-describedby={errors.cardNumber ? "card-number-error" : undefined}
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="1234 5678 9012 3456"
                    value={card.number}
                    onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
                  />
                  {errors.cardNumber && <small id="card-number-error" className="field-error">{errors.cardNumber}</small>}
                </CheckoutField>
                <CheckoutField label="Name on card" className="span-2">
                  <input aria-invalid={Boolean(errors.cardName)} aria-describedby={errors.cardName ? "card-name-error" : undefined} autoComplete="cc-name" placeholder="Name as shown on card" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} />
                  {errors.cardName && <small id="card-name-error" className="field-error">{errors.cardName}</small>}
                </CheckoutField>
                <CheckoutField label="Expiry date">
                  <input
                    aria-invalid={Boolean(errors.expiry)}
                    aria-describedby={errors.expiry ? "expiry-error" : undefined}
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    placeholder="MM / YY"
                    value={card.expiry}
                    onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                  />
                  {errors.expiry && <small id="expiry-error" className="field-error">{errors.expiry}</small>}
                </CheckoutField>
                <CheckoutField label="Security code">
                  <input
                    aria-invalid={Boolean(errors.cvc)}
                    aria-describedby={errors.cvc ? "cvc-error" : undefined}
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    maxLength={4}
                    placeholder="CVC"
                    value={card.cvc}
                    onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, "") })}
                  />
                  {errors.cvc && <small id="cvc-error" className="field-error">{errors.cvc}</small>}
                </CheckoutField>
                <p className="payment-note span-2">Your card details are encrypted and never stored by Niyo.</p>
              </div>
            )}
            </div>
          </div>

          <div className="checkout-actions">
            <button type="submit" className="button-link checkout-submit" disabled={isSubmitting}>
              {isSubmitting ? <LoaderCircle className="loading-icon" /> : <Lock />}
              {isSubmitting ? "Processing…" : `Place order · $${total.toLocaleString()}`}
            </button>
            <p className="checkout-approval">You won&apos;t be charged until you approve on your phone.</p>
            <p className="checkout-terms">
              By placing your order you agree to our <Link href="/shipping">shipping & returns policy</Link>.
            </p>
          </div>
        </form>

        <div className="checkout-sidebar">
        <aside className="checkout-summary" aria-label="Order summary">
          <details className="summary-details" open>
          <summary>
            <span>Order summary <small>{count} {count === 1 ? "item" : "items"}</small></span>
            <span className="summary-preview">${total.toLocaleString()} USD <ChevronDown /></span>
          </summary>
          <div className="summary-content">
          <div className="co-items">
            {grouped.map(({ product, quantity }) => (
              <div className="co-item" key={product.slug}>
                <div className="co-thumb">
                  <img src={product.image} alt={product.title} />
                  <b>{quantity}</b>
                </div>
                <div className="co-item-info">
                  <strong>{product.title}</strong>
                  <span>{product.artist}</span>
                  <span>{product.type}</span>
                </div>
                <em>${(product.price * quantity).toLocaleString()}</em>
              </div>
            ))}
          </div>
          <div className="co-rows">
            <p>
              Subtotal <span>${total.toLocaleString()}</span>
            </p>
            <p>
              Shipping <span>We&apos;ll confirm shipping within 24 hours.</span>
            </p>
          </div>
          <p className="co-total">
            Total{" "}
            <strong>
              ${total.toLocaleString()} <small>USD</small>
            </strong>
          </p>
          </div>
          </details>
        </aside>
        <section className="checkout-trust" aria-label="Shopping with confidence">
          <h2>Care, at every step</h2>
          <p><Truck /> Carefully packed, with delivery updates along the way.</p>
          <p><ArrowLeft /> 14-day returns on eligible works.</p>
          <p><ShieldCheck /> Every work is verified for artist authenticity.</p>
        </section>
        </div>
      </div>
    </section>
  );
}

function Collections() {
  return (
    <>
      <section className="page-intro">
        <p className="section-kicker">Niyo Arts / Collections</p>
        <h1>Ways of seeing.</h1>
        <p>Themed selections from across the gallery, curated to help you find work that fits the way you live.</p>
      </section>
      <section className="collections-page">
        {collections.map((c, i) => {
          const works = c.slugs.map((s) => products.find((p) => p.slug === s)!).filter(Boolean);
          return (
            <article className={`collection-row ${i % 2 ? "reverse" : ""}`} key={c.title}>
              <Link href="/shop" className="collection-row-image">
                <img src={c.image} alt={c.title} loading="lazy" decoding="async" />
              </Link>
              <div className="collection-row-body">
                <p className="section-kicker">
                  {works.length} {works.length === 1 ? "work" : "works"}
                </p>
                <h2>{c.title}</h2>
                <p className="collection-line">{c.line}</p>
                <p className="collection-text">{c.text}</p>
                <div className="mini-works">
                  {works.map((w) => (
                    <Link href={`/shop/${w.slug}`} className="mini-work" key={w.slug}>
                      <img src={w.image} alt={w.title} loading="lazy" decoding="async" />
                      <span>{w.title}</span>
                      <small>From ${w.price.toLocaleString()}</small>
                    </Link>
                  ))}
                </div>
                <Link className="text-link" href="/shop">
                  Shop the collection <ArrowUpRight />
                </Link>
              </div>
            </article>
          );
        })}
      </section>
    </>
  );
}

function Artists() {
  return (
    <>
      <section className="page-intro">
        <p className="section-kicker">Niyo Arts / Artists</p>
        <h1>Meet the makers.</h1>
        <p>Painters, photographers and digital artists from across the world, each with a distinct way of seeing.</p>
      </section>
      <section className="artists-page">
        <div className="artist-grid">
          {artists.map((a) => {
            const works = products.filter((p) => p.artist === a.name);
            const latest = works[works.length - 1];
            const from = works.length ? Math.min(...works.map((w) => w.price)) : 0;
            return (
              <Link key={a.name} href="/shop" className="artist-card">
                <div className="artist-image">
                  <img className="artist-photo" src={a.image} alt={`Work by ${a.name}`} loading="lazy" decoding="async" />
                  {latest && (
                    <>
                      <img
                        className="artist-latest"
                        src={latest.image}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        decoding="async"
                      />
                      <span className="artist-latest-label" aria-hidden="true">
                        <small>Latest work</small>
                        <strong>{latest.title}</strong>
                        <em>${latest.price.toLocaleString()}</em>
                      </span>
                    </>
                  )}
                </div>
                <div className="artist-info">
                  <div>
                    <h3>{a.name}</h3>
                    <p className="artist-medium">{a.medium}</p>
                  </div>
                  <span className="artist-location">{a.location}</span>
                </div>
                <p className="artist-bio">{a.bio}</p>
                <p className="artist-stats">
                  {works.length} {works.length === 1 ? "work" : "works"} · from ${from.toLocaleString()}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}

function About() {
  const principles = [
    { title: "Curated, not crowded", text: "We show fewer works, chosen with care, so every piece has room to be seen." },
    { title: "Artists first", text: "We work directly with artists and make sure the people who make the work are paid fairly for it." },
    { title: "Made to last", text: "Archival materials, careful packing and honest descriptions, so what arrives is what you saw." },
  ];
  return (
    <>
      <section className="about-hero">
        <p className="section-kicker">Niyo Arts / About</p>
        <h1>Art for the way you live.</h1>
      </section>
      <section className="about-figure">
        <img src={image("photo-1579783902614-a3fb3927b6a5", 2000)} alt="A painting in a quiet interior" loading="lazy" decoding="async" />
      </section>
      <section className="about-story">
        <p className="section-kicker">Our story</p>
        <div className="about-content">
          <p className="about-lead">
            Niyo Arts is a curated gallery and online shop for original and limited edition artwork, made for homes and
            offices as much as for walls in galleries.
          </p>
          <p>
            We work with artists to bring their work to collectors of every level. Each piece is selected for its
            presence, materiality, and the story it carries into your space.
          </p>
          <p>We believe the right artwork changes a room, then quietly changes you.</p>
          <Link className="text-link" href="/contact">
            Get in touch <ArrowUpRight />
          </Link>
        </div>
      </section>
      <section className="about-principles">
        {principles.map((p) => (
          <div key={p.title}>
            <h3>{p.title}</h3>
            <p>{p.text}</p>
          </div>
        ))}
      </section>
      <section className="about-cta">
        <h2>
          Find something to <em>live with.</em>
        </h2>
        <Link className="button-link" href="/shop">
          Explore the shop <ArrowUpRight />
        </Link>
      </section>
    </>
  );
}

function Generic({ title, eyebrow, children }: { title: string; eyebrow: string; children?: React.ReactNode }) {
  return (
    <section className="generic-page">
      <p className="section-kicker">{eyebrow}</p>
      <h1>{title}</h1>
      <div className="generic-content">
        {children || (
          <>
            <p>We are making space for better ways to experience art — online and in the rooms where it belongs.</p>
            <Link className="text-link" href="/shop">
              Explore the collection <ArrowUpRight />
            </Link>
          </>
        )}
      </div>
    </section>
  );
}

export default function SiteApp({ path }: { path: string }) {
  const [menu, setMenu] = useState(false);
  const { items: cart, add, remove } = useCart();
  const route = path.replace(/^\//, "").split("/");
  const isHome = path === "/" || !path;

  let body: React.ReactNode;

  if (isHome) {
    body = (
      <>
        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow">Niyo Arts / 01 — 2026</p>
            <h1>
              Discover art.
              <br />
              <em>Own a story.</em>
            </h1>
            <p className="hero-description">
              A considered collection of original and limited edition artwork from the artists shaping how we see the world.
            </p>
            <Link className="circle-link" href="/shop" aria-label="Shop the collection">
             Explore <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="hero-image-wrap">
            <img src={image("photo-1577083288073-40892c0860a4", 1800)} alt="Abstract blue and rust artwork" />
            <div className="image-caption">
              <span>01 / 05</span>
              <span>Untitled Study No. 4 — Nia Wambui</span>
            </div>
          </div>
        </section>
        <section className="intro-section">
          <p className="section-kicker">A different kind of gallery</p>
          <div>
            <h2>
              Art that stays
              <br />
              <em>with you.</em>
            </h2>
            <p className="intro-text">We believe the right artwork changes a space, then quietly changes you.</p>
            <Link className="text-link" href="/about">
              Our point of view <ArrowUpRight />
            </Link>
          </div>
        </section>
        <section className="collection-section">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Curated / 02</p>
              <h2>Ways of seeing</h2>
            </div>
            <Link className="text-link" href="/collections">
              View collections <ArrowUpRight />
            </Link>
          </div>
          <div className="collection-grid">
            {collections.slice(0, 2).map((c, i) => (
              <Link className={`collection-card ${i === 0 ? "collection-card-tall" : ""}`} href="/collections" key={c.title}>
                <div className="collection-image">
                  <img src={c.image} alt={`${c.title} collection`} loading="lazy" decoding="async" />
                </div>
                <div className="collection-meta">
                  <p>{c.title}</p>
                  <h3>{c.line}</h3>
                  <ArrowUpRight />
                </div>
              </Link>
            ))}
          </div>
        </section>
        <section className="works-section">
          <div className="section-heading">
            <div>
              <p className="section-kicker">The latest / 03</p>
              <h2>Works to live with</h2>
            </div>
            <Link className="text-link" href="/shop">
              Shop all work <ArrowUpRight />
            </Link>
          </div>
          <div className="art-grid">
            {products.slice(0, 3).map((p) => (
              <ProductCard key={p.slug} p={p} onAdd={add} />
            ))}
          </div>
        </section>
      </>
    );
  } else if (route[0] === "shop" && route[1]) {
    body = <ProductPage slug={route[1]} onAdd={add} />;
  } else if (route[0] === "shop" || route[0] === "gallery") {
    body = <Listing mode={route[0]} onAdd={add} />;
  } else if (route[0] === "search") {
    body = <Listing mode="search" onAdd={add} />;
  } else if (route[0] === "cart") {
    body = <Cart items={cart} remove={remove} />;
  } else if (route[0] === "checkout") {
    body = <Checkout items={cart} />;
  } else if (route[0] === "collections") {
    body = <Collections />;
  } else if (route[0] === "artists") {
    body = <Artists />;
  } else if (route[0] === "about") {
    body = <About />;
  } else if (route[0] === "account") {
    body = (
      <Generic title="Your account" eyebrow="Niyo / account">
        <p>Sign in to view orders, downloads, saved works, and account settings.</p>
        <Link className="button-link" href="/login">
          Sign in <ArrowUpRight />
        </Link>
      </Generic>
    );
  } else if (route[0] === "admin") {
    body = (
      <Generic title="Studio dashboard" eyebrow="Niyo / admin">
        <p>Product, order, collection, and customer management will connect to your Express API here.</p>
        <div className="admin-grid">
          {["Products", "Collections", "Orders", "Reports"].map((x) => (
            <Link href={`/admin/${x.toLowerCase()}`} className="admin-card" key={x}>
              <span>{x}</span>
              <ArrowUpRight />
            </Link>
          ))}
        </div>
      </Generic>
    );
  } else if (route[0] === "shipping") {
    body = <Generic title="Shipping & returns" eyebrow="Niyo / info" />;
  } else if (route[0] === "contact") {
    body = <Generic title="Contact" eyebrow="Niyo / info" />;
  } else {
    body = <Generic title="Page not found" eyebrow="Niyo / 404" />;
  }

  return (
    <>
      <Header cart={cart.length} open={menu} onMenu={() => setMenu(!menu)} />
      {menu && (
        <div className="mobile-menu">
          {nav.map(([l, h]) => (
            <Link onClick={() => setMenu(false)} key={h} href={h}>
              {l}
            </Link>
          ))}
        </div>
      )}
      {body}
      <Footer />
    </>
  );
}