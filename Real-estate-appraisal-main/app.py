from flask import Flask, render_template, request, jsonify
import joblib
import pandas as pd
import numpy as np
import json
import os

app = Flask(__name__)

MODEL_PATH = 'model/house_price_model.joblib'
METRICS_PATH = 'model/evaluation_metrics.json'
DIAGNOSTIC_PATH = 'model/diagnostic_data.json'
METADATA_PATH = 'model/model_metadata.json'

model = None
metrics = {}
diagnostics = {}
metadata = {}

NUMERIC_FEATURES = [
    'OverallQual', 'OverallCond', 'GrLivArea', 'YearBuilt', 'YearRemodAdd',
    'TotalBsmtSF', '1stFlrSF', '2ndFlrSF', 'FullBath', 'HalfBath',
    'BedroomAbvGr', 'GarageCars', 'GarageArea', 'Fireplaces', 'LotArea'
]

def load_artifacts():
    global model, metrics, diagnostics, metadata
    try:
        model = joblib.load(MODEL_PATH)
        with open(METRICS_PATH, 'r') as f:
            metrics = json.load(f)
        with open(DIAGNOSTIC_PATH, 'r') as f:
            diagnostics = json.load(f)
        with open(METADATA_PATH, 'r') as f:
            metadata = json.load(f)
        print("Artifacts loaded successfully.")
    except Exception as e:
        print(f"Error loading artifacts: {e}")

load_artifacts()


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/diagnostics')
def diagnostics_page():
    return render_template('diagnostics.html')


@app.route('/api/metrics')
def api_metrics():
    if not metrics:
        return jsonify({"error": "Metrics not found. Run train_model.py first."}), 404

    # Compute residual stats from saved diagnostic data
    residual_stats = {}
    if diagnostics and 'error' in diagnostics:
        errors = diagnostics['error']
        residual_stats = {
            "mae_residual": float(np.mean(np.abs(errors))),
            "std_residual": float(np.std(errors)),
            "median_error": float(np.median(errors)),
            "p25_error": float(np.percentile(np.abs(errors), 25)),
            "p75_error": float(np.percentile(np.abs(errors), 75)),
        }

    return jsonify({
        "metrics": metrics,
        "diagnostics": diagnostics,
        "metadata": metadata,
        "residual_stats": residual_stats
    })


@app.route('/api/predict', methods=['POST'])
def predict():
    if not model:
        return jsonify({"error": "Model not loaded. Check server logs."}), 500

    try:
        data = request.json
        features = metadata.get('selected_features', [])

        input_data = {}
        for feature in features:
            if feature not in data:
                return jsonify({"error": f"Missing required field: {feature}"}), 400
            val = data[feature]
            if isinstance(val, (int, float)) and val < 0:
                return jsonify({"error": f"'{feature}' cannot be negative."}), 400
            input_data[feature] = [val]

        df_input = pd.DataFrame(input_data)
        for col in NUMERIC_FEATURES:
            if col in df_input.columns:
                df_input[col] = pd.to_numeric(df_input[col], errors='coerce')

        predicted_price = float(model.predict(df_input)[0])

        # Compute error range from 80/20 split MAE (the deployment split)
        mae = metrics.get('80_20', {}).get('mae', 0)

        # Compute price percentile context using training data stats from metadata
        price_stats = metadata.get('price_stats', {})
        context = "mid-range"
        if price_stats:
            p25 = price_stats.get('p25', 0)
            p75 = price_stats.get('p75', 0)
            if predicted_price < p25:
                context = "below average"
            elif predicted_price > p75:
                context = "above average"

        return jsonify({
            "predicted_price": round(predicted_price, 2),
            "currency": "USD",
            "price_range_low": round(predicted_price - mae, 2),
            "price_range_high": round(predicted_price + mae, 2),
            "typical_error": round(mae, 2),
            "price_context": context,
            "input_summary": data  # echo back for display
        })

    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500


@app.route('/api/health')
def health():
    status = "healthy" if model else "degraded"
    return jsonify({"status": status})


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
