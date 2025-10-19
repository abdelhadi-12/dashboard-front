export default function Topbar({ onToggle }) {
  return (
    <header className="sb-topbar">
      <button className="btn btn-link text-dark me-2" onClick={onToggle}>
        <i className="fa-solid fa-bars"></i>
      </button>
      <div className="fw-semibold">BI Dashboard</div>
      <div className="ms-auto d-flex align-items-center gap-3">
        <i className="fa-regular fa-bell"></i>
        <i className="fa-regular fa-circle-user"></i>
      </div>
    </header>
  );
}
