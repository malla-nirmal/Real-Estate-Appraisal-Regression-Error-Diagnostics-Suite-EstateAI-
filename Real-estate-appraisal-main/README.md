# EstateAI - Real Estate Appraisal Regression & Error Diagnostics Suite

## Project Overview
EstateAI is a machine learning web application that predicts property prices based on the Kaggle Ames Housing dataset. It demonstrates a complete machine learning workflow from data preprocessing to web deployment, along with a comprehensive Error Diagnostics Suite to evaluate model reliability.

## Problem Statement
A model can appear to perform well using a single metric while still making significant errors on expensive properties. Therefore, this project provides a predicted house price alongside an Error Diagnostics Suite that evaluates the model using MAE, RMSE, and R² across multiple train/test splits, giving the user a complete understanding of model performance.

## Objectives
- Predict the estimated sale price of a house using property information.
- Evaluate and explain model reliability.
- Demonstrate proper data preprocessing and leakage prevention.

## Dataset
Uses the original `train.csv` (1460 rows, 81 columns) from Kaggle's "House Prices - Advanced Regression Techniques". 
Target column: `SalePrice`. The `Id` column has been excluded from features as it is an identifier.

## Machine Learning Workflow
1. **Data Inspection**: `explore_data.py` & Jupyter notebook.
2. **Preprocessing**: Handled inside an sklearn `Pipeline` using `ColumnTransformer`.
   - Numeric features: `SimpleImputer(median)` + `StandardScaler`
   - Categorical features: `SimpleImputer(most_frequent)` + `OneHotEncoder`
3. **Data Leakage Prevention**: Preprocessing is fitted *only* on training splits, ensuring no target information or unseen distributions influence the transformation.
4. **Model**: `Ridge` Regression (with regularisation) is used as it handles the large amount of one-hot encoded features efficiently.
5. **Evaluation**: Conducted on 80/20, 75/25, and 70/30 splits.

## Evaluation Metrics
- **MAE** (Mean Absolute Error): The average absolute difference between the actual and predicted house prices.
- **RMSE** (Root Mean Squared Error): Penalizes large prediction errors more strongly than MAE.
- **R²** (R-squared): Measures how much of the variation in house prices is explained by the model.

## Project Structure
```
real-estate-appraisal/
├── app.py                   # Flask Web Server
├── train_model.py           # ML Pipeline Training Script
├── evaluate_model.py        # Model Evaluation Script
├── requirements.txt         # Dependencies
├── README.md                # Documentation
├── .gitignore
├── data/
│   └── train.csv            # Original Ames Housing Dataset
├── model/
│   ├── house_price_model.joblib
│   ├── evaluation_metrics.json
│   ├── model_metadata.json
│   └── diagnostic_data.json
├── templates/
│   ├── index.html           # Prediction UI
│   └── diagnostics.html     # Diagnostics UI
├── static/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
└── notebooks/
    └── exploration.ipynb
```

## Installation & Running

1. **Activate Virtual Environment**
   ```bash
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

2. **Train the Model**
   ```bash
   python train_model.py
   ```
   This reads `data/train.csv`, evaluates splits, and writes artifacts into the `model/` directory.

3. **Run the Application**
   ```bash
   python app.py
   ```
   Open `http://localhost:5000` in your web browser.

## API Endpoints
- `GET /` - Homepage / Prediction Form
- `GET /diagnostics` - Model Diagnostics Dashboard
- `POST /api/predict` - Accepts JSON features, returns predicted price
- `GET /api/metrics` - Returns JSON with all split metrics and actual vs predicted values
- `GET /api/health` - Check model load status

## Limitations & Future Improvements
- Currently restricted to a subset of 19 user-facing features for simplicity on the web form. Future improvements could dynamically handle all 79 features using advanced default imputation techniques.
- Model uses simple Ridge regression; Gradient Boosting or Random Forest could be explored to handle non-linear combinations better.
