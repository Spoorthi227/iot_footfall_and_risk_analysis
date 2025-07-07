import firebase_admin
from firebase_admin import credentials, db

# Initialize Firebase Admin with your service account
cred = credentials.Certificate('serviceAccountKey.json')
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://iot-monitoring-system-3ec93-default-rtdb.firebaseio.com'
})

def update_metrics(metrics_data):
    """
    Update metrics in Firebase Realtime Database
    """
    ref = db.reference('metrics')
    ref.child(metrics_data['date']).set({
        'entered': metrics_data['entered'],
        'purchased': metrics_data['purchased'],
        'profit': metrics_data['profit'],
        'conversion_rate': metrics_data['conversion_rate'],
        'risk': metrics_data['risk']
    })

def update_hourly_data(date, hourly_data):
    """
    Update hourly data in Firebase Realtime Database
    """
    ref = db.reference('hourly')
    ref.child(date).set(hourly_data) 