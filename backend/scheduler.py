import time
import subprocess
import logging
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def run_xatu_data_prep():
    """Run the xatu_data_prep.py script."""
    try:
        logger.info("Starting xatu_data_prep.py")
        
        # Check if we're running on Heroku
        is_heroku = os.environ.get('DYNO') is not None
        
        if is_heroku:
            # On Heroku, we need to use the full path or module import
            if os.path.exists('/app/backend/xatu_data_prep.py'):
                logger.info("Running on Heroku with backend directory")
                subprocess.run(["python", "/app/backend/xatu_data_prep.py"], check=True)
            else:
                logger.info("Running on Heroku with module import")
                subprocess.run(["python", "-m", "backend.xatu_data_prep"], check=True)
        else:
            # Locally, we can just run the script directly
            logger.info("Running locally")
            subprocess.run(["python", "xatu_data_prep.py"], check=True)
            
        logger.info("xatu_data_prep.py completed successfully")
    except subprocess.CalledProcessError as e:
        logger.error(f"Error running xatu_data_prep.py: {e}")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")

def main():
    """Main function to run the scheduler."""
    # Get the interval from environment variable or use default (12 seconds)
    interval = int(os.environ.get("XATU_UPDATE_INTERVAL", 12))
    
    logger.info(f"Starting scheduler with interval of {interval} seconds")
    
    while True:
        run_xatu_data_prep()
        logger.info(f"Sleeping for {interval} seconds")
        time.sleep(interval)

if __name__ == "__main__":
    main() 