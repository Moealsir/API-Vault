# VaultGuard Enhanced

A secure, modern API secret management application with multiple key-value pairs per secret and enhanced security features.

## Features

- 🔐 **Multiple Key-Value Pairs**: Each secret can contain multiple key-value pairs
- 📊 **Row-Based Display**: Clean table view for better secret organization
- 🛡️ **AES-256 Encryption**: All secret values are encrypted at rest
- 🔍 **Search & Filter**: Find secrets by name, platform, or project
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🚀 **Easy Deployment**: Docker-based deployment with SSL support
- 🔒 **Security Headers**: CSRF protection, rate limiting, and security headers
- 📈 **Dashboard Analytics**: Track projects, secrets, and platforms

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Git

### Deployment

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vaultguard-enhanced
   ```

2. **Run the deployment script**
   ```bash
   ./deploy.sh
   ```

3. **Configure environment variables**
   - Edit the `.env` file with your configuration
   - Set `ENCRYPTION_KEY` (32 characters)
   - Set `SESSION_SECRET` (random string)
   - Set `CORS_ORIGIN` to your domain

4. **Access the application**
   - HTTP: http://localhost
   - HTTPS: https://localhost

## Manual Deployment

### Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL`: PostgreSQL connection string
- `ENCRYPTION_KEY`: 32-character encryption key
- `SESSION_SECRET`: Session secret key
- `CORS_ORIGIN`: Your domain for CORS

### Docker Deployment

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Manual Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up database**
   ```bash
   # Create PostgreSQL database
   createdb vaultguard
   
   # Run migrations
   npm run db:push
   ```

3. **Build application**
   ```bash
   npm run build
   ```

4. **Start application**
   ```bash
   npm start
   ```

## Production Deployment

### SSL Certificates

For production, replace the self-signed certificates with real ones:

1. **Let's Encrypt (recommended)**
   ```bash
   # Install certbot
   sudo apt install certbot
   
   # Generate certificates
   sudo certbot certonly --standalone -d yourdomain.com
   
   # Copy certificates
   sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
   sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
   ```

2. **Custom certificates**
   - Place your certificate in `ssl/cert.pem`
   - Place your private key in `ssl/key.pem`

### Domain Configuration

1. **Update environment variables**
   ```bash
   CORS_ORIGIN=https://yourdomain.com
   ```

2. **Update nginx configuration**
   - Edit `nginx.conf` to set your domain name
   - Configure SSL settings as needed

3. **DNS Configuration**
   - Point your domain to the server IP
   - Ensure ports 80 and 443 are open

### Security Considerations

- Change default database passwords
- Use strong encryption keys
- Enable firewall rules
- Regular security updates
- Monitor application logs
- Backup database regularly

## API Documentation

### Authentication

The application uses session-based authentication. Users must log in to access the API.

### Endpoints

#### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

#### Secrets
- `GET /api/secrets/:id` - Get secret (decrypted)
- `POST /api/secrets` - Create secret
- `PATCH /api/secrets/:id` - Update secret
- `DELETE /api/secrets/:id` - Delete secret

#### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Secret Format

Secrets now support multiple key-value pairs:

```json
{
  "name": "Stripe API Keys",
  "type": "API Key",
  "platform": "Stripe",
  "projectId": "project-id",
  "values": {
    "publishable_key": "pk_live_...",
    "secret_key": "sk_live_...",
    "webhook_secret": "whsec_..."
  }
}
```

## Development

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run database migrations
npm run db:push

# Type checking
npm run check
```

### Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility functions
├── server/                 # Backend Express application
│   ├── db.ts              # Database configuration
│   ├── encryption.ts      # Encryption utilities
│   ├── routes.ts          # API routes
│   └── storage.ts         # Data access layer
├── shared/                 # Shared types and schemas
└── docker-compose.yml     # Docker configuration
```

## Testing

The application includes comprehensive testing for:

- ✅ Sign-in and sign-out functionality
- ✅ Project management (create, read, update, delete)
- ✅ Category/platform filtering
- ✅ Secret management with multiple key-value pairs
- ✅ Search and sorting functionality
- ✅ Copy secret values to clipboard
- ✅ Dashboard statistics accuracy

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --grep "secrets"

# Run tests in watch mode
npm run test:watch
```

## Troubleshooting

### Common Issues

1. **Database connection errors**
   - Check PostgreSQL is running
   - Verify DATABASE_URL is correct
   - Ensure database exists

2. **Encryption errors**
   - Verify ENCRYPTION_KEY is exactly 32 characters
   - Check if key changed after data was encrypted

3. **SSL certificate errors**
   - Regenerate certificates if expired
   - Check certificate file permissions
   - Verify nginx configuration

4. **Port conflicts**
   - Change ports in docker-compose.yml
   - Check if ports are already in use

### Logs

```bash
# Application logs
docker-compose logs -f app

# Database logs
docker-compose logs -f db

# Nginx logs
docker-compose logs -f nginx

# All logs
docker-compose logs -f
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review application logs
