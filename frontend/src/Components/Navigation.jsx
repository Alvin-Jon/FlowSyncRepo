import { Link, useLocation } from "react-router-dom";
import { HomeIcon,Droplets, SlidersVerticalIcon,Zap, AlertTriangle, Settings as Cog } from "lucide-react";

export default function Navigation() {
  const { pathname } = useLocation();

  const links = [
    { path: "/", label: "Dashboard", icon: <HomeIcon size={20} /> },
    { path: "/automation", label: "Automation", icon: <SlidersVerticalIcon size={20} /> },
    { path: "/leakage", label: "Leakage", icon: <Droplets size={20} /> },
    { path: "/settings", label: "Settings", icon: <Cog size={20} /> },
  ];

  return (
    <nav>
      <img src="/flowsync_logo_nb.png" alt="Logo" className="logo" />
      {links.map((link) => (
        <Link
          key={link.path}
          to={link.path}
          className={`nav-link ${pathname === link.path ? "active" : ""}`}
        >
          {link.icon}
          <span>{link.label}</span>
        </Link>
      ))}
    </nav>
  );
}
