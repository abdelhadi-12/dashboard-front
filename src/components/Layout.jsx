import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "./layout.css";

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`sb-wrapper ${collapsed ? "collapsed" : ""}`}>
      <Sidebar />
      <div className="sb-main">
        <Topbar onToggle={() => setCollapsed((v) => !v)} />
        <main className="sb-content container-fluid py-3">{children}</main>
        <footer className="sb-footer small text-muted py-3 px-3">
          © {new Date().getFullYear()} – RASTAURANT
        </footer>
      </div>
    </div>
  );
}
