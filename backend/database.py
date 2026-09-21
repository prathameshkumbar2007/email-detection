import sqlite3
import json
import os
import hashlib
from datetime import datetime, timezone, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), 'cybertrace.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS analyses (
        id TEXT PRIMARY KEY,
        subject TEXT,
        sender TEXT,
        recipient TEXT,
        risk_score INTEGER,
        risk_tier TEXT,
        threat_classification TEXT,
        confidence_level TEXT,
        created_at TEXT,
        raw_eml TEXT,
        result_json TEXT
    )""")
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS cases (
        id TEXT PRIMARY KEY,
        title TEXT,
        priority TEXT,
        status TEXT,
        assigned_analyst TEXT,
        description TEXT,
        created_at TEXT,
        updated_at TEXT,
        related_analysis_id TEXT,
        notes TEXT,
        evidence_ids TEXT,
        timeline TEXT
    )""")
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        title TEXT,
        severity TEXT,
        alert_type TEXT,
        related_email_subject TEXT,
        sender TEXT,
        status TEXT,
        created_at TEXT,
        assigned_analyst TEXT,
        analysis_id TEXT,
        case_id TEXT,
        notes TEXT
    )""")
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS evidence (
        id TEXT PRIMARY KEY,
        filename TEXT,
        file_type TEXT,
        sha256 TEXT,
        file_size INTEGER,
        uploaded_at TEXT,
        uploaded_by TEXT,
        case_id TEXT,
        description TEXT,
        chain_of_custody TEXT
    )""")
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        case_id TEXT,
        title TEXT,
        created_by TEXT,
        generated_at TEXT,
        status TEXT,
        summary TEXT,
        report_data TEXT
    )""")
    
    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
