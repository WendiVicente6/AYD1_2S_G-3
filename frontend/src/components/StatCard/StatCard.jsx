export default function StatCard({ icon, label, value, detail, trend }) {
  return (
    <article className="stat-card">
      <div className="stat-card-main">
        <div className="stat-icon">{icon}</div>
        <div>
          <span className="stat-label">{label}</span>
          <strong className="stat-value">{value}</strong>
          <span className="stat-detail">{detail}</span>
        </div>
      </div>
      {trend && <span className="trend">{trend}</span>}
    </article>
  );
}
