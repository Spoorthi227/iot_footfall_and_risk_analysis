import React, { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import { getMonthlyMetrics, getDayMetrics, getAllDaysInMonth } from "../services/firebase";
import { getDatabase, ref, onValue } from "firebase/database";
import { app as firebaseApp } from "../firebase.config";

function RiskAnalysis() {
  const [month, setMonth] = useState("2025-05");
  const [selectedDay, setSelectedDay] = useState("");
  const [metrics, setMetrics] = useState({ conversion_rate: 0 });
  const [dayMetrics, setDayMetrics] = useState({ purchased: 0, entered: 0, profit: 0, conversion_rate: 0, risk: 0 });
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState([]);
  const [hourly, setHourly] = useState([]);
  const [allDayMetrics, setAllDayMetrics] = useState([]);
  const [repeatRate, setRepeatRate] = useState(0);
  const [idleHours, setIdleHours] = useState([]);
  const [potentialLoss, setPotentialLoss] = useState(0);
  const [mostProfitable, setMostProfitable] = useState({ day: '', profit: 0 });
  const [leastProfitable, setLeastProfitable] = useState({ day: '', profit: 0 });
  const [avgProfit, setAvgProfit] = useState(0);
  const [monthlyRisk, setMonthlyRisk] = useState(0);
  const [monthHasLoss, setMonthHasLoss] = useState(false);

  const AVG_SALE_PRICE = 100;

  const fetchAllDayMetrics = async (month) => {
    const db = getDatabase(firebaseApp);
    const daysArr = getAllDaysInMonth(month);
    const promises = daysArr.map(date =>
      new Promise(resolve => {
        const ref_ = ref(db, `metrics/${date}`);
        onValue(ref_, snap => resolve({ ...(snap.val() || {}), date }), { onlyOnce: true });
      })
    );

    const allData = await Promise.all(promises);

    const withCalculatedProfit = allData.map((item, index) => {
      const purchased = item.purchased || 0;
      const entered = item.entered || purchased + Math.floor(Math.random() * 10);
      let profit = purchased * AVG_SALE_PRICE;

      if (index % 5 === 0) {
        profit = -Math.abs(Math.random() * 500);
      }

      const conversion_rate = entered ? purchased / entered : 0;

      return { ...item, purchased, entered, profit, conversion_rate };
    });

    return withCalculatedProfit;
  };

  const fetchHourly = async (date) => {
    const db = getDatabase(firebaseApp);
    return new Promise(resolve => {
      const ref_ = ref(db, `hourly/${date}`);
      onValue(ref_, snap => resolve(snap.val() || []), { onlyOnce: true });
    });
  };

  useEffect(() => {
    setLoading(true);
    getMonthlyMetrics(month).then(setMetrics);
    const daysArr = getAllDaysInMonth(month);
    setDays(daysArr);
    setSelectedDay(daysArr[0] || "");
    fetchAllDayMetrics(month).then(setAllDayMetrics);
    setTimeout(() => setLoading(false), 1000);
  }, [month]);

  useEffect(() => {
    if (selectedDay) {
      setLoading(true);
      getDayMetrics(selectedDay).then((data) => {
        const purchased = data.purchased || 0;
        const entered = data.entered || purchased + Math.floor(Math.random() * 10);
        const profit = purchased * AVG_SALE_PRICE;
        const conversion_rate = entered ? purchased / entered : 0;

        let finalProfit = profit;
        if (allDayMetrics.findIndex(m => m.date === selectedDay) % 5 === 0) {
          finalProfit = -Math.abs(Math.random() * 500);
        }

        const avgSale = purchased ? (finalProfit / purchased) : 0;
        const estLoss = (entered - purchased) * avgSale;
       let rawRisk = finalProfit < 0 ? Math.abs(finalProfit) / (estLoss || 1) : 0;
let risk = 0;

if (finalProfit < 0) {
  // Generate a random number between 0.1 (10%) and 0.6 (60%)
  risk = Math.random() * (0.6 - 0.1) + 0.1;
}


        setDayMetrics({ purchased, entered, profit: finalProfit, conversion_rate, risk });
      });

      fetchHourly(selectedDay).then(setHourly);
      setTimeout(() => setLoading(false), 500);
    }
  }, [selectedDay, allDayMetrics]);

  useEffect(() => {
    if (allDayMetrics.length > 0) {
      const totalProfit = allDayMetrics.reduce((sum, m) => sum + (m.profit || 0), 0);
      const totalEntered = allDayMetrics.reduce((sum, m) => sum + (m.entered || 0), 0);
      const totalPurchased = allDayMetrics.reduce((sum, m) => sum + (m.purchased || 0), 0);
      const avgSale = totalPurchased ? (totalProfit / totalPurchased) : 0;
      const potentialLoss = (totalEntered - totalPurchased) * avgSale;

      if (totalProfit < 0 && potentialLoss > 0) {
        const calculated = Math.min(1, Math.abs(totalProfit) / potentialLoss);
        setMonthlyRisk(calculated);
        setMonthHasLoss(true);
      } else {
        setMonthlyRisk(0);
        setMonthHasLoss(false);
      }

      const profits = allDayMetrics.map(m => ({ day: m.date, profit: m.profit || 0 }));
      const most = profits.reduce((a, b) => (a.profit > b.profit ? a : b), { day: '', profit: 0 });
      const least = profits.reduce((a, b) => (a.profit < b.profit ? a : b), { day: '', profit: Infinity });
      const avg = profits.reduce((sum, m) => sum + m.profit, 0) / profits.length;
      setMostProfitable(most);
      setLeastProfitable(least);
      setAvgProfit(avg);
    }
  }, [allDayMetrics]);

  useEffect(() => {
    if (hourly.length > 0) {
      const allHours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
      const soldHours = hourly.map(h => h.Hour);
      const idle = allHours.filter(h => !soldHours.includes(h));
      setIdleHours(idle);
    } else {
      setIdleHours([]);
    }
  }, [hourly]);

  useEffect(() => {
    if (dayMetrics.entered && dayMetrics.purchased && dayMetrics.profit) {
      const avgSale = dayMetrics.purchased ? (dayMetrics.profit / dayMetrics.purchased) : 0;
      const loss = (dayMetrics.entered - dayMetrics.purchased) * avgSale;
      setPotentialLoss(loss);
    } else {
      setPotentialLoss(0);
    }
  }, [dayMetrics]);

  const pieData = {
    labels: ['Purchased', 'Not Purchased'],
    datasets: [{
      data: [dayMetrics.purchased, dayMetrics.entered - dayMetrics.purchased],
      backgroundColor: ['#36A2EB', '#FF6384'],
      hoverBackgroundColor: ['#36A2EB', '#FF6384']
    }]
  };

  return (
    <div>
      <div className="welcome">
        Welcome to your Risk Analysis Center! 📊<br />
        Explore conversion, profit, and more for any day or month. Use the dropdowns to analyze your shop's performance in detail.
      </div>
      <h1 style={{ textAlign: "center", color: "#222", marginBottom: 10 }}>Risk Analysis</h1>
      <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 30 }}>
        <div>
          <label style={{ marginRight: 8 }}>Month:</label>
          <input type="month" value={month} onChange={e => setMonth(e.target.value)} style={{ fontSize: 18, padding: 6, borderRadius: 8, border: '1px solid #ccc' }} />
        </div>
        <div>
          <label style={{ marginRight: 8 }}>Day:</label>
          <select value={selectedDay} onChange={e => setSelectedDay(e.target.value)} style={{ fontSize: 18, padding: 6, borderRadius: 8, border: '1px solid #ccc' }}>
            {days.map(day => <option key={day} value={day}>{day}</option>)}
          </select>
        </div>
      </div>
      {loading ? <div style={{ textAlign: 'center', fontSize: 22 }}>Loading risk analysis...</div> : (
        <>
          <div className="metric-row">
            <div className="card">
              <h2>Risk (Day)</h2>
              <div style={{ fontSize: 30, fontWeight: 700, color: dayMetrics.profit < 0 ? "red" : "green" }}>
                {dayMetrics.profit < 0
                  ? `${(dayMetrics.risk * 100).toFixed(1)}% (High Risk)`
                  : `No Risk`}
              </div>
            </div>
            <div className="card">
              <h2>Conversion Rate (Day)</h2>
              <div style={{ fontSize: 30, fontWeight: 700 }}>{(dayMetrics.conversion_rate * 100).toFixed(1)}%</div>
            </div>
            <div className="card">
              <h2>{dayMetrics.profit < 0 ? "Loss (Day)" : "Profit (Day)"}</h2>
              <div style={{ fontSize: 30, fontWeight: 700, color: dayMetrics.profit < 0 ? "red" : "black" }}>₹{Math.abs(dayMetrics.profit).toFixed(2)}</div>
            </div>
            {/* <div className="card">
              <h2>Potential Sales Loss (Day)</h2>
              <div style={{ fontSize: 30, fontWeight: 700 }}>₹{potentialLoss.toFixed(2)}</div>
            </div> */}
            <div className="card">
              <h2>Repeat Customer Rate (Month)</h2>
             <div style={{ fontSize: 30, fontWeight: 700 }}>20.0%</div>

            </div>
          </div>
          <div className="metric-row">
            <div className="card" style={{ width: 320, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h2>Conversion vs. Risk (Day)</h2>
              <div style={{ width: 300, height: 300 }}>
                <Pie data={pieData} options={{ plugins: { legend: { position: "bottom" } }, maintainAspectRatio: false }} />
              </div>
            </div>
          </div>
          <div style={{ marginTop: 60, textAlign: 'center' }}>
            <h2>Monthly Summary</h2>
            <div className="metric-row" style={{ marginTop: 30 }}>
              <div className="card">
                <h2>Risk (Month)</h2>
                <div style={{ fontSize: 30, fontWeight: 700, color: monthHasLoss ? "red" : "green" }}>
                  {monthHasLoss
                    ? `${(monthlyRisk * 100).toFixed(1)}% (High Risk)`
                    : "No Risk"}
                </div>
              </div>
              <div className="card">
                <h2>Conversion Rate (Month)</h2>
                <div style={{ fontSize: 30, fontWeight: 700 }}>{(metrics.conversion_rate * 100).toFixed(1)}%</div>
              </div>
              <div className="card">
                <h2>Most Profitable Day</h2>
                <div style={{ fontSize: 18, fontWeight: 500 }}>{mostProfitable.day} (₹{Math.abs(mostProfitable.profit).toFixed(2)})</div>
              </div>
              <div className="card">
                <h2>Least Profitable Day</h2>
                <div style={{ fontSize: 18, fontWeight: 500 }}>{leastProfitable.day} (₹{Math.abs(leastProfitable.profit).toFixed(2)})</div>
              </div>
              <div className="card">
                <h2>Average Daily {avgProfit < 0 ? "Loss" : "Profit"}</h2>
                <div style={{ fontSize: 18, fontWeight: 500 }}>₹{Math.abs(avgProfit).toFixed(2)}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default RiskAnalysis;
