"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert, App, Button, Input, Radio, Select, Spin, Steps } from "antd";
import {
  ArrowLeftOutlined, ArrowUpOutlined, DeleteOutlined, DownOutlined,
  LockOutlined, PictureOutlined, SafetyCertificateOutlined, ShoppingOutlined, TruckOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/components/site-provider";
import type { CartProduct } from "@/components/site-provider";
import { ApiRequestError, createFlutterwaveCheckout, createOrder } from "@/services/api";
import { formatPrice, groupCartItems } from "./shared";

type CountryOption = { name: string; capital: string };

function isCountryOptionsResponse(value: unknown): value is { data: CountryOption[] } {
  if (!value || typeof value !== "object" || !("data" in value) || !Array.isArray(value.data)) {
    return false;
  }
  return value.data.every((country) =>
    country && typeof country === "object" &&
    "name" in country && typeof country.name === "string" &&
    "capital" in country && typeof country.capital === "string"
  );
}

export function Cart({
  items,
  remove,
  clear,
  subtotal,
  currency,
  loading,
  error,
}: {
  items: CartProduct[];
  remove: (slug: string) => Promise<void>;
  clear: () => Promise<void>;
  subtotal: number;
  currency: string;
  loading: boolean;
  error: string;
}) {
  const { message } = App.useApp();
  const total = subtotal;
  const grouped = groupCartItems(items);
  return (
    <section className="cart-page">
      <div className="page-heading">
        <p className="section-kicker">Your selection</p>
        <h1>Cart</h1>
      </div>
      {error && <Alert showIcon type="error" title={error} />}
      {loading && <div role="status"><Spin size="small" /> Updating your cart…</div>}
      {items.length ? (
        <div className="cart-layout">
          <div>
            {grouped.map(({ product, quantity }) => (
              <div className="cart-item" key={product.slug}>
                {product.image
                  ? <img src={product.image} alt={product.title} />
                  : <div className="cart-item-image-placeholder" aria-hidden="true"><PictureOutlined /></div>}
                <div>
                  <p className="art-type">{product.type}</p>
                  <h3>{product.title}</h3>
                  <p>{product.artist}</p>
                  <p>Quantity: {quantity}</p>
                  {product.unavailable && <p className="field-error">Unavailable and cannot be checked out.</p>}
                </div>
                <strong>{formatPrice(product.price * quantity, product.currency)}</strong>
                <Button danger type="text" disabled={loading} aria-label={`Remove one ${product.title}`} icon={<DeleteOutlined />}
                  onClick={() => { void remove(product.slug).catch((reason: unknown) => message.error(reason instanceof Error ? reason.message : "Unable to update your cart.")); }} />
              </div>
            ))}
          </div>
          <aside className="summary">
            <p>Subtotal <strong>{formatPrice(total, currency)}</strong></p>
            <p>Shipping <strong>Calculated at checkout</strong></p>
            <hr />
            <p className="total">Total <strong>{formatPrice(total, currency)}</strong></p>
            {grouped.some(({ product }) => product.unavailable) ? (
              <Button className="button-link" disabled>Remove unavailable artwork to continue</Button>
            ) : (
              <Button className="button-link" type="primary" href="/checkout" icon={<ArrowUpOutlined />}>Continue to checkout</Button>
            )}
            <Button type="link" danger disabled={loading} onClick={() => { void clear().catch((reason: unknown) => message.error(reason instanceof Error ? reason.message : "Unable to empty your cart.")); }}>Empty cart</Button>
          </aside>
        </div>
      ) : (
        <div className="empty-state">
          <ShoppingOutlined />
          <h2>Your cart is quiet.</h2>
          <p>Find a work that changes the room.</p>
          <Button type="primary" href="/shop">Explore the shop</Button>
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
    <div className={`co-field ${className}${error ? " has-error" : ""}`} role="group" aria-label={label}>
      <span>{label}</span>
      {children}
      {error && <small id={errorId} className="field-error">{error}</small>}
    </div>
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
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [countriesError, setCountriesError] = useState("");
  const [contact, setContact] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: "",
    city: "",
    postcode: "",
    country: "Rwanda",
  });
  const [cardProvider, setCardProvider] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingReference, setPendingReference] = useState("");
  const [confirmationEmailStatus, setConfirmationEmailStatus] = useState<"sent" | "failed" | "">("");
  const [idempotencyKey, setIdempotencyKey] = useState("");

  const grouped = groupCartItems(items);
  const count = items.length;
  const selectedCountry = countries.find(({ name }) => name === contact.country);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/country-options", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Country data request failed (${response.status}).`);
        const result: unknown = await response.json();
        if (!isCountryOptionsResponse(result)) {
          throw new Error("The country service returned invalid data.");
        }
        const options = result.data;
        if (!options.length) throw new Error("The country service returned no countries.");
        setCountries(options);
        setContact((current) => {
          if (current.city) return current;
          const currentCountry = options.find(({ name }) => name === current.country);
          return currentCountry?.capital ? { ...current, city: currentCountry.capital } : current;
        });
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setCountriesError(reason instanceof Error ? reason.message : "Unable to load countries.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCountriesLoading(false);
      });
    return () => controller.abort();
  }, []);

  const onContact =
    (key: keyof typeof contact) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setContactValue(key, e.target.value);
    };

  const setContactValue = (key: keyof typeof contact, value: string) => {
    setContact((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  useEffect(() => {
    if (user) {
      setContact((current) => ({
        ...current,
        name: current.name || user.name,
        email: current.email || user.email,
        phone: current.phone || user.phone,
      }));
    }
  }, [user]);

  const startPayment = async (reference: string) => {
    const { data } = await createFlutterwaveCheckout(reference);
    const paymentUrl = new URL(data.paymentUrl);
    if (paymentUrl.protocol !== "https:") {
      throw new Error("The payment provider returned an invalid checkout URL.");
    }
    window.location.assign(paymentUrl.toString());
  };

  if (loading || authLoading)
    return <section className="checkout-page"><div role="status"><Spin /> Loading your cart…</div></section>;

  if (!count && !pendingReference)
    return (
      <section className="checkout-page">
        <div className="empty-state">
          <ShoppingOutlined />
          <h2>Nothing to check out yet.</h2>
          <p>Add a work to your cart to continue.</p>
          <Button type="primary" href="/shop" icon={<ArrowUpOutlined />}>Explore the shop</Button>
        </div>
      </section>
    );

  return (
    <section className="checkout-page">
      <Steps className="checkout-steps-antd" current={1} size="small" items={[{ title: <Link href="/cart">Cart</Link> }, { title: "Checkout" }, { title: "Confirmation" }]} />

      <div className="checkout-heading">
        <h1>Checkout</h1>
        <p className="checkout-secure">
          <LockOutlined /> Secure, encrypted checkout
        </p>
      </div>

      <div className="checkout-layout">
        <form
          className="checkout-form"
          noValidate
          onSubmit={async (e) => {
            e.preventDefault();
            const nextErrors: Record<string, string> = {};
            if (contact.name.trim().length < 2 || contact.name.trim().length > 160) nextErrors.name = "Enter your full name.";
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim()) || contact.email.length > 254) nextErrors.email = "Enter a valid email address.";
            if (contact.phone.trim().replace(/\D/g, "").length < 7 || contact.phone.length > 40) nextErrors.phone = "Enter a valid phone number.";
            if (contact.address.trim().length < 3 || contact.address.length > 240) nextErrors.address = "Enter an address between 3 and 240 characters.";
            if (contact.city.trim().length < 2 || contact.city.length > 120) nextErrors.city = "Enter a city between 2 and 120 characters.";
            if (contact.country.trim().length < 2 || contact.country.length > 120) nextErrors.country = "Enter a valid country.";
            if (contact.postcode.length > 30) nextErrors.postcode = "Postal code must be 30 characters or fewer.";
            if (grouped.some(({ product }) => product.unavailable)) {
              nextErrors.form = "Remove unavailable artwork before checking out.";
            }
            if (user && !cartId && !items.length) nextErrors.form = "Your cart is not ready. Reload the cart and try again.";
            setErrors(nextErrors);
            if (Object.keys(nextErrors).length) return;

            setIsSubmitting(true);
            try {
              const checkoutKey = idempotencyKey || crypto.randomUUID();
              if (!idempotencyKey) setIdempotencyKey(checkoutKey);
              const result = await createOrder({
                ...(cartId ? { cartId } : {
                  items: grouped.map(({ product, quantity }) => ({ productSlug: product.slug, quantity })),
                }),
                customer: {
                  name: contact.name.trim(),
                  email: contact.email.trim(),
                  phone: contact.phone.trim(),
                },
                shippingAddress: {
                  address: contact.address.trim(),
                  city: contact.city.trim(),
                  country: contact.country.trim(),
                  ...(contact.postcode.trim() ? { postcode: contact.postcode.trim() } : {}),
                },
                payment: { method: "card", ...(cardProvider.trim() ? { provider: cardProvider.trim() } : {}) },
              }, checkoutKey);
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
              <Button className="button-link" type="primary" disabled={isSubmitting} loading={isSubmitting} onClick={async () => {
                setIsSubmitting(true);
                setErrors({});
                try {
                  await startPayment(pendingReference);
                } catch (reason) {
                  setErrors({ form: reason instanceof Error ? reason.message : "Unable to start payment." });
                } finally {
                  setIsSubmitting(false);
                }
              }} icon={!isSubmitting ? <ArrowUpOutlined /> : undefined}>
                Retry hosted payment
              </Button>
            </div>
          )}

          {/* Contact */}
          <div className="checkout-block">
            <h2>Contact</h2>
            <p className="checkout-optional-account">
              Checkout without creating an account. {user ? "Your details are pre-filled from your account." : (
                <>Already have an account? <Link href="/login?returnTo=%2Fcheckout">Sign in</Link>, or <Link href="/register?returnTo=%2Fcheckout">create one</Link> (optional).</>
              )}
            </p>
            <div className="co-grid">
              <CheckoutField label="Full name" error={errors.name} errorId="name-error">
                <Input autoComplete="name" maxLength={160} placeholder="Full name" value={contact.name}
                  status={errors.name ? "error" : undefined} aria-describedby={errors.name ? "name-error" : undefined}
                  onChange={(event) => setContactValue("name", event.target.value)} />
              </CheckoutField>
              <CheckoutField label="Email" error={errors.email} errorId="email-error">
                <Input type="email" autoComplete="email" maxLength={254} placeholder="you@example.com" value={contact.email}
                  status={errors.email ? "error" : undefined} aria-describedby={errors.email ? "email-error" : undefined}
                  onChange={(event) => setContactValue("email", event.target.value)} />
              </CheckoutField>
              <CheckoutField label="Phone" error={errors.phone} errorId="phone-error">
                <Input type="tel" inputMode="tel" autoComplete="tel" maxLength={40} placeholder="+250 7XX XXX XXX" value={contact.phone}
                  status={errors.phone ? "error" : undefined} aria-describedby={errors.phone ? "phone-error" : undefined}
                  onChange={(event) => setContactValue("phone", event.target.value)} />
              </CheckoutField>
            </div>
          </div>

          {/* Delivery */}
          <div className="checkout-block">
            <h2>Delivery address</h2>
            <div className="co-grid">
              <CheckoutField label="Street address" className="span-2">
                <Input status={errors.address ? "error" : undefined} aria-describedby={errors.address ? "address-error" : undefined} autoComplete="street-address" placeholder="Street and house number" value={contact.address} onChange={onContact("address")} />
                {errors.address && <small id="address-error" className="field-error">{errors.address}</small>}
              </CheckoutField>
            </div>
            <div className="co-grid delivery-grid">
              <CheckoutField label="Country" error={errors.country} errorId="country-error">
                  {countriesError ? (
                    <Input
                      aria-label="Country"
                      autoComplete="country-name"
                      placeholder="Enter your country"
                      value={contact.country}
                      status={errors.country ? "error" : undefined}
                      onChange={(event) => setContactValue("country", event.target.value)}
                    />
                  ) : (
                    <Select
                      aria-label="Country"
                      showSearch
                      size="large"
                      optionFilterProp="label"
                      loading={countriesLoading}
                      value={contact.country}
                      status={errors.country ? "error" : undefined}
                      options={countries.map(({ name }) => ({ value: name, label: name }))}
                      onChange={(country) => {
                        const capital = countries.find(({ name }) => name === country)?.capital || "";
                        setContact((current) => ({ ...current, country, city: capital }));
                        setErrors((current) => {
                          const next = { ...current };
                          delete next.country;
                          delete next.city;
                          return next;
                        });
                      }}
                    />
                  )}
                  {countriesError && <small className="field-error" role="status">Country list unavailable: {countriesError}. Enter the country manually.</small>}
                </CheckoutField>
                <CheckoutField label="City" error={errors.city} errorId="city-error">
                  <Input status={errors.city ? "error" : undefined} aria-describedby={errors.city ? "city-error" : undefined} autoComplete="address-level2" placeholder={selectedCountry?.capital || "Enter your city"} value={contact.city} onChange={onContact("city")} />
              </CheckoutField>
              <CheckoutField label="Postal code (optional)" error={errors.postcode} errorId="postcode-error">
                <Input status={errors.postcode ? "error" : undefined} aria-describedby={errors.postcode ? "postcode-error" : undefined} autoComplete="postal-code" placeholder="Postal code" value={contact.postcode} onChange={onContact("postcode")} />
              </CheckoutField>
            </div>
          </div>

    {/* Payment */}
<div className="checkout-block">
  <h2>Payment</h2>

  <div className="pay-options" role="radiogroup" aria-label="Payment method">
    {[
      {
        value: "card",
        title: "Card",
        hint: "Visa, Mastercard · hosted checkout",
        brands: (
          <span className="payment-brands">
            <span className="brand-visa">VISA</span>
            <span className="brand-mastercard" aria-hidden="true">
              <i /><i /><b>mastercard</b>
            </span>
          </span>
        ),
      },
      {
        value: "mobile",
        title: "Mobile money",
        hint: "Temporarily unavailable",
        disabled: true,
        brands: (
          <span className="payment-brands">
            <span className="brand-mtn">MTN</span>
            <span className="brand-airtel">Airtel</span>
          </span>
        ),
      },
    ].map((option) => (
      <label className={`pay-option${option.disabled ? " pay-option-disabled" : ""}`} key={option.value}>
        <input
          type="radio"
          name="payment-method"
          value={option.value}
          defaultChecked={option.value === "card"}
          disabled={option.disabled}
        />
        <span className="pay-option-body">
          <strong>{option.title}</strong>
          <small>{option.hint}</small>
          {option.brands}
        </span>
      </label>
    ))}
  </div>

  <div className="pay-details-panel">
    <div className="co-grid pay-details">
      <p className="payment-note span-2">
        You'll be redirected to a secure hosted checkout to enter your card details.
        This site never stores card numbers.
      </p>
    </div>
  </div>
</div>

          <div className="checkout-actions">
            {errors.form && <Alert showIcon type="error" title={errors.form} />}
            <Button type="primary" htmlType="submit" className="button-link checkout-submit" loading={isSubmitting}
              disabled={isSubmitting || Boolean(pendingReference)} icon={!isSubmitting ? <LockOutlined /> : undefined}>
              {isSubmitting ? "Processing…" : `Continue to payment · ${formatPrice(subtotal, currency)}`}
            </Button>
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
            <span className="summary-preview">{formatPrice(subtotal, currency)} <DownOutlined /></span>
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
          <p><TruckOutlined /> Carefully packed, with delivery updates along the way.</p>
          <p><ArrowLeftOutlined /> 14-day returns on eligible works.</p>
          <p><SafetyCertificateOutlined /> Every work is verified for artist authenticity.</p>
        </section>
        </div>
      </div>
    </section>
  );
}
