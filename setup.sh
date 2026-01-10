#!/bin/bash
# Ghost Servers - VPS Setup Script
# Run: curl -sL https://raw.githubusercontent.com/Davveravve/ghostserver/main/setup.sh | bash

set -e

echo "=========================================="
echo "  Ghost Servers - VPS Setup"
echo "=========================================="

# Update system
echo "[1/5] Updating system..."
apt update && apt upgrade -y

# Install MySQL
echo "[2/5] Installing MySQL..."
apt install -y mysql-server

# Start MySQL
systemctl start mysql
systemctl enable mysql

# Create database and user
echo "[3/5] Setting up database..."
MYSQL_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)

mysql -e "CREATE DATABASE IF NOT EXISTS ghost_gaming;"
mysql -e "CREATE USER IF NOT EXISTS 'ghost'@'%' IDENTIFIED BY '${MYSQL_PASSWORD}';"
mysql -e "GRANT ALL PRIVILEGES ON ghost_gaming.* TO 'ghost'@'%';"
mysql -e "FLUSH PRIVILEGES;"

# Configure MySQL to accept remote connections
echo "[4/5] Configuring MySQL for remote access..."
sed -i 's/bind-address.*/bind-address = 0.0.0.0/' /etc/mysql/mysql.conf.d/mysqld.cnf
systemctl restart mysql

# Open firewall
echo "[5/5] Configuring firewall..."
ufw allow 22/tcp
ufw allow 3306/tcp
ufw allow 27015:27020/udp
ufw allow 27015:27020/tcp
ufw --force enable

# Get server IP
SERVER_IP=$(curl -s ifconfig.me)

echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
echo "DATABASE_URL for Vercel:"
echo "mysql://ghost:${MYSQL_PASSWORD}@${SERVER_IP}:3306/ghost_gaming"
echo ""
echo "Save this! You need it for Vercel."
echo ""
echo "MySQL Password: ${MYSQL_PASSWORD}"
echo "Server IP: ${SERVER_IP}"
echo ""
