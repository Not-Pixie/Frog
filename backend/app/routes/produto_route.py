# app/routes/products.py
from flask import Blueprint, request, jsonify, current_app
from app.database.database import SessionLocal
from app.services.produto_service import create_produto

product_bp = Blueprint("products", __name__)


