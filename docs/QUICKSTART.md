# Quick Start Guide

## 🚀 Get Started in 5 Minutes

This guide will help you set up the ER Bill Explainer project and start exploring the data.

---

## Prerequisites

- **Python 3.9+** installed
- **Power BI Desktop** (free download from Microsoft)
- **10GB+ free disk space** (for data files)
- **Internet connection** (for downloading datasets)

---

## Step 1: Set Up Python Environment

```bash
# Navigate to project directory
cd "ER-Bill-Explainer"

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Mac/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

**Expected output**: All packages installed successfully

---

## Step 2: Download Data

```bash
# Run the data download script
python scripts/etl/01_download_data.py
```

**What happens**:
- Downloads CMS benchmark datasets (~500MB)
- Attempts to download hospital MRF files
- Shows progress bars for each download

> [!NOTE]
> Hospital MRF URLs may need manual update. The script will guide you if needed.

**Expected time**: 5-15 minutes (depending on internet speed)

---

## Step 3: Process Data (Coming Soon)

```bash
# Process hospital MRF files
python scripts/etl/02_process_mrf.py

# Process CMS benchmarks
python scripts/etl/03_process_benchmarks.py

# Build star schema
python scripts/etl/04_build_star_schema.py
```

**Output**: Parquet files in `data/processed/star_schema/`

---

## Step 4: Open Power BI Dashboard (Coming Soon)

```bash
# Open the Power BI file
open powerbi/ER_Bill_Explainer.pbix
```

**First-time setup in Power BI**:
1. Click "Refresh" to load latest data
2. Navigate through 5 report pages
3. Adjust scenario parameters (copay, deductible, coinsurance)

---

## Project Structure

```
ER-Bill-Explainer/
├── data/
│   ├── raw/              # Downloaded files (large, git-ignored)
│   ├── processed/        # Cleaned data (parquet files)
│   ├── benchmarks/       # CMS benchmark data
│   └── reference/        # Top 20 ER services list
├── scripts/
│   └── etl/              # Data processing scripts
├── docs/                 # Documentation
├── powerbi/              # Power BI dashboard (coming soon)
├── README.md             # Main documentation
└── requirements.txt      # Python dependencies
```

---

## Troubleshooting

### Issue: "Module not found" error

**Solution**:
```bash
# Make sure virtual environment is activated
source venv/bin/activate  # Mac/Linux
# venv\Scripts\activate  # Windows

# Reinstall dependencies
pip install -r requirements.txt
```

### Issue: Download fails for hospital MRF

**Solution**:
1. Visit hospital price transparency page manually
2. Find "Machine-Readable File" link
3. Update URL in `scripts/etl/config.py`
4. Re-run download script

### Issue: Power BI can't find data files

**Solution**:
1. In Power BI, go to Transform Data → Data Source Settings
2. Update file path to point to your `data/processed/star_schema/` folder
3. Click "Refresh"

---

## Next Steps

1. ✅ **Explore the data**: Open parquet files in Python/Pandas to understand structure
2. ✅ **Customize services**: Edit `data/reference/top_er_services.csv` to add more services
3. ✅ **Add hospitals**: Update `scripts/etl/config.py` with more hospital MRF URLs
4. ✅ **Enhance dashboard**: Customize Power BI visuals and add your own insights

---

## Getting Help

- **Documentation**: See `docs/` folder for detailed guides
- **Data sources**: See `docs/data_sources.md`
- **Schema**: See `docs/star_schema.md`

---

## Portfolio Tips

When showcasing this project:

1. **Lead with the story**: "I had a confusing ER bill, so I built this..."
2. **Show the dashboard**: Screenshots/GIF of interactive features
3. **Highlight technical skills**: Python ETL, star schema, DAX, Power BI
4. **Emphasize real-world data**: CMS public datasets, price transparency
5. **Mention limitations**: Shows critical thinking

**Resume bullet example**:
> Built a Power BI dashboard using hospital price transparency files and CMS benchmarks to explain ER billing, processing 500MB+ of public healthcare data through a Python ETL pipeline into an analytics-ready star schema
