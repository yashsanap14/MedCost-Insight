# 🏥 ER Bill Explainer — Healthcare Pricing Intelligence Platform

> Upload your ER bill. Get instant insights. Take action.

**ER Bill Explainer** is a web-based tool that decodes confusing emergency room bills by benchmarking every charge against federal CMS Medicare rates. It identifies overcharges, calculates your negotiation leverage, and generates a ready-to-send dispute letter — all in seconds.

---

## ✨ Key Features

### 📊 Analytics Dashboard
- **Negotiation Score** — Instant assessment of your bargaining leverage (Strong / Moderate / Low)
- **Category Breakdown** — Interactive donut chart showing where your money goes (Facility, Lab, Imaging, Procedures)
- **Top 5 Cost Drivers** — Dollar-ranked list of your most expensive charges
- **Pricing Aggressiveness Meter** — Histogram revealing how extreme the hospital's markup is (1-3x vs 15x+ Medicare)
- **Actionable Insights** — Cards highlighting specific negotiation opportunities

### 🔬 Service-Level Analysis
- Every CPT code benchmarked against Medicare rates
- Severity tags: Fair / Moderate / High / Critical
- Category filtering and ranked views

### ⚖️ Price Comparison
- Side-by-side: Gross Charge vs Cash Price vs Negotiated Range vs Medicare Rate
- State-level and national percentile benchmarking

### 🎛️ Insurance Simulator
- Pre-built plan presets (Bronze, Silver, Gold, Platinum, Catastrophic)
- Adjustable sliders: Deductible, Coinsurance, Copay, Out-of-Pocket Max
- Real-time "You Pay" vs "Insurance Pays" calculation
- AI-powered plan recommendation engine

### 🎯 Action Plan
- **🤖 AI Bill Explainer** — Paste your bill text and Google Gemini explains every charge in plain English
- **📝 Negotiation Letter** — Auto-generated letter citing exact CPT codes and Medicare rates
- **✅ Dispute Checklist** — Step-by-step guide to challenge your bill
- **💬 Talking Points** — Ready-to-use scripts for calling the billing department

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3 (custom dark-mode design system), Vanilla JavaScript |
| Backend | Python Flask, Flask-CORS |
| AI | Google Gemini 2.0 Flash (bill explanation) |
| Data | CMS Medicare rates, State benchmarks, National percentiles |
| Design | Glassmorphism, micro-animations, responsive mobile-first layout |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- A [Google Gemini API key](https://aistudio.google.com/apikey) (free tier works)

### Installation

```bash
# Clone the repository
git clone https://github.com/yashsanap14/ER---Bill-Explainer.git
cd ER---Bill-Explainer

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure your API key
cp .env.example .env
# Edit .env and add your Gemini API key
```

### Run the Application

```bash
python server.py
# → http://localhost:5001
```

The server hosts both the website and the `/explain-bill` API endpoint.

---

## 📁 Project Structure

```
ER-Bill-Explainer/
├── server.py              # Flask backend (Gemini API + static file server)
├── .env.example           # API key template
├── requirements.txt       # Python dependencies
├── website/
│   ├── index.html         # Main application (landing + dashboard + tabs)
│   ├── app.js             # Application logic (analytics, rendering, simulator)
│   ├── data.js            # Embedded dataset (20 ER services, plan presets, benchmarks)
│   └── styles.css         # Full design system (dark mode, responsive, animations)
├── data/
│   └── reference/         # CMS benchmark reference data
├── scripts/               # Data processing & ETL scripts
├── docs/                  # Additional documentation
└── README.md
```

---

## 📡 API

```
POST /explain-bill
Content-Type: application/json

Request:  { "bill_text": "ER Visit Level 4 (CPT 99284) $1,892.00..." }
Response: { "explanation": "..." }
```

---

## 🔒 Privacy & Security

- **No data stored** — Bills are processed in-memory and never saved
- **No accounts required** — No sign-up, no tracking
- **HIPAA-Exempt** — Educational tool only; no PHI collected or transmitted
- **API key secured** — `.env` is gitignored; key never touches the repo

---

## 📊 Data Sources

All benchmark data is **public and credible**:

| Dataset | Source |
|---------|--------|
| Hospital Price Transparency (MRF) | [CMS Hospital Price Transparency](https://www.cms.gov/priorities/key-initiatives/hospital-price-transparency) |
| Medicare Outpatient Hospitals | [CMS Data Portal](https://data.cms.gov/provider-summary-by-type-of-service/medicare-outpatient-hospitals) |
| Physician Fee Schedule (PFS) | [CMS PFS](https://www.cms.gov/medicare/payment/fee-schedules/physician) |
| Clinical Lab Fee Schedule | [CMS CLFS](https://www.cms.gov/medicare/payment/fee-schedules/clinical-laboratory-fee-schedule-clfs) |

---

## ⚠️ Disclaimers

> [!CAUTION]
> This tool provides **estimates only**. Actual costs vary by insurance plan, network status, deductible status, and billing practices.

> [!NOTE]
> **Not Medical or Legal Advice.** This tool is for educational and analytical purposes only.

---

## 📄 License

This project uses public datasets from CMS and is intended for educational and portfolio purposes.
