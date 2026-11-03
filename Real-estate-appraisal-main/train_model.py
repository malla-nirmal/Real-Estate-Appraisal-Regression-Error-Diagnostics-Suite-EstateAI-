import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import json
import os

def main():
    os.makedirs('model', exist_ok=True)
    print("Loading data...")
    df = pd.read_csv('data/train.csv')
    df = df.replace('NA', np.nan)
    print(f"Dataset shape: {df.shape}")

    features = [
        'OverallQual', 'OverallCond', 'GrLivArea', 'YearBuilt', 'YearRemodAdd',
        'TotalBsmtSF', '1stFlrSF', '2ndFlrSF', 'FullBath', 'HalfBath',
        'BedroomAbvGr', 'KitchenQual', 'GarageCars', 'GarageArea',
        'Neighborhood', 'HouseStyle', 'CentralAir', 'Fireplaces', 'LotArea'
    ]
    target = 'SalePrice'

    numeric_features = [
        'OverallQual', 'OverallCond', 'GrLivArea', 'YearBuilt', 'YearRemodAdd',
        'TotalBsmtSF', '1stFlrSF', '2ndFlrSF', 'FullBath', 'HalfBath',
        'BedroomAbvGr', 'GarageCars', 'GarageArea', 'Fireplaces', 'LotArea'
    ]
    categorical_features = ['KitchenQual', 'Neighborhood', 'HouseStyle', 'CentralAir']

    X = df[features].copy()
    y = df[target]

    for col in numeric_features:
        X[col] = pd.to_numeric(X[col], errors='coerce')

    print(f"Selected {len(features)} features for deployment.")

    # Preprocessing
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])
    preprocessor = ColumnTransformer(transformers=[
        ('num', numeric_transformer, numeric_features),
        ('cat', categorical_transformer, categorical_features)
    ])

    model_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', Ridge(alpha=1.0))
    ])

    splits = {
        "80_20": {"test_size": 0.20, "random_state": 42},
        "75_25": {"test_size": 0.25, "random_state": 42},
        "70_30": {"test_size": 0.30, "random_state": 42}
    }

    evaluation_metrics = {}
    diagnostic_data = {}

    for split_name, params in splits.items():
        print(f"Training and evaluating {split_name} split...")
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=params["test_size"], random_state=params["random_state"]
        )

        model_pipeline.fit(X_train, y_train)
        y_pred = np.array(model_pipeline.predict(X_test))

        mae  = float(mean_absolute_error(y_test, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
        r2   = float(r2_score(y_test, y_pred))

        evaluation_metrics[split_name] = {"mae": mae, "rmse": rmse, "r2": r2}

        if split_name == "80_20":
            errors = (y_test - y_pred).tolist()
            # Save 150 points for scatter plot, ALL errors for residual histogram
            diagnostic_data = {
                "actual":    y_test.tolist()[:150],
                "predicted": y_pred.tolist()[:150],
                "error":     errors[:150],
                "all_errors": errors   # full list for residual histogram
            }
            joblib.dump(model_pipeline, 'model/house_price_model.joblib')
            print("Saved final deployment model (80/20 split).")

    with open('model/evaluation_metrics.json', 'w') as f:
        json.dump(evaluation_metrics, f, indent=4)

    with open('model/diagnostic_data.json', 'w') as f:
        json.dump(diagnostic_data, f, indent=4)

    # Price stats for context (low/mid/high)
    price_stats = {
        "min":    float(y.min()),
        "max":    float(y.max()),
        "mean":   float(y.mean()),
        "median": float(y.median()),
        "p25":    float(y.quantile(0.25)),
        "p75":    float(y.quantile(0.75)),
    }

    metadata = {
        "dataset_rows": int(df.shape[0]),
        "total_features": int(df.shape[1] - 1),
        "selected_features": features,
        "model_name": "Ridge Regression",
        "training_configuration": "Pipeline(SimpleImputer -> Scaler/Encoder -> Ridge alpha=1.0)",
        "random_state": 42,
        "price_stats": price_stats
    }
    with open('model/model_metadata.json', 'w') as f:
        json.dump(metadata, f, indent=4)

    print("\n" + "="*50)
    print("TRAINING COMPLETE")
    print("="*50)
    print(f"\n80/20 Split Results:")
    print(f"  MAE  : ${evaluation_metrics['80_20']['mae']:,.2f}")
    print(f"  RMSE : ${evaluation_metrics['80_20']['rmse']:,.2f}")
    print(f"  R²   : {evaluation_metrics['80_20']['r2']:.4f}  ({evaluation_metrics['80_20']['r2']*100:.2f}% variance explained)")
    print(f"\nPrice stats saved (p25=${price_stats['p25']:,.0f}, median=${price_stats['median']:,.0f}, p75=${price_stats['p75']:,.0f})")
    print("\nArtifacts saved to model/")

if __name__ == '__main__':
    main()
