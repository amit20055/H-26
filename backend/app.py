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
CSV_PATH = "water_leak_detection_1000_rows.csv"
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
            confidence = 38.5 if is_anomaly else 97.4
            
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
            
        time.sleep(5)

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

@app.route('/api/trigger-email', methods=['POST'])
def trigger_email():
    """Endpoint triggered by frontend to physically send email alerts."""
    from flask import request
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    data = request.json
    zone = data.get('zone', 'Unknown Zone')
    recipient = data.get('recipient')
    pressure = data.get('pressure', 0)
    flow = data.get('flow', 0)
    location = data.get('location', 'N/A')

    if not recipient:
        return jsonify({"status": "error", "message": "No recipient provided"}), 400

    # =========================================================================
    # USER: TO ACTUALLY SEND REAL EMAILS, FILL IN YOUR GMAIL CREDENTIALS HERE
    # Generate a 16-character 'App Password' from Google Account Settings!
    # =========================================================================
    SENDER_EMAIL = ""      # e.g., "your.email@gmail.com"
    SENDER_PASSWORD = ""   # e.g., "abcd efgh ijkl mnop"

    if not SENDER_EMAIL or not SENDER_PASSWORD:
        print(f"[MAIL MOCK] Would have sent email to {recipient} for {zone}. Configure SMTP to send real emails.")
        return jsonify({"status": "success", "message": "Credentials missing, email mock logged"}), 200

    try:
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = recipient
        msg['Subject'] = f"CRITICAL: Pipeline Anomaly Detected in {zone}"

        body = f"""
        Alert details:
        - Zone: {zone}
        - Pressure: {pressure} Bar
        - Flow Rate: {flow} L/s
        - Live Location Coordinates: {location}
        
        Please inspect immediately.
        """
        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        print(f"[MAIL SUCCESS] Real email dispatched to {recipient}")
        return jsonify({"status": "success", "message": "Email sent"}), 200
    except Exception as e:
        print(f"[MAIL ERROR] Failed to send email: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500
import os

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=False)
