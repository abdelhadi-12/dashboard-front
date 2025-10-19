import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
} from "recharts";

// ⚙️ adapte si besoin (localhost/127.0.0.1 et port)
const API = "https://dashbord-back.onrender.com";

// 🎨 Palette
const COLORS = ["#4e73df", "#1cc88a", "#36b9cc", "#f6c23e", "#e74a3b", "#858796"];

export default function Dashboard() {
  // ---- KPIs principaux (restaurants)
  const [kpis, setKpis] = useState({
    total_reviews: null,
    avg_rating: null,
    restaurants: null,
    alcohol_clean_pct: null,
  });

  // ---- KPIs consommateurs (nouveaux)
  const [consumerKpis, setConsumerKpis] = useState({
    average_age: null,
    average_budget_score: null,
    abstemious_rate: null,
  });

  // ---- datasets Analytics
  const [topRestaurants, setTopRestaurants] = useState([]);
  const [avgByCity, setAvgByCity] = useState([]);
  const [priceByCity, setPriceByCity] = useState({ cities: [], prices: [], matrix: [] });

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        // Appels API parallèles
        const [kRes, tRes, cRes, pRes, ageRes, budgetRes, absRes] = await Promise.all([
          axios.get(`${API}/metrics/kpis`),
          axios.get(`${API}/metrics/top-restaurants`, { params: { n: 10 } }),
          axios.get(`${API}/metrics/by-city`),
          axios.get(`${API}/analytics/price-by-city`),
          axios.get(`${API}/kpi/average-age`),
          axios.get(`${API}/kpi/average-budget-score`),
          axios.get(`${API}/kpi/abstemious-rate`),
        ]);

        // KPI restaurants
        setKpis(kRes.data ?? {});

        // KPI consommateurs
        setConsumerKpis({
          average_age: ageRes.data?.value ?? null,
          average_budget_score: budgetRes.data?.value ?? null,
          abstemious_rate: absRes.data?.value ?? null,
        });

        // Graphiques
        setTopRestaurants(
          (tRes.data || []).map((d) => ({
            name: d.Name ?? d.name ?? String(d.Restaurant_ID ?? d.id ?? ""),
            rating_count: d.Rating_Count ?? d.rating_count ?? d.count ?? 0,
            avg_rating: d.Avg_Rating ?? d.avg_rating ?? d.avg ?? 0,
          }))
        );

        setAvgByCity(
          (cRes.data || []).map((d) => ({
            city: d.City ?? d.city ?? "",
            avg: d.Avg_Rating ?? d.avg_rating ?? 0,
          }))
        );

        setPriceByCity(pRes.data || { cities: [], prices: [], matrix: [] });
      } catch (e) {
        console.error(e);
        setErr("Erreur: impossible de récupérer les données depuis l'API.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ---- transformer price×city (matrice) -> lignes pour Recharts
  const priceStacked = useMemo(
    () => matrixToRows(priceByCity.cities, priceByCity.prices, priceByCity.matrix, "city"),
    [priceByCity]
  );

  return (
    <div className="container py-4">
      <h1 className="h3 mb-4 text-gray-800">BI Dashboard</h1>

      {err && <div className="alert alert-danger">{err}</div>}

      {/* KPIs Restaurants */}
      <div className="row">
        <KpiCard title="Reviews"          colorClass="border-left-primary" value={loading ? "…" : fmtNum(kpis.total_reviews)} />
        <KpiCard title="Average Rating"   colorClass="border-left-success" value={loading ? "…" : (kpis.avg_rating ?? "—")} />
        <KpiCard title="Restaurants"      colorClass="border-left-info"    value={loading ? "…" : fmtNum(kpis.restaurants)} />
        <KpiCard title="Alcohol Clean %"  colorClass="border-left-warning" value={loading ? "…" : (kpis.alcohol_clean_pct != null ? `${kpis.alcohol_clean_pct}%` : "—")} />
      </div>

      {/* KPIs Consommateurs */}
      <div className="row mt-4">
        <KpiCard title="Average Age" colorClass="border-left-dark" value={loading ? "…" : (consumerKpis.average_age ?? "—")} />
        <KpiCard title="Budget Score (1–3)" colorClass="border-left-secondary" value={loading ? "…" : (consumerKpis.average_budget_score ?? "—")} />
        <KpiCard title="% Abstemious" colorClass="border-left-danger" value={loading ? "…" : (consumerKpis.abstemious_rate != null ? `${consumerKpis.abstemious_rate}%` : "—")} />
      </div>

      {/* Graphiques */}
      <div className="row mt-5">
        {/* Top restaurants */}
        <ChartCard title="Top Restaurants (#ratings vs Avg)" className="col-lg-8">
          <ResponsiveContainer width="100%" height={360}>
            {loading ? <Skeleton /> : (
              <ComposedChart data={topRestaurants}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" hide />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="rating_count" name="#Ratings" fill={COLORS[0]} radius={[4,4,0,0]} />
                <Line yAxisId="right" type="monotone" dataKey="avg_rating" name="Avg" stroke={COLORS[1]} strokeWidth={2} dot={false} />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </ChartCard>

        {/* Average by City */}
        <ChartCard title="Average Rating by City" className="col-lg-4">
          <ResponsiveContainer width="100%" height={360}>
            {loading ? <Skeleton /> : (
              <LineChart data={avgByCity.slice(0, 15)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="city" hide />
                <YAxis domain={[0, "dataMax+1"]} />
                <Tooltip />
                <Legend />
                <Line dataKey="avg" name="Avg" stroke={COLORS[2]} strokeWidth={2} dot={false} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Price levels x City (stacked) */}
      <div className="row">
        <ChartCard title="Price Levels by City (stacked)" className="col-12">
          <ResponsiveContainer width="100%" height={380}>
            {loading ? <Skeleton /> : (
              <BarChart data={priceStacked.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="city" />
                <YAxis />
                <Tooltip />
                <Legend />
                {stackKeys(priceStacked, "city").map((k, i) => (
                  <Bar key={k} dataKey={k} stackId="p" name={k} fill={COLORS[i % COLORS.length]} />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

/* =================== composants utilitaires =================== */

function KpiCard({ title, value, colorClass }) {
  return (
    <div className="col-md-3 mb-3">
      <div className={`card ${colorClass} shadow h-100 py-2`}>
        <div className="card-body">
          <div className="text-xs font-weight-bold text-uppercase mb-1">{title}</div>
          <div className="h5 mb-0 font-weight-bold text-gray-800">{value ?? "—"}</div>
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, className = "col-12", children }) {
  return (
    <div className={className + " mb-4"}>
      <div className="card shadow h-100">
        <div className="card-header py-3">
          <h6 className="m-0 font-weight-bold text-primary">{title}</h6>
        </div>
        <div className="card-body">{children}</div>
      </div>
    </div>
  );
}

function Skeleton() {
  return <div className="text-muted">Loading…</div>;
}

function fmtNum(n) {
  if (n == null) return "—";
  return new Intl.NumberFormat().format(n);
}

function matrixToRows(rowsLabels = [], colLabels = [], matrix = [], keyName = "row") {
  return (rowsLabels || []).map((rowName, i) => {
    const row = { [keyName]: rowName };
    const line = matrix?.[i] || [];
    (colLabels || []).forEach((c, j) => (row[c] = line?.[j] || 0));
    return row;
  });
}

function stackKeys(rows, dimKey) {
  if (!rows || rows.length === 0) return [];
  const keys = new Set();
  rows.forEach((r) => {
    Object.keys(r).forEach((k) => {
      if (k !== dimKey) keys.add(k);
    });
  });
  return Array.from(keys);
}
