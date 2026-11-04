"use client";

import Link from "next/link";

import { Alert, Button, Input } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import { useState } from "react";
import { ApiRequestError, submitContact } from "@/services/api";
// import "./contact.css";

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
          Visit Niyo Arts Center and Café in Kigali, or send us a message.
        </p>

        <dl className="contact-details">
          <div>
            <dt>Address</dt>
            <dd>
              KG572 St, No. 25, Kacyiru, Kigali — behind the Public Library
            </dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd><a href="tel:+250788932111">+250 788 932 111</a></dd>
          </div>
          <div>
            <dt>Opening hours</dt>
            <dd>Daily, 8 AM–8 PM</dd>
          </div>
        </dl>
      </header>

      <div className="contact-panel">
        {success ? (
          <div className="contact-success" role="status">
            <h2>Message sent</h2>
            <p>{success}</p>
            {emailWarning && <p className="contact-note">{emailWarning}</p>}
            <Button type="link" className="contact-text-button" onClick={() => setSuccess("")}>
              Send another message
            </Button>
          </div>
        ) : (
          <form className="contact-form" onSubmit={handleSubmit} noValidate={false}>
            <div className="contact-row">
              <div className="contact-field">
                <label htmlFor="contact-name">Name</label>
                <Input
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
                <Input
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
              <Input id="contact-subject" maxLength={200} value={form.subject} onChange={set("subject")} />
            </div>

            <div className="contact-field">
              <label htmlFor="contact-message">Message</label>
              <Input.TextArea
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
              <Alert showIcon type="error" title={error} />
            )}

            <Button type="primary" htmlType="submit" className="contact-submit" loading={submitting}>
              {submitting ? "Sending…" : "Send message"}
              {!submitting && <ArrowRightOutlined aria-hidden="true" />}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
export function About() {
  const highlights = [
    { title: "Artists in residence", text: "Our gallery hosts 17 artists in residence from the Great Lakes region." },
    { title: "A creative space", text: "Niyo Arts Center gives Rwandan creative artists space to explore their talents and express themselves freely." },
    { title: "Niyo Art Cafe", text: "Enjoy coffee from Rwanda. Forty percent of café profits support Niyo Foundation and its work with women and children living in poverty in Rwanda." },
  ];
  return (
    <>
      <section className="about-hero">
        <p className="section-kicker">Niyo Arts Center · Kigali, Rwanda</p>
        <h1>Art, community and creativity.</h1>
      </section>
      <section className="about-story">
        <p className="section-kicker">Our story</p>
        <div className="about-content">
          <p className="about-lead">
            Niyo Arts Center is a space for Rwandan creative artists to explore their talents and express themselves freely.
          </p>
          <p>
            The gallery is home to 17 artists in residence from the Great Lakes region. Visit to experience their work and Niyo Art Cafe.
          </p>
          <Link className="text-link" href="/contact">
            Find us in Kigali <ArrowRightOutlined />
          </Link>
        </div>
      </section>
      <section className="about-principles">
        {highlights.map((p) => (
          <div key={p.title}>
            <h3>{p.title}</h3>
            <p>{p.text}</p>
          </div>
        ))}
      </section>
      <section className="about-cta">
        <h2>
          Visit Niyo Arts Center.
        </h2>
        <Link className="button-link" href="/contact">
          Get directions and contact us <ArrowRightOutlined />
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
              Explore the collection <ArrowRightOutlined />
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
