"use client";

import Link from "next/link";

import { CheckoutField } from "./commerce-pages";
import { image } from "./shared";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { ApiRequestError, submitContact } from "@/services/api";
// import "./contact.css";

// TODO: replace with your real address
const CONTACT_EMAIL = "hello@niyoarts.com";

const EMPTY_FORM = { name: "", email: "", subject: "", message: "" };

export function Contact() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [emailWarning, setEmailWarning] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof typeof EMPTY_FORM) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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
      setEmailWarning(
        result.data.notificationEmail === "failed"
          ? "Your message was saved, but the notification email could not be delivered."
          : ""
      );
      setForm(EMPTY_FORM);
    } catch (reason) {
      setError(
        reason instanceof ApiRequestError && reason.validationErrors.length
          ? reason.validationErrors.map((item) => `${item.path}: ${item.message}`).join(" ")
          : reason instanceof Error
            ? reason.message
            : "Unable to send your message."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="contact-page">
      <header className="contact-intro">
        <h1>Contact</h1>
        <p className="contact-lead">
          Questions about an artwork, a commission or your order? Send us a message and we will reply by email.
        </p>

        <dl className="contact-details">
          <div>
            <dt>Email</dt>
            <dd>
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </dd>
          </div>
          <div>
            <dt>Artwork enquiries</dt>
            <dd>Include the title of the piece so we can find it quickly.</dd>
          </div>
          <div>
            <dt>Orders and shipping</dt>
            <dd>Include your order number if you have one.</dd>
          </div>
        </dl>
      </header>

      <div className="contact-panel">
        {success ? (
          <div className="contact-success" role="status">
            <h2>Message sent</h2>
            <p>{success}</p>
            {emailWarning && <p className="contact-note">{emailWarning}</p>}
            <button type="button" className="contact-text-button" onClick={() => setSuccess("")}>
              Send another message
            </button>
          </div>
        ) : (
          <form className="contact-form" onSubmit={handleSubmit} noValidate={false}>
            <div className="contact-row">
              <div className="contact-field">
                <label htmlFor="contact-name">Name</label>
                <input
                  id="contact-name"
                  required
                  minLength={2}
                  maxLength={160}
                  autoComplete="name"
                  value={form.name}
                  onChange={set("name")}
                />
              </div>
              <div className="contact-field">
                <label htmlFor="contact-email">Email</label>
                <input
                  id="contact-email"
                  required
                  type="email"
                  maxLength={254}
                  autoComplete="email"
                  value={form.email}
                  onChange={set("email")}
                />
              </div>
            </div>

            <div className="contact-field">
              <label htmlFor="contact-subject">
                Subject <span className="contact-optional">Optional</span>
              </label>
              <input id="contact-subject" maxLength={200} value={form.subject} onChange={set("subject")} />
            </div>

            <div className="contact-field">
              <label htmlFor="contact-message">Message</label>
              <textarea
                id="contact-message"
                required
                minLength={10}
                maxLength={5000}
                rows={7}
                value={form.message}
                onChange={set("message")}
              />
              <span className="contact-count" aria-hidden="true">
                {form.message.length} / 5000
              </span>
            </div>

            {error && (
              <p className="contact-error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="contact-submit" disabled={submitting}>
              {submitting ? "Sending…" : "Send message"}
              {!submitting && <ArrowUpRight size={18} aria-hidden="true" />}
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
