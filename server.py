"""
ER Bill Explainer — Backend API Server
Provides /explain-bill endpoint using Google Gemini 1.5 Flash
"""

import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("⚠️  WARNING: GEMINI_API_KEY not found in environment variables.")
    print("   Create a .env file with: GEMINI_API_KEY=your_key_here")

# Use the newer google.genai SDK
try:
    from google import genai
    client = genai.Client(api_key=GEMINI_API_KEY)
    USE_NEW_SDK = True
except ImportError:
    import google.generativeai as genai_legacy
    genai_legacy.configure(api_key=GEMINI_API_KEY)
    model = genai_legacy.GenerativeModel("gemini-1.5-flash")
    USE_NEW_SDK = False

# Flask app
app = Flask(__name__, static_folder="website")
CORS(app)

# ── Serve the static website ──────────────────────────────────────
@app.route("/")
def serve_index():
    return send_from_directory(app.static_folder, "index.html")

@app.route("/<path:path>")
def serve_static(path):
    return send_from_directory(app.static_folder, path)

# ── API: Explain Bill ─────────────────────────────────────────────
SYSTEM_PROMPT = """You are a medical billing assistant.
Explain the following emergency room bill in simple language that a non-medical person can understand.
Break down:

- Each charge
- Why it may have been billed
- Whether it is a common ER charge
- Flag anything that looks potentially unusual

Do NOT provide medical advice.
Keep the tone clear, helpful, and professional.

ER Bill:
{bill_text}"""

@app.route("/explain-bill", methods=["POST"])
def explain_bill():
    """Accept bill text and return a Gemini-powered explanation."""
    # Validate request
    data = request.get_json(silent=True)
    if not data or "bill_text" not in data:
        return jsonify({"error": "Missing 'bill_text' in request body"}), 400

    bill_text = data["bill_text"].strip()
    if not bill_text:
        return jsonify({"error": "bill_text cannot be empty"}), 400

    if len(bill_text) > 10000:
        return jsonify({"error": "bill_text exceeds maximum length of 10,000 characters"}), 400

    # Check API key
    if not GEMINI_API_KEY:
        return jsonify({"error": "Server misconfigured: GEMINI_API_KEY not set"}), 500

    # Call Gemini
    try:
        prompt = SYSTEM_PROMPT.format(bill_text=bill_text)

        if USE_NEW_SDK:
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt
            )
            explanation = response.text
        else:
            response = model.generate_content(prompt)
            explanation = response.text

        return jsonify({"explanation": explanation})

    except Exception as e:
        print(f"Gemini API error: {e}")
        return jsonify({"error": f"Failed to generate explanation: {str(e)}"}), 500


# ── Run ───────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"\n🏥 ER Bill Explainer API running at http://localhost:{port}")
    print(f"   POST /explain-bill  — Analyze a bill with Gemini AI\n")
    app.run(host="0.0.0.0", debug=True, port=port)
