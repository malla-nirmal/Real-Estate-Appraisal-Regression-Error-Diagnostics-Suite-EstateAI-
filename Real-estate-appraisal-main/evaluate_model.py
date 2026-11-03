import joblib
import json
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import numpy as np

def evaluate():
    print("Loading model and data...")
    model = joblib.load('model/house_price_model.joblib')
    
    with open('model/model_metadata.json', 'r') as f:
        metadata = json.load(f)
        
    features = metadata['selected_features']
    
    df = pd.read_csv('data/train.csv')
    df = df.replace('NA', np.nan)
    
    X = df[features]
    y = df['SalePrice']
    
    print("Evaluating full dataset...")
    y_pred = model.predict(X)
    
    mae = mean_absolute_error(y, y_pred)
    rmse = np.sqrt(mean_squared_error(y, y_pred))
    r2 = r2_score(y, y_pred)
    
    print(f"Full Dataset MAE:  {mae:.2f}")
    print(f"Full Dataset RMSE: {rmse:.2f}")
    print(f"Full Dataset R2:   {r2:.4f}")

if __name__ == "__main__":
    evaluate()
