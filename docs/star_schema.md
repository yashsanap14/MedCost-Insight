# Star Schema Design

## Overview

The ER Bill Explainer uses a **star schema** optimized for Power BI analytics. This design enables fast aggregations and intuitive relationships for end users.

---

## Schema Diagram

```
                    ┌─────────────────┐
                    │  dim_service    │
                    ├─────────────────┤
                    │ service_id (PK) │
                    │ cpt_hcpcs       │
                    │ description     │
                    │ category        │
                    │ modality        │
                    └────────┬────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
       ┌────────▼────────┐       ┌───────▼────────┐
       │  fact_prices    │       │fact_benchmarks │
       ├─────────────────┤       ├────────────────┤
       │ price_id (PK)   │       │ benchmark_id   │
       │ service_id (FK) │       │ service_id (FK)│
       │ provider_id (FK)│       │ medicare_rate  │
       │ gross_charge    │       │ source         │
       │ cash_price      │       │ year           │
       │ negotiated_min  │       └────────────────┘
       │ negotiated_med  │
       │ negotiated_max  │
       │ payer_name      │
       └────────┬────────┘
                │
                │
       ┌────────▼────────┐
       │  dim_provider   │
       ├─────────────────┤
       │ provider_id (PK)│
       │ hospital_name   │
       │ ccn             │
       │ city            │
       │ state           │
       │ zip_code        │
       └─────────────────┘

       ┌─────────────────┐
       │ fact_scenarios  │
       ├─────────────────┤
       │ scenario_id (PK)│
       │ scenario_name   │
       │ copay           │
       │ deductible_rem  │
       │ coinsurance_pct │
       └─────────────────┘
```

---

## Table Definitions

### Dimension Tables

#### dim_service
**Purpose**: Catalog of all medical services/procedures

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `service_id` | INT | Primary key | 1 |
| `cpt_hcpcs` | VARCHAR(10) | CPT/HCPCS code | "70450" |
| `description` | VARCHAR(255) | Service description | "CT head/brain without contrast" |
| `category` | VARCHAR(50) | Service category | "imaging" |
| `modality` | VARCHAR(50) | Subcategory | "CT" |

**Cardinality**: ~20-100 rows (focused on common ER services)

---

#### dim_provider
**Purpose**: Hospital/provider directory

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `provider_id` | INT | Primary key | 1 |
| `hospital_name` | VARCHAR(255) | Hospital name | "Inova Fairfax Hospital" |
| `ccn` | VARCHAR(10) | CMS Certification Number | "490007" |
| `city` | VARCHAR(100) | City | "Falls Church" |
| `state` | CHAR(2) | State abbreviation | "VA" |
| `zip_code` | VARCHAR(10) | ZIP code | "22042" |

**Cardinality**: ~10-50 rows (Virginia hospitals + comparisons)

---

### Fact Tables

#### fact_prices
**Purpose**: Hospital-specific pricing data from MRF files

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `price_id` | INT | Primary key | 1 |
| `service_id` | INT | Foreign key → dim_service | 5 |
| `provider_id` | INT | Foreign key → dim_provider | 1 |
| `gross_charge` | DECIMAL(10,2) | Hospital list price | 11234.50 |
| `cash_price` | DECIMAL(10,2) | Self-pay discounted price | 3500.00 |
| `negotiated_min` | DECIMAL(10,2) | Minimum negotiated rate | 2200.00 |
| `negotiated_median` | DECIMAL(10,2) | Median negotiated rate | 2800.00 |
| `negotiated_max` | DECIMAL(10,2) | Maximum negotiated rate | 4500.00 |
| `payer_name` | VARCHAR(100) | Insurance company (if specific) | "Aetna" |
| `effective_date` | DATE | When rate became effective | 2024-01-01 |

**Cardinality**: ~200-2,000 rows (services × providers × payers)

**Grain**: One row per service-provider-payer combination

---

#### fact_benchmarks
**Purpose**: Medicare/CMS benchmark rates

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `benchmark_id` | INT | Primary key | 1 |
| `service_id` | INT | Foreign key → dim_service | 5 |
| `medicare_rate` | DECIMAL(10,2) | Medicare payment amount | 1850.00 |
| `source` | VARCHAR(20) | Data source | "OPPS" |
| `year` | INT | Effective year | 2024 |
| `locality` | VARCHAR(10) | Geographic locality (if applicable) | "0510" |

**Source values**:
- `OPPS` - Outpatient Prospective Payment System
- `PFS` - Physician Fee Schedule
- `CLFS` - Clinical Laboratory Fee Schedule

**Cardinality**: ~20-100 rows (one per service)

**Grain**: One row per service-year-source

---

#### fact_scenarios
**Purpose**: Patient responsibility calculation scenarios

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `scenario_id` | INT | Primary key | 1 |
| `scenario_name` | VARCHAR(100) | Scenario description | "Typical plan" |
| `copay` | DECIMAL(10,2) | ER copay amount | 250.00 |
| `deductible_remaining` | DECIMAL(10,2) | Deductible not yet met | 500.00 |
| `coinsurance_pct` | DECIMAL(5,2) | Coinsurance percentage | 20.00 |
| `oop_max_remaining` | DECIMAL(10,2) | Out-of-pocket max remaining | 3000.00 |

**Cardinality**: 3-10 rows (predefined scenarios)

**Grain**: One row per scenario

---

## Relationships

### Primary Relationships

```
fact_prices[service_id] → dim_service[service_id]  (Many-to-One)
fact_prices[provider_id] → dim_provider[provider_id]  (Many-to-One)
fact_benchmarks[service_id] → dim_service[service_id]  (Many-to-One)
```

### Relationship Properties (Power BI)
- **Cardinality**: Many-to-One (fact → dimension)
- **Cross-filter direction**: Single (dimension filters fact)
- **Active**: Yes

---

## Data Quality Rules

### dim_service
- ✅ No null values in `service_id`, `cpt_hcpcs`, `description`
- ✅ `cpt_hcpcs` must be unique
- ✅ `category` must be one of: `facility`, `imaging`, `lab`, `procedure`, `professional`

### dim_provider
- ✅ No null values in `provider_id`, `hospital_name`, `state`
- ✅ `ccn` must be unique (if present)
- ✅ `state` must be valid 2-letter code

### fact_prices
- ✅ `gross_charge >= cash_price >= negotiated_median` (typically)
- ✅ All foreign keys must exist in dimension tables
- ✅ `negotiated_min <= negotiated_median <= negotiated_max`

### fact_benchmarks
- ✅ `medicare_rate > 0`
- ✅ `source` must be one of: `OPPS`, `PFS`, `CLFS`
- ✅ Each service should have at least one benchmark

---

## Sample Data

### dim_service (excerpt)

| service_id | cpt_hcpcs | description | category |
|------------|-----------|-------------|----------|
| 1 | 99284 | ER visit, high complexity | facility |
| 2 | 70450 | CT head without contrast | imaging |
| 3 | 85025 | CBC with differential | lab |

### fact_prices (excerpt)

| price_id | service_id | provider_id | gross_charge | cash_price | negotiated_median |
|----------|------------|-------------|--------------|------------|-------------------|
| 1 | 2 | 1 | 11234.50 | 3500.00 | 2800.00 |
| 2 | 3 | 1 | 425.00 | 125.00 | 85.00 |

### fact_benchmarks (excerpt)

| benchmark_id | service_id | medicare_rate | source |
|--------------|------------|---------------|--------|
| 1 | 2 | 1850.00 | OPPS |
| 2 | 3 | 45.50 | CLFS |

---

## File Outputs

All tables will be saved as Parquet files for Power BI import:

```
data/processed/star_schema/
├── dim_service.parquet
├── dim_provider.parquet
├── fact_prices.parquet
├── fact_benchmarks.parquet
└── fact_scenarios.parquet
```

**Why Parquet?**
- ✅ Columnar format (fast for analytics)
- ✅ Compressed (smaller file size)
- ✅ Preserves data types
- ✅ Native Power BI support

---

## Usage in Power BI

### Import Process
1. Get Data → Parquet
2. Navigate to `data/processed/star_schema/`
3. Select all 5 parquet files
4. Load

### Auto-detected Relationships
Power BI should auto-detect relationships based on column names. Verify:
- `fact_prices[service_id]` → `dim_service[service_id]`
- `fact_prices[provider_id]` → `dim_provider[provider_id]`
- `fact_benchmarks[service_id]` → `dim_service[service_id]`

### Manual Relationship Creation (if needed)
1. Model view → Manage Relationships
2. Create new relationship
3. Select fact table → foreign key column
4. Select dimension table → primary key column
5. Set cardinality to Many-to-One
6. Set cross-filter direction to Single

---

## Extensibility

### Adding More Services
1. Add rows to `dim_service`
2. ETL pipeline will automatically join to prices/benchmarks

### Adding More Hospitals
1. Add rows to `dim_provider`
2. Download additional MRF files
3. Re-run ETL pipeline

### Adding Custom Scenarios
1. Add rows to `fact_scenarios`
2. Update Power BI parameters to reference new scenarios
