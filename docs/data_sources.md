# Data Sources Documentation

## Overview

This document provides detailed information about all data sources used in the ER Bill Explainer dashboard, including access methods, update schedules, and data dictionaries.

---

## 1. Hospital Price Transparency Files (MRF)

### Source
- **Authority**: Centers for Medicare & Medicaid Services (CMS)
- **Regulation**: Hospital Price Transparency Rule (effective January 1, 2021)
- **Website**: https://www.cms.gov/priorities/key-initiatives/hospital-price-transparency

### What It Contains
Machine-Readable Files (MRF) published by hospitals containing:
- Gross charges (list prices)
- Discounted cash prices
- Payer-specific negotiated rates
- De-identified minimum/maximum negotiated charges

### File Formats
- JSON (most common)
- CSV (some hospitals)
- File sizes: 100MB - 2GB+

### How to Access

#### Inova Health System
1. Visit: https://www.inova.org/price-transparency
2. Look for "Machine-Readable File" or "Standard Charges"
3. Download the JSON/CSV file

> [!NOTE]
> Hospital MRF URLs change periodically. If the link is broken, search for "[Hospital Name] price transparency" or "[Hospital Name] standard charges"

### Data Dictionary (Typical MRF Structure)

| Field | Description | Example |
|-------|-------------|---------|
| `description` | Service/item description | "CT HEAD W/O DYE" |
| `code` | CPT/HCPCS code | "70450" |
| `gross_charge` | Hospital list price | 11234.50 |
| `discounted_cash_price` | Self-pay price | 3500.00 |
| `payer_name` | Insurance company | "Aetna" |
| `negotiated_rate` | Insurer-specific rate | 2800.00 |

### Update Frequency
- **Required**: At least annually
- **Best Practice**: Quarterly or when rates change significantly

---

## 2. CMS Medicare Outpatient Hospitals Dataset

### Source
- **Website**: https://data.cms.gov/provider-summary-by-type-of-service/medicare-outpatient-hospitals
- **Direct Download**: CSV format, ~500MB

### What It Contains
- Medicare outpatient/ER services by hospital
- Average submitted charges
- Average Medicare payments
- Service volume

### Data Dictionary

| Field | Description |
|-------|-------------|
| `Rndrng_Prvdr_CCN` | CMS Certification Number (hospital ID) |
| `Rndrng_Prvdr_Org_Name` | Hospital name |
| `Rndrng_Prvdr_City` | City |
| `Rndrng_Prvdr_State_Abrvtn` | State (2-letter) |
| `APC` | Ambulatory Payment Classification code |
| `APC_Desc` | Service description |
| `Avg_Sbmtd_Chrg` | Average submitted charge |
| `Avg_Mdcr_Pymt_Amt` | Average Medicare payment |
| `Avg_Mdcr_Outlier_Amt` | Average outlier payment |

### Use Case
- Benchmark hospital charges against Medicare payments
- Identify geographic variation in pricing
- Compare Inova to other VA hospitals

### Update Frequency
- **Annual** (typically released in summer for prior calendar year)

---

## 3. CMS Physician Fee Schedule (PFS)

### Source
- **Website**: https://www.cms.gov/medicare/payment/fee-schedules/physician
- **Download**: RVU files (Relative Value Units)

### What It Contains
- Payment rates for physician/professional services
- Relative Value Units (RVUs) for work, practice expense, malpractice
- Geographic adjustment factors (GPCI)

### Key Files
- `RVUXX.zip` - Annual RVU file (XX = year, e.g., RVU23)
- Contains: CPT codes, work RVU, practice expense RVU, malpractice RVU

### Calculation Formula
```
Medicare Payment = (Work RVU × Work GPCI + 
                    PE RVU × PE GPCI + 
                    MP RVU × MP GPCI) × Conversion Factor
```

### Use Case
- Benchmark professional fees (e.g., radiologist reading CT scan)
- Separate facility vs professional components

### Update Frequency
- **Annual** (effective January 1)

---

## 4. CMS Clinical Laboratory Fee Schedule (CLFS)

### Source
- **Website**: https://www.cms.gov/medicare/payment/fee-schedules/clinical-laboratory-fee-schedule-clfs

### What It Contains
- Medicare payment rates for lab tests
- National limitation amounts
- Local fee schedules by state

### Data Dictionary

| Field | Description |
|-------|-------------|
| `HCPCS_Code` | Lab test code |
| `Test_Description` | Lab test name |
| `National_Limit` | Maximum Medicare payment |
| `Modifier` | Test modifier (if applicable) |

### Common ER Lab Tests in CLFS
- 85025 - CBC with differential
- 80053 - Comprehensive Metabolic Panel
- 81001 - Urinalysis

### Use Case
- Benchmark lab test prices
- Identify markup on common tests (CBC, CMP, UA)

### Update Frequency
- **Annual** (effective January 1)
- **Quarterly** updates for new tests

---

## Data Quality Considerations

### Hospital MRF Files
> [!WARNING]
> **Compliance varies**: Not all hospitals publish complete or well-formatted files. Common issues:
> - Missing CPT codes
> - Inconsistent payer names
> - Incomplete negotiated rates

**Mitigation**: Fall back to CMS benchmarks when hospital data is unavailable.

### CMS Datasets
> [!NOTE]
> **Lag time**: CMS data is typically 1-2 years behind current year.

**Example**: In 2026, the most recent complete data may be from 2024.

---

## Data Refresh Schedule

| Dataset | Refresh Frequency | Last Updated | Next Update |
|---------|-------------------|--------------|-------------|
| Hospital MRF | Annual (minimum) | Check hospital site | Varies |
| CMS Outpatient | Annual | Summer 2025 (2024 data) | Summer 2026 |
| PFS | Annual | Jan 1, 2026 | Jan 1, 2027 |
| CLFS | Annual | Jan 1, 2026 | Jan 1, 2027 |

---

## Accessing Data Programmatically

### CMS Data Portal API
Some CMS datasets support API access:

```python
import requests

# Example: CMS Outpatient Hospitals API
url = "https://data.cms.gov/data-api/v1/dataset/[dataset-id]/data"
response = requests.get(url, params={"limit": 1000})
data = response.json()
```

### Hospital MRF Files
- Typically require direct download (no API)
- Use `requests` library with streaming for large files

---

## Attribution

All data sources are **public domain** and provided by:
- Centers for Medicare & Medicaid Services (CMS)
- U.S. Department of Health and Human Services

**Citation Example**:
> Data sourced from CMS Hospital Price Transparency initiative and Medicare fee schedules. Centers for Medicare & Medicaid Services, 2024.

---

## Additional Resources

- [CMS Price Transparency FAQs](https://www.cms.gov/hospital-price-transparency/hospitals/faqs)
- [Hospital Price Transparency Enforcement](https://www.cms.gov/priorities/key-initiatives/hospital-price-transparency/enforcement)
- [Medicare Payment Systems Overview](https://www.cms.gov/outreach-and-education/medicare-learning-network-mln/mlnproducts/downloads/medicarepymtsys-factsheet.pdf)
