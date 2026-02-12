# Ensure .env is loaded whenever the app package is imported
try:
    from dotenv import load_dotenv  # type: ignore
    load_dotenv()
except Exception:
    # If python-dotenv is not installed or fails, ignore; server can still be
    # started with `--env-file .env` or system env vars.
    pass

# Basic logging setup so app logs are visible in uvicorn output
import logging
import os
import sys

_level = os.getenv("LOG_LEVEL", "INFO").upper()

root = logging.getLogger()
if not root.handlers:
    handler = logging.StreamHandler(sys.stdout)
    fmt = logging.Formatter("%(asctime)s %(levelname)s %(name)s: %(message)s")
    handler.setFormatter(fmt)
    root.addHandler(handler)
root.setLevel(getattr(logging, _level, logging.INFO))

# Make sure our app logger is at least INFO by default
logging.getLogger("app").setLevel(getattr(logging, _level, logging.INFO))
