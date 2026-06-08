from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.database import get_db_connection
from app.analysis_ia import YmmoAIEngine

app = FastAPI(
    title="YMMO API Nationale",
    description="Backend et moteur IA pour la plateforme immobilière YMMO",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ai_engine = YmmoAIEngine()

# --- MODÈLES DE DONNÉES (Pydantic) ---
class PropertyEstimateInput(BaseModel):
    area: int
    rooms: int

class PropertyCreateInput(BaseModel):
    title: str
    description: str
    category: str
    type: str
    price: int
    area: int
    rooms: int
    city: str
    postcode: str
    user_id: int

@app.get("/")
def health_check():
    return {"status": "healthy", "message": "API YMMO en ligne et prête pour le Frontend."}

@app.get("/api/properties")
def get_all_properties():
    """Récupère la liste de tous les biens immobiliers (disponibles et vendus)"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM property ORDER BY created_at DESC;")
    properties = cursor.fetchall()
    cursor.close()
    conn.close()
    return properties

@app.post("/api/properties")
def create_property(property: PropertyCreateInput):
    """Permet au commercial d'ajouter un nouveau bien depuis le formulaire Front"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO property (title, description, category, type, price, area, rooms, city, postcode, user_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id;
        """, (property.title, property.description, property.category, property.type, 
              property.price, property.area, property.rooms, property.city, property.postcode, property.user_id))
        new_id = cursor.fetchone()['id']
        conn.commit()
        return {"status": "success", "message": "Bien immobilier ajouté", "property_id": new_id}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@app.get("/api/agences")
def get_all_agences():
    """Récupère la liste des 13 agences pour alimenter un menu déroulant (<select>) sur le Front"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM agences ORDER BY id ASC;")
    agences = cursor.fetchall()
    cursor.close()
    conn.close()
    return agences

@app.post("/api/analytics/predict")
def predict_price(data: PropertyEstimateInput):
    """Endpoint IA : Calcule l'estimation d'un prix pour l'outil d'évaluation du Front"""
    if data.area <= 0 or data.rooms <= 0:
        raise HTTPException(status_code=400, detail="La surface et le nombre de pièces doivent être supérieurs à 0.")
    try:
        estimated_price = ai_engine.predict_property_price(data.area, data.rooms)
        return {
            "status": "success",
            "estimated_price": round(estimated_price, 2),
            "currency": "EUR"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur IA : {str(e)}")