"""
Configuration for ER Bill Explainer ETL Pipeline
"""

from pathlib import Path

# Project paths
PROJECT_ROOT = Path(__file__).parent.parent.parent
DATA_DIR = PROJECT_ROOT / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
BENCHMARKS_DIR = DATA_DIR / "benchmarks"
REFERENCE_DIR = DATA_DIR / "reference"

# Create directories if they don't exist
for dir_path in [RAW_DATA_DIR, PROCESSED_DATA_DIR, BENCHMARKS_DIR, REFERENCE_DIR]:
    dir_path.mkdir(parents=True, exist_ok=True)

# Data source URLs
DATA_SOURCES = {
    "cms_outpatient": {
        "url": "https://data.cms.gov/provider-summary-by-type-of-service/medicare-outpatient-hospitals/medicare-outpatient-hospitals-by-provider-and-service/data",
        "filename": "cms_outpatient_hospitals.csv",
        "description": "CMS Medicare Outpatient Hospitals by Provider and Service"
    },
    "cms_pfs": {
        "url": "https://www.cms.gov/medicaremedicare-fee-service-paymentphysicianfeeschedpfs-relative-value-files/rvu23a",
        "filename": "pfs_rvu_2023.zip",
        "description": "CMS Physician Fee Schedule RVU File"
    },
    "cms_clfs": {
        "url": "https://www.cms.gov/medicare/payment/fee-schedules/clinical-laboratory-fee-schedule-clfs",
        "filename": "clfs_2023.zip",
        "description": "CMS Clinical Laboratory Fee Schedule"
    }
}

# Hospital-specific MRF URLs (to be updated with actual Inova URLs)
HOSPITAL_MRF_URLS = {
    "inova_alexandria": {
        "url": "https://www.inova.org/price-transparency",  # Actual file obtained
        "hospital_name": "Inova Alexandria Hospital",
        "ccn": "490089",  # CMS Certification Number for Alexandria
        "city": "Alexandria",
        "state": "VA"
    },
    "inova_fairfax": {
        "url": "https://www.inova.org/price-transparency",  # Placeholder - need actual MRF URL
        "hospital_name": "Inova Fairfax Hospital",
        "ccn": "490007",  # CMS Certification Number
        "city": "Falls Church",
        "state": "VA"
    }
}

# Top 20 Common ER Services (CPT/HCPCS codes)
TOP_ER_SERVICES = [
    # ER Visit Levels
    {"code": "99281", "description": "ER visit, minimal complexity", "category": "facility"},
    {"code": "99282", "description": "ER visit, low complexity", "category": "facility"},
    {"code": "99283", "description": "ER visit, moderate complexity", "category": "facility"},
    {"code": "99284", "description": "ER visit, high complexity", "category": "facility"},
    {"code": "99285", "description": "ER visit, very high complexity", "category": "facility"},
    
    # Imaging - CT
    {"code": "70450", "description": "CT head/brain without contrast", "category": "imaging"},
    {"code": "70486", "description": "CT face without contrast", "category": "imaging"},
    {"code": "71045", "description": "Chest X-ray, single view", "category": "imaging"},
    {"code": "71046", "description": "Chest X-ray, 2 views", "category": "imaging"},
    {"code": "73610", "description": "Ankle X-ray, 3+ views", "category": "imaging"},
    
    # Lab Tests
    {"code": "85025", "description": "Complete Blood Count (CBC) with differential", "category": "lab"},
    {"code": "80053", "description": "Comprehensive Metabolic Panel (CMP)", "category": "lab"},
    {"code": "81001", "description": "Urinalysis, automated", "category": "lab"},
    {"code": "82947", "description": "Glucose, blood quantitative", "category": "lab"},
    {"code": "85610", "description": "Prothrombin time (PT)", "category": "lab"},
    
    # Procedures
    {"code": "12001", "description": "Simple repair, superficial wound", "category": "procedure"},
    {"code": "29125", "description": "Application of short arm splint", "category": "procedure"},
    {"code": "36415", "description": "Routine venipuncture", "category": "procedure"},
    {"code": "96372", "description": "Injection, subcutaneous/intramuscular", "category": "procedure"},
    {"code": "94640", "description": "Nebulizer treatment", "category": "procedure"},
]

# State filter (expand as needed)
TARGET_STATES = ["VA", "MD", "DC"]

# Data quality thresholds
DATA_QUALITY_THRESHOLDS = {
    "min_services_coverage": 0.8,  # At least 80% of target services should have data
    "max_null_percentage": 0.1,    # Max 10% null values in key fields
    "min_benchmark_coverage": 0.9  # At least 90% of services should have Medicare benchmarks
}

# Patient responsibility scenario defaults
DEFAULT_SCENARIOS = {
    "low_deductible": {
        "copay": 250,
        "deductible_remaining": 0,
        "coinsurance_pct": 10,
        "description": "Low deductible plan, deductible already met"
    },
    "high_deductible": {
        "copay": 0,
        "deductible_remaining": 2000,
        "coinsurance_pct": 20,
        "description": "High deductible plan, deductible not met"
    },
    "typical": {
        "copay": 250,
        "deductible_remaining": 500,
        "coinsurance_pct": 20,
        "description": "Typical plan with partial deductible remaining"
    }
}
