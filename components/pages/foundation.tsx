"use client";

import { useEffect, useState } from "react";
import { Alert, Image, Modal, Spin } from "antd";
import "../../app/FoundationPage.css";
import hero from "../../images/drummers.jpeg";
import drummers from "../../images/drummers.jpeg";
import g1 from "../../images/gallery-1.jpeg";
import g2 from "../../images/gallery-2.jpeg";
import g3 from "../../images/gallery-3.jpeg";
import g4 from "../../images/gallery-4.jpeg";
import { getEvent, getEvents } from "@/services/api";
import type { ApiEvent } from "@/services/api";

const gallery = [g1, g2, g3, g4];

export function FoundationPage() {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<ApiEvent | null>(null);
  const [eventDetailsOpen, setEventDetailsOpen] = useState(false);
  const [eventDetailsLoading, setEventDetailsLoading] = useState(false);
  const [eventDetailsError, setEventDetailsError] = useState("");

  useEffect(() => {
    let active = true;
    getEvents()
      .then(({ data }) => {
        if (active) setEvents(data);
      })
      .catch((reason: unknown) => {
        if (active) setEventsError(reason instanceof Error ? reason.message : "Unable to load events.");
      })
      .finally(() => {
        if (active) setEventsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function showEventDetails(id: string) {
    setEventDetailsOpen(true);
    setSelectedEvent(null);
    setEventDetailsError("");
    setEventDetailsLoading(true);
    try {
      const { data } = await getEvent(id);
      setSelectedEvent(data);
    } catch (reason) {
      setEventDetailsError(reason instanceof Error ? reason.message : "Unable to load event details.");
    } finally {
      setEventDetailsLoading(false);
    }
  }

  return (
    <div className="foundation-page">
      <div className="foundation-container">
        <section
          className="foundation-hero"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url(${hero.src})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <h1>Niyo Foundation</h1>
        </section>

        <section className="foundation-intro">
          <div>
            <h2>What would Niyo Gallery be without its Foundation?</h2>
            <p>
              First and foremost, Niyo takes its roots from the Foundation. Created in 2012,
              Niyo Foundation has been established to assist and support through art children
              in the streets, single mothers, genocide survivors and more generally,
              individuals stroke by poverty.
            </p>
            <p>
              The Foundation offers the possibility to learn how to dance, to drum, to sew, to
              produce handcraft products and above all, to create value with hands. Benefitting
              from their art, vulnerable people are able to strengthen their resilience, to
              build their future but also to support other's lives, by contributing to the
              Foundation for 40% of their earnings.
            </p>
            {/* Donation widget placeholder (was the literal shortcode in the design) */}
            <p>[wdgk_donation]</p>
          </div>
          <Image src={drummers.src} alt="Drummers performing at Niyo Foundation" />
        </section>

        {/* ===== EVENTS SECTION ===== */}
        <section className="foundation-events">
          <h2 className="foundation-events-title">Upcoming Events</h2>
          <p className="foundation-events-subtitle">
            Join us at our upcoming events — every ticket supports the Foundation's mission.
          </p>

          <div className="foundation-events-grid">
            {eventsLoading ? (
              <div role="status"><Spin /> <span>Loading events…</span></div>
            ) : eventsError ? (
              <Alert type="error" showIcon title={eventsError} />
            ) : events.length ? events.map((event, index) => (
              <article key={event.id} className="foundation-event-card">
                <div className="foundation-event-image">
                  <img src={event.imageUrl || gallery[index % gallery.length].src} alt={event.title} />
                  {event.date && <span className="foundation-event-date">{event.date}</span>}
                </div>
                <div className="foundation-event-body">
                  <h3>{event.title}</h3>
                  {event.location && <p className="foundation-event-location">📍 {event.location}</p>}
                  {event.description && <p className="foundation-event-desc">{event.description}</p>}
                  <button
                    className="foundation-event-btn"
                    onClick={() => void showEventDetails(event.id)}
                  >
                    View Details
                  </button>
                </div>
              </article>
            )) : <p>No upcoming events are available right now.</p>}
          </div>
        </section>

        <section className="foundation-gallery">
          {gallery.map((src, i) => (
            <Image key={i} src={src.src} alt={`Niyo Foundation gallery ${i + 1}`} />
          ))}
        </section>
      </div>

      <div className="foundation-footer-space" />

      <Modal
        title={selectedEvent?.title || "Event details"}
        open={eventDetailsOpen}
        onCancel={() => setEventDetailsOpen(false)}
        footer={null}
      >
        {eventDetailsLoading ? (
          <Spin aria-label="Loading event details" />
        ) : eventDetailsError ? (
          <Alert type="error" showIcon title={eventDetailsError} />
        ) : selectedEvent ? (
          <div>
            {selectedEvent.imageUrl && (
              <Image src={selectedEvent.imageUrl} alt={selectedEvent.title} />
            )}
            {selectedEvent.date && <p>{selectedEvent.date}</p>}
            {selectedEvent.location && <p>{selectedEvent.location}</p>}
            {selectedEvent.description && <p>{selectedEvent.description}</p>}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}