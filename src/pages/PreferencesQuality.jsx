// src/pages/PreferencesQuality.jsx
import { useEffect, useState } from "react";
import { http } from "../lib/api";
import ChartCard from "../components/ChartCard";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ComposedChart, Line
} from "recharts";

// 🎨 Nouvelle palette plus vive (Power BI style)
const COLORS = [
  "#1ABC9C", // vert turquoise
  "#2E86C1", // bleu
  "#9B59B6", // violet
  "#F39C12", // orange
  "#E74C3C", // rouge
  "#27AE60", // vert
  "#8E44AD", // violet foncé
  "#FFC000", // jaune vif
  "#16A085", // vert d’eau
  "#D35400", // orange foncé
];

export default function PreferencesQuality() {
  const [cuisine, setCuisine] = useState({ labels: [], values: [] });
  const [alcohol, setAlcohol] = useState({ labels: [], values: [] });
  const [byRest, setByRest] = useState({ labels: [], values: [] });
  const [avgCnt, setAvgCnt] = useState([]);

  useEffect(() => {
    (async () => {
      const [a, b, c, d] = await Promise.all([
        http.get("/analytics/cuisine-share"),
        http.get("/analytics/alcohol-service"),
        http.get("/analytics/ratings-by-restaurant?top=12"),
        http.get("/analytics/avg-vs-count?top=10"),
      ]);
      setCuisine(a.data || { labels: [], values: [] });
      setAlcohol(b.data || { labels: [], values: [] });
      setByRest(c.data || { labels: [], values: [] });
      setAvgCnt(d.data || []);
    })();
  }, []);

  const cuisineData = cuisine.labels.map((l, i) => ({ name: l, value: cuisine.values[i] || 0 }));
  const alcoholData = alcohol.labels.map((l, i) => ({ name: l, value: alcohol.values[i] || 0 }));
  const byRestData = byRest.labels.map((l, i) => ({ name: l, value: byRest.values[i] || 0 }));

  return (
    <div className="container py-4">
      <h2 className="h4 mb-3">Preferences & Quality</h2>

      <div className="row">
        <div className="col-lg-6">
          <ChartCard title="Cuisine Preference Share (Top5 + Other)">
            <ResponsiveContainer>
              <PieChart>
                <Tooltip />
                <Legend />
                <Pie data={cuisineData} dataKey="value" nameKey="name" label>
                  {cuisineData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
        <div className="col-lg-6">
          <ChartCard title="Alcohol Service Types">
            <ResponsiveContainer>
              <BarChart data={alcoholData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                {/* Couleur du bar chart modifiée */}
                <Bar dataKey="value" name="Count" fill="#2E86C1" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-6">
          <ChartCard title="Ratings Count by Restaurant (Top 12)">
            <ResponsiveContainer>
              <PieChart>
                <Tooltip />
                <Legend />
                <Pie data={byRestData} dataKey="value" nameKey="name" label>
                  {byRestData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
        <div className="col-lg-6">
          <ChartCard title="Average Rating vs #Ratings (Top 10)">
            <ResponsiveContainer>
              <ComposedChart data={avgCnt}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis yAxisId="l" />
                <YAxis yAxisId="r" orientation="right" />
                <Tooltip />
                <Legend />
                {/* Couleur bar + ligne harmonisée */}
                <Bar yAxisId="l" dataKey="ratings_count" name="#Ratings" fill="#FFC000" />
                <Line yAxisId="r" dataKey="avg_overall" name="Avg" stroke="#E74C3C" strokeWidth={3} dot />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
