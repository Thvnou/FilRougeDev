import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from app.database import get_db_connection

class YmmoAIEngine:
    def get_admin_dashboard_data(self) -> dict:
        """Calcule les métriques globales du marché et de l'IA pour le Dashboard Admin"""
        conn = get_db_connection()
        query = """
            SELECT p.area, p.rooms, t.final_price 
            FROM transactions t
            JOIN property p ON t.property_id = p.id
        """
        df = pd.read_sql(query, conn)
        conn.close()
        
        if len(df) < 2:
            return {"error": "Pas assez de données pour le Dashboard"}
        
        # 1. Entraînement du modèle
        X = df[['area', 'rooms']]
        y = df['final_price']
        model = LinearRegression()
        model.fit(X, y)
        
        # 2. Calcul des KPI du Dashboard
        prix_moyen_m2 = (df['final_price'] / df['area']).mean()
        total_ventes = float(df['final_price'].sum())
        nombre_ventes = len(df)
        
        # Extraction des coefficients de l'IA (poids des variables)
        coef_surface = float(model.coef_[0])
        coef_piece = float(model.coef_[1])
        constante = float(model.intercept_)
        
        # 3. Formatage pour les graphiques du Frontend
        historique_points = df.to_dict(orient="records") # Liste de {area, rooms, final_price}
        
        return {
            "metrics": {
                "total_sales_volume": total_ventes,
                "total_sales_count": nombre_ventes,
                "avg_price_per_m2": round(prix_moyen_m2, 2)
            },
            "ia_insights": {
                "value_of_one_m2": round(coef_surface, 2),    # Ce que l'IA attribue à 1m² de plus
                "value_of_one_room": round(coef_piece, 2),  # Ce que l'IA attribue à 1 pièce de plus
                "base_price": round(constante, 2)
            },
            "chart_data": historique_points
        }

    def predict_property_price(self, area: int, rooms: int) -> float:
        """Garde la fonction de prédiction unitaire (inchangée)"""
        conn = get_db_connection()
        query = "SELECT p.area, p.rooms, t.final_price FROM transactions t JOIN property p ON t.property_id = p.id"
        df = pd.read_sql(query, conn)
        conn.close()
        if len(df) < 2: return float((area * 3500) + (rooms * 15000))
        model = LinearRegression().fit(df[['area', 'rooms']], df['final_price'])
        return float(model.predict([[area, rooms]])[0])