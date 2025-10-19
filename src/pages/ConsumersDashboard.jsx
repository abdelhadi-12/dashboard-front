// src/pages/ConsumersDashboard.jsx
import { useEffect, useState } from "react";
import { http } from "../lib/api";
import ChartCard from "../components/ChartCard";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from "recharts";

// 🎨 Palette Power BI (vivante et harmonieuse)
const COLORS = [
  "#1ABC9C", // vert turquoise
  "#2E86C1", // bleu
  "#9B59B6", // violet
  "#F39C12", // orange
  "#E74C3C", // rouge
  "#27AE60", // vert
  "#8E44AD", // violet foncé
  "#FFC000", // jaune
  "#16A085", // vert d’eau
  "#D35400", // orange foncé
];

export default function ConsumersDashboard() {
  const [ageHist, setAgeHist] = useState({ bins: [], counts: [] });
  const [drink, setDrink] = useState({ cities: [], levels: [], matrix: [] });
  const [budget, setBudget] = useState({ occupations: [], buckets: [], matrix: [] });

  useEffect(() => {
    (async () => {
      const [a, b, c] = await Promise.all([
        http.get("/analytics/age-histogram?bins=18"),
        http.get("/analytics/drink-levels-by-city"),
        http.get("/analytics/budget-by-occupation"),
      ]);
      setAgeHist(a.data || { bins: [], counts: [] });
      setDrink(b.data || { cities: [], levels: [], matrix: [] });
      setBudget(c.data || { occupations: [], buckets: [], matrix: [] });
    })();
  }, []);

  const ageData = (ageHist.bins || []).map((x, i) => ({
    bin: Math.round(x),
    count: ageHist.counts?.[i] || 0,
  }));

  const drinkData = drink.cities.map((city, i) => {
    const row = { city };
    drink.levels.forEach((l, j) => (row[l] = drink.matrix[i][j]));
    return row;
  });

  const budgetData = budget.occupations.map((occ, i) => {
    const row = { occ };
    budget.buckets.forEach((b, j) => (row[b] = budget.matrix[i][j]));
    return row;
  });

  return (
    <div className="container py-4">
      <h2 className="h4 mb-3">Consumers</h2>

      <div className="row">
        {/* --- Age Distribution --- */}
        <div className="col-lg-6">
          <ChartCard title="Age distribution">
            <ResponsiveContainer>
              <BarChart data={ageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bin" />
                <YAxis />
                <Tooltip />
                <Legend />
                {/* Couleur principale (bleu) */}
                <Bar dataKey="count" name="Count" fill="#2E86C1" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* --- Drink Levels by City --- */}
        <div className="col-lg-6">
          <ChartCard title="Drink levels by city (stacked)">
            <ResponsiveContainer>
              <BarChart data={drinkData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="city" />
                <YAxis />
                <Tooltip />
                <Legend />
                {/* Couleurs multiples par niveau */}
                {drink.levels.map((l, i) => (
                  <Bar key={l} dataKey={l} stackId="s" fill={COLORS[i % COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* --- Budget by Occupation --- */}
      <ChartCard title="Budget levels by occupation (stacked)">
        <ResponsiveContainer>
          <BarChart data={budgetData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="occ" />
            <YAxis />
            <Tooltip />
            <Legend />
            {budget.buckets.map((b, i) => (
              <Bar key={b} dataKey={b} stackId="s" fill={COLORS[(i + 3) % COLORS.length]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
