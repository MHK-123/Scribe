# 🛡️ Scribe Core: Linux VPS Hosting Guide
This guide provides instructions for deploying Scribe on a Linux VPS (Ubuntu 22.04 / Oracle Cloud).

## 🚀 1. Initial Sanctum Setup
Connect to your VPS via SSH and prepare the environment:
```bash
# Update system indices
sudo apt update && sudo apt upgrade -y

# Install Python 3.11 and Git if missing
sudo apt install python3.11 python3-pip git -y
```

## 📜 2. Manifesting the Scribe
Clone your repository and install dependencies:
```bash
# Clone the repository
git clone <YOUR_REPO_URL>
cd <REPO_NAME>

# Install required rituals
pip3 install -r requirements.txt
```

## 💎 3. Soul Binding (.env)
Create the configuration file and bind your secrets:
```bash
nano .env
```
Paste the following, replacing placeholders with your actual values:
```env
TOKEN=your_discord_bot_token_here
DATABASE_URL=postgresql://user:password@host:port/dbname
API_URL=https://your-backend-url.com
```
*Press `Ctrl+O` then `Enter` to save, and `Ctrl+X` to exit.*

## 🔥 4. Ignition (Execution)

### Option A: Standard Run (Testing)
Perfect for verifying the bot's manifestation:
```bash
python3 main.py
```

### Option B: Production (systemd Service)
The recommended way for 24/7 autonomous operation:
```bash
# Create service file
sudo nano /etc/systemd/system/scribe.service
```
Paste this configuration (adjust `User` and `WorkingDirectory`):
```ini
[Unit]
Description=Scribe Discord Bot
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/Scribe
ExecStart=/usr/bin/python3 main.py
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=scribe-bot

[Install]
WantedBy=multi-user.target
```
Start and enable the sentinel:
```bash
sudo systemctl daemon-reload
sudo systemctl enable scribe
sudo systemctl start scribe
```

## 📡 5. Observation (Logs)
Monitor the bot's rituals and detect anomalies:
```bash
# View live logs
journalctl -u scribe -f
```

---
> [!TIP]
> **Performance Note**: Scribe is optimized for 1GB RAM. If you encounter memory pressure, ensure no other heavy services are running on the same instance.
