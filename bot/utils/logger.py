import os
import logging
from logging.handlers import RotatingFileHandler

# ─── Ensure Logs Directory Exists ───
LOG_DIR = os.path.join(os.path.dirname(__file__), '..', 'logs')
os.makedirs(LOG_DIR, exist_ok=True)

# ─── Formatters ───
# Clean format for generic logs
general_formatter = logging.Formatter(
    '[{asctime}] [{levelname:<8}] {name}: {message}', 
    datefmt='%Y-%m-%d %H:%M:%S', 
    style='{'
)

def setup_logger(logger_name: str, log_file: str, level=logging.INFO):
    """
    Creates an advanced logger that outputs to both a rotating file and the console.
    """
    logger = logging.getLogger(logger_name)
    logger.setLevel(level)

    # Prevent assigning duplicate handlers if called multiple times
    if logger.hasHandlers():
        return logger

    # ── Console Handler ──
    console_handler = logging.StreamHandler()
    console_handler.setLevel(level)
    console_handler.setFormatter(general_formatter)

    # ── Rotating File Handler (Max 5MB per file, keeps 3 backups) ──
    file_handler = RotatingFileHandler(
        os.path.join(LOG_DIR, log_file), 
        maxBytes=5 * 1024 * 1024, 
        backupCount=3,
        encoding='utf-8'
    )
    file_handler.setLevel(level)
    file_handler.setFormatter(general_formatter)

    logger.addHandler(console_handler)
    logger.addHandler(file_handler)
    
    return logger

# Create the global logger instance for the bot
bot_logger = setup_logger('scribe_bot', 'bot.log')
