import os
import json
import logging

def get_pyxatu_config():
    """
    Get pyxatu configuration from environment variables or local config file.
    
    Returns:
        dict: A dictionary containing the pyxatu configuration.
    """
    # Check if environment variables are set (Heroku deployment)
    clickhouse_user = os.environ.get('CLICKHOUSE_USER')
    clickhouse_password = os.environ.get('CLICKHOUSE_PASSWORD')
    clickhouse_url = os.environ.get('CLICKHOUSE_URL')
    
    # If all environment variables are set, use them
    if clickhouse_user and clickhouse_password and clickhouse_url:
        logging.info("Using pyxatu configuration from environment variables")
        return {
            "CLICKHOUSE_USER": clickhouse_user,
            "CLICKHOUSE_PASSWORD": clickhouse_password,
            "CLICKHOUSE_URL": clickhouse_url
        }
    
    # Otherwise, try to read from the local config file
    config_path = os.path.expanduser("~/.pyxatu_config.json")
    if os.path.exists(config_path):
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
            logging.info("Using pyxatu configuration from local config file")
            return config
        except Exception as e:
            logging.error(f"Error reading pyxatu config file: {e}")
    
    # If no configuration is found, log an error
    logging.error("No pyxatu configuration found. Please set environment variables or create a config file.")
    return {} 