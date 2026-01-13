"""
Build Star Schema for Power BI
Combines hospital prices and benchmarks into analytics-ready tables
"""

import pandas as pd
from pathlib import Path
import logging
from config import (
    PROCESSED_DATA_DIR, BENCHMARKS_DIR, TOP_ER_SERVICES, 
    DEFAULT_SCENARIOS, HOSPITAL_MRF_URLS
)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def build_dim_service() -> pd.DataFrame:
    """
    Build service dimension table
    
    Returns:
        DataFrame with service catalog
    """
    logger.info("Building dim_service...")
    
    # Start with reference data
    services = []
    for idx, service in enumerate(TOP_ER_SERVICES, start=1):
        services.append({
            "service_id": idx,
            "cpt_hcpcs": service["code"],
            "description": service["description"],
            "category": service["category"],
            "modality": service.get("modality", service["category"])
        })
    
    df = pd.DataFrame(services)
    
    logger.info(f"✓ Created dim_service with {len(df)} services")
    
    return df


def build_dim_provider() -> pd.DataFrame:
    """
    Build provider dimension table
    
    Returns:
        DataFrame with hospital directory
    """
    logger.info("Building dim_provider...")
    
    providers = []
    for idx, (key, info) in enumerate(HOSPITAL_MRF_URLS.items(), start=1):
        providers.append({
            "provider_id": idx,
            "hospital_name": info["hospital_name"],
            "ccn": info.get("ccn", ""),
            "city": info["city"],
            "state": info["state"],
            "zip_code": ""  # Can be added later
        })
    
    df = pd.DataFrame(providers)
    
    logger.info(f"✓ Created dim_provider with {len(df)} hospitals")
    
    return df


def build_fact_prices(dim_service: pd.DataFrame, dim_provider: pd.DataFrame) -> pd.DataFrame:
    """
    Build prices fact table from processed MRF data
    
    Args:
        dim_service: Service dimension for ID mapping
        dim_provider: Provider dimension for ID mapping
        
    Returns:
        DataFrame with hospital prices
    """
    logger.info("Building fact_prices...")
    
    # Load processed hospital prices
    prices_file = PROCESSED_DATA_DIR / "hospital_prices.parquet"
    
    if not prices_file.exists():
        logger.warning("⚠️  No hospital prices file found")
        logger.info("Creating empty fact_prices table")
        return pd.DataFrame(columns=[
            "price_id", "service_id", "provider_id", "gross_charge", 
            "cash_price", "negotiated_min", "negotiated_median", 
            "negotiated_max", "payer_count"
        ])
    
    df = pd.read_parquet(prices_file)
    
    # Map to service IDs
    service_map = dim_service.set_index("cpt_hcpcs")["service_id"].to_dict()
    df["service_id"] = df["code"].map(service_map)
    
    # Map to provider IDs
    provider_map = dim_provider.set_index("hospital_name")["provider_id"].to_dict()
    df["provider_id"] = df["hospital_name"].map(provider_map)
    
    # Remove unmapped records
    df = df.dropna(subset=["service_id", "provider_id"])
    
    # Select and rename columns
    df = df[[
        "service_id", "provider_id", "gross_charge", "cash_price",
        "negotiated_min", "negotiated_median", "negotiated_max", "payer_count"
    ]].copy()
    
    # Add price_id
    df.insert(0, "price_id", range(1, len(df) + 1))
    
    # Convert IDs to integers
    df["service_id"] = df["service_id"].astype(int)
    df["provider_id"] = df["provider_id"].astype(int)
    
    logger.info(f"✓ Created fact_prices with {len(df)} records")
    
    return df


def build_fact_benchmarks(dim_service: pd.DataFrame) -> pd.DataFrame:
    """
    Build benchmarks fact table from CMS data
    
    Args:
        dim_service: Service dimension for ID mapping
        
    Returns:
        DataFrame with Medicare benchmarks
    """
    logger.info("Building fact_benchmarks...")
    
    # Load benchmarks
    benchmarks_file = BENCHMARKS_DIR / "cms_benchmarks.parquet"
    
    if not benchmarks_file.exists():
        logger.error("✗ No benchmarks file found")
        logger.info("Please run 03_process_benchmarks.py first")
        return pd.DataFrame()
    
    df = pd.read_parquet(benchmarks_file)
    
    # Map to service IDs
    service_map = dim_service.set_index("cpt_hcpcs")["service_id"].to_dict()
    df["service_id"] = df["code"].map(service_map)
    
    # Remove unmapped records
    df = df.dropna(subset=["service_id"])
    
    # Select and rename columns
    df = df[["service_id", "medicare_rate", "source", "year"]].copy()
    
    # Add benchmark_id
    df.insert(0, "benchmark_id", range(1, len(df) + 1))
    
    # Convert IDs to integers
    df["service_id"] = df["service_id"].astype(int)
    
    logger.info(f"✓ Created fact_benchmarks with {len(df)} records")
    
    return df


def build_fact_scenarios() -> pd.DataFrame:
    """
    Build scenarios fact table
    
    Returns:
        DataFrame with patient responsibility scenarios
    """
    logger.info("Building fact_scenarios...")
    
    scenarios = []
    for idx, (key, info) in enumerate(DEFAULT_SCENARIOS.items(), start=1):
        scenarios.append({
            "scenario_id": idx,
            "scenario_name": info["description"],
            "copay": info["copay"],
            "deductible_remaining": info["deductible_remaining"],
            "coinsurance_pct": info["coinsurance_pct"],
            "oop_max_remaining": 5000  # Default out-of-pocket max
        })
    
    df = pd.DataFrame(scenarios)
    
    logger.info(f"✓ Created fact_scenarios with {len(df)} scenarios")
    
    return df


def validate_star_schema(
    dim_service: pd.DataFrame,
    dim_provider: pd.DataFrame,
    fact_prices: pd.DataFrame,
    fact_benchmarks: pd.DataFrame,
    fact_scenarios: pd.DataFrame
) -> bool:
    """
    Validate star schema integrity
    
    Returns:
        True if all validations pass
    """
    logger.info("\n" + "=" * 60)
    logger.info("VALIDATING STAR SCHEMA")
    logger.info("=" * 60)
    
    all_valid = True
    
    # Check 1: No null primary keys
    if dim_service["service_id"].isnull().any():
        logger.error("✗ Null values in dim_service.service_id")
        all_valid = False
    else:
        logger.info("✓ dim_service.service_id has no nulls")
    
    if dim_provider["provider_id"].isnull().any():
        logger.error("✗ Null values in dim_provider.provider_id")
        all_valid = False
    else:
        logger.info("✓ dim_provider.provider_id has no nulls")
    
    # Check 2: Foreign key integrity
    if not fact_prices.empty:
        invalid_services = ~fact_prices["service_id"].isin(dim_service["service_id"])
        if invalid_services.any():
            logger.error(f"✗ {invalid_services.sum()} invalid service_id in fact_prices")
            all_valid = False
        else:
            logger.info("✓ All fact_prices.service_id are valid")
        
        invalid_providers = ~fact_prices["provider_id"].isin(dim_provider["provider_id"])
        if invalid_providers.any():
            logger.error(f"✗ {invalid_providers.sum()} invalid provider_id in fact_prices")
            all_valid = False
        else:
            logger.info("✓ All fact_prices.provider_id are valid")
    
    if not fact_benchmarks.empty:
        invalid_services = ~fact_benchmarks["service_id"].isin(dim_service["service_id"])
        if invalid_services.any():
            logger.error(f"✗ {invalid_services.sum()} invalid service_id in fact_benchmarks")
            all_valid = False
        else:
            logger.info("✓ All fact_benchmarks.service_id are valid")
    
    # Check 3: Data quality
    if not fact_benchmarks.empty:
        negative_rates = fact_benchmarks["medicare_rate"] <= 0
        if negative_rates.any():
            logger.error(f"✗ {negative_rates.sum()} non-positive medicare_rate values")
            all_valid = False
        else:
            logger.info("✓ All medicare_rate values are positive")
    
    # Check 4: Coverage
    services_with_benchmarks = fact_benchmarks["service_id"].nunique()
    total_services = len(dim_service)
    coverage = services_with_benchmarks / total_services if total_services > 0 else 0
    
    logger.info(f"✓ Benchmark coverage: {coverage:.1%} ({services_with_benchmarks}/{total_services} services)")
    
    if coverage < 0.8:
        logger.warning(f"⚠️  Low benchmark coverage ({coverage:.1%})")
    
    return all_valid


def save_star_schema(
    dim_service: pd.DataFrame,
    dim_provider: pd.DataFrame,
    fact_prices: pd.DataFrame,
    fact_benchmarks: pd.DataFrame,
    fact_scenarios: pd.DataFrame
):
    """
    Save all star schema tables to parquet files
    """
    logger.info("\n" + "=" * 60)
    logger.info("SAVING STAR SCHEMA")
    logger.info("=" * 60)
    
    output_dir = PROCESSED_DATA_DIR / "star_schema"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    tables = {
        "dim_service": dim_service,
        "dim_provider": dim_provider,
        "fact_prices": fact_prices,
        "fact_benchmarks": fact_benchmarks,
        "fact_scenarios": fact_scenarios
    }
    
    for table_name, df in tables.items():
        output_file = output_dir / f"{table_name}.parquet"
        df.to_parquet(output_file, index=False)
        
        file_size = output_file.stat().st_size / 1024
        logger.info(f"✓ Saved {table_name}: {len(df)} rows, {file_size:.2f} KB")
    
    logger.info(f"\n✓ All tables saved to: {output_dir}")


def print_summary(
    dim_service: pd.DataFrame,
    dim_provider: pd.DataFrame,
    fact_prices: pd.DataFrame,
    fact_benchmarks: pd.DataFrame,
    fact_scenarios: pd.DataFrame
):
    """Print summary statistics"""
    logger.info("\n" + "=" * 60)
    logger.info("STAR SCHEMA SUMMARY")
    logger.info("=" * 60)
    
    print(f"\n📊 Table Sizes:")
    print(f"  dim_service:      {len(dim_service):,} rows")
    print(f"  dim_provider:     {len(dim_provider):,} rows")
    print(f"  fact_prices:      {len(fact_prices):,} rows")
    print(f"  fact_benchmarks:  {len(fact_benchmarks):,} rows")
    print(f"  fact_scenarios:   {len(fact_scenarios):,} rows")
    
    if not fact_prices.empty:
        print(f"\n💰 Price Statistics:")
        print(fact_prices[["gross_charge", "cash_price", "negotiated_median"]].describe().round(2))
    
    if not fact_benchmarks.empty:
        print(f"\n📈 Benchmark Statistics:")
        print(fact_benchmarks.groupby("source")["medicare_rate"].describe().round(2))


def main():
    """Main orchestrator"""
    logger.info("🚀 Starting star schema build...\n")
    
    logger.info("=" * 60)
    logger.info("BUILDING STAR SCHEMA")
    logger.info("=" * 60)
    
    # Build dimension tables
    dim_service = build_dim_service()
    dim_provider = build_dim_provider()
    
    # Build fact tables
    fact_prices = build_fact_prices(dim_service, dim_provider)
    fact_benchmarks = build_fact_benchmarks(dim_service)
    fact_scenarios = build_fact_scenarios()
    
    # Validate
    is_valid = validate_star_schema(
        dim_service, dim_provider, fact_prices, 
        fact_benchmarks, fact_scenarios
    )
    
    if not is_valid:
        logger.warning("⚠️  Validation warnings detected, but continuing...")
    
    # Save
    save_star_schema(
        dim_service, dim_provider, fact_prices,
        fact_benchmarks, fact_scenarios
    )
    
    # Summary
    print_summary(
        dim_service, dim_provider, fact_prices,
        fact_benchmarks, fact_scenarios
    )
    
    logger.info("\n✅ Star schema build complete!")
    logger.info("\n📝 Next steps:")
    logger.info("1. Open Power BI Desktop")
    logger.info("2. Get Data → Parquet")
    logger.info(f"3. Navigate to: {PROCESSED_DATA_DIR / 'star_schema'}")
    logger.info("4. Select all 5 parquet files and load")


if __name__ == "__main__":
    main()
