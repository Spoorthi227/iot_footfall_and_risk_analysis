from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import firebase_admin
from firebase_admin import credentials, db
from firebase_admin.auth import verify_id_token
from firebase_admin import auth
from functools import wraps

app = Flask(__name__)
CORS(app)

# Initialize Firebase Admin
try:
    cred = credentials.Certificate('serviceAccountKey.json')
    firebase_admin.initialize_app(cred, {
        'databaseURL': 'https://iot-monitoring-system-3ec93-default-rtdb.firebaseio.com'
    })
    print("Firebase initialized successfully!")
except Exception as e:
    print(f"Error initializing Firebase: {str(e)}")

CUSTOMER_COUNT = 175
DATE = "2025-05-01"

@app.route('/')
def home():
    return jsonify({
        "message": "Server is running",
        "available_endpoints": [
            "GET /",
            "GET /test",
            "GET /api/metrics",
            "GET /api/hourly"
        ]
    }), 200

@app.route('/test')
def test():
    try:
        # Test Firebase connection
        ref = db.reference('test')
        ref.set({'test': 'success'})
        return jsonify({
            "message": "Test endpoint working",
            "server_status": "OK",
            "firebase_status": "Connected",
            "database_url": 'https://iot-monitoring-system-3ec93-default-rtdb.firebaseio.com'
        }), 200
    except Exception as e:
        return jsonify({
            "message": "Test endpoint working",
            "server_status": "OK",
            "firebase_error": str(e)
        }), 200

@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    try:
        df = pd.read_csv('customer_data1.csv')
        purchased = len(df[df['PurchaseDate'] == DATE])
        profit = df[df['PurchaseDate'] == DATE]['PurchaseAmount'].sum()
        conversion_rate = purchased / CUSTOMER_COUNT if CUSTOMER_COUNT else 0
        risk = 1 - conversion_rate
        
        metrics = {
            'date': DATE,
            'entered': CUSTOMER_COUNT,
            'purchased': purchased,
            'profit': profit,
            'conversion_rate': conversion_rate,
            'risk': risk
        }
        
        # Update Firebase with error handling
        try:
            ref = db.reference('metrics')
            ref.child(DATE).set(metrics)
            print(f"Successfully wrote metrics to Firebase for date {DATE}")
        except Exception as e:
            print(f"Error writing to Firebase: {str(e)}")
        
        return jsonify(metrics)
    except Exception as e:
        print(f"Error in metrics endpoint: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/hourly', methods=['GET'])
def get_hourly():
    try:
        df = pd.read_csv('customer_data1.csv')
        df = df[df['PurchaseDate'] == DATE]
        df['Hour'] = df['PurchaseTime'].str.slice(0,2)
        hourly_counts = df.groupby('Hour').size().reset_index(name='count')
        hourly_counts = hourly_counts.sort_values('Hour')
        
        # Convert to list of dicts for Firebase
        hourly_data = hourly_counts.to_dict(orient='records')
        
        # Update Firebase
        ref = db.reference('hourly')
        ref.child(DATE).set(hourly_data)
        
        return jsonify(hourly_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/update_metrics', methods=['POST'])
def update_metrics():
    try:
        data = request.json
        ref = db.reference('metrics')
        ref.child(DATE).update(data)
        
        return jsonify({"message": "Data updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/populate_all_days', methods=['POST'])
def populate_all_days():
    try:
        df = pd.read_csv('customer_data1.csv')
        all_dates = df['PurchaseDate'].unique()
        for date in all_dates:
            day_df = df[df['PurchaseDate'] == date]
            purchased = len(day_df)
            profit = day_df['PurchaseAmount'].sum()
            conversion_rate = purchased / CUSTOMER_COUNT if CUSTOMER_COUNT else 0
            risk = 1 - conversion_rate

            metrics = {
                'date': date,
                'entered': CUSTOMER_COUNT,
                'purchased': purchased,
                'profit': profit,
                'conversion_rate': conversion_rate,
                'risk': risk
            }
            ref = db.reference('metrics')
            ref.child(date).set(metrics)

            # Hourly
            day_df['Hour'] = day_df['PurchaseTime'].str.slice(0,2)
            hourly_counts = day_df.groupby('Hour').size().reset_index(name='count')
            hourly_counts = hourly_counts.sort_values('Hour')
            hourly_data = hourly_counts.to_dict(orient='records')
            ref_hourly = db.reference('hourly')
            ref_hourly.child(date).set(hourly_data)
        return jsonify({'message': 'All days populated successfully', 'dates': list(all_dates)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=8000)