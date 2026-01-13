"""
Process CMS Benchmark Data
Normalizes Medicare payment benchmarks from PFS, CLFS, and OPPS
"""

import pandas as pd
from pathlib import Path
import logging
from typing import Optional
from config import RAW_DATA_DIR, BENCHMARKS_DIR, TOP_ER_SERVICES

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def process_cms_outpatient() -> pd.DataFrame:
    """
    Process CMS Outpatient Hospitals dataset
    
    Returns:
        DataFrame with service benchmarks from OPPS
    """
    logger.info("Processing CMS Outpatient Hospitals dataset...")
    
    # Look for downloaded CMS file
    cms_file = RAW_DATA_DIR / "cms_outpatient_hospitals.csv"
    
    if not cms_file.exists():
        logger.warning(f"⚠️  CMS Outpatient file not found: {cms_file}")
        logger.info("Creating sample benchmark data instead...")
        return create_sample_benchmarks()
    
    try:
        # Load CMS data
        df = pd.read_csv(cms_file, low_memory=False)
        
        logger.info(f"Loaded {len(df)} records from CMS Outpatient dataset")
        
        # Filter to relevant columns
        # Note: Actual column names may vary - adjust based on real file
        if "APC" in df.columns and "Avg_Mdcr_Pymt_Amt" in df.columns:
            df_filtered = df[["APC", "APC_Desc", "Avg_Mdcr_Pymt_Amt"]].copy()
            df_filtered.columns = ["code", "description", "medicare_rate"]
        else:
            logger.warning("Expected columns not found, using sample data")
            return create_sample_benchmarks()
        
        # Remove nulls
        df_filtered = df_filtered.dropna(subset=["medicare_rate"])
        
        # Add metadata
        df_filtered["source"] = "OPPS"
        df_filtered["year"] = 2024
        
        logger.info(f"✓ Extracted {len(df_filtered)} OPPS benchmarks")
        
        return df_filtered
        
    except Exception as e:
        logger.error(f"Error processing CMS Outpatient: {e}")
        return create_sample_benchmarks()


def create_sample_benchmarks() -> pd.DataFrame:
    """
    Create sample benchmark data based on typical Medicare rates
    
    This is used when actual CMS files are not available.
    Rates are approximate and based on 2024 Medicare fee schedules.
    
    Returns:
        DataFrame with sample benchmarks
    """
    logger.info("Creating sample benchmark data...")
    
    # Sample Medicare rates for common ER services
    sample_data = [
        # ER Visit Levels (Facility fees)
        {"code": "99281", "description": "ER visit, minimal", "medicare_rate": 150.00, "source": "OPPS"},
        {"code": "99282", "description": "ER visit, low", "medicare_rate": 250.00, "source": "OPPS"},
        {"code": "99283", "description": "ER visit, moderate", "medicare_rate": 450.00, "source": "OPPS"},
        {"code": "99284", "description": "ER visit, high", "medicare_rate": 750.00, "source": "OPPS"},
        {"code": "99285", "description": "ER visit, very high", "medicare_rate": 1200.00, "source": "OPPS"},
        
        # Imaging - CT
        {"code": "70450", "description": "CT head without contrast", "medicare_rate": 1850.00, "source": "OPPS"},
        {"code": "70486", "description": "CT face without contrast", "medicare_rate": 1650.00, "source": "OPPS"},
        {"code": "71045", "description": "Chest X-ray, single", "medicare_rate": 85.00, "source": "OPPS"},
        {"code": "71046", "description": "Chest X-ray, 2 views", "medicare_rate": 120.00, "source": "OPPS"},
        {"code": "73610", "description": "Ankle X-ray, 3+ views", "medicare_rate": 95.00, "source": "OPPS"},
        
        # Lab Tests
        {"code": "85025", "description": "CBC with differential", "medicare_rate": 45.50, "source": "CLFS"},
        {"code": "80053", "description": "Comprehensive Metabolic Panel", "medicare_rate": 65.00, "source": "CLFS"},
        {"code": "81001", "description": "Urinalysis, automated", "medicare_rate": 12.50, "source": "CLFS"},
        {"code": "82947", "description": "Glucose, blood", "medicare_rate": 8.50, "source": "CLFS"},
        {"code": "85610", "description": "Prothrombin time", "medicare_rate": 18.00, "source": "CLFS"},
        
        # Procedures
        {"code": "12001", "description": "Simple wound repair", "medicare_rate": 180.00, "source": "PFS"},
        {"code": "29125", "description": "Short arm splint", "medicare_rate": 95.00, "source": "PFS"},
        {"code": "36415", "description": "Routine venipuncture", "medicare_rate": 8.00, "source": "CLFS"},
        {"code": "96372", "description": "Injection, subcut/IM", "medicare_rate": 35.00, "source": "PFS"},
        {"code": "94640", "description": "Nebulizer treatment", "medicare_rate": 45.00, "source": "PFS"},
    ]
    
    df = pd.DataFrame(sample_data)
    df["year"] = 2024
    
    logger.info(f"✓ Created {len(df)} sample benchmarks")
    logger.warning("⚠️  Using sample data - download actual CMS files for real benchmarks")
    
    return df


def validate_benchmarks(df: pd.DataFrame) -> pd.DataFrame:
    """
    Validate benchmark data quality
    
    Args:
        df: Benchmark DataFrame
        
    Returns:
        Validated DataFrame
    """
    logger.info("Validating benchmark data...")
    
    initial_count = len(df)
    
    # Remove negative or zero rates
    df = df[df["medicare_rate"] > 0].copy()
    
    # Remove duplicates (keep first)
    df = df.drop_duplicates(subset=["code", "source"], keep="first")
    
    # Check coverage of target services
    target_codes = [service["code"] for service in TOP_ER_SERVICES]
    covered_codes = df[df["code"].isin(target_codes)]["code"].unique()
    coverage = len(covered_codes) / len(target_codes)
    
    logger.info(f"✓ Validation complete:")
    logger.info(f"  - Removed {initial_count - len(df)} invalid records")
    logger.info(f"  - Coverage: {coverage:.1%} of target ER services")
    
    if coverage < 0.8:
        logger.warning(f"⚠️  Low coverage ({coverage:.1%}) - consider adding more benchmarks")
    
    return df


def save_benchmarks(df: pd.DataFrame):
    """
    Save benchmark data to parquet
    
    Args:
        df: Benchmark DataFrame
    """
    output_file = BENCHMARKS_DIR / "cms_benchmarks.parquet"
    
    df.to_parquet(output_file, index=False)
    
    logger.info(f"\n✓ Saved to: {output_file}")
    logger.info(f"  File size: {output_file.stat().st_size / 1024:.2f} KB")


def main():
    """Main processing orchestrator"""
    logger.info("🚀 Starting benchmark processing...\n")
    
    logger.info("=" * 60)
    logger.info("PROCESSING CMS BENCHMARKS")
    logger.info("=" * 60)
    
    # Create benchmarks directory if needed
    BENCHMARKS_DIR.mkdir(parents=True, exist_ok=True)
    
    # Process CMS Outpatient (or create samples)
    df = process_cms_outpatient()
    
    if df.empty:
        logger.error("✗ No benchmark data available")
        return
    
    # Validate
    df = validate_benchmarks(df)
    
    # Save
    save_benchmarks(df)
    
    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("SUMMARY STATISTICS")
    logger.info("=" * 60)
    
    print("\nBenchmarks by source:")
    print(df.groupby("source")["medicare_rate"].agg(["count", "min", "median", "max"]).round(2))
    
    print("\nTop 10 highest Medicare rates:")
    print(df.nlargest(10, "medicare_rate")[["code", "description", "medicare_rate", "source"]])
    
    logger.info("\n✅ Benchmark processing complete!")


if __name__ == "__main__":
    main()
