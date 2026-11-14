# AWS All-In-One Deployment Guide (LeadA360)

This guide deploys both the **Frontend (React)** and **Backend (Django)** onto AWS.

---

### **Cost Reality Check (Actual vs Estimate)**
* **AWS SES is strictly Pay-As-You-Go**:
  * You only pay **$0.10 for every 1,000 emails actually sent**.
  * If you send 5,000 emails in a month = **$0.50**.
  * If you don't send emails on certain days, you pay **$0**.
* **AWS Free Tier (if your account is < 12 months old)**:
  * EC2 `t3.micro`: **750 hours/month FREE** ($0).
  * RDS PostgreSQL `db.t3.micro`: **750 hours/month FREE** ($0).
  * **Actual initial AWS bill: ~$5 – $15/month total!**

---

### **Step 1: Launch an AWS EC2 Instance**

1. Go to the **AWS EC2 Console** in **ap-south-1 (Mumbai)**:
   * **AMI**: `Ubuntu Server 24.04 LTS` (64-bit x86)
   * **Instance Type**: `t3.micro` (Free-tier eligible) or `t3.small` ($15/mo)
   * **Key Pair**: Create or select your `.pem` key pair (e.g. `leada360-key.pem`)
2. **Network & Security Groups (Allow Inbound Ports)**:
   * **SSH**: Port `22` (Your IP)
   * **HTTP**: Port `80` (Anywhere `0.0.0.0/0`)
   * **HTTPS**: Port `443` (Anywhere `0.0.0.0/0`)

---

### **Step 2: Connect to your EC2 Instance**

In your local terminal (where your `.pem` file is located):
```bash
chmod 400 leada360-key.pem
ssh -i "leada360-key.pem" ubuntu@<YOUR_EC2_PUBLIC_IP>
```

---

### **Step 3: Transfer & Setup Code on EC2**

On the EC2 server, clone or copy the project:
```bash
sudo mkdir -p /var/www/leada360
sudo chown -R ubuntu:ubuntu /var/www/leada360

# Option A: Git clone
git clone <YOUR_GIT_REPO_URL> /var/www/leada360

# Option B: Run the automated setup script
chmod +x /var/www/leada360/deploy_aws_ec2.sh
/var/www/leada360/deploy_aws_ec2.sh
```

---

### **Step 4: Build the React Frontend on EC2**

```bash
cd /var/www/leada360/frontend
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

npm install
npm run build
```

---

### **Step 5: Configure Backend `.env` & Run Migrations**

In `/var/www/leada360/backend/.env`:
```env
DEBUG=False
SECRET_KEY=generate-a-strong-random-key-here
ALLOWED_HOSTS=<YOUR_EC2_PUBLIC_IP>,api.yourdomain.com,yourdomain.com

# RDS PostgreSQL Connection
DATABASE_URL=postgres://campaign:leada360campaign^123@leada360-campaign-db.cf4masc4ihe7.ap-south-1.rds.amazonaws.com:5432/leada360_campaign

# Telemetry URL
TRACKING_BASE_URL=http://<YOUR_EC2_PUBLIC_IP>

# AWS SES credentials
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
AWS_DEFAULT_REGION=ap-south-1
```

Run database migrations and start the service:
```bash
cd /var/www/leada360/backend
source venv/bin/activate
python manage.py migrate
sudo systemctl restart leada360
sudo systemctl restart nginx
```

---

### **Step 6: Access Your Live Application**

Open your browser and visit:
`http://<YOUR_EC2_PUBLIC_IP>`

* **Frontend**: Loaded instantly via Nginx.
* **Backend API**: Proxied securely to Django Gunicorn.
* **Database**: Direct, zero-latency connection to your AWS RDS Mumbai instance.
* **Emails**: Dispatched directly via AWS SES.

