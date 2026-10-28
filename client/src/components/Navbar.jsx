import { Waves, ArrowUpRight } from 'lucide-react';
export default function Navbar() {
  return (
    <header className="nav">
      <a className="brand" href="#">
        <span className="brand-icon">
          <Waves size={24} />
        </span>{" "}
        OceanLens<span className="brand-dot"></span>
        <span className="brand-sub">PIXMAMBA LAB</span>
      </a>
      <nav aria-label="Main navigation">
        <a href="#studio">Enhance</a>
        <a href="#about">The model</a>
        <a className="nav-cta" href="#studio">
          Open studio <ArrowUpRight size={15} />
        </a>
      </nav>
    </header>
  );
}
