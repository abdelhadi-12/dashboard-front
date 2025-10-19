// src/App.js
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import RestaurantsAnalytics from "./pages/RestaurantsAnalytics";
import ConsumersDashboard from "./pages/ConsumersDashboard";
import PreferencesQuality from "./pages/PreferencesQuality";
import Investment from "./pages/Investment";
import Marketing from "./pages/Marketing"; 
import FranchiseOwners from "./pages/FranchiseOwners";
import RestaurantRatings from "./pages/RestaurantRatings";
import "bootstrap/dist/css/bootstrap.min.css";

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* Page d'accueil par défaut */}
          <Route path="/" element={<Navigate to="/home" replace />} />

          {/* Pages principales */}
          <Route path="/home" element={<Dashboard />} />
          <Route path="/analytics" element={<RestaurantsAnalytics />} />
          <Route path="/consumers" element={<ConsumersDashboard />} />
          <Route path="/preferences" element={<PreferencesQuality />} />
          <Route path="/Restaurant" element={<RestaurantRatings />} />
          <Route path="/investment" element={<Investment />} />
          <Route path="/marketing" element={<Marketing />} /> 
          <Route path="/owners" element={<FranchiseOwners />} />

          {/* Redirection si route inconnue */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
