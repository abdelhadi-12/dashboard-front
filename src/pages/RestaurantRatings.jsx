// src/pages/RestaurantRatings.jsx
import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line
} from "recharts";
import { http } from "../lib/api";
import ChartCard from "../components/ChartCard";

const PALETTE = [
  "#1ABC9C", "#2E86C1", "#9B59B6", "#F39C12", "#E74C3C",
  "#27AE60", "#8E44AD", "#16A085", "#D35400", "#7D3C98",
];

export default function RestaurantRatings() {
  const [alcohol, setAlcohol] = useState({ labels: [], values: [] });
  const [dlCity, setDlCity] = useState({ cities: [], levels: [], matrix: [] });
  const [budgetAge, setBudgetAge] = useState({ labels: [], series: { High: [], Medium: [], Low: [] } });
  const [satisDrink, setSatisDrink] = useState({ labels: [], values: [] });
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [a1, a2, a3, a4] = await Promise.all([
          http.get("/analytics/alcohol-service"),
          http.get("/analytics/drink-levels-by-city"),
          http.get("/analytics/budget-by-age"),          // assure-toi que l’endpoint existe
          http.get("/analytics/drink-satisfaction"),     // idem
        ]);
        if (!alive) return;
        setAlcohol(a1.data || { labels: [], values: [] });
        setDlCity(a2.data || { cities: [], levels: [], matrix: [] });
        setBudgetAge(a3.data || { labels: [], series: { High: [], Medium: [], Low: [] } });
        setSatisDrink(a4.data || { labels: [], values: [] });
      } catch (e) {
        console.error(e);
        setError("Impossible de charger les données du backend.");
      }
    })();
    return () => { alive = false; };
  }, []);

  // --- Alcohol bar (horizontal)
  const alcoholData = useMemo(
    () => alcohol.labels.map((lab, i) => ({ name: lab, value: alcohol.values[i] ?? 0 })),
    [alcohol]
  );

  // --- Drink Levels by City (stacked bars)
  const dlStacked = useMemo(() => {
    return dlCity.cities.map((city, i) => {
      const row = {};
      dlCity.levels.forEach((lvl, j) => { row[lvl] = dlCity.matrix[i]?.[j] ?? 0; });
      return { city, ...row };
    });
  }, [dlCity]);

  // --- Budget by Age (3 lines)
  const budgetLines = useMemo(() => {
    return budgetAge.labels.map((age, i) => ({
      age,
      High:   budgetAge.series?.High?.[i] ?? 0,
      Medium: budgetAge.series?.Medium?.[i] ?? 0,
      Low:    budgetAge.series?.Low?.[i] ?? 0,
    }));
  }, [budgetAge]);

  // --- Satisfaction by Drink Level (horizontal bars)
  const satisData = useMemo(
    () => satisDrink.labels.map((lab, i) => ({ level: lab, avg: satisDrink.values[i] ?? 0 })),
    [satisDrink]
  );

  return (
    <div className="container-fluid px-0">
      <div className="d-flex align-items-center mb-3">
        <h2 className="h4 mb-0">Restaurant Ratings</h2>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row">
        {/* 1) Alcohol Clean */}
        <div className="col-xl-6 mb-4">
          <ChartCard title="Alcohol Clean (répartition)">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={alcoholData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip />
                <Legend />
                {/* Couleur personnalisée */}
                <Bar dataKey="value" name="Count" fill="#1ABC9C" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* 2) Consumers by City & Drink Level (stacked) */}
        <div className="col-xl-6 mb-4">
          <ChartCard title="Nombre de Consumer_ID par City et Drink_Level">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={dlStacked} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="city" angle={-30} textAnchor="end" interval={0} />
                <YAxis />
                <Tooltip />
                <Legend />
                {dlCity.levels.map((lvl, i) => (
                  <Bar key={lvl} dataKey={lvl} stackId="dl" fill={PALETTE[i % PALETTE.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* 3) Budget by Age (lines) */}
        <div className="col-xl-7 mb-4">
          <ChartCard title="Répartition du budget par tranche d'âge">
            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={budgetLines} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="age" tickFormatter={(v) => `${v}`} />
                <YAxis />
                <Tooltip />
                <Legend />
                {/* Couleurs de lignes distinctes */}
                <Line type="monotone" dataKey="High"   stroke="#FFC000" strokeWidth={3} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="Medium" stroke="#FF7F00" strokeWidth={3} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="Low"    stroke="#E74C3C" strokeWidth={3} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* 4) Satisfaction moyenne par Drink_Level */}
        <div className="col-xl-5 mb-4">
          <ChartCard title="Satisfaction moyenne par Drink_Level">
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={satisData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 5]} />
                <YAxis dataKey="level" type="category" width={140} />
                <Tooltip />
                <Legend />
                {/* Couleur personnalisée */}
                <Bar dataKey="avg" name="Avg Rating" fill="#2E86C1" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
