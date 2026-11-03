import pandas as pd

df = pd.read_csv('data/train.csv')
print(f"Shape: {df.shape}")
print("\nMissing values:")
print(df.isnull().sum()[df.isnull().sum() > 0])

user_features = ['OverallQual', 'OverallCond', 'GrLivArea', 'YearBuilt', 'YearRemodAdd', 
                 'TotalBsmtSF', '1stFlrSF', '2ndFlrSF', 'FullBath', 'HalfBath', 
                 'BedroomAbvGr', 'KitchenQual', 'GarageCars', 'GarageArea', 
                 'Neighborhood', 'HouseStyle', 'CentralAir', 'Fireplaces', 'LotArea']

print("\nMissing in selected features:")
print(df[user_features].isnull().sum())

print("\nCategorical columns in selected:")
print(df[user_features].select_dtypes(include=['object']).columns.tolist())

print("\nNumerical columns in selected:")
print(df[user_features].select_dtypes(exclude=['object']).columns.tolist())

print("\nUnique values for KitchenQual:", df['KitchenQual'].unique())
print("Unique values for CentralAir:", df['CentralAir'].unique())
