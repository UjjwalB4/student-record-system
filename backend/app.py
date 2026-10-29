"""
CampusCloud — Smart Student Management Portal
Flask Backend with SQLite (local) and DynamoDB (AWS) support
"""

import os
import uuid
import json
import sqlite3
import logging
from datetime import datetime
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

# ── Configuration ─────────────────────────────────────────────────────────────
DB_MODE = os.environ.get("DB_MODE", "local").lower()   # "local" or "aws"
DYNAMO_TABLE = os.environ.get("DYNAMO_TABLE", "campus_students")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")
SQLITE_PATH = os.environ.get("SQLITE_PATH", "campuscloud.db")

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("campuscloud")

app = Flask(__name__, static_folder="assets")
CORS(app)

# ── Database helpers ────────────────────────────────────────────────────────

def get_db_mode():
    return DB_MODE


# ---------- SQLite helpers ----------

def sqlite_conn():
    conn = sqlite3.connect(SQLITE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_sqlite():
    with sqlite_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS students (
                id          TEXT PRIMARY KEY,
                student_id  TEXT UNIQUE NOT NULL,
                name        TEXT NOT NULL,
                email       TEXT NOT NULL,
                course      TEXT NOT NULL,
                created_at  TEXT NOT NULL,
                updated_at  TEXT NOT NULL
            )
        """)
        conn.commit()
    log.info("SQLite initialised at %s", SQLITE_PATH)


def row_to_dict(row):
    return dict(row) if row else None


# ---------- DynamoDB helpers ----------

_dynamo_table = None


def get_dynamo_table():
    global _dynamo_table
    if _dynamo_table:
        return _dynamo_table
    try:
        import boto3
        dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
        _dynamo_table = dynamodb.Table(DYNAMO_TABLE)
        _dynamo_table.load()   # raises if table not found
        log.info("DynamoDB table '%s' connected", DYNAMO_TABLE)
        return _dynamo_table
    except Exception as exc:
        log.error("DynamoDB connection failed: %s", exc)
        raise


# ── CRUD Operations ─────────────────────────────────────────────────────────

def list_students():
    if DB_MODE == "aws":
        table = get_dynamo_table()
        resp = table.scan()
        items = sorted(resp.get("Items", []), key=lambda s: s.get("created_at", ""), reverse=True)
        return items
    else:
        with sqlite_conn() as conn:
            rows = conn.execute("SELECT * FROM students ORDER BY created_at DESC").fetchall()
            return [row_to_dict(r) for r in rows]


def add_student(data: dict) -> dict:
    student = {
        "id": str(uuid.uuid4()),
        "student_id": data["student_id"].strip(),
        "name": data["name"].strip(),
        "email": data["email"].strip().lower(),
        "course": data["course"].strip(),
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    if DB_MODE == "aws":
        get_dynamo_table().put_item(Item=student)
    else:
        with sqlite_conn() as conn:
            conn.execute(
                "INSERT INTO students (id, student_id, name, email, course, created_at, updated_at) "
                "VALUES (:id, :student_id, :name, :email, :course, :created_at, :updated_at)",
                student,
            )
            conn.commit()
    return student


def update_student(student_id: str, data: dict) -> dict | None:
    updates = {k: v for k, v in data.items() if k in ("name", "email", "course", "student_id")}
    updates["updated_at"] = datetime.utcnow().isoformat()

    if DB_MODE == "aws":
        table = get_dynamo_table()
        expr = "SET " + ", ".join(f"#{k}=:{k}" for k in updates)
        names = {f"#{k}": k for k in updates}
        vals = {f":{k}": v for k, v in updates.items()}
        table.update_item(
            Key={"id": student_id},
            UpdateExpression=expr,
            ExpressionAttributeNames=names,
            ExpressionAttributeValues=vals,
        )
        resp = table.get_item(Key={"id": student_id})
        return resp.get("Item")
    else:
        set_clause = ", ".join(f"{k} = :{k}" for k in updates)
        updates["id"] = student_id
        with sqlite_conn() as conn:
            conn.execute(f"UPDATE students SET {set_clause} WHERE id = :id", updates)
            conn.commit()
            row = conn.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
            return row_to_dict(row)


def delete_student(student_id: str) -> bool:
    if DB_MODE == "aws":
        get_dynamo_table().delete_item(Key={"id": student_id})
    else:
        with sqlite_conn() as conn:
            cur = conn.execute("DELETE FROM students WHERE id = ?", (student_id,))
            conn.commit()
            return cur.rowcount > 0
    return True


def get_student(student_id: str) -> dict | None:
    if DB_MODE == "aws":
        resp = get_dynamo_table().get_item(Key={"id": student_id})
        return resp.get("Item")
    else:
        with sqlite_conn() as conn:
            row = conn.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
            return row_to_dict(row)


# ── Validators ──────────────────────────────────────────────────────────────

def validate_student(data: dict) -> list[str]:
    errors = []
    if not data.get("name", "").strip():
        errors.append("Name is required.")
    if not data.get("student_id", "").strip():
        errors.append("Student ID is required.")
    if not data.get("course", "").strip():
        errors.append("Course is required.")
    email = data.get("email", "").strip()
    if not email:
        errors.append("Email is required.")
    elif "@" not in email or "." not in email.split("@")[-1]:
        errors.append("Invalid email format.")
    return errors


# ── REST API Routes ─────────────────────────────────────────────────────────

@app.route("/api/status", methods=["GET"])
def status():
    db_mode = get_db_mode()
    aws_ok = False
    if db_mode == "aws":
        try:
            get_dynamo_table()
            aws_ok = True
        except Exception:
            aws_ok = False
    return jsonify({
        "status": "ok",
        "db_mode": db_mode,
        "aws_connected": aws_ok,
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
    })


@app.route("/api/students", methods=["GET"])
def api_list_students():
    try:
        students = list_students()
        # Search / filter
        q = request.args.get("q", "").lower()
        course_filter = request.args.get("course", "").lower()
        if q:
            students = [s for s in students if q in s["name"].lower() or q in s["student_id"].lower() or q in s["email"].lower()]
        if course_filter:
            students = [s for s in students if s["course"].lower() == course_filter]
        return jsonify({"students": students, "total": len(students)})
    except Exception as exc:
        log.exception("list_students failed")
        return jsonify({"error": str(exc)}), 500


@app.route("/api/students", methods=["POST"])
def api_add_student():
    data = request.get_json(force=True) or {}
    errors = validate_student(data)
    if errors:
        return jsonify({"errors": errors}), 400
    try:
        student = add_student(data)
        return jsonify({"student": student, "message": "Student added successfully."}), 201
    except Exception as exc:
        log.exception("add_student failed")
        if "UNIQUE constraint failed" in str(exc) or "ConditionalCheckFailed" in str(exc):
            return jsonify({"errors": ["Student ID already exists."]}), 409
        return jsonify({"error": str(exc)}), 500


@app.route("/api/students/<student_id>", methods=["GET"])
def api_get_student(student_id):
    try:
        student = get_student(student_id)
        if not student:
            return jsonify({"error": "Student not found."}), 404
        return jsonify({"student": student})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/students/<student_id>", methods=["PUT"])
def api_update_student(student_id):
    data = request.get_json(force=True) or {}
    errors = validate_student(data)
    if errors:
        return jsonify({"errors": errors}), 400
    try:
        student = update_student(student_id, data)
        if not student:
            return jsonify({"error": "Student not found."}), 404
        return jsonify({"student": student, "message": "Student updated successfully."})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/students/<student_id>", methods=["DELETE"])
def api_delete_student(student_id):
    try:
        ok = delete_student(student_id)
        if not ok:
            return jsonify({"error": "Student not found."}), 404
        return jsonify({"message": "Student deleted successfully."})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/stats", methods=["GET"])
def api_stats():
    try:
        students = list_students()
        courses = {}
        for s in students:
            courses[s["course"]] = courses.get(s["course"], 0) + 1
        recent = students[:5]
        return jsonify({
            "total_students": len(students),
            "total_courses": len(courses),
            "courses": courses,
            "recent_students": recent,
        })
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# ── Static assets ─────────────────────────────────────────────────────────────

@app.route("/assets/<path:filename>")
def serve_asset(filename):
    return send_from_directory("assets", filename)


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if DB_MODE != "aws":
        init_sqlite()
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "true").lower() == "true"
    log.info("Starting CampusCloud backend on port %d (DB_MODE=%s)", port, DB_MODE)
    app.run(host="0.0.0.0", port=port, debug=debug)
