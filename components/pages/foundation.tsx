import { Image } from "antd";
import "../../app/FoundationPage.css";
import hero from "../../images/drummers.jpeg";
import drummers from "../../images/drummers.jpeg";
import g1 from "../../images/gallery-1.jpeg";
import g2 from "../../images/gallery-2.jpeg";
import g3 from "../../images/gallery-3.jpeg";
import g4 from "../../images/gallery-4.jpeg";

const gallery = [g1, g2, g3, g4];

// Sample events data — replace with your real data (e.g., from an API or CMS)
const events = [
  {
    id: 1,
    title: "Annual Drumming Workshop",
    date: "March 15, 2025",
    location: "Niyo Gallery, Kigali",
    description:
      "Join us for a full-day drumming workshop led by Niyo Foundation artists. All proceeds support children in the streets.",
    image: g1,
  },
  {
    id: 2,
    title: "Art & Resilience Exhibition",
    date: "April 22, 2025",
    location: "Niyo Gallery Main Hall",
    description:
      "A showcase of handcraft and artwork created by single mothers and genocide survivors in our program.",
    image: g2,
  },
  {
    id: 3,
    title: "Sewing Skills Graduation",
    date: "May 10, 2025",
    location: "Niyo Foundation Center",
    description:
      "Celebrate the graduation of our latest sewing cohort as they launch their independent businesses.",
    image: g3,
  },
  {
    id: 4,
    title: "Community Dance Night",
    date: "June 5, 2025",
    location: "Niyo Gallery Courtyard",
    description:
      "An evening of dance, music, and community. Open to all — come support our dancers and enjoy live performances.",
    image: g4,
  },
];

export function FoundationPage() {
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
            {events.map((event) => (
              <article key={event.id} className="foundation-event-card">
                <div className="foundation-event-image">
                  <img src={event.image.src} alt={event.title} />
                  <span className="foundation-event-date">{event.date}</span>
                </div>
                <div className="foundation-event-body">
                  <h3>{event.title}</h3>
                  <p className="foundation-event-location">📍 {event.location}</p>
                  <p className="foundation-event-desc">{event.description}</p>
                  <button
                    className="foundation-event-btn"
                    onClick={() => {
                      // Replace with your navigation logic, e.g.:
                      // navigate(`/foundation/events/${event.id}`)
                      console.log("View details for event", event.id);
                    }}
                  >
                    View Details
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="foundation-gallery">
          {gallery.map((src, i) => (
            <Image key={i} src={src.src} alt={`Niyo Foundation gallery ${i + 1}`} />
          ))}
        </section>
      </div>

      <div className="foundation-footer-space" />
    </div>
  );
}