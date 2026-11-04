
import hero from "../../images/background.jpg";
import drinksMenu from "../../images/menu.jpg";
import foodMenu from "../../images/food.jpg";
import g1 from "../../images/food-menu.jpg";
import g2 from "../../images/drinks-menu.jpg";
import g3 from "../../images/drinks.jpg";
import g4 from "../../images/overview.jpg";
import g5 from "../../images/out-side.jpg";
import { Image } from "antd";

const gallery = [g1, g2, g3, g4, g5];

export function CafePage() {
  return (
    <div className="cafe-page">
      <div className="cafe-container">
       <section
  className="cafe-hero"
  style={{
    backgroundImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url(${hero.src})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  }}
>
          {/* Point these to your real menu pages or PDFs */}
          <a className="cafe-menu-card" href="#drinks-menu" aria-label="Drinks menu">
            <img src={drinksMenu.src} alt="Drinks menu" />
          </a>
          <a className="cafe-menu-card" href="#food-menu" aria-label="Food menu">
            <img src={foodMenu.src} alt="Food menu" />
          </a>
        </section>

        <div className="cafe-divider" />

        <section className="cafe-gallery">
          {gallery.map((src, i) => (
            <Image key={i} src={src.src} alt={`Cafe photo ${i + 1}`} />
          ))}
        </section>
      </div>
    </div>
  );
}