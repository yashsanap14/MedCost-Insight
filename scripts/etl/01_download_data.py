"""
Download required datasets for ER Bill Explainer
"""

import requests
from pathlib import Path
from tqdm import tqdm
import logging
from config import DATA_SOURCES, RAW_DATA_DIR, HOSPITAL_MRF_URLS

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def download_file(url: str, destination: Path, description: str = "") -> bool:
    """
    Download a file with progress bar and resume capability
    
    Args:
        url: URL to download from
        destination: Local file path to save to
        description: Description for progress bar
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Check if file already exists
        if destination.exists():
            logger.info(f"File already exists: {destination.name}")
            response = input(f"Re-download {destination.name}? (y/n): ")
            if response.lower() != 'y':
                return True
        
        logger.info(f"Downloading: {description or url}")
        
        # Stream download with progress bar
        response = requests.get(url, stream=True, timeout=30)
        response.raise_for_status()
        
        total_size = int(response.headers.get('content-length', 0))
        
        with open(destination, 'wb') as f, tqdm(
            desc=destination.name,
            total=total_size,
            unit='iB',
            unit_scale=True,
            unit_divisor=1024,
        ) as pbar:
            for chunk in response.iter_content(chunk_size=8192):
                size = f.write(chunk)
                pbar.update(size)
        
        logger.info(f"✓ Downloaded: {destination.name}")
        return True
        
    except requests.exceptions.RequestException as e:
        logger.error(f"✗ Failed to download {url}: {e}")
        return False
    except Exception as e:
        logger.error(f"✗ Unexpected error downloading {url}: {e}")
        return False


def download_cms_datasets():
    """Download all CMS benchmark datasets"""
    logger.info("=" * 60)
    logger.info("DOWNLOADING CMS BENCHMARK DATASETS")
    logger.info("=" * 60)
    
    success_count = 0
    
    for source_key, source_info in DATA_SOURCES.items():
        destination = RAW_DATA_DIR / source_info["filename"]
        
        if download_file(
            url=source_info["url"],
            destination=destination,
            description=source_info["description"]
        ):
            success_count += 1
    
    logger.info(f"\nCMS Downloads: {success_count}/{len(DATA_SOURCES)} successful")
    return success_count == len(DATA_SOURCES)


def download_hospital_mrf():
    """Download hospital Machine-Readable Files (MRF)"""
    logger.info("\n" + "=" * 60)
    logger.info("DOWNLOADING HOSPITAL PRICE TRANSPARENCY FILES")
    logger.info("=" * 60)
    
    logger.warning(
        "\n⚠️  NOTE: Hospital MRF files can be very large (100MB - 2GB)."
        "\n   This may take several minutes."
    )
    
    success_count = 0
    
    for hospital_key, hospital_info in HOSPITAL_MRF_URLS.items():
        logger.info(f"\n📋 {hospital_info['hospital_name']}")
        
        # Note: Actual MRF URLs need to be found on hospital websites
        # This is a placeholder that will need manual update
        if "placeholder" in hospital_info["url"].lower() or "price-transparency" in hospital_info["url"]:
            logger.warning(
                f"⚠️  MRF URL for {hospital_info['hospital_name']} needs to be updated."
                f"\n   Please visit: {hospital_info['url']}"
                f"\n   Look for 'Machine-Readable File' or 'Standard Charges' link."
                f"\n   Update the URL in scripts/etl/config.py"
            )
            continue
        
        # Determine filename from hospital key
        destination = RAW_DATA_DIR / f"{hospital_key}_mrf.json"
        
        if download_file(
            url=hospital_info["url"],
            destination=destination,
            description=f"{hospital_info['hospital_name']} MRF"
        ):
            success_count += 1
    
    logger.info(f"\nHospital MRF Downloads: {success_count}/{len(HOSPITAL_MRF_URLS)} successful")
    return success_count > 0


def main():
    """Main download orchestrator"""
    logger.info("🚀 Starting data download process...\n")
    
    # Create raw data directory if it doesn't exist
    RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    # Download CMS datasets
    cms_success = download_cms_datasets()
    
    # Download hospital MRF files
    mrf_success = download_hospital_mrf()
    
    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("DOWNLOAD SUMMARY")
    logger.info("=" * 60)
    logger.info(f"CMS Datasets: {'✓ Success' if cms_success else '✗ Failed'}")
    logger.info(f"Hospital MRFs: {'✓ Success' if mrf_success else '⚠️  Needs manual URL update'}")
    
    if not mrf_success:
        logger.info("\n📝 NEXT STEPS:")
        logger.info("1. Visit hospital price transparency pages")
        logger.info("2. Find the Machine-Readable File (MRF) download link")
        logger.info("3. Update URLs in scripts/etl/config.py")
        logger.info("4. Re-run this script")
    
    logger.info("\n✅ Download process complete!")


if __name__ == "__main__":
    main()
