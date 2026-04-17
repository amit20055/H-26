import os
import pandas as pd
from sklearn.ensemble import IsolationForest

class LeakDetector:
    def __init__(self, data_path):
        self.model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
        self.ready = False
        self._train(data_path)

    def _train(self, data_path):
        if not os.path.exists(data_path):
            print(f"Warning: Dataset not found at {data_path}. Model not trained.")
            return

        try:
            df = pd.read_csv(data_path)
            # Use Pressure and Flow Rate for training
            features = ['Pressure (bar)', 'Flow Rate (L/s)']
            
            # Check if columns exist
            if not all(col in df.columns for col in features):
                print("Warning: Missing required columns in dataset.")
                return

            X = df[features].dropna()
            self.model.fit(X)
            self.ready = True
            print("LeakDetector model successfully trained on the dataset.")
        except Exception as e:
            print(f"Error training the model: {e}")

    def predict(self, pressure, flow_rate):
        if not self.ready:
            return False # Default to normal if model is not ready
        
        # Prediction returns -1 for outliers (anomalies) and 1 for inliers (normal)
        # Use a DataFrame to avoid feature name warnings
        df_input = pd.DataFrame([[pressure, flow_rate]], columns=['Pressure (bar)', 'Flow Rate (L/s)'])
        prediction = self.model.predict(df_input)
        return prediction[0] == -1
