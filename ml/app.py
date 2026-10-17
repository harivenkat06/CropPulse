import os
import sqlite3
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timedelta
import joblib
from xgboost import XGBRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import TimeSeriesSplit

app = FastAPI(title="CropPulse Prediction Service")

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend/prisma/dev.db"))
MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "models/xgboost_model.pkl"))
ENCODERS_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "models/encoders.pkl"))

class PredictRequest(BaseModel):
    crop_id: str
    market_id: str
    horizon: int  # 1, 3, or 7 days

class HistoryPoint(BaseModel):
    label: str
    price: float

class PredictionResponse(BaseModel):
    expected_price: float
    min_price: float
    max_price: float
    confidence: float
    horizon: int
    model_version: str
    last_trained: str
    history: List[HistoryPoint] = Field(default_factory=list)
    message: Optional[str] = None

def load_data():
    conn = sqlite3.connect(DB_PATH)
    query = """
        SELECT mp.cropId, mp.marketId, mp.modalPrice, mp.date 
        FROM MarketPrice mp
        ORDER BY mp.date ASC
    """
    df = pd.read_sql_query(query, conn)
    conn.close()
    
    df['date'] = pd.to_datetime(df['date'])
    return df

@app.get("/catalog")
def get_catalog():
    try:
        conn = sqlite3.connect(DB_PATH)
        crops = pd.read_sql_query(
            'SELECT id, name, icon FROM "Crop" ORDER BY name ASC',
            conn
        ).to_dict(orient="records")
        markets = pd.read_sql_query(
            'SELECT id, name, district, state, latitude, longitude FROM "Market" ORDER BY name ASC',
            conn
        ).to_dict(orient="records")
        conn.close()
        return {"crops": crops, "markets": markets}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Prediction catalog is unavailable: {str(e)}")

@app.post("/train")
def train_model():
    try:
        df = load_data()
        if len(df) < 100:
            raise HTTPException(status_code=400, detail="Insufficient total database records for training.")
        
        # Sort and feature engineering
        df = df.sort_values(by=['cropId', 'marketId', 'date'])
        
        # Add lag features
        for lag in [1, 2, 3, 7]:
            df[f'lag_{lag}'] = df.groupby(['cropId', 'marketId'])['modalPrice'].shift(lag)
            
        # Add rolling features
        df['rolling_mean_7'] = df.groupby(['cropId', 'marketId'])['modalPrice'].shift(1).rolling(7).mean()
        df['rolling_std_7'] = df.groupby(['cropId', 'marketId'])['modalPrice'].shift(1).rolling(7).std()
        
        # Add calendar features
        df['day_of_week'] = df['date'].dt.dayofweek
        df['month'] = df['date'].dt.month
        
        # Drop rows with NaN caused by shifting
        df = df.dropna()
        
        if len(df) < 50:
            raise HTTPException(status_code=400, detail="Insufficient cleaned rows for training after lag generation.")
            
        # Categorical encoding
        le_crop = LabelEncoder()
        le_market = LabelEncoder()
        
        df['crop_encoded'] = le_crop.fit_transform(df['cropId'])
        df['market_encoded'] = le_market.fit_transform(df['marketId'])
        
        features = [
            'crop_encoded', 'market_encoded', 
            'lag_1', 'lag_2', 'lag_3', 'lag_7', 
            'rolling_mean_7', 'rolling_std_7', 
            'day_of_week', 'month'
        ]
        
        X = df[features]
        y = df['modalPrice']
        
        # Train model
        model = XGBRegressor(n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42)
        model.fit(X, y)
        
        # Save model and encoders
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        joblib.dump(model, MODEL_PATH)
        joblib.dump({'crop': le_crop, 'market': le_market}, ENCODERS_PATH)
        
        return {
            "status": "success",
            "message": "Model trained successfully",
            "records_used": len(df),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict", response_model=PredictionResponse)
def predict(req: PredictRequest):
    if not os.path.exists(MODEL_PATH) or not os.path.exists(ENCODERS_PATH):
        # Auto-train if model doesn't exist
        try:
            train_model()
        except Exception as e:
            return PredictionResponse(
                expected_price=0.0,
                min_price=0.0,
                max_price=0.0,
                confidence=0.0,
                horizon=req.horizon,
                model_version="none",
                last_trained="none",
                message=f"Model not trained. Auto-train failed: {str(e)}"
            )

    try:
        model = joblib.load(MODEL_PATH)
        encoders = joblib.load(ENCODERS_PATH)
        
        le_crop = encoders['crop']
        le_market = encoders['market']
        
        # Seeded or refreshed databases can assign new IDs while leaving a stale model behind.
        if req.crop_id not in le_crop.classes_ or req.market_id not in le_market.classes_:
            train_model()
            model = joblib.load(MODEL_PATH)
            encoders = joblib.load(ENCODERS_PATH)
            le_crop = encoders['crop']
            le_market = encoders['market']

        if req.crop_id not in le_crop.classes_ or req.market_id not in le_market.classes_:
            return PredictionResponse(
                expected_price=0.0,
                min_price=0.0,
                max_price=0.0,
                confidence=0.0,
                horizon=req.horizon,
                model_version="1.0.0",
                last_trained=datetime.fromtimestamp(os.path.getmtime(MODEL_PATH)).isoformat(),
                message="No historical training data is available for the selected crop and market."
            )
            
        crop_enc = le_crop.transform([req.crop_id])[0]
        market_enc = le_market.transform([req.market_id])[0]
        
        # Get latest data from database to construct features
        conn = sqlite3.connect(DB_PATH)
        query = """
            SELECT modalPrice, date FROM MarketPrice 
            WHERE cropId = ? AND marketId = ? 
            ORDER BY date DESC LIMIT 15
        """
        history_df = pd.read_sql_query(query, conn, params=(req.crop_id, req.market_id))
        conn.close()
        
        if len(history_df) < 10:
            return PredictionResponse(
                expected_price=0.0,
                min_price=0.0,
                max_price=0.0,
                confidence=0.0,
                horizon=req.horizon,
                model_version="1.0.0",
                last_trained=datetime.fromtimestamp(os.path.getmtime(MODEL_PATH)).isoformat(),
                message="Insufficient historical data for a reliable prediction."
            )
            
        # Reverse history to chronological order (asc)
        history_df = history_df.iloc[::-1].reset_index(drop=True)
        
        # Construct feature vector for prediction
        prices = history_df['modalPrice'].values
        
        expected_prices = []
        current_prices = prices.copy()
        
        # Auto-regressively predict up to horizon days
        for h in range(1, req.horizon + 1):
            pred_date = datetime.now() + timedelta(days=h)
            
            # Construct features
            lag_1 = current_prices[-1]
            lag_2 = current_prices[-2]
            lag_3 = current_prices[-3]
            lag_7 = current_prices[-7] if len(current_prices) >= 7 else current_prices[-1]
            
            rolling_mean_7 = np.mean(current_prices[-7:]) if len(current_prices) >= 7 else np.mean(current_prices)
            rolling_std_7 = np.std(current_prices[-7:]) if len(current_prices) >= 7 else np.std(current_prices)
            if np.isnan(rolling_std_7):
                rolling_std_7 = 0.0
                
            day_of_week = pred_date.weekday()
            month = pred_date.month
            
            feature_vector = pd.DataFrame([{
                'crop_encoded': crop_enc,
                'market_encoded': market_enc,
                'lag_1': lag_1,
                'lag_2': lag_2,
                'lag_3': lag_3,
                'lag_7': lag_7,
                'rolling_mean_7': rolling_mean_7,
                'rolling_std_7': rolling_std_7,
                'day_of_week': day_of_week,
                'month': month
            }])
            
            pred = float(model.predict(feature_vector)[0])
            expected_prices.append(pred)
            current_prices = np.append(current_prices, pred)
            
        final_pred = expected_prices[-1]
        
        # Calculate volatility/uncertainty from historical prices
        historical_volatility = np.std(prices) / np.mean(prices) if len(prices) > 0 else 0.05
        # Uncertainty increases with horizon
        horizon_penalty = 1 + (req.horizon * 0.02)
        uncertainty_range = final_pred * historical_volatility * horizon_penalty
        
        min_price = max(0.0, final_pred - uncertainty_range)
        max_price = final_pred + uncertainty_range
        
        # Calculate confidence score
        # Base confidence 95%, decreased by volatility and horizon
        confidence = max(50.0, 95.0 - (historical_volatility * 100) - (req.horizon * 2))
        
        return PredictionResponse(
            expected_price=round(final_pred, 2),
            min_price=round(min_price, 2),
            max_price=round(max_price, 2),
            confidence=round(confidence, 1),
            horizon=req.horizon,
            model_version="1.0.0",
            last_trained=datetime.fromtimestamp(os.path.getmtime(MODEL_PATH)).isoformat(),
            history=[
                HistoryPoint(label=f"D{i + 1}", price=round(float(row.modalPrice), 2))
                for i, row in enumerate(history_df.tail(6).itertuples())
            ],
            message=None
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
