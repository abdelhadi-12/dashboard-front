// src/pages/Investment.jsx
import { useEffect, useMemo, useState } from "react";
import { http } from "../lib/api";
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";

// --- Couleurs (cohérentes avec le reste)
const COLORS = {
  primary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  info: "#06b6d4",
  gray: "#64748b",
  low: "#60a5fa",
  med: "#34d399",
  high: "#f59e0b",
};
const PIE_COLORS = ["#60a5fa", "#34d399", "#f59e0b", "#06b6d4", "#a78bfa"];

function ChartCard({ title, children }) {
  // Fallback tout simple si tu n’as pas components/ChartCard.jsx
  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header py-3">
        <h6 className="m-0 text-primary">{title}</h6>
      </div>
      <div className="card-body" style={{ height: 360 }}>
        {children}
      </div>
    </div>
  );
}

export default function Investment() {
  const [city, setCity] = useState(""); // "" = All
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Données
  const [kpis, setKpis] = useState({ restaurants: 0, consumers: 0, cities: 0, avg_rating: null });

  const [priceByCity, setPriceByCity] = useState({ cities: [], prices: [], matrix: [] }); // Low/Medium/High par city
  const [priceCounts, setPriceCounts] = useState({ labels: [], values: [] }); // Low/Medium/High (filtré ville)
  const [topCuisines, setTopCuisines] = useState({ labels: [], values: [] });
  const [franchiseCount, setFranchiseCount] = useState({ labels: [], values: [] });
  const [cuisinesByPrice100, setCuisinesByPrice100] = useState({ cuisines: [], buckets: [], matrix_pct: [] });

  // Charger liste des villes (une fois)
  useEffect(() => {
    const boot = async () => {
      try {
        const { data } = await http.get("/analytics/price-by-city");
        setPriceByCity(data || { cities: [], prices: [], matrix: [] });
        setCities(["All", ...(data?.cities || [])]);
      } catch (e) {
        console.error(e);
        setErr("Impossible de charger les villes.");
      }
    };
    boot();
  }, []);

  // Charger tout ce qui dépend de city
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr("");
      try {
        const q = city && city !== "All" ? `?city=${encodeURIComponent(city)}` : "";

        // KPIs
        const k = await http.get(`/investor/kpis${q}`);
        setKpis(k.data || { restaurants: 0, consumers: 0, cities: 0, avg_rating: null });

        // Nombre de Price (Low/Medium/High) pour la ville (ou All)
        const p = await http.get(`/analytics/price-count-stacked${q}`);
        setPriceCounts(p.data || { labels: [], values: [] });

        // Top 5 cuisines
        const t = await http.get(`/analytics/top-cuisines${q}`);
        setTopCuisines(t.data || { labels: [], values: [] });

        // Nombre par franchise
        const f = await http.get(`/analytics/franchise-count${q}`);
        setFranchiseCount(f.data || { labels: [], values: [] });

        // 100% empilé — top cuisines x price
        const c100 = await http.get(`/analytics/top-cuisines-by-price-100${q}`);
        setCuisinesByPrice100(c100.data || { cuisines: [], buckets: [], matrix_pct: [] });
      } catch (e) {
        console.error(e);
        setErr("Erreur: impossible de récupérer les données depuis l'API.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [city]);

  // Transformer /analytics/price-by-city -> dataset Recharts (stacked par ville)
  const priceCityData = useMemo(() => {
    const { cities: C, prices: P, matrix: M } = priceByCity || {};
    if (!C?.length || !P?.length || !M?.length) return [];

    if (city && city !== "All") {
      const idx = C.indexOf(city);
      if (idx === -1) return [];
      const row = M[idx] || [];
      const obj = { city };
      P.forEach((p, i) => { obj[p] = row[i] || 0; });
      return [obj];
    }

    // Toutes les villes
    return C.map((cty, r) => {
      const obj = { city: cty };
      (P || []).forEach((p, i) => { obj[p] = (M[r] || [])[i] || 0; });
      return obj;
    });
  }, [city, priceByCity]);

  // Dataset pour Donut Top 5 cuisines
  const pieCuisines = useMemo(() => {
    const { labels, values } = topCuisines || {};
    return (labels || []).map((name, i) => ({ name, value: (values || [])[i] || 0 }));
  }, [topCuisines]);

  // Franchise -> horizontal bars
  const franchiseData = useMemo(() => {
    const { labels, values } = franchiseCount || {};
    return (labels || []).map((name, i) => ({ name, count: (values || [])[i] || 0 }));
  }, [franchiseCount]);

  // 100% empilé -> pourcentages
  const cuisines100Data = useMemo(() => {
    const { cuisines, buckets, matrix_pct } = cuisinesByPrice100 || {};
    if (!cuisines?.length) return [];
    return cuisines.map((c, r) => {
      const obj = { cuisine: c };
      (buckets || []).forEach((b, i) => {
        const v = ((matrix_pct?.[r]?.[i] || 0) * 100);
        obj[b] = Math.round(v * 10) / 10; // 1 décimale
      });
      return obj;
    });
  }, [cuisinesByPrice100]);

  return (
    <div className="container-fluid py-3">
      <div className="d-flex align-items-center gap-3 mb-3">
        <h2 className="h4 m-0">Investment</h2>
        <select
          className="form-select w-auto"
          value={city || "All"}
          onChange={(e) => setCity(e.target.value)}
        >
          {cities.map((c) => (
            <option key={c} value={c === "All" ? "" : c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {err && <div className="alert alert-danger mb-3">{err}</div>}

      {/* KPIs */}
      <div className="row g-3 mb-2">
        <Kpi title="Restaurants" value={loading ? "…" : kpis.restaurants} color={COLORS.primary} />
        <Kpi title="Consumers" value={loading ? "…" : kpis.consumers} color={COLORS.success} />
        <Kpi title="Cities" value={loading ? "…" : kpis.cities} color={COLORS.info} />
        <Kpi title="Avg Rating" value={loading ? "…" : (kpis.avg_rating ?? "—")} color={COLORS.warning} />
      </div>

      <div className="row">
        {/* Nombre de Price par City (stacked) */}
        <div className="col-xl-8">
          <ChartCard title="Nombre de Price par City">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priceCityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="city" />
                <YAxis />
                <Tooltip />
                <Legend />
                {/* Les clés Low/Medium/High peuvent venir en minuscules/majuscules selon ton CSV.
                    Ici on couvre les plus probables. */}
                <Bar dataKey="Low" stackId="p" fill={COLORS.low} />
                <Bar dataKey="Medium" stackId="p" fill={COLORS.med} />
                <Bar dataKey="High" stackId="p" fill={COLORS.high} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Top 5 cuisines (donut) */}
        <div className="col-xl-4">
          <ChartCard title="Top 5 cuisines">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip />
                <Legend />
                <Pie
                  data={pieCuisines}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="50%"
                  outerRadius="80%"
                  stroke="none"
                >
                  {pieCuisines.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      <div className="row">
        {/* Par franchise */}
        <div className="col-xl-6">
          <ChartCard title="Nombre de restaurants par franchise">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={franchiseData}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 40, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={140} />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS.primary} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* 100% empilé */}
        <div className="col-xl-6">
          <ChartCard title="Top Cuisines — distribution par Price (100%)">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cuisines100Data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="cuisine" />
                <YAxis tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Legend />
                <Bar dataKey="Low" stackId="pct" fill={COLORS.low} />
                <Bar dataKey="Medium" stackId="pct" fill={COLORS.med} />
                <Bar dataKey="High" stackId="pct" fill={COLORS.high} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

function Kpi({ title, value, color }) {
  return (
    <div className="col-md-3">
      <div className="card shadow-sm h-100">
        <div className="card-body">
          <div className="text-uppercase small mb-1" style={{ color }}>{title}</div>
          <div className="h4 m-0">{value}</div>
        </div>
      </div>
    </div>
  );
}
