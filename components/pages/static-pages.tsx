"use client";

import Link from "next/link";
import { useState } from "react";
import { ApiRequestError, submitContact } from "@/services/api";
import { ArrowUpRight } from "lucide-react";
import { CheckoutField } from "./commerce-pages";
import { image } from "./shared";

export function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [emailWarning, setEmailWarning] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <section className="generic-page">
      <p className="section-kicker">Niyo / info</p>
      <h1>Contact</h1>
      <div className="generic-content">
        <p>Questions about an artwork or your order? Send us a message.</p>
        {success ? (
          <>
            <p role="status">{success}</p>
            {emailWarning && <p role="status">{emailWarning}</p>}
          </>
        ) : (
          <form
            className="checkout-form"
            onSubmit={async (event) => {
              event.preventDefault();
              setError("");
              setSuccess("");
              setSubmitting(true);
              try {
                const result = await submitContact({
                  name: form.name.trim(),
                  email: form.email.trim(),
                  ...(form.subject.trim() ? { subject: form.subject.trim() } : {}),
                  message: form.message.trim(),
                });
                setSuccess(result.message);
                setEmailWarning(result.data.notificationEmail === "failed"
                  ? "Your message was saved, but the notification email could not be delivered."
                  : "");
                setForm({ name: "", email: "", subject: "", message: "" });
              } catch (reason) {
                setError(reason instanceof ApiRequestError && reason.validationErrors.length
                  ? reason.validationErrors.map((item) => `${item.path}: ${item.message}`).join(" ")
                  : reason instanceof Error ? reason.message : "Unable to send your message.");
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <CheckoutField label="Name">
              <input required minLength={2} maxLength={160} autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </CheckoutField>
            <CheckoutField label="Email">
              <input required type="email" maxLength={254} autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </CheckoutField>
            <CheckoutField label="Subject (optional)">
              <input maxLength={200} value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} />
            </CheckoutField>
            <CheckoutField label="Message">
              <textarea required minLength={10} maxLength={5000} rows={6} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} />
            </CheckoutField>
            {error && <p className="field-error" role="alert">{error}</p>}
            <button type="submit" className="button-link" disabled={submitting}>
              {submitting ? "Sending…" : "Send message"} <ArrowUpRight />
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
export function About() {
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
export function Generic({ title, eyebrow, children }: { title: string; eyebrow: string; children?: React.ReactNode }) {
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
