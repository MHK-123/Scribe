FROM python:3.11-slim

WORKDIR /app

# Copy the bot requirements file
COPY bot/requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the bot code
COPY bot/ ./bot/

# Set Python path to ensure it can find modules
ENV PYTHONPATH=/app

# Start the bot
CMD ["python", "bot/bot.py"]
