# ER Bill Explainer & Cost Transparency Dashboard

## Problem Statement

When patients visit the ER, they often receive multiple bills with confusing terminology:
- **Billed charges** vs **allowed amount** vs **insurance paid** vs **patient responsibility**
- Multiple billing sources: facility, physician, lab, radiology
- Unexpected out-of-pocket costs even when "insurance covers most of it"

**Real-world example:** An ER visit for a head injury resulted in:
- Total billed: ~$11,000
- Insurance covered: Most of it
- Patient still owed: $246 (Why?)

This dashboard answers: **"What did I get, what does it usually cost, and why did I pay what I paid?"**

---

## Solution Overview

An interactive Power BI dashboard that:
1. **Breaks down ER bills** into understandable components
2. **Compares hospital charges** to Medicare benchmarks
3. **Estimates patient responsibility** based on insurance parameters
4. **Identifies cost drivers** and billing surprises
5. **Enables hospital-to-hospital comparisons** for transparency

---

## Data Sources

All data is **public and credible**:

| Dataset | Source | Purpose |
|---------|--------|---------|
| Hospital Price Transparency (MRF) | [CMS Hospital Price Transparency](https://www.cms.gov/priorities/key-initiatives/hospital-price-transparency) | Hospital-specific gross charges, cash prices, negotiated rates |
| Medicare Outpatient Hospitals | [CMS Data Portal](https://data.cms.gov/provider-summary-by-type-of-service/medicare-outpatient-hospitals) | Benchmark charges and Medicare payments by service |
| Physician Fee Schedule (PFS) | [CMS PFS](https://www.cms.gov/medicare/payment/fee-schedules/physician) | Professional service benchmarks |
| Clinical Laboratory Fee Schedule | [CMS CLFS](https://www.cms.gov/medicare/payment/fee-schedules/clinical-laboratory-fee-schedule-clfs) | Lab test price benchmarks |

---

## Dashboard Pages

### 1. Bill Explained in 60 Seconds
- **Waterfall chart**: Billed → Allowed → Insurance Paid → Patient Owes
- **KPIs**: Total charges, estimated allowed, insurance paid, patient responsibility
- **Donut chart**: Patient cost breakdown (copay/coinsurance/deductible)

### 2. Test Cost Breakdown
- **Itemized matrix**: Service, CPT code, hospital charge, cash price, negotiated rates, Medicare benchmark
- **Box plot**: Distribution of negotiated rates across payers
- **Bar chart**: Services with highest price variance

### 3. Where the Surprise Comes From
- **Sankey diagram**: Billing flow (facility → physician → lab → radiology)
- **Decomposition tree**: Patient responsibility drivers
- **Educational callouts**: Why you get multiple bills

### 4. Geography & Hospital Comparison
- **Map**: Average allowed amounts by state
- **Ranking table**: Hospitals with highest variance from Medicare benchmarks
- **Filters**: State, service category, year

### 5. Policy & Patient Tips
- Common scenarios driving patient costs
- Data-driven educational content (not legal advice)

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Data Sources (Public)                   │
│  • Hospital MRF Files  • CMS OPPS  • PFS  • CLFS            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   ETL Pipeline (Python)                      │
│  • pandas for cleaning  • DuckDB for analytics              │
│  • Normalize MRF files  • Join benchmarks                   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              Star Schema (Parquet/PostgreSQL)                │
│  • dim_service  • dim_provider                              │
│  • fact_prices  • fact_benchmarks  • fact_scenarios         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                      Power BI Dashboard                      │
│  • DAX measures  • Interactive slicers  • 5 report pages    │
└─────────────────────────────────────────────────────────────┘
```

---

## Star Schema Design

### Dimension Tables
- **dim_service**: service_id, service_name, CPT/HCPCS, modality, category
- **dim_provider**: provider_id, hospital_name, CCN, city, state

### Fact Tables
- **fact_prices**: provider_id, service_id, gross_charge, cash_price, negotiated_min/median/max
- **fact_benchmarks**: service_id, medicare_rate, source (PFS/CLFS/OPPS)
- **fact_scenarios**: scenario_id, copay, deductible_remaining, coinsurance, computed_patient_owed

---

## Key DAX Measures

```dax
Allowed_Estimate = 
    COALESCE(
        [Negotiated_Median],
        [Medicare_Benchmark]
    )

Patient_Owes = 
    [Copay] + 
    MIN([Deductible_Remaining], [Allowed_Total]) + 
    [Coinsurance_%] * ([Allowed_Total] - MIN([Deductible_Remaining], [Allowed_Total]))

Variance_% = 
    DIVIDE(
        [Cash_Price] - [Medicare_Benchmark],
        [Medicare_Benchmark]
    )
```

---

## Project Structure

```
ER-Bill-Explainer/
├── data/
│   ├── raw/              # Downloaded MRF, CMS files
│   ├── processed/        # Cleaned, normalized data
│   └── benchmarks/       # PFS, CLFS, OPPS benchmarks
├── scripts/
│   ├── etl/              # Data extraction & transformation
│   └── analysis/         # Exploratory analysis
├── powerbi/              # .pbix file
├── docs/                 # Additional documentation
├── assets/               # Screenshots, diagrams
└── README.md
```

---

## Getting Started

### Prerequisites
- Python 3.9+
- Power BI Desktop
- Optional: PostgreSQL or DuckDB

### Installation

```bash
# Clone repository
cd ER-Bill-Explainer

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Run ETL Pipeline

```bash
# Download data
python scripts/etl/01_download_data.py

# Process MRF files
python scripts/etl/02_process_mrf.py

# Normalize benchmarks
python scripts/etl/03_process_benchmarks.py

# Build star schema
python scripts/etl/04_build_star_schema.py
```

### Open Power BI Dashboard

```bash
# Open the .pbix file
open powerbi/ER_Bill_Explainer.pbix
```

---

## Limitations & Assumptions

> [!CAUTION]
> This dashboard provides **estimates only**. Actual bills vary by:
> - Specific insurance plan details
> - Medical coding and billing practices
> - In-network vs out-of-network status
> - Individual deductible/out-of-pocket status

> [!WARNING]
> **MRF Data Quality**: Hospital price transparency files can be incomplete or inconsistent. This dashboard uses best-effort normalization.

> [!NOTE]
> **Not Medical/Legal Advice**: This tool is for educational and analytical purposes only.

---


## License

This project uses public datasets from CMS and is intended for educational/portfolio purposes.
