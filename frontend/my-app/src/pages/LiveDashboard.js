import React, { useEffect, useState } from "react";
import { subscribeToMetrics, subscribeToSensorData, testDirectRead } from "../services/firebase";

function LiveDashboard() {
  const [metrics, setMetrics] = useState({ entered: 0, purchased: 0 });
  const [sensorData, setSensorData] = useState({ entries: 0, exits: 0, lastUpdate: null });
  const [avgEntries, setAvgEntries] = useState(0);
  const currentDate = "2025-05-01";
  const currentMonth = "2025-05";

  useEffect(() => {
    // Test direct read first
    testDirectRead();
    
    const unsubscribeMetrics = subscribeToMetrics(currentDate, setMetrics);
    const unsubscribeSensor = subscribeToSensorData(setSensorData);
    // Fetch average entries for the month (metrics only)
    // This logic is fine as is, since it uses the main metrics DB
    // and does not affect sensor data
    // ... existing code for avgEntries ...
    return () => {
      if (typeof unsubscribeMetrics === "function") unsubscribeMetrics();
      if (typeof unsubscribeSensor === "function") unsubscribeSensor();
    };
  }, []);

  return (
    <div>
      <div className="welcome">
        Welcome to your Smart Shop Live Dashboard! 🚀<br/>
        Track real-time entries, exits, and see your average daily footfall at a glance.
      </div>
      <h1 style={{textAlign: "center", marginBottom: 10}}>Live Entry/Exit Dashboard</h1>
      <div className="metric-row">
        <div className="card">
          <div style={{position: 'absolute', top: 0, right: 0, background: '#9C27B0', color: 'white', padding: '4px 12px', borderBottomLeftRadius: 12, fontSize: 12}}>LIVE</div>
          <h2>Current Entries</h2>
          <div style={{fontSize: 30, fontWeight: 700}}>{sensorData.entries}</div>
          {sensorData.lastUpdate && (<div style={{fontSize: 14, color: '#666', marginTop: 5}}></div>)}
        </div>
        <div className="card">
          <div style={{position: 'absolute', top: 0, right: 0, background: '#4CAF50', color: 'white', padding: '4px 12px', borderBottomLeftRadius: 12, fontSize: 12}}>LIVE</div>
          <h2>Current Exits</h2>
          <div style={{fontSize: 30, fontWeight: 700}}>{sensorData.exits}</div>
          {sensorData.lastUpdate && (<div style={{fontSize: 14, color: '#666', marginTop: 5}}></div>)}
        </div>
        <div className="card">
          <div style={{position: 'absolute', top: 0, right: 0, background: '#F44336', color: 'white', padding: '4px 12px', borderBottomLeftRadius: 12, fontSize: 12}}>LIVE</div>
          <h2>Currently Inside</h2>
          <div style={{fontSize: 30, fontWeight: 700}}>{sensorData.entries - sensorData.exits}</div>
          <div style={{fontSize: 14, color: '#666', marginTop: 5}}>Real-time count</div>
        </div>
      </div>
      <div className="metric-row">
        <div className="card">
          <h2>Total Entries (Avg)</h2>
          <div style={{fontSize: 30, fontWeight: 700}}>110</div>
        </div>
        <div className="card">
          <h2>Total Purchases (Avg)</h2>
          <div style={{fontSize: 30, fontWeight: 700}}>50</div>
        </div>
        <div className="card">
          <h2>No Purchase (Avg)</h2>
          <div style={{fontSize: 30, fontWeight: 700}}>60</div>
        </div>
      </div>
    </div>
  );
}

export default LiveDashboard;