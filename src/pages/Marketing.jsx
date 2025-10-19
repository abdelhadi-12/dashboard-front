// src/pages/Marketing.jsx
import { useEffect, useState } from "react";
import { http } from "../lib/api";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";

const COLORS = [
  "#FFC000", // jaune vif
  "#F39C12", // orange
  "#E74C3C", // rouge
  "#9B59B6", // violet
  "#1ABC9C", // vert turquoise
  "#2E86C1", // bleu
  "#F5B041", // orange clair
  "#8E44AD", // violet foncé
  "#27AE60", // vert
  "#D35400", // orange foncé
];

export default function Marketing() {
  const [kpi, setKpi] = useState({ value: null, label: "" });
  const [occBud, setOccBud] = useState({ occupations: [], budgets: [], matrix: [] });
  const [donutTop, setDonutTop] = useState({ labels: [], values: [], percents: [] });
  const [qualByName, setQualByName] = useState({ names: [], categories: [], matrix: [] });
  const [prefTop10, setPrefTop10] = useState({ labels: [], values: [] });
  const [ageBins, setAgeBins] = useState({ labels: [], values: [] });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [kpiRes, occBudRes, donutRes, qualRes, prefRes, ageRes] = await Promise.all([
          http.get("/kpi/avg-rating"),
          http.get("/analytics/consumers-occupation-budget"),
          http.get("/analytics/ratings-count-top10"),
          http.get("/analytics/ratings-qual-by-name"),
          http.get("/analytics/pref-cuisine-top10"),
          http.get("/analytics/consumers-age-bins"),
        ]);

        setKpi(kpiRes.data ?? { value: null, label: "" });
        setOccBud(occBudRes.data ?? { occupations: [], budgets: [], matrix: [] });
        setDonutTop(donutRes.data ?? { labels: [], values: [], percents: [] });
        setQualByName(qualRes.data ?? { names: [], categories: [], matrix: [] });
        setPrefTop10(prefRes.data ?? { labels: [], values: [] });
        setAgeBins(ageRes.data ?? { labels: [], values: [] });
      } catch (e) {
        console.error(e);
        setErr("Impossible de charger les données Marketing.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="container py-3">
      <h2 className="h4 mb-3">Marketing Insights</h2>

      {err && <div className="alert alert-danger">{err}</div>}

      {/* KPI */}
      <div className="row">
        <div className="col-md-3 mb-3">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="small text-muted">{kpi.label || "Moyenne Rating"}</div>
              <div className="display-6 fw-bold">
                {loading ? "…" : kpi.value != null ? Number(kpi.value).toFixed(2) : "—"}
              </div>
              <div className="text-warning" style={{ fontSize: 24 }}>⭐</div>
            </div>
          </div>
        </div>
      </div>

      {/* Occupation × Budget (stacked bar) */}
      <ChartCard title="Consumers — Occupation × Budget (Stacked)">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={toStackedData(occBud)}
            margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="occupation" />
            <YAxis />
            <Tooltip />
            <Legend />
            {(occBud.budgets || []).map((b, i) => (
              <Bar key={b} dataKey={b} stackId="a" fill={COLORS[i % COLORS.length]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="row">
        {/* Donut Top 10 Ratings by Restaurant */}
        <div className="col-lg-6 mb-3">
          <ChartCard title="Ratings Count par Restaurant (Top 10) — Donut">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Tooltip
                  formatter={(v, _name, p) => {
                    const pct = p?.payload?.percent ?? 0;
                    return [`${v} (${pct}%)`, p?.payload?.name];
                  }}
                />
                <Legend />
                <Pie
                  data={toDonutData(donutTop)}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="55%"
                  outerRadius="80%"
                  isAnimationActive
                >
                  {toDonutData(donutTop).map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Ratings Count by Name & Rating Quality (grouped) */}
        <div className="col-lg-6 mb-3">
          <ChartCard title="Ratings Count par Name & Rating Quality">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={toGroupedData(qualByName)}
                margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" interval={0} angle={-20} dy={20} height={60} />
                <YAxis />
                <Tooltip />
                <Legend />
                {(qualByName.categories || []).map((c, i) => (
                  <Bar key={c} dataKey={c} fill={COLORS[i % COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      <div className="row">
        {/* Pref Count par Cuisine (Top 10) */}
        <div className="col-lg-6 mb-3">
          <ChartCard title="Pref Count par Cuisine (Top 10)">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={zipXY(prefTop10.labels, prefTop10.values, "Cuisine", "Count")}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="Cuisine" width={120} />
                <Tooltip />
                <Bar dataKey="Count" fill="#FFC000" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Consumers par Age (bins) */}
        <div className="col-lg-6 mb-3">
          <ChartCard title="Consumer Count par Age (compartiments)">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={zipXY(ageBins.labels, ageBins.values, "AgeBin", "Count")}
                margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="AgeBin" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="Count" fill="#2E86C1" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

/* ------------- UI helper ------------- */
function ChartCard({ title, children }) {
  return (
    <div className="card shadow-sm h-100">
      <div className="card-header bg-white">
        <strong>{title}</strong>
      </div>
      <div className="card-body" style={{ backgroundColor: "#F9FAFB" }}>
        {children}
      </div>
    </div>
  );
}

/* ------------- Data helpers ------------- */
function toStackedData(occBud) {
  const { occupations = [], budgets = [], matrix = [] } = occBud || {};
  return (occupations || []).map((occ, i) => {
    const row = { occupation: occ };
    (budgets || []).forEach((b, j) => {
      row[b] = matrix?.[i]?.[j] ?? 0;
    });
    return row;
  });
}

function toDonutData(d) {
  const labels = d?.labels || [];
  const values = d?.values || [];
  const perc = d?.percents || [];
  return labels.map((name, i) => ({
    name,
    value: values[i] ?? 0,
    percent: perc[i] ?? 0,
  }));
}

function toGroupedData(q) {
  const { names = [], categories = [], matrix = [] } = q || {};
  return (names || []).map((n, i) => {
    const row = { name: n };
    (categories || []).forEach((c, j) => {
      row[c] = matrix?.[i]?.[j] ?? 0;
    });
    return row;
  });
}

function zipXY(labels = [], values = [], xKey = "x", yKey = "y") {
  return (labels || []).map((x, i) => ({ [xKey]: x, [yKey]: values?.[i] ?? 0 }));
}
