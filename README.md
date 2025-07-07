# IOT based footfall and risk analysis system

This project presents a smart IoT-based system designed to help businesses monitor customer traffic, analyze risk, and make informed decisions. It uses **ESP32 sensors** to track entry and exit counts in real time, stores the data in **Firebase**, and displays trends and alerts through a **web-based dashboard**.

---

## Project Highlights

- Real-time footfall tracking using ESP32 and infrared sensors  
- Data stored and managed through Firebase Realtime Database  
- Visual representation of traffic data using Chart.js on a web dashboard  
- Risk alerts triggered when predefined footfall thresholds are crossed  
- Helps in identifying peak hours and optimizing staff deployment  
- Supports both large multi-section stores and small single-door outlets  

---

## Technology Stack

- **Hardware**: ESP32 microcontroller  
- **Backend**: Firebase Realtime Database  
- **Development Tools**: Arduino IDE  
- **Frontend**: HTML, JavaScript  
- **Visualization**: Chart.js  

---

## How It Works

1. ESP32 collects entry and exit data through connected sensors.  
2. The device sends real-time updates to Firebase.  
3. A web dashboard fetches the data and displays:
   - Live visitor count  
   - Hourly and weekly traffic trends  
   - Risk levels based on dynamic thresholds  
4. When risk conditions are met (e.g., too many people in a short time), alerts are triggered.

---

##  Business Impact

This system is especially useful for businesses aiming to:

- Track visitor flow patterns over time  
- Understand buyer-to-visitor ratios  
- Improve sales and staffing strategies  
- Detect early indicators of potential revenue loss or safety risks  
- Make long-term operational decisions based on real-time data  
