import { Image } from "antd";
import "../../app/FoundationPage.css";
import hero from "../../images/drummers.jpeg";
import drummers from "../../images/drummers.jpeg";
import g1 from "../../images/gallery-1.jpeg";
import g2 from "../../images/gallery-2.jpeg";
import g3 from "../../images/gallery-3.jpeg";
import g4 from "../../images/gallery-4.jpeg";

const gallery = [g1, g2, g3, g4];

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
              build their future but also to support other’s lives, by contributing to the
              Foundation for 40% of their earnings.
            </p>
            {/* Donation widget placeholder (was the literal shortcode in the design) */}
            <p>[wdgk_donation]</p>
          </div>
          <Image src={drummers.src} alt="Drummers performing at Niyo Foundation" />
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