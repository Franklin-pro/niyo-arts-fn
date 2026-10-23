"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/site-provider";
import type { CartProduct } from "@/components/site-provider";
import { ApiRequestError, createFlutterwaveCheckout, createOrder } from "@/services/api";
import { ArrowLeft, ArrowUpRight, ChevronDown, Lock, LoaderCircle, ShieldCheck, ShoppingBag, Truck, X } from "lucide-react";
import { formatPrice, groupCartItems } from "./shared";

export function Cart({
  items,
  remove,
  clear,
  subtotal,
  currency,
  loading,
  error,
  signedIn,
}: {
  items: CartProduct[];
  remove: (slug: string) => Promise<void>;
  clear: () => Promise<void>;
  subtotal: number;
  currency: string;
  loading: boolean;
  error: string;
  signedIn: boolean;
}) {
  const total = subtotal;
  const grouped = groupCartItems(items);
  return (
    <section className="cart-page">
      <div className="page-heading">
        <p className="section-kicker">Your selection</p>
        <h1>Cart</h1>
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
      {loading && <p role="status">Updating your cart…</p>}
      {!signedIn ? (
        <div className="empty-state">
          <h2>Sign in to view your cart.</h2>
          <Link className="button-link" href="/login?returnTo=%2Fcart">Sign in</Link>
        </div>
      ) : items.length ? (
        <div className="cart-layout">
          <div>
            {grouped.map(({ product, quantity }) => (
              <div className="cart-item" key={product.slug}>
                <img src={product.image} alt={product.title} />
                <div>
                  <p className="art-type">{product.type}</p>
                  <h3>{product.title}</h3>
                  <p>{product.artist}</p>
                  <p>Quantity: {quantity}</p>
                  {product.unavailable && <p className="field-error">Unavailable and cannot be checked out.</p>}
                </div>
                <strong>{formatPrice(product.price * quantity, product.currency)}</strong>
                <button disabled={loading} onClick={() => { void remove(product.slug).catch(() => undefined); }} aria-label={`Remove one ${product.title}`}>
                  <X />
                </button>
              </div>
            ))}
          </div>
          <aside className="summary">
            <p>Subtotal <strong>{formatPrice(total, currency)}</strong></p>
            <p>Shipping <strong>Calculated at checkout</strong></p>
            <hr />
            <p className="total">Total <strong>{formatPrice(total, currency)}</strong></p>
            {grouped.some(({ product }) => product.unavailable) ? (
              <button className="button-link" type="button" disabled>Remove unavailable artwork to continue</button>
            ) : (
              <Link className="button-link" href="/checkout">Continue to checkout <ArrowUpRight /></Link>
            )}
            <button className="text-link" type="button" disabled={loading} onClick={() => { void clear().catch(() => undefined); }}>Empty cart</button>
          </aside>
        </div>
      ) : (
        <div className="empty-state">
          <ShoppingBag />
          <h2>Your cart is quiet.</h2>
          <p>Find a work that changes the room.</p>
          <Link className="button-link" href="/shop">
            Explore the shop 
          </Link>
        </div>
      )}
    </section>
  );
}
export function CheckoutField({
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
export function Checkout({
  items,
  cartId,
  subtotal,
  currency,
  loading,
  orderPlaced,
}: {
  items: CartProduct[];
  cartId: string | null;
  subtotal: number;
  currency: string;
  loading: boolean;
  orderPlaced: () => void;
}) {
  const { user, authLoading } = useAuth();
  const [method, setMethod] = useState<"mobile" | "card">("mobile");
  const [network, setNetwork] = useState<"MTN Mobile Money" | "Airtel Money">("MTN Mobile Money");
  const [contact, setContact] = useState({
    address: "",
    city: "",
    postcode: "",
    country: "Rwanda",
  });
  const [cardProvider, setCardProvider] = useState("");
  const [momo, setMomo] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingReference, setPendingReference] = useState("");
  const [confirmationEmailStatus, setConfirmationEmailStatus] = useState<"sent" | "failed" | "">("");

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

  const startPayment = async (reference: string) => {
    const { data } = await createFlutterwaveCheckout(reference);
    const paymentUrl = new URL(data.paymentUrl);
    if (paymentUrl.protocol !== "https:") {
      throw new Error("The payment provider returned an invalid checkout URL.");
    }
    window.location.assign(paymentUrl.toString());
  };

  if (!user)
    return (
      <section className="checkout-page">
        <div className="empty-state">
          <h2>Sign in to check out.</h2>
          <p>Your order details are linked to your account.</p>
          <Link className="button-link" href="/login?returnTo=%2Fcheckout">Sign in <ArrowUpRight /></Link>
        </div>
      </section>
    );

  if (loading)
    return <section className="checkout-page"><p role="status">Loading your cart…</p></section>;

  if (!count && !pendingReference)
    return (
      <section className="checkout-page">
        <div className="empty-state">
          <ShoppingBag />
          <h2>Nothing to check out yet.</h2>
          <p>Add a work to your cart to continue.</p>
          <Link className="button-link" href="/shop">Explore the shop <ArrowUpRight /></Link>
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
          onSubmit={async (e) => {
            e.preventDefault();
            const nextErrors: Record<string, string> = {};
            if (contact.address.trim().length < 3 || contact.address.length > 240) nextErrors.address = "Enter an address between 3 and 240 characters.";
            if (contact.city.trim().length < 2 || contact.city.length > 120) nextErrors.city = "Enter a city between 2 and 120 characters.";
            if (contact.country.trim().length < 2 || contact.country.length > 120) nextErrors.country = "Enter a valid country.";
            if (contact.postcode.length > 30) nextErrors.postcode = "Postal code must be 30 characters or fewer.";
            if (method === "mobile" && (momo.trim().length < 5 || momo.length > 40)) nextErrors.momo = "Enter a valid mobile money number.";
            if (method === "mobile" && contact.country !== "Rwanda") {
              nextErrors.form = "Mobile money checkout is currently available for Rwanda only. Choose card for other destinations.";
            } else if (method === "mobile" && currency !== "RWF") {
              nextErrors.form = "Rwanda mobile money requires all cart items to be priced in RWF.";
            }
            if (grouped.some(({ product }) => product.unavailable)) {
              nextErrors.form = "Remove unavailable artwork before checking out.";
            }
            if (!cartId) nextErrors.form = "Your cart is not ready. Reload the cart and try again.";
            setErrors(nextErrors);
            if (Object.keys(nextErrors).length) return;

            setIsSubmitting(true);
            try {
              let phoneDigits = momo.replace(/\D/g, "");
              if (phoneDigits.startsWith("250")) phoneDigits = phoneDigits.slice(3);
              if (phoneDigits.startsWith("0")) phoneDigits = phoneDigits.slice(1);
              const paymentPhone = `+250${phoneDigits}`;
              const activeCartId = cartId;
              if (!activeCartId) throw new Error("Your cart is not ready. Reload the cart and try again.");
              const result = await createOrder({
                cartId: activeCartId,
                shippingAddress: {
                  address: contact.address.trim(),
                  city: contact.city.trim(),
                  country: contact.country.trim(),
                  ...(contact.postcode.trim() ? { postcode: contact.postcode.trim() } : {}),
                },
                payment: method === "mobile"
                  ? { method: "mobile_money", provider: network, phone: paymentPhone }
                  : { method: "card", ...(cardProvider.trim() ? { provider: cardProvider.trim() } : {}) },
              });
              orderPlaced();
              setPendingReference(result.data.reference);
              setConfirmationEmailStatus(result.data.confirmationEmail || "");
              await startPayment(result.data.reference);
            } catch (reason) {
              setErrors((current) => ({
                ...current,
                form: reason instanceof ApiRequestError && reason.validationErrors.length
                  ? reason.validationErrors.map((item) => `${item.path}: ${item.message}`).join(" ")
                  : reason instanceof Error ? reason.message : "Unable to create your order or start payment.",
              }));
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          {pendingReference && (
            <div className="checkout-block" role="alert">
              <h2>Order {pendingReference} created</h2>
              <p>Your order is pending payment. Continue to Flutterwave to finish checkout.</p>
              {confirmationEmailStatus === "failed" && <p role="status">The order was created, but its confirmation email could not be delivered.</p>}
              <button className="button-link" type="button" disabled={isSubmitting} onClick={async () => {
                setIsSubmitting(true);
                setErrors({});
                try {
                  await startPayment(pendingReference);
                } catch (reason) {
                  setErrors({ form: reason instanceof Error ? reason.message : "Unable to start payment." });
                } finally {
                  setIsSubmitting(false);
                }
              }}>
                Retry hosted payment <ArrowUpRight />
              </button>
            </div>
          )}

          {/* Contact */}
          <div className="checkout-block">
            <h2>Contact</h2>
            <p>{user.name}<br />{user.email}<br />{user.phone}</p>
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
              <CheckoutField label="Postal code (optional)" error={errors.postcode} errorId="postcode-error">
                <input aria-invalid={Boolean(errors.postcode)} aria-describedby={errors.postcode ? "postcode-error" : undefined} autoComplete="postal-code" placeholder="Postal code" value={contact.postcode} onChange={onContact("postcode")} />
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
                  <strong>Card · hosted checkout required</strong>
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
                        <input type="radio" name="network" checked={network === n} onChange={() => setNetwork(n === "Airtel Money" ? "Airtel Money" : "MTN Mobile Money")} />
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
                  <p className="payment-note span-2">Flutterwave will prompt on the mobile money number. Rwanda mobile money requires the cart currency to be RWF.</p>
                </div>
            ) : (
                <div className="co-grid pay-details">
                  <CheckoutField label="Payment provider (optional)" className="span-2">
                    <input maxLength={120} placeholder="Flutterwave" value={cardProvider} onChange={(event) => setCardProvider(event.target.value)} />
                  </CheckoutField>
                  <p className="payment-note span-2">Flutterwave will collect card details on its hosted checkout page. This site never accepts card numbers.</p>
                </div>
            )}
            </div>
          </div>

          <div className="checkout-actions">
            {errors.form && <p className="field-error" role="alert">{errors.form}</p>}
            <button type="submit" className="button-link checkout-submit" disabled={isSubmitting || Boolean(pendingReference)}>
              {isSubmitting ? <LoaderCircle className="loading-icon" /> : <Lock />}
              {isSubmitting ? "Processing…" : `Continue to payment · ${formatPrice(subtotal, currency)}`}
            </button>
            <p className="checkout-approval">You will be redirected to Flutterwave to complete payment securely.</p>
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
            <span className="summary-preview">{formatPrice(subtotal, currency)} <ChevronDown /></span>
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
                <em>{formatPrice(product.price * quantity, product.currency)}</em>
              </div>
            ))}
          </div>
          <div className="co-rows">
            <p>
              Subtotal <span>{formatPrice(subtotal, currency)}</span>
            </p>
            <p>
              Shipping <span>We&apos;ll confirm shipping within 24 hours.</span>
            </p>
          </div>
          <p className="co-total">
            Total{" "}
            <strong>
              {formatPrice(subtotal, currency)}
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
