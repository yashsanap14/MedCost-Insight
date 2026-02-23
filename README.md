# 🏥 MedCost Insight — Healthcare Pricing Intelligence Platform

> Upload your ER bill. Get instant insights. Take action.

**MedCost Insight** is a web-based tool that decodes confusing emergency room bills by benchmarking every charge against federal CMS Medicare rates. It identifies overcharges, calculates your negotiation leverage, and generates a ready-to-send dispute letter — all in seconds.

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
git clone https://github.com/yashsanap14/MedCost-Insight.git
cd MedCost-Insight

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure your API key
cp .env.example .env
# Edit .env and add your Gemini API key
