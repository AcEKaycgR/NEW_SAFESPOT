import joblib
import pandas as pd

model = joblib.load("./models/tourist_safety_rf_v1.joblib")

new_data = pd.DataFrame([{
    "latitude": 27.1751,
    "longitude": 78.0421,
    "avg_safe_time": 2.5,
    "current_spent_time": 3.0
}])

def predict_data(data):
    prediction = model.predict(data)
    return prediction[0]

predict_data(new_data)