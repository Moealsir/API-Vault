#!/bin/bash

# Production Setup Script for VaultGuard
# This script prepares the application for production deployment

set -e

echo "🔧 VaultGuard Production Setup"
echo "=============================="

# Check Node.js version
NODE_VERSION=$(node --version)
echo "📦 Node.js version: $NODE_VERSION"

if [[ ! "$NODE_VERSION" =~ ^v1[8-9]\. ]] && [[ ! "$NODE_VERSION" =~ ^v2[0-9]\. ]]; then
    echo "⚠️  Warning: Node.js 18+ is recommended for production"
fi

# Install production dependencies only
echo "📥 Installing production dependencies..."
npm ci --only=production

# Build the application
echo "🔨 Building application..."
npm run build

# Create necessary directories
echo "📁 Creating production directories..."
mkdir -p logs
mkdir -p ssl
mkdir -p backups

# Set proper permissions
echo "🔒 Setting file permissions..."
chmod 755 logs
chmod 700 ssl
chmod 755 backups

# Generate encryption key if not provided
if [ -z "$ENCRYPTION_KEY" ]; then
    echo "🔐 Generating encryption key..."
    ENCRYPTION_KEY=$(openssl rand -hex 16)
    echo "Generated ENCRYPTION_KEY: $ENCRYPTION_KEY"
    echo "⚠️  Save this key securely! You'll need it in your .env file"
fi

# Generate session secret if not provided
if [ -z "$SESSION_SECRET" ]; then
    echo "🔑 Generating session secret..."
    SESSION_SECRET=$(openssl rand -hex 32)
    echo "Generated SESSION_SECRET: $SESSION_SECRET"
    echo "⚠️  Save this secret securely! You'll need it in your .env file"
fi

# Create systemd service file
echo "🚀 Creating systemd service file..."
cat > vaultguard.service << EOF
[Unit]
Description=VaultGuard API Secret Manager
After=network.target postgresql.service

[Service]
Type=simple
User=vaultguard
WorkingDirectory=/opt/vaultguard
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=/opt/vaultguard/.env

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/vaultguard/logs

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Production setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Copy this application to /opt/vaultguard"
echo "2. Create vaultguard user: sudo useradd -r -s /bin/false vaultguard"
echo "3. Set ownership: sudo chown -R vaultguard:vaultguard /opt/vaultguard"
echo "4. Copy service file: sudo cp vaultguard.service /etc/systemd/system/"
echo "5. Create .env file with your configuration"
echo "6. Enable service: sudo systemctl enable vaultguard"
echo "7. Start service: sudo systemctl start vaultguard"
echo ""
echo "🔍 Monitor with: sudo systemctl status vaultguard"
echo "📄 View logs with: sudo journalctl -u vaultguard -f"
