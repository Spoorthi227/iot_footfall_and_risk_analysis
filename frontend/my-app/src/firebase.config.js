// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyAUJ-ZN5o_x2fQhhwGY9brz5OntBkyb1ZE",
  authDomain: "iot-monitoring-system-3ec93.firebaseapp.com",
  databaseURL: "https://iot-monitoring-system-3ec93-default-rtdb.firebaseio.com",
  projectId: "iot-monitoring-system-3ec93",
  storageBucket: "iot-monitoring-system-3ec93.firebasestorage.app",
  messagingSenderId: "305893726395",
  appId: "1:305893726395:web:4969a268c7ebd07d45319e",
  measurementId: "G-G3PKR2NJHH"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);