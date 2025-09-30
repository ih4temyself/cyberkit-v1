from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
from pathlib import Path
import json
import hashlib
import httpx
from zxcvbn import zxcvbn  # type: ignore


DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "modules.json"

app = FastAPI(title="CyberSec Edu API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QuizAnswerPayload(BaseModel):
    answers: Dict[str, int] 

def load_data() -> Dict[str, Any]:
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Data file not found: {DATA_PATH}")
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def sanitize_quiz_for_client(quiz: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    cleaned = []
    for q in quiz:
        cleaned.append({
            "id": q["id"],
            "question": q["question"],
            "options": q["options"]
        })
    return cleaned

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.get("/api/modules")
def list_modules():
    data = load_data()
    modules = []
    for m in data["modules"]:
        modules.append({
            "id": m["id"],
            "title": m["title"],
            "summary": m.get("summary", ""),
            "quiz_count": len(m.get("quiz", []))
        })
    return {"modules": modules}

@app.get("/api/modules/{module_id}")
def get_module(module_id: str):
    data = load_data()
    module = next((m for m in data["modules"] if m["id"] == module_id), None)
    if not module:
        raise HTTPException(404, "Module not found")
    module_out = dict(module)
    if "quiz" in module_out:
        module_out["quiz"] = sanitize_quiz_for_client(module_out["quiz"])
    return module_out

@app.get("/api/modules/{module_id}/quiz")
def get_quiz(module_id: str):
    data = load_data()
    module = next((m for m in data["modules"] if m["id"] == module_id), None)
    if not module:
        raise HTTPException(404, "Module not found")
    return {"quiz": sanitize_quiz_for_client(module.get("quiz", []))}

@app.post("/api/modules/{module_id}/quiz/grade")
def grade_quiz(module_id: str, payload: QuizAnswerPayload):
    data = load_data()
    module = next((m for m in data["modules"] if m["id"] == module_id), None)
    if not module:
        raise HTTPException(404, "Module not found")
    key = {q["id"]: q["answer"] for q in module.get("quiz", [])}
    expl = {q["id"]: q["explanation"] for q in module.get("quiz", [])}
    results = []
    correct = 0
    total = len(key)
    for qid, right_idx in key.items():
        user_idx = payload.answers.get(qid, None)
        is_ok = (user_idx == right_idx)
        if is_ok:
            correct += 1
        results.append({
            "questionId": qid,
            "correct": is_ok,
            "correctIndex": right_idx,
            "yourIndex": user_idx,
            "explanation": expl.get(qid, "")
        })
    return {"score": correct, "total": total, "results": results}


class PasswordCheckPayload(BaseModel):
    password: str


@app.post("/api/password/check")
async def check_password(payload: PasswordCheckPayload):
    pwd = payload.password or ""

    if zxcvbn is not None:
        strength = zxcvbn(pwd)
        display = strength.get("crack_times_display", {})
        seconds = strength.get("crack_times_seconds", {})
        crack_time_display = display.get("offline_slow_hashing_1e4_per_second")
        crack_time_seconds = seconds.get("offline_slow_hashing_1e4_per_second")
        score = strength.get("score", 0)
    else:
        # Minimal heuristic fallback (0-4), encourages installing zxcvbn
        score = 0
        if len(pwd) >= 12: score += 2
        elif len(pwd) >= 8: score += 1
        if any(c.islower() for c in pwd): score += 1
        if any(c.isupper() for c in pwd): score += 1
        if any(c.isdigit() for c in pwd): score += 1
        if any(not c.isalnum() for c in pwd): score += 1
        if len(pwd) and any(pwd.count(ch) >= 3 for ch in set(pwd)): score -= 1
        score = max(0, min(4, score))
        crack_time_display = None
        crack_time_seconds = None

    sha1 = hashlib.sha1(pwd.encode("utf-8")).hexdigest().upper()
    prefix, suffix = sha1[:5], sha1[5:]
    breached = False
    breach_count = 0
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"https://api.pwnedpasswords.com/range/{prefix}")
            if resp.status_code == 200:
                for line in resp.text.splitlines():
                    h, cnt = line.split(":")
                    if h == suffix:
                        breached = True
                        breach_count = int(cnt)
                        break
    except Exception:
        breached = False
        breach_count = 0

    return {
        "breached": breached,
        "breach_count": breach_count,
        "score": score,
        "crack_time_display": crack_time_display,
        "crack_time_seconds": crack_time_seconds,
    }
