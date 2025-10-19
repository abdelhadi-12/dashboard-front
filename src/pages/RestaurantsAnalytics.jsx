// src/pages/RestaurantsAnalytics.jsx
import { useEffect, useState } from "react";
import { http } from "../lib/api";
import ChartCard from "../components/ChartCard";
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
  LineChart, BarChart
} from "recharts";

// 🎨 Palette Power BI-style
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

export default function RestaurantsAnalytics() {
  const [top, setTop] = useState([]);
  const [byCity, setByCity] = useState([]);
  const [priceGrid, setPriceGrid] = useState({ cities: [], prices: [], matrix: [] });

  useEffect(() => {
    (async () => {
      const [a, b, c] = await Promise.all([
        http.get("/metrics/top-restaurants?n=10"),
        http.get("/metrics/by-city"),
        http.get("/analytics/price-by-city"),
      ]);
      setTop(a.data || []);
      setByCity(b.data || []);
      setPriceGrid(c.data || { cities: [], prices: [], matrix: [] });
    })();
  }, []);

  const topData = top.map(r => ({
    name: r.Name ?? String(r.Restaurant_ID),
    count: r.Rating_Count,
    avg: r.Avg_Rating
  }));

  const priceData = priceGrid.cities.map((city, i) => {
    const row = { city };
    priceGrid.prices.forEach((p, j) => (row[p] = priceGrid.matrix[i][j]));
    return row;
  });

  return (
    <div className="container py-4">
      <h2 className="h4 mb-3">BI Dashboard</h2>

      <div className="row">
        {/* --- TOP RESTAURANTS --- */}
        <div className="col-lg-8">
          <ChartCard title="Top Restaurants (#ratings vs Avg)">
            <ResponsiveContainer>
              <ComposedChart data={topData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                {/* Bar jaune et ligne rouge */}
                <Bar yAxisId="left" dataKey="count" name="#Ratings" fill="#FFC000" />
                <Line yAxisId="right" dataKey="avg" name="Avg" stroke="#E74C3C" strokeWidth={3} dot />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* --- AVG RATING BY CITY --- */}
        <div className="col-lg-4">
          <ChartCard title="Average Rating by City">
            <ResponsiveContainer>
              <LineChart data={byCity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="City" />
                <YAxis />
                <Tooltip />
                <Legend />
                {/* Ligne bleue élégante */}
                <Line dataKey="Avg_Rating" name="Avg" stroke="#2E86C1" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* --- PRICE LEVELS BY CITY --- */}
      <ChartCard title="Price Levels by City (stacked)">
        <ResponsiveContainer>
          <BarChart data={priceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="city" />
            <YAxis />
            <Tooltip />
            <Legend />
            {/* Couleurs variées pour chaque niveau de prix */}
            {priceGrid.prices.map((p, i) => (
              <Bar key={p} dataKey={p} stackId="s" fill={COLORS[i % COLORS.length]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
