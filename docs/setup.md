# Medflect AI Setup Guide

## Prerequisites

Before setting up Medflect AI, ensure you have the following installed:

### Required Software
- **Node.js** 18.0.0 or higher
- **npm** 8.0.0 or higher
- **Docker** Desktop 4.0.0 or higher
- **Git** 2.30.0 or higher

### Optional Software
- **VS Code** with recommended extensions
- **Postman** or **Insomnia** for API testing
- **DBeaver** or **pgAdmin** for database management

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd MEDFLECTAIMVP
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all workspace dependencies
npm run bootstrap
```

### 3. Environment Configuration

```bash
# Copy environment template
cp env.example .env

# Edit .env with your actual values
# See Environment Variables section below
```

### 4. Start Local Services

```bash
# Start all services (Supabase, Ganache, Redis, PostgreSQL)
npm run start:local

# Wait for services to be ready (check Docker Compose logs)
docker-compose logs -f
```

### 5. Run the Application

```bash
# Start web development server
npm run dev:web

# Start server development server
npm run dev:server
```

The application will be available at:
- **Web App**: http://localhost:5173
- **Server**: http://localhost:3000
- **Supabase**: http://localhost:54321
- **Ganache**: http://localhost:8545

## Environment Variables

### Required Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Groq AI Configuration
GROQ_API_KEY=sk-npvlOAYvZsy6iRqqtM5PNA
GROQ_API_ENDPOINT=http://91.108.112.45:4000

# Blockchain Configuration
BLOCKCHAIN_PRIVATE_KEY=your_ethereum_private_key
BLOCKCHAIN_RPC_URL=http://localhost:8545
BLOCKCHAIN_CHAIN_ID=1337

# Feature Flags
MOCK_GROQ=false
MOCK_CHAIN=false
MOCK_SMS=false
```

### Optional Variables

```bash
# Development Settings
NODE_ENV=development
LOG_LEVEL=debug

# PWA Configuration
PWA_NAME=Medflect AI
PWA_SHORT_NAME=Medflect
PWA_DESCRIPTION=AI-powered healthcare insights with FHIR compliance
PWA_THEME_COLOR=#0ea5e9
PWA_BACKGROUND_COLOR=#ffffff

# Security
JWT_SECRET=your_jwt_secret_key
ENCRYPTION_KEY=your_encryption_key_for_sensitive_data
```

## Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Note down your project URL and API keys

### 2. Database Schema

The application will automatically create the required tables when you first run it. However, you can also run the SQL migrations manually:

```sql
-- Connect to your Supabase database and run:

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create tables (these will be created automatically by the app)
-- See packages/server/src/services/fhirService.ts for table creation logic
```

### 3. Row Level Security (RLS)

RLS policies are automatically configured by the application. Ensure RLS is enabled on all tables:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE fhir_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
```

## Blockchain Setup

### 1. Local Development (Ganache)

The application uses Ganache for local blockchain development:

```bash
# Ganache is started automatically with docker-compose
# It will be available at http://localhost:8545

# Get test accounts and private keys from Ganache logs
docker-compose logs ganache
```

### 2. Smart Contract Deployment

```bash
# Navigate to blockchain package
cd packages/blockchain

# Install dependencies
npm install

# Compile contracts
npm run compile

# Deploy to local network
npm run deploy:local
```

### 3. Environment Configuration

Update your `.env` file with the deployed contract addresses:

```bash
# After deployment, update these values
CONSENT_AUDIT_CONTRACT_ADDRESS=0x...
CONSENT_MANAGEMENT_CONTRACT_ADDRESS=0x...
```

## Development Workflow

### 1. Start Development

```bash
# Terminal 1: Start local services
npm run start:local

# Terminal 2: Start web development server
npm run dev:web

# Terminal 3: Start server development server
npm run dev:server
```

### 2. Code Changes

The development servers support hot reloading:
- **Web App**: Changes in `apps/web/src/` will automatically reload
- **Server**: Changes in `packages/server/src/` will restart the server

### 3. Database Changes

When making database schema changes:

1. Update the TypeScript types in `packages/server/src/types/`
2. Update the service logic in `packages/server/src/services/`
3. Test the changes locally
4. Create a migration script if needed

### 4. Testing

```bash
# Run all tests
npm test

# Run tests for specific workspace
npm run test --workspace=@medflect/web
npm run test --workspace=@medflect/server

# Run type checking
npm run type-check

# Run linting
npm run lint
```

## Troubleshooting

### Common Issues

#### 1. Port Conflicts

If you encounter port conflicts:

```bash
# Check what's using the ports
netstat -ano | findstr :5173
netstat -ano | findstr :3000
netstat -ano | findstr :54321

# Kill processes or change ports in docker-compose.yml
```

#### 2. Docker Issues

```bash
# Reset Docker containers
docker-compose down -v
docker-compose up --build

# Check Docker logs
docker-compose logs -f
```

#### 3. Database Connection Issues

```bash
# Check Supabase status
docker-compose logs supabase

# Verify environment variables
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY
```

#### 4. Blockchain Issues

```bash
# Check Ganache status
docker-compose logs ganache

# Verify contract deployment
cd packages/blockchain
npm run verify:local
```

### Performance Issues

#### 1. Slow Build Times

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules
npm install
```

#### 2. Memory Issues

```bash
# Increase Docker memory allocation
# Docker Desktop > Settings > Resources > Memory: 8GB+

# Check container resource usage
docker stats
```

## Production Deployment

### 1. Environment Preparation

```bash
# Set production environment
NODE_ENV=production

# Update environment variables for production
# Use production Supabase project
# Use production blockchain network
# Set MOCK_GROQ=false, MOCK_CHAIN=false, MOCK_SMS=false
```

### 2. Build for Production

```bash
# Build all packages
npm run build:all

# Build specific packages
npm run build:web
npm run build:server
```

### 3. Deployment

```bash
# Deploy to your hosting platform
# Examples: Vercel, Netlify, AWS, Azure

# For serverless deployment:
# - Deploy Edge Functions to Supabase
# - Deploy smart contracts to mainnet/testnet
# - Configure CDN for static assets
```

## Monitoring & Debugging

### 1. Application Logs

```bash
# Web app logs (browser console)
# Server logs (terminal running dev:server)
# Supabase logs (docker-compose logs supabase)
```

### 2. Database Monitoring

```bash
# Connect to Supabase dashboard
# Monitor query performance
# Check RLS policy effectiveness
```

### 3. Blockchain Monitoring

```bash
# Check transaction status
# Monitor gas usage
# Verify contract interactions
```

## Security Considerations

### 1. API Keys

- Never commit `.env` files to version control
- Use environment variables for all secrets
- Rotate API keys regularly
- Use least privilege principle

### 2. Database Security

- Enable RLS on all tables
- Use parameterized queries
- Validate all inputs
- Log all access attempts

### 3. Blockchain Security

- Use test networks for development
- Verify smart contract code
- Test with small amounts first
- Keep private keys secure

## Support & Resources

### Documentation
- [Architecture Guide](./architecture.md)
- [API Reference](./api.md)
- [Security Guide](./security.md)
- [FHIR Compliance](./fhir-compliance.md)

### Community
- GitHub Issues for bug reports
- GitHub Discussions for questions
- Discord community (if available)

### External Resources
- [Supabase Documentation](https://supabase.com/docs)
- [FHIR R4 Specification](https://www.hl7.org/fhir/)
- [Ethereum Development](https://ethereum.org/developers/)
- [Groq API Documentation](https://console.groq.com/docs) 