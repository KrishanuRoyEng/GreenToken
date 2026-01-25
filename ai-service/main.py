from fastapi import FastAPI, UploadFile, File, HTTPException
import pandas as pd
import geopandas as gpd
import io
import json
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from typing import List, Dict, Any

app = FastAPI(title="GreenToken AI Service")

# --- Mock Model Training (In production, load a saved model) ---
# Synthetic data for Blue Carbon Ecosystems
# Features: [Area (ha), Salinity (ppt), Soil Carbon (Mg/ha), Age (years)]
# Target: Carbon Sequestration Potential (tCO2e/year)
X_train = np.array([
    [10, 30, 150, 5],   # Mangrove, young
    [50, 32, 400, 20],  # Mangrove, mature
    [5, 35, 80, 2],     # Seagrass, young
    [100, 28, 600, 50], # Mangrove, ancient
    [20, 34, 120, 8],   # Salt Marsh
])
y_train = np.array([120, 950, 30, 2100, 180]) # Mock output

model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

@app.get("/")
def health_check():
    return {"status": "healthy", "service": "GreenToken AI"}

@app.post("/analyze/carbon-potential")
async def predict_carbon(data: Dict[str, float]):
    """
    Predict carbon potential based on ecosystem parameters.
    Expected Payload: { "area": 10, "salinity": 30, "soil_carbon": 150, "age": 5 }
    """
    try:
        features = [[
            data.get("area", 0),
            data.get("salinity", 30),
            data.get("soil_carbon", 200),
            data.get("age", 10)
        ]]
        prediction = model.predict(features)[0]
        
        # Calculate confidence (mock logic based on distance from training data)
        confidence = 0.85 if data.get("area", 0) < 200 else 0.65

        return {
            "predicted_carbon_credits": round(prediction, 2),
            "confidence_score": confidence,
            "ecosystem_valuation_usd": round(prediction * 25, 2) # $25 per credit
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/process/geo-data")
async def process_geo_data(file: UploadFile = File(...)):
    """
    Process uploaded CSV/GeoJSON files to extract project sites.
    """
    try:
        contents = await file.read()
        filename = file.filename.lower()
        
        df = None
        if filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        elif filename.endswith('.geojson') or filename.endswith('.json'):
            df = gpd.read_file(io.BytesIO(contents))
        elif filename.endswith('.xlsx'):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")

        # Basic logic to find coordinate columns
        lat_col = next((col for col in df.columns if 'lat' in col.lower()), None)
        lon_col = next((col for col in df.columns if 'lon' in col.lower() or 'lng' in col.lower()), None)
        
        if not lat_col or not lon_col:
            return {"error": "Could not identify Latitude/Longitude columns", "columns": df.columns.tolist()}

        # Extract first 50 rows for preview
        preview = []
        for _, row in df.head(50).iterrows():
            try:
                item = {
                    "latitude": float(row[lat_col]),
                    "longitude": float(row[lon_col]),
                    "name": row.get("name", row.get("site", f"Site {_}")),
                    "potential_credits": 0
                }
                
                # Run prediction for each row if data exists
                area = float(row.get("area", row.get("hectares", 10)))
                pred = model.predict([[area, 30, 200, 10]])[0]
                item["potential_credits"] = round(pred, 2)
                
                preview.append(item)
            except:
                continue

        return {
            "message": f"Successfully processed {len(df)} records",
            "sites_found": len(preview),
            "preview_data": preview,
            "total_estimated_credits": sum(p["potential_credits"] for p in preview)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
