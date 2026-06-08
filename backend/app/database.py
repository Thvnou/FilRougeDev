import psycopg2
from psycopg2.extras import RealDictCursor
import os

DB_URL = os.getenv("DATABASE_URL", "postgresql://ymmo_admin:SecretSecurePassword123@ymmo-db:5432/ymmo_db")

def get_db_connection():
    """Retourne une connexion à la base de données avec un curseur typé Dictionnaire"""
    conn = psycopg2.connect(DB_URL, cursor_factory=RealDictCursor)
    return conn