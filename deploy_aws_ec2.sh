#!/bin/bash
set -e

echo "=========================================="
echo " LeadA360 All-AWS Server Setup"
echo "=========================================="

# 1. Update OS packages
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-pip python3-venv git nginx certbot python3-certbot-nginx libpq-dev curl

# 2. Setup project folder
PROJECT_DIR="/var/www/leada360"
sudo mkdir -p $PROJECT_DIR
sudo chown -R ubuntu:ubuntu $PROJECT_DIR

echo ">>> Setting up Python virtual environment..."
cd $PROJECT_DIR/backend || true
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 3. Create Gunicorn Systemd Service
echo ">>> Creating Gunicorn Systemd service..."
sudo bash -c 'cat > /etc/systemd/system/leada360.service <<EOF
[Unit]
Description=LeadA360 Django Gunicorn Daemon
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/var/www/leada360/backend
ExecStart=/var/www/leada360/backend/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:8000 config.wsgi:application --timeout 120
Restart=always

[Install]
WantedBy=multi-user.target
EOF'

sudo systemctl daemon-reload
sudo systemctl enable leada360

# 4. Configure Nginx Reverse Proxy
echo ">>> Configuring Nginx..."
sudo bash -c 'cat > /etc/nginx/sites-available/leada360 <<EOF
server {
    listen 80;
    server_name _;

    # Serve built React Frontend
    root /var/www/leada360/frontend/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Proxy API and Telemetry requests to Django
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Static assets
    location /static/ {
        alias /var/www/leada360/backend/staticfiles/;
    }
}
EOF'

sudo ln -sf /etc/nginx/sites-available/leada360 /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo "=========================================="
echo " AWS EC2 LeadA360 Setup Complete! "
echo "=========================================="

