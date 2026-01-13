"""
Process Inova Hospital CSV MRF Files
Specialized parser for Inova's CSV-format price transparency files
"""

import pandas as pd
from pathlib import Path
import logging
from typing import List, Dict
from config import RAW_DATA_DIR, PROCESSED_DATA_DIR, TOP_ER_SERVICES

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def parse_inova_csv_mrf(file_path: Path) -> pd.DataFrame:
    """
    Parse Inova's CSV MRF format
    
    Inova's format:
    - First 3 rows: metadata (hospital name, date, etc.)
    - Row 4: column headers
    - Data starts at row 5
    - Columns: description, revenue_code, setting, code, code_type, ...
    - Multiple payer-specific rate columns
    
    Args:
        file_path: Path to Inova CSV MRF
        
    Returns:
        DataFrame with extracted pricing data
    """
    logger.info(f"Parsing Inova CSV MRF: {file_path.name}")
    
    # Read file, skipping metadata rows
    # Use latin-1 encoding to handle special characters
    df = pd.read_csv(file_path, skiprows=3, low_memory=False, encoding='latin-1')
    
    logger.info(f"Loaded {len(df)} rows from {file_path.name}")
    
    # The structure appears to be:
    # Col 0: Description
    # Col 1: Revenue Code
    # Col 2: Setting (RC = Revenue Code)
    # Col 3: Code (CPT/HCPCS)
    # Col 4: Code Type
    # Col 5: Setting Type
    # Then various price columns
    
    # Get column names (first row after metadata)
    col_names = df.columns.tolist()
    
    # Extract key columns
    # Based on the sample, columns are positional
    records = []
    
    for idx, row in df.iterrows():
        try:
            # Extract basic info from first few columns
            description = str(row.iloc[0]) if pd.notna(row.iloc[0]) else ""
            revenue_code = str(row.iloc[1]) if pd.notna(row.iloc[1]) else ""
            code = str(row.iloc[3]) if pd.notna(row.iloc[3]) else ""
            code_type = str(row.iloc[4]) if pd.notna(row.iloc[4]) else ""
            
            # Skip if no code
            if not code or code == "nan":
                continue
            
            # Extract pricing columns (positions may vary, but typically:)
            # Col 9: Gross Charge
            # Col 10: De-identified Min
            # Col 11: De-identified Max / Cash Price
            
            gross_charge = None
            cash_price = None
            
            try:
                if pd.notna(row.iloc[9]):
                    gross_charge = float(row.iloc[9])
            except (ValueError, IndexError):
                pass
            
            try:
                if pd.notna(row.iloc[11]):
                    cash_price = float(row.iloc[11])
            except (ValueError, IndexError):
                pass
            
            # Extract negotiated rates from remaining columns
            # Payer-specific rates appear in groups of 3: rate, percentage, method
            negotiated_rates = []
            
            # Scan columns for numeric values that look like rates
            for col_idx in range(12, min(len(row), 100), 3):  # Check every 3rd column
                try:
                    if pd.notna(row.iloc[col_idx]):
                        rate = float(row.iloc[col_idx])
                        if rate > 0 and rate < 100000:  # Sanity check
                            negotiated_rates.append(rate)
                except (ValueError, IndexError):
                    continue
            
            records.append({
                "code": code.strip(),
                "description": description.strip(),
                "revenue_code": revenue_code,
                "code_type": code_type,
                "gross_charge": gross_charge,
                "cash_price": cash_price,
                "negotiated_rates": negotiated_rates,
                "hospital_name": "Inova Alexandria Hospital"
            })
            
        except Exception as e:
            logger.debug(f"Skipping row {idx}: {e}")
            continue
    
    result_df = pd.DataFrame(records)
    
    logger.info(f"✓ Extracted {len(result_df)} charge records")
    
    return result_df


def filter_to_er_services(df: pd.DataFrame) -> pd.DataFrame:
    """
    Filter to only ER-relevant services from TOP_ER_SERVICES
    
    Args:
        df: DataFrame with all charges
        
    Returns:
        Filtered DataFrame
    """
    target_codes = [service["code"] for service in TOP_ER_SERVICES]
    
    filtered = df[df["code"].isin(target_codes)].copy()
    
    logger.info(f"Filtered to {len(filtered)} ER-relevant services (from {len(df)} total)")
    logger.info(f"Found codes: {sorted(filtered['code'].unique())}")
    
    return filtered


def calculate_negotiated_stats(negotiated_rates: List[float]) -> Dict:
    """
    Calculate min, median, max from negotiated rates
    
    Args:
        negotiated_rates: List of rates
        
    Returns:
        Dict with min, median, max, payer_count
    """
    if not negotiated_rates or len(negotiated_rates) == 0:
        return {
            "negotiated_min": None,
            "negotiated_median": None,
            "negotiated_max": None,
            "payer_count": 0
        }
    
    rates = [r for r in negotiated_rates if r > 0]
    
    if not rates:
        return {
            "negotiated_min": None,
            "negotiated_median": None,
            "negotiated_max": None,
            "payer_count": 0
        }
    
    return {
        "negotiated_min": min(rates),
        "negotiated_median": pd.Series(rates).median(),
        "negotiated_max": max(rates),
        "payer_count": len(rates)
    }


def expand_negotiated_rates(df: pd.DataFrame) -> pd.DataFrame:
    """
    Expand negotiated_rates column into min/median/max columns
    
    Args:
        df: DataFrame with negotiated_rates column
        
    Returns:
        DataFrame with expanded columns
    """
    stats = df["negotiated_rates"].apply(calculate_negotiated_stats)
    stats_df = pd.DataFrame(stats.tolist())
    
    result = pd.concat([df.drop("negotiated_rates", axis=1), stats_df], axis=1)
    
    return result


def process_inova_mrf_files() -> pd.DataFrame:
    """
    Process all Inova CSV MRF files in raw data directory
    
    Returns:
        Combined DataFrame of all hospital prices
    """
    logger.info("=" * 60)
    logger.info("PROCESSING INOVA CSV MRF FILES")
    logger.info("=" * 60)
    
    all_data = []
    
    # Find all Inova MRF files (CSV format)
    mrf_files = list(RAW_DATA_DIR.glob("inova*_mrf.csv"))
    
    if not mrf_files:
        logger.warning("⚠️  No Inova MRF files found in data/raw/")
        logger.info("Expected filename pattern: inova*_mrf.csv")
        return pd.DataFrame()
    
    for mrf_file in mrf_files:
        # Parse Inova CSV
        df = parse_inova_csv_mrf(mrf_file)
        
        if df.empty:
            logger.warning(f"No charges extracted from {mrf_file.name}")
            continue
        
        # Filter to ER services
        df_filtered = filter_to_er_services(df)
        
        if df_filtered.empty:
            logger.warning(f"No ER services found in {mrf_file.name}")
            continue
        
        all_data.append(df_filtered)
    
    if not all_data:
        logger.error("✗ No data extracted from any MRF files")
        return pd.DataFrame()
    
    # Combine all hospitals
    combined = pd.concat(all_data, ignore_index=True)
    
    # Expand negotiated rates
    combined = expand_negotiated_rates(combined)
    
    logger.info(f"\n✓ Processed {len(mrf_files)} MRF files")
    logger.info(f"✓ Total records: {len(combined)}")
    logger.info(f"✓ Unique services: {combined['code'].nunique()}")
    logger.info(f"✓ Hospitals: {combined['hospital_name'].nunique()}")
    
    return combined


def save_processed_data(df: pd.DataFrame):
    """
    Save processed MRF data to parquet
    
    Args:
        df: Processed DataFrame
    """
    output_file = PROCESSED_DATA_DIR / "hospital_prices.parquet"
    
    df.to_parquet(output_file, index=False)
    
    logger.info(f"\n✓ Saved to: {output_file}")
    logger.info(f"  File size: {output_file.stat().st_size / 1024 / 1024:.2f} MB")


def main():
    """Main processing orchestrator"""
    logger.info("🚀 Starting Inova MRF processing...\n")
    
    # Create processed directory if needed
    PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    # Process all MRF files
    df = process_inova_mrf_files()
    
    if df.empty:
        logger.error("\n✗ No data to save. Please check MRF files.")
        return
    
    # Save processed data
    save_processed_data(df)
    
    # Summary statistics
    logger.info("\n" + "=" * 60)
    logger.info("SUMMARY STATISTICS")
    logger.info("=" * 60)
    
    print("\nServices found:")
    print(df.groupby("code")["description"].first())
    
    print("\n\nPrice ranges by service:")
    summary = df.groupby("code").agg({
        "gross_charge": ["min", "median", "max"],
        "cash_price": "median",
        "negotiated_median": "median",
        "payer_count": "first"
    }).round(2)
    print(summary)
    
    logger.info("\n✅ Inova MRF processing complete!")


if __name__ == "__main__":
    main()
