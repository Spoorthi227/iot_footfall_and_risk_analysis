import React, { useEffect, useState } from "react";
import './App.css';
import {
  Bar,
  Line,
  Pie,
} from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  ArcElement,
  Filler,
} from "chart.js";
import 'chartjs-adapter-date-fns';
import { subscribeToMetrics, subscribeToHourly, subscribeToSensorData } from './services/firebase';
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import LiveDashboard from "./pages/LiveDashboard";
import CustomerPatterns from "./pages/CustomerPatterns";
import RiskAnalysis from "./pages/RiskAnalysis";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  ArcElement,
  Filler,
);

const navStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "40px",
  background: "#fff",
  boxShadow: "0 2px 12px #eee",
  padding: "18px 0",
  marginBottom: 40,
  borderRadius: 16,
  fontSize: 20,
};
const linkStyle = ({ isActive }) => ({
  color: isActive ? "#1976d2" : "#444",
  textDecoration: "none",
  fontWeight: isActive ? 700 : 500,
  borderBottom: isActive ? "2px solid #1976d2" : "none",
  paddingBottom: 4,
  transition: "all 0.2s",
});

function App() {
  const [metrics, setMetrics] = useState(null);
  const [hourly, setHourly] = useState([]);
  const [sensorData, setSensorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentDate = "2025-05-01";

  useEffect(() => {
    try {
      console.log('Setting up Firebase listeners...');
      
      // Subscribe to metrics updates
      const unsubscribeMetrics = subscribeToMetrics(currentDate, (data) => {
        console.log('New metrics data received in App:', data);
        setMetrics(data);
      });

      // Subscribe to hourly updates
      const unsubscribeHourly = subscribeToHourly(currentDate, (data) => {
        console.log('New hourly data received in App:', data);
        setHourly(Array.isArray(data) ? data : []);
      });

      // Subscribe to sensor data
      const unsubscribeSensor = subscribeToSensorData((data) => {
        console.log('New sensor data received:', data);
        setSensorData(data);
      });

      // Set loading to false after a short delay to ensure data is processed
      setTimeout(() => {
        setLoading(false);
      }, 1000);

      return () => {
        console.log('Cleaning up Firebase listeners...');
        unsubscribeMetrics();
        unsubscribeHourly();
        unsubscribeSensor();
      };
    } catch (err) {
      console.error('Error setting up Firebase listeners:', err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div style={{padding: 40, fontSize: 22, textAlign: 'center'}}>
        <div>Loading dashboard...</div>
        <div style={{fontSize: 16, color: '#666', marginTop: 10}}>
          Connecting to Firebase and fetching data...
        </div>
      </div>
    );
  }

  // Check if we have both metrics and hourly data
  if (!metrics || !Array.isArray(hourly) || hourly.length === 0) {
    return (
      <div style={{padding: 40, fontSize: 22, textAlign: 'center', color: 'red'}}>
        <div>Waiting for data...</div>
        <div style={{fontSize: 16, color: '#666', marginTop: 10}}>
          Please check if data exists in Firebase for date: {currentDate}
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const hours = hourly.map(h => `${h.Hour}:00`);
  const counts = hourly.map(h => h.count);

  // Pie chart for conversion/risk
  const pieData = {
    labels: ['Purchased', 'Not Purchased'],
    datasets: [{
      data: [metrics.purchased, metrics.entered - metrics.purchased],
      backgroundColor: ['#36A2EB', '#FF6384'],
      hoverBackgroundColor: ['#36A2EB', '#FF6384']
    }]
  };

  // Bar chart for hourly purchases
  const barData = {
    labels: hours,
    datasets: [{
      label: 'Purchases per Hour',
      data: counts,
      backgroundColor: '#4bc0c0'
    }]
  };

  // Line chart for cumulative purchases
  let cumulative = 0;
  const cumulativeCounts = counts.map(count => cumulative += count);
  const lineData = {
    labels: hours,
    datasets: [{
      label: 'Cumulative Purchases',
      data: cumulativeCounts,
      borderColor: '#36A2EB',
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      fill: true,
      tension: 0.3,
    }]
  };

  return (
    <Router>
      <div className="app-container">
        <nav style={navStyle}>
          <NavLink to="/" style={linkStyle} end>Live Dashboard</NavLink>
          <NavLink to="/patterns" style={linkStyle}>Customer Patterns</NavLink>
          <NavLink to="/risk" style={linkStyle}>Risk Analysis</NavLink>
        </nav>
        <Routes>
          <Route path="/" element={<LiveDashboard />} />
          <Route path="/patterns" element={<CustomerPatterns />} />
          <Route path="/risk" element={<RiskAnalysis />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
