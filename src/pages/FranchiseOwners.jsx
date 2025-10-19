// src/pages/FranchiseOwners.jsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import ChartCard from "../components/ChartCard";
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

const API = import.meta.env?.VITE_API_URL || "http://127.0.0.1:8000"; // adapte si besoin
const COLORS = ["#4e73df", "#1cc88a", "#f6c23e", "#e74a3b", "#36b9cc", "#858796"];

// helpers
const fmt = (n, d = 2) =>
  (n === null || n === undefined || Number.isNaN(n)) ? "—" : Number(n).toFixed(d);

export default function FranchiseOwners() {
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const [, setTick] = useState(0);
useEffect(() => {
  const onResize = () => setTick(t => t + 1);
  window.addEventListener("resize", onResize);
  // petit kick au montage pour les onglets/collapses
  setTimeout(onResize, 0);
  return () => window.removeEventListener("resize", onResize);
}, []);

  // KPIs
  const [loyalty, setLoyalty] = useState({ value: null, label: "Loyalty Rate %" });
  const [density, setDensity] = useState({ value: null, label: "Restaurant Density" });

  // Modèle
  const [model, setModel] = useState({
    r2: null, mae: null, n_obs: 0,
    drivers: [],          // [{feature, importance}]
    top_cuisines: [],     // [{cuisine, predicted_rating}]
    messages: [],
    mock_used: false,
  });

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const [k1, k2, sum] = await Promise.allSettled([
          axios.get(`${API}/kpi/loyalty-rate`),
          axios.get(`${API}/kpi/restaurant-density`),
          axios.get(`${API}/predictive/summary`),
        ]);

        if (!alive) return;

        // Loyalty
        if (k1.status === "fulfilled") {
          setLoyalty(k1.value?.data ?? { value: null, label: "Loyalty Rate %" });
        }

        // Density
        if (k2.status === "fulfilled") {
          setDensity(k2.value?.data ?? { value: null, label: "Restaurant Density" });
        }

        // Predictive summary
        if (sum.status === "fulfilled") {
          setModel(sum.value?.data ?? {});
        } else {
          // on garde la page fonctionnelle, et on ajoute un message d’info
          setModel((m) => ({
            ...m,
            messages: [...(m.messages || []), "Le modèle prédictif n’a pas pu être calculé (endpoint /predictive/summary)."],
          }));
        }

        // Afficher une erreur globale seulement si TOUT a échoué
        if (k1.status === "rejected" && k2.status === "rejected" && sum.status === "rejected") {
          setErr("Impossible de récupérer les données Franchise Owners.");
        } else {
          setErr("");
        }
      } catch (e) {
        console.error(e);
        setErr("Impossible de récupérer les données Franchise Owners.");
      } finally {
        setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, []);

  // Données pour les graphiques
  const driversData = useMemo(
    () => (model.drivers || []).map(d => ({
      name: d.feature ?? d.raw_feature ?? "",
      value: d.importance ?? 0,
    })),
    [model.drivers]
  );

  const cuisinesData = useMemo(
    () => (model.top_cuisines || []).map((c) => ({
      name: c.cuisine ?? "",
      value: c.predicted_rating ?? 0,
    })),
    [model.top_cuisines]
  );

  return (
    <div className="container py-3">
      <h2 className="h4 mb-3">Franchise Owners — Insights</h2>

      {err && <div className="alert alert-danger">{err}</div>}
      {model.mock_used && !err && (
        <div className="alert alert-warning py-2">
          Mode démonstration : données mock utilisées (CSV manquants).
        </div>
      )}

      {/* KPIs */}
      <div className="row g-3">
        <KpiCard
          title={loyalty.label || "Loyalty Rate %"}
          value={loading ? "…" : (loyalty.value != null ? `${loyalty.value}%` : "—")}
          color="#1cc88a"
        />
        <KpiCard
          title={density.label || "Restaurant Density"}
          value={loading ? "…" : fmt(density.value, 2)}
          color="#36b9cc"
        />
        <KpiCard title="Model R²"  value={loading ? "…" : fmt(model.r2, 4)}  color="#4e73df" />
        <KpiCard title="Model MAE" value={loading ? "…" : fmt(model.mae, 4)} color="#f6c23e" />
      </div>

      {/* Importances (drivers) */}
      <ChartCard title="Facteurs déterminants (importances)" className="mt-3">
        <div style={{ height: 360 }}>
          {driversData.length === 0 ? (
            <div className="text-muted">Aucune importance à afficher.</div>
          ) : (
            <ResponsiveContainer key={`drv-${driversData.length}`} width="99%" height="100%">
              <BarChart
                data={driversData}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={240} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Importance" fill={COLORS[0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </ChartCard>

      {/* Top cuisines (si dispo) */}
      <ChartCard title="Top cuisines — note prédite" className="mt-3">
        <div style={{ height: 360 }}>
          {cuisinesData.length === 0 ? (
            <div className="text-muted">Aucune cuisine à afficher.</div>
          ) : (
<ResponsiveContainer key={`cui-${cuisinesData.length}`} width="99%" height="100%">
              <BarChart data={cuisinesData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-25} textAnchor="end" interval={0} />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Predicted Rating" fill={COLORS[1]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </ChartCard>

      
    </div>
  );
}

function KpiCard({ title, value, color }) {
  return (
    <div className="col-md-3">
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="small text-muted">{title}</div>
          <div className="display-6 fw-bold" style={{ color }}>{value}</div>
        </div>
      </div>
    </div>
  );
}
