import os
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
from functools import lru_cache
import logging

class HackerFormatter(logging.Formatter):
    LEVEL_ICONS = {
        "INFO": "[+]",
        "WARNING": "[!]",
        "ERROR": "[x]"
    }

    def format(self, record):
        ts = datetime.now().strftime("%H:%M:%S")
        icon = self.LEVEL_ICONS.get(record.levelname, "[*]")
        return f"[{ts}] {icon} STUDENT-API :: {record.getMessage()}"

handler = logging.StreamHandler()
handler.setFormatter(HackerFormatter())

logger = logging.getLogger("STUDENT-API")
logger.setLevel(logging.INFO)
logger.handlers.clear()
logger.addHandler(handler)

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(__file__)
EXCEL_FILE = os.path.join(BASE_DIR, "data", "students.xlsx")

def normalize(value):
    if value is None:
        return ""
    return (
        str(value)
        .lower()
        .strip()
        .replace("’", "'")
        .replace("‘", "'")
        .replace("ʼ", "'")
        .replace("ʻ", "'")
        .replace("`", "'")
    )

@lru_cache(maxsize=1)
def load_students():
    logger.info(f"LOAD excel={EXCEL_FILE}")
    df = pd.read_excel(EXCEL_FILE, engine="openpyxl", dtype=str)
    df = df.fillna("")
    df.columns = [c.strip() for c in df.columns]
    logger.info(f"DATA rows={len(df)} loaded")
    return df

@app.route("/api/health", methods=["GET"])
def health():
    logger.info("HTTP GET /api/health")
    return jsonify({
        "status": "ok",
        "timestamp": datetime.now().isoformat()
    })

@app.route("/api/columns", methods=["GET"])
def columns():
    logger.info("HTTP GET /api/columns")
    df = load_students()
    return jsonify({
        "success": True,
        "columns": list(df.columns),
        "total_students": len(df)
    })

@app.route("/api/search", methods=["GET"])
def search():
    query = request.args.get("q", "").strip()
    logger.info(f"HTTP GET /api/search q='{query}'")

    if not query:
        logger.warning("SEARCH aborted: empty query")
        return jsonify({
            "success": False,
            "message": "Qidiruv so‘rovi bo‘sh",
            "students": []
        })

    df = load_students()
    q = normalize(query)

    results = []

    for _, row in df.iterrows():
        row_text = " ".join(normalize(row[col]) for col in df.columns)
        if q in row_text:
            results.append({col: str(row[col]) for col in df.columns})

    logger.info(f"SEARCH completed results={len(results)}")

    return jsonify({
        "success": True,
        "count": len(results),
        "students": results,
        "search_term": query
    })

if __name__ == "__main__":
    app.run()

