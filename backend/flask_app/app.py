"""
Flask Fallback Wrapper
─────────────────────
This Flask app acts as a thin proxy/fallback in front of the FastAPI service.
All requests are forwarded to FastAPI (running on port 8000).
Use Flask's port (5000) if you need Flask-specific middleware, plugins, or
want to serve Flask templates alongside the API.
"""
import os
import requests as req_lib
from flask import Flask, request, jsonify, Response

app = Flask(__name__)

FASTAPI_BASE = os.getenv("FASTAPI_BASE_URL", "http://127.0.0.1:8000")

EXCLUDED_HEADERS = {
    "content-encoding", "content-length",
    "transfer-encoding", "connection",
}


def _proxy(path: str) -> Response:
    """Forward the incoming Flask request to FastAPI and stream back the response."""
    url = f"{FASTAPI_BASE}/{path}"

    # Forward query params, headers (inc. Authorization), and body
    resp = req_lib.request(
        method=request.method,
        url=url,
        headers={k: v for k, v in request.headers if k.lower() != "host"},
        params=request.args,
        data=request.get_data(),
        allow_redirects=False,
        timeout=30,
    )

    # Strip hop-by-hop headers before returning
    headers = {
        k: v for k, v in resp.headers.items()
        if k.lower() not in EXCLUDED_HEADERS
    }

    return Response(resp.content, status=resp.status_code, headers=headers)


# ─── Health ──────────────────────────────────────────────────────────────────

@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "Odoo Cafe POS API (Flask fallback)"})


# ─── Catch-all proxy ─────────────────────────────────────────────────────────

@app.route("/<path:path>", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
def proxy(path: str):
    return _proxy(path)


if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
