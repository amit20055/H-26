import time
import random
import threading
from collections import deque
from flask import Flask, jsonify
from flask_cors import CORS
from model import LeakDetector

app = Flask(__name__)
CORS(app)

# Load the ML Model synchronously on startup
CSV_PATH = "../water_leak_detection_1000_rows.csv"
detector = LeakDetector(CSV_PATH)

# Zones Config
ZONES = ["Zone A", "Zone B", "Zone C", "Zone D", "Zone E"]

# We'll store history for the charts and logs. Let's keep the last 100 entries per zone.
HISTORY_LIMIT = 100
history_data = {zone: deque(maxlen=HISTORY_LIMIT) for zone in ZONES}

# Latest snapshot of data
latest_data = {zone: {} for zone in ZONES}

def generate_sensor_data(zone):
    """Simulates realistic pressure and flow rate."""
    # Normal ranges: pressure 2.4–3.4 bar, flow 80–125 L/s
    base_pressure = random.uniform(2.4, 3.4)
    base_flow = random.uniform(80, 125)
    
    is_simulated_anomaly = False
    
    # ~1% chance to inject an anomaly (burst or blockage)
    if random.random() < 0.01:
        is_simulated_anomaly = True
        # High pressure spike + flow drop
        base_pressure = random.uniform(4.2, 4.8)
        base_flow = random.uniform(20, 35)

    return base_pressure, base_flow, is_simulated_anomaly

def simulation_loop():
    """Background thread that generates data every second."""
    event_id = 1
    while True:
        timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
        for zone in ZONES:
            p, f, sim_anomaly = generate_sensor_data(zone)
            
            # Predict using our Isolation Forest model
            is_anomaly = detector.predict(p, f)
            
            # Calculate a mock confidence score
            confidence = round(random.uniform(30, 45), 1) if is_anomaly else round(random.uniform(95, 99), 1)
            
            data_point = {
                "id": event_id,
                "timestamp": timestamp,
                "zone": zone,
                "pressure": round(p, 2),
                "flow_rate": round(f, 2),
                "is_anomaly": bool(is_anomaly),
                "confidence": confidence
            }
            
            # Update state
            history_data[zone].append(data_point)
            latest_data[zone] = data_point
            event_id += 1
            
        time.sleep(1)

# Start background thread
thread = threading.Thread(target=simulation_loop, daemon=True)
thread.start()

@app.route('/api/data', methods=['GET'])
def get_latest_data():
    """Returns the latest sensor readings for all zones."""
    return jsonify(latest_data)

@app.route('/api/history', methods=['GET'])
def get_history():
    """Returns the history logs for all zones."""
    # Convert deque to a flat list ordered from oldest to newest
    all_history = []
    for zone in ZONES:
        all_history.extend(list(history_data[zone]))
    
    # Sort by ID or Timestamp
    all_history.sort(key=lambda x: x['id'])
    return jsonify(all_history)

if __name__ == '__main__':
    app.run(port=5000, debug=False, use_reloader=False)
