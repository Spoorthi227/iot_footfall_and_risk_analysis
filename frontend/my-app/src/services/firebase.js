import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";

// Your existing Firebase config (for metrics and hourly data)
const mainFirebaseConfig = {
  apiKey: "AIzaSyAUJ-ZN5o_x2fQhhwGY9brz5OntBkyb1ZE",
  authDomain: "iot-monitoring-system-3ec93.firebaseapp.com",
  databaseURL: "https://iot-monitoring-system-3ec93-default-rtdb.firebaseio.com",
  projectId: "iot-monitoring-system-3ec93",
  storageBucket: "iot-monitoring-system-3ec93.firebasestorage.app",
  messagingSenderId: "305893726395",
  appId: "1:305893726395:web:4969a268c7ebd07d45319e",
  measurementId: "G-G3PKR2NJHH"
};

//  Firebase config for sensor data
const sensorFirebaseConfig = {
  apiKey: "AIzaSyDhQnLokinGKaaiL-d0lw9Z7LzFsIeiIkw", // <-- get this from your Firebase project settings
  authDomain: "footfall-a1a59.firebaseapp.com",
  databaseURL: "https://footfall-a1a59-default-rtdb.firebaseio.com",
  projectId: "footfall-a1a59",
  storageBucket: "footfall-a1a59.appspot.com",
  messagingSenderId: "1055713458644",
  appId: "1:1055713458644:web:be65b688ed807ba14afe41",
  measurementId: "G-HQ4RYM2JC8"
};

// Guard main app initialization
const mainApp = getApps().find(app => app.name === "[DEFAULT]") || initializeApp(mainFirebaseConfig);
// Guard sensor app initialization
const sensorApp = getApps().find(app => app.name === "sensor-app") || initializeApp(sensorFirebaseConfig, "sensor-app");

const mainDb = getDatabase(mainApp);
const sensorDb = getDatabase(sensorApp);

console.log('Main Firebase initialized with URL:', mainFirebaseConfig.databaseURL);
console.log('Sensor Firebase initialized with URL:', sensorFirebaseConfig.databaseURL);

export const subscribeToMetrics = (date, callback) => {
  console.log('Subscribing to metrics for date:', date);
  const metricsRef = ref(mainDb, `metrics/${date}`);
  
  return onValue(metricsRef, (snapshot) => {
    console.log('Raw metrics snapshot:', snapshot.val());
    const data = snapshot.val();
    if (data) {
      console.log('Valid metrics data received:', data);
      callback(data);
    } else {
      console.error('No metrics data available for date:', date);
    }
  }, (error) => {
    console.error('Error in metrics subscription:', error);
  });
};

export const subscribeToHourly = (date, callback) => {
  console.log('Subscribing to hourly for date:', date);
  const hourlyRef = ref(mainDb, `hourly/${date}`);
  
  return onValue(hourlyRef, (snapshot) => {
    console.log('Raw hourly snapshot:', snapshot.val());
    const data = snapshot.val();
    if (data) {
      console.log('Valid hourly data received:', data);
      callback(data);
    } else {
      console.error('No hourly data available for date:', date);
    }
  }, (error) => {
    console.error('Error in hourly subscription:', error);
  });
};

export const subscribeToSensorData = (callback) => {
  console.log('Subscribing to sensor data');
  
  // Force a fresh connection by creating a new reference
  const sensorRef = ref(sensorDb, 'footfall_counts');
  
  // Add a one-time listener first to get current data
  const getCurrentData = () => {
    return new Promise((resolve) => {
      const currentRef = ref(sensorDb, 'footfall_counts');
      onValue(currentRef, (snapshot) => {
        console.log('CURRENT DATA CHECK:', snapshot.val());
        resolve(snapshot.val());
      }, { onlyOnce: true });
    });
  };

  // Get current data first
  getCurrentData().then(currentData => {
    console.log('Initial data fetch:', currentData);
    if (currentData) {
      const transformedData = {
        entries: currentData.entry || currentData.entries || 0,
        exits: currentData.exit || currentData.exits || 0,
        lastUpdate: currentData.timestamp || new Date().toISOString()
      };
      console.log('Initial transformed data:', transformedData);
      callback(transformedData);
    }
  });

  // Set up real-time listener
  const unsubscribe = onValue(sensorRef, (snapshot) => {
    const data = snapshot.val();
    console.log('REAL-TIME UPDATE - Raw sensor data:', data);
    console.log('REAL-TIME UPDATE - Snapshot key:', snapshot.key);
    console.log('REAL-TIME UPDATE - Snapshot ref:', snapshot.ref.toString());

    if (data) {
      const transformedData = {
        entries: data.entry || data.entries || 0,
        exits: data.exit || data.exits || 0,
        lastUpdate: data.timestamp || new Date().toISOString()
      };
      console.log('REAL-TIME UPDATE - Transformed sensor data:', transformedData);
      callback(transformedData);
    } else {
      console.warn('REAL-TIME UPDATE - No data received from Firebase');
      callback({
        entries: 0,
        exits: 0,
        lastUpdate: new Date().toISOString()
      });
    }
  }, (error) => {
    console.error('Error in sensor subscription:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    callback({
      entries: 0,
      exits: 0,
      lastUpdate: new Date().toISOString()
    });
  });

  return unsubscribe;
};

// Helper: get all days in a month as YYYY-MM-DD
function getAllDaysInMonth(month) {
  const [year, m] = month.split('-');
  const days = new Date(year, m, 0).getDate();
  return Array.from({length: days}, (_, i) => `${month}-${String(i+1).padStart(2, '0')}`);
}

// Fetch hourly data for all days in a month and compute average per hour
export async function getMonthlyHourlyData(month) {
  const days = getAllDaysInMonth(month);
  const promises = days.map(date =>
    new Promise(resolve => {
      const ref_ = ref(mainDb, `hourly/${date}`);
      onValue(ref_, snap => resolve(snap.val() || []), { onlyOnce: true });
    })
  );
  const allHourly = await Promise.all(promises);
  // allHourly: array of arrays of {Hour, count}
  const hourTotals = Array(24).fill(0);
  let dayCount = 0;
  allHourly.forEach(dayArr => {
    if (Array.isArray(dayArr) && dayArr.length > 0) {
      dayCount++;
      dayArr.forEach(({Hour, count}) => {
        const h = parseInt(Hour, 10);
        if (!isNaN(h)) hourTotals[h] += count;
      });
    }
  });
  return hourTotals.map(total => dayCount ? total / dayCount : 0);
}

// Fetch daily data for all days in a month and compute average per day
export async function getMonthlyDailyData(month) {
  const days = getAllDaysInMonth(month);
  const promises = days.map(date =>
    new Promise(resolve => {
      const ref_ = ref(mainDb, `metrics/${date}`);
      onValue(ref_, snap => resolve(snap.val() || {}), { onlyOnce: true });
    })
  );
  const allMetrics = await Promise.all(promises);
  // allMetrics: array of {purchased}
  return allMetrics.map(m => m.purchased || 0);
}

// Fetch monthly metrics (sum/avg for the month)
export async function getMonthlyMetrics(month) {
  const days = getAllDaysInMonth(month);
  const promises = days.map(date =>
    new Promise(resolve => {
      const ref_ = ref(mainDb, `metrics/${date}`);
      onValue(ref_, snap => resolve(snap.val() || {}), { onlyOnce: true });
    })
  );
  const allMetrics = await Promise.all(promises);
  let totalPurchased = 0, totalEntered = 0, totalProfit = 0, count = 0;
  allMetrics.forEach(m => {
    if (m && typeof m.purchased === 'number') {
      totalPurchased += m.purchased;
      totalEntered += m.entered || 0;
      totalProfit += m.profit || 0;
      count++;
    }
  });
  const avgRisk = count ? 1 - (totalPurchased / (totalEntered || 1)) : 0;
  const avgConversion = count ? (totalPurchased / (totalEntered || 1)) : 0;
  return {
    risk: avgRisk,
    conversion_rate: avgConversion,
    profit: totalProfit,
    purchased: totalPurchased,
    entered: totalEntered
  };
}

// Fetch daily totals for a month (array of purchases per day)
export async function getMonthlyDailyTotals(month) {
  const days = getAllDaysInMonth(month);
  const promises = days.map(date =>
    new Promise(resolve => {
      const ref_ = ref(mainDb, `metrics/${date}`);
      onValue(ref_, snap => resolve(snap.val() || {}), { onlyOnce: true });
    })
  );
  const allMetrics = await Promise.all(promises);
  return allMetrics.map(m => m.purchased || 0);
}

// Fetch weekly totals for a month (array of purchases per week)
export async function getMonthlyWeeklyTotals(month) {
  const dailyTotals = await getMonthlyDailyTotals(month);
  const weeks = [];
  for (let i = 0; i < dailyTotals.length; i += 7) {
    weeks.push(dailyTotals.slice(i, i + 7).reduce((a, b) => a + b, 0));
  }
  return weeks;
}

// Fetch metrics for a specific day
export async function getDayMetrics(date) {
  return new Promise(resolve => {
    const ref_ = ref(mainDb, `metrics/${date}`);
    onValue(ref_, snap => {
      const m = snap.val() || {};
      const risk = m.entered ? 1 - (m.purchased / m.entered) : 0;
      const conversion_rate = m.entered ? (m.purchased / m.entered) : 0;
      resolve({
        ...m,
        risk,
        conversion_rate
      });
    }, { onlyOnce: true });
  });
}

// Test function to directly read current data
export const testDirectRead = () => {
  console.log('=== TESTING DIRECT READ ===');
  const testRef = ref(sensorDb, 'footfall_counts');
  
  onValue(testRef, (snapshot) => {
    console.log('DIRECT READ RESULT:', snapshot.val());
    console.log('DIRECT READ PATH:', snapshot.ref.toString());
    console.log('DIRECT READ EXISTS:', snapshot.exists());
  }, { onlyOnce: true });
};

// Export getAllDaysInMonth for use in components
export { getAllDaysInMonth };