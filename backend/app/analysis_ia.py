import pandas as pd
from sklearn.linear_model import LinearRegression
from app.database import get_db_connection

class YmmoAIEngine:
    def predict_property_price(self, area: int, rooms: int) -> float:
        """Entraîne la régression linéaire sur l'historique et prédit un prix"""
        conn = get_db_connection()
        query = """
            SELECT p.area, p.rooms, t.final_price 
            FROM transactions t
            JOIN property p ON t.property_id = p.id
        """
        df = pd.read_sql(query, conn)
        conn.close()
        
        if len(df) < 2:
            return float((area * 3500) + (rooms * 15000))
        
        X = df[['area', 'rooms']]
        y = df['final_price']
        
        model = LinearRegression()
        model.fit(X, y)
        
        prediction = model.predict([[area, rooms]])
        return float(prediction[0])