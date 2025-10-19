import { NavLink } from "react-router-dom";
import "./sidebar.css";

export default function Sidebar() {
  return (
    <nav className="sb-sidenav">
      <div className="sb-brand">
        <i className="fa-regular fa-face-smile me-2"></i> Restaurant Rating
      </div>

      <div className="sb-section-title">Interface</div>
      <ul className="sb-menu">
        <li>
          <NavLink to="/home" className="sb-link">
            <i className="fa-solid fa-chart-pie" />
            Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink to="/analytics" className="sb-link">
            <i className="fa-solid fa-chart-column me-2" />
            Analytics
          </NavLink>
        </li>
        <li>
          <NavLink to="/consumers" className="sb-link">
            <i className="fa-solid fa-users me-2" />
            Consumers
          </NavLink>
        </li>
        <li>
          <NavLink to="/preferences" className="sb-link">
            <i className="fa-solid fa-chart-line" />
            Preferences
          </NavLink>
        </li>
          <li>
          <NavLink to="/investment" className="sb-link">
            <i className="fa-solid fa-hand-holding-dollar me-2" />
            Investment
          </NavLink>
        </li>  <li>
          <NavLink to="/Restaurant" className="sb-link">
            <i className="fa-solid fa-star me-2" />
            Restaurateur
          </NavLink>
        </li>
        <li>
          <NavLink to="/Marketing" className="sb-link">
            <i className="fa-solid fa-bullhorn" />
            Marketing
          </NavLink>
        </li>
        <li>
          <NavLink to="/owners" className="sb-link">
            <i className="fa-solid fa-store me-2" />
            FranchiseOwners
          </NavLink>
        </li>
      </ul>

      
    </nav>
  );
}
