export default function ChartCard({ title, children }) {
  return (
    <div className="card mb-4 shadow-sm">
      <div className="card-header bg-white">
        <strong>{title}</strong>
      </div>
      <div className="card-body" style={{ height: 360 }}>
        {children}
      </div>
    </div>
  );
}
