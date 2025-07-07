import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  getMonthlyHourlyData,
  getMonthlyDailyTotals,
  getMonthlyWeeklyTotals,
  subscribeToSensorData,
  testDirectRead
} from "../services/firebase";

function CustomerPatterns() {
  const [hourlyDataRaw, setHourlyDataRaw] = useState(new Array(24).fill(0));
  const [dailyDataRaw, setDailyDataRaw] = useState(new Array(31).fill(0));
  const [weeklyDataRaw, setWeeklyDataRaw] = useState(new Array(5).fill(0));
  const [month, setMonth] = useState("2025-06");
  const [sensorData, setSensorData] = useState({ entries: 0, exits: 0, lastUpdate: null });

  const [liveHourly, setLiveHourly] = useState(null);
  const [liveDaily, setLiveDaily] = useState(null);
  const [liveWeekly, setLiveWeekly] = useState(null);

  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDate() - 1;
  const currentWeek = Math.floor(currentDay / 7);
  const currentMonth = now.toISOString().slice(0, 7);

  useEffect(() => {
    getMonthlyHourlyData(month).then(setHourlyDataRaw);
    getMonthlyDailyTotals(month).then(setDailyDataRaw);
    getMonthlyWeeklyTotals(month).then(setWeeklyDataRaw);

    // Clear live overlay if month changes
    if (month !== currentMonth) {
      setLiveHourly(null);
      setLiveDaily(null);
      setLiveWeekly(null);
    }
  }, [month]);

  useEffect(() => {
    testDirectRead();

    const unsubscribe = subscribeToSensorData((data) => {
      setSensorData(data);

      if (month === currentMonth) {
        setLiveHourly({ index: currentHour, value: data.entries });
        setLiveDaily({ index: currentDay, value: data.entries });
        setLiveWeekly({ index: currentWeek, value: data.entries });
      }
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [month, currentHour, currentDay, currentWeek]);

  const mergeLive = (data, live) => {
    const updated = [...data];
    if (live && live.index >= 0 && live.index < updated.length) {
      updated[live.index] = live.value;
    }
    return updated;
  };

  const hourLabels = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
  const dayLabels = Array.from({ length: 31 }, (_, i) => `${i + 1}`);
  const weekLabels = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"];

  const hourlyData = {
    labels: hourLabels,
    datasets: [{
      label: "live entry count per Hour",
      data: mergeLive(hourlyDataRaw, liveHourly),
      backgroundColor: hourLabels.map((_, i) =>
        i === currentHour && month === currentMonth ? "#FFCE56" : "#4bc0c0"
      )
    }]
  };

  const dailyData = {
    labels: dayLabels,
    datasets: [{
      label: "live count per Day",
      data: mergeLive(dailyDataRaw, liveDaily),
      backgroundColor: dayLabels.map((_, i) =>
        i === currentDay && month === currentMonth ? "#FFCE56" : "#36A2EB"
      )
    }]
  };

  const weeklyData = {
    labels: weekLabels,
    datasets: [{
      label: "live count this Week",
      data: mergeLive(weeklyDataRaw, liveWeekly),
      backgroundColor: weekLabels.map((_, i) =>
        i === currentWeek && month === currentMonth ? "#FFCE56" : "#FF6384"
      )
    }]
  };

  return (
    <div>
      <h1 style={{ textAlign: "center", color: "#222", marginBottom: 10 }}>Customer Patterns</h1>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 30 }}>
        <input
          type="month"
          value={month}
          onChange={e => setMonth(e.target.value)}
          style={{ fontSize: 18, padding: 6, borderRadius: 8, border: '1px solid #ccc' }}
        />
      </div>

      <div style={{ display: "flex", gap: 20, justifyContent: "center", marginBottom: 30 }}>
        <div style={{ background: "#9C27B0", color: "#fff", padding: 16, borderRadius: 12, width: 220, textAlign: "center" }}>
          <h3>Current Entries</h3>
          <div style={{ fontSize: 28, fontWeight: "bold" }}>{sensorData.entries}</div>
          {sensorData.lastUpdate && <div style={{ fontSize: 12 }}></div>}
        </div>
        <div style={{ background: "#4CAF50", color: "#fff", padding: 16, borderRadius: 12, width: 220, textAlign: "center" }}>
          <h3>Current Exits</h3>
          <div style={{ fontSize: 28, fontWeight: "bold" }}>{sensorData.exits}</div>
          {sensorData.lastUpdate && <div style={{ fontSize: 12 }}></div>}
        </div>
        <div style={{ background: "#F44336", color: "#fff", padding: 16, borderRadius: 12, width: 220, textAlign: "center" }}>
          <h3>Currently Inside</h3>
          <div style={{ fontSize: 28, fontWeight: "bold" }}>{sensorData.entries - sensorData.exits}</div>
          <div style={{ fontSize: 12 }}>Live count</div>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "40px", justifyContent: "center", alignItems: "flex-start" }}>
        <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px #eee", padding: 24, width: 420 }}>
          <h3 style={{ textAlign: "center" }}>Hourly Pattern (Avg)</h3>
          <Bar data={hourlyData} options={{
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              x: { title: { display: true, text: "Hour" } },
              y: { title: { display: true, text: "Avg Purchases" }, beginAtZero: true }
            }
          }} />
        </div>
        <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px #eee", padding: 24, width: 420 }}>
          <h3 style={{ textAlign: "center" }}>Daily Pattern (Total)</h3>
          <Bar data={dailyData} options={{
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              x: { title: { display: true, text: "Day" } },
              y: { title: { display: true, text: "Total Purchases" }, beginAtZero: true }
            }
          }} />
        </div>
        <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px #eee", padding: 24, width: 420 }}>
          <h3 style={{ textAlign: "center" }}>Weekly Pattern (Total)</h3>
          <Bar data={weeklyData} options={{
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              x: { title: { display: true, text: "Week" } },
              y: { title: { display: true, text: "Total Purchases" }, beginAtZero: true }
            }
          }} />
        </div>
      </div>
    </div>
  );
}

export default CustomerPatterns;
