"""
Run complete ETL pipeline
Orchestrates all data processing steps
"""

import logging
import sys
from pathlib import Path

# Add scripts directory to path
sys.path.insert(0, str(Path(__file__).parent))

from config import PROJECT_ROOT

# Import ETL modules
try:
    from etl import download_data, process_mrf, process_benchmarks, build_star_schema
except ImportError:
    # If running as script, import directly
    import importlib.util
    
    def load_module(name, path):
        spec = importlib.util.spec_from_file_location(name, path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module
    
    etl_dir = Path(__file__).parent / "etl"
    download_data = load_module("download_data", etl_dir / "01_download_data.py")
    process_mrf = load_module("process_mrf", etl_dir / "02_process_mrf.py")
    process_benchmarks = load_module("process_benchmarks", etl_dir / "03_process_benchmarks.py")
    build_star_schema = load_module("build_star_schema", etl_dir / "04_build_star_schema.py")

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def run_full_pipeline():
    """
    Run complete ETL pipeline
    """
    logger.info("=" * 70)
    logger.info(" ER BILL EXPLAINER - FULL ETL PIPELINE")
    logger.info("=" * 70)
    
    try:
        # Step 1: Download data
        logger.info("\n🔽 STEP 1/4: Downloading data...")
        download_data.main()
        
        # Step 2: Process MRF files
        logger.info("\n🏥 STEP 2/4: Processing hospital MRF files...")
        process_mrf.main()
        
        # Step 3: Process benchmarks
        logger.info("\n📊 STEP 3/4: Processing CMS benchmarks...")
        process_benchmarks.main()
        
        # Step 4: Build star schema
        logger.info("\n⭐ STEP 4/4: Building star schema...")
        build_star_schema.main()
        
        logger.info("\n" + "=" * 70)
        logger.info("✅ PIPELINE COMPLETE!")
        logger.info("=" * 70)
        logger.info("\n📝 Next steps:")
        logger.info("1. Open Power BI Desktop")
        logger.info("2. Import parquet files from data/processed/star_schema/")
        logger.info("3. Build your dashboard!")
        
    except Exception as e:
        logger.error(f"\n✗ Pipeline failed: {e}")
        raise


if __name__ == "__main__":
    run_full_pipeline()
