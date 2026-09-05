import { Construction } from "lucide-react";

export default function Placeholder({ title, description }) {
  return (
    <section className="empty-page">
      <div className="empty-icon"><Construction size={30} /></div>
      <h2>{title}</h2>
      <p>{description}</p>
      <span>Vista base lista para que el equipo implemente las historias de usuario.</span>
    </section>
  );
}
