# SafeSpot Tourist Safety Application

A comprehensive tourist safety platform featuring blockchain-based digital identity verification, real-time safety monitoring, and AI-powered assistance. Built with modern web technologies and secure blockchain integration.

## 🌟 Key Features

- **🔐 Blockchain Authentication**: Secure wallet-based tourist registration with MetaMask integration
- **🆔 Digital Identity System**: Tamper-proof digital IDs with QR code verification
- **👮 Authority Verification**: Real-time identity verification for authorities and checkpoints
- **🗺️ Safety Maps**: Geofenced risk zones with real-time updates
- **🚨 SOS Emergency System**: One-tap panic button with location tracking
- **🤖 AI Assistant**: Smart tourist guidance and safety recommendations
- **📱 Mobile-First Design**: Responsive interface for all devices

## Project Structure

- `frontend/` - Next.js frontend application with React components
- `backend/` - Express.js API server with blockchain integration
- `smart-contracts/` - Solidity smart contracts for Ethereum
- `docs/` - Comprehensive project documentation
- `scripts/` - Setup and maintenance scripts
- `docker-compose.yml` - Docker orchestration for development

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **MetaMask** browser extension for blockchain features
- **Git** for version control
- **Docker** (optional, for containerized development)

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd SIh_toursit_app-main

# Install all dependencies
npm run install:all
```

### 2. Environment Setup

Create environment files for both frontend and backend:

**Backend Environment** (`backend/.env`):
```env
# Database
DATABASE_URL="file:./dev.db"

# Google AI API
GOOGLE_API_KEY=your_google_ai_api_key_here

# Blockchain (for production)
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/your-infura-key
SMART_CONTRACT_ADDRESS=0x742d35cc6ba...

# Server
PORT=3001
NODE_ENV=development
```

**Frontend Environment** (`frontend/.env.local`):
```env
# API URLs
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:3001

# App Configuration
NEXT_PUBLIC_APP_NAME="SafeSpot"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

### 3. Database Setup

```bash
# Navigate to backend
cd backend

# Run database migrations
npx prisma migrate dev

# Seed initial data (optional)
npx prisma db seed
```

### 4. Smart Contract Setup (Optional)

For blockchain features in development:

```bash
# Navigate to smart contracts
cd smart-contracts

# Install dependencies
npm install

# Deploy to local network
npx hardhat run scripts/deploy.js --network localhost

# Or deploy to testnet
npx hardhat run scripts/deploy.js --network sepolia
```

### 5. Start Development Servers

**Option A: Start All Services (Recommended)**
```bash
# From project root
npm run dev
```

**Option B: Start Services Individually**
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Smart Contracts (if needed)
cd smart-contracts
npx hardhat node
```

### 6. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api-docs
- **Health Check**: http://localhost:3001/health

## 🔧 Development Best Practices Implemented

### Code Quality
- **TypeScript**: Full type safety across frontend and backend
- **ESLint & Prettier**: Consistent code formatting and linting
- **Husky**: Pre-commit hooks for code quality
- **Jest**: Comprehensive testing framework

### Security
- **Environment Variables**: Sensitive data properly configured
- **Input Validation**: Server-side request validation
- **CORS**: Properly configured cross-origin requests
- **Rate Limiting**: API endpoint protection

### Performance
- **Next.js Optimization**: Automatic code splitting and optimization
- **Database Indexing**: Optimized database queries
- **Caching**: Strategic caching for API responses
- **Image Optimization**: Automatic image optimization

### Deployment
- **Docker Support**: Multi-stage builds for production
- **CI/CD Ready**: GitHub Actions workflow configuration
- **Environment Management**: Separate configs for dev/staging/prod
- **Health Monitoring**: Endpoint health checks

## 📖 Usage Guide

### For Tourists

1. **Connect Wallet**: Click "Connect Wallet" and approve MetaMask connection
2. **Complete Registration**: Provide basic information and KYC details
3. **Generate Digital ID**: Once verified, generate your blockchain-based digital ID
4. **Access Features**: Use safety maps, emergency SOS, and AI assistant

### For Authorities

1. **Access Authority Dashboard**: Navigate to `/admin` route
2. **Scan QR Codes**: Use the verification interface to scan tourist IDs
3. **Verify Identities**: Real-time verification with complete tourist data
4. **Monitor Activity**: View verification logs and audit trails

### For Developers

1. **API Integration**: Use the comprehensive REST API for custom integrations
2. **Component Library**: Reuse React components for blockchain features
3. **Smart Contracts**: Interact with deployed Ethereum contracts
4. **Testing**: Run test suites to verify functionality

## 🧪 Testing

### Run All Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Smart contract tests
cd smart-contracts
npx hardhat test

# End-to-end tests
npm run test:e2e
```

### Test Coverage
```bash
# Generate coverage reports
npm run test:coverage
```

## 🐳 Docker Development

### Quick Docker Setup
```bash
# Build and start all services
docker-compose up --build

# Background mode
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Individual Service Docker
```bash
# Backend only
docker-compose up backend

# Frontend only
docker-compose up frontend
```

## 🎯 Core Features Deep Dive

### Blockchain Authentication System
- **MetaMask Integration**: Seamless wallet connection for tourists
- **Smart Contract Registration**: Immutable user data on Ethereum blockchain  
- **Digital Signatures**: Cryptographic verification of identity
- **Decentralized Storage**: No single point of failure for user data

### Digital Identity Management
- **QR Code Generation**: Scannable digital IDs for quick verification
- **Expiration Management**: Time-limited validity for enhanced security
- **Status Tracking**: Active, expired, and revoked ID states
- **Authority Verification**: Real-time validation by authorized personnel

### Safety & Emergency Features
- **Real-time Safety Maps**: Live updates on risk zones and safe areas
- **SOS Emergency System**: One-tap panic button with GPS location
- **AI-Powered Assistant**: Intelligent guidance and safety recommendations
- **Geofencing**: Automated alerts when entering risk zones
- **Emergency Contacts**: Quick access to local emergency services

### Advanced Capabilities
- **Anomaly Detection**: AI-powered incident reporting and analysis
- **Safety Score Generation**: Dynamic risk assessment for locations
- **Itinerary Planning**: Smart route planning with safety considerations
- **Multi-language Support**: Localized interface for international tourists
- **Offline Functionality**: Core features available without internet

## 🔐 Security & Privacy

### Data Protection
- **Encrypted Storage**: All sensitive data encrypted at rest and in transit
- **Minimal Data Collection**: Only necessary information is stored
- **GDPR Compliance**: Full compliance with international privacy regulations
- **Blockchain Immutability**: Tamper-proof record keeping

### Access Control
- **Role-Based Permissions**: Different access levels for tourists vs authorities
- **Multi-Factor Authentication**: Enhanced security for sensitive operations
- **Audit Logging**: Complete trail of all verification activities
- **API Security**: Rate limiting and input validation on all endpoints

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[Blockchain Authentication Guide](./docs/blockchain-authentication.md)** - Complete guide to the digital identity system
- **[API Documentation](./docs/api-documentation.md)** - REST API reference with examples
- **[Deployment Guide](./docs/deployment.md)** - Production deployment instructions
- **[Development Guide](./docs/development.md)** - Developer setup and contribution guidelines
- **[Security Guidelines](./docs/security.md)** - Security best practices and considerations

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- Follow existing code style and conventions
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- **MetaMask** for providing secure wallet integration
- **Ethereum Foundation** for blockchain infrastructure
- **OpenAI** for AI-powered features
- **Next.js Team** for the excellent React framework
- **Prisma Team** for database management tools

## 📞 Support

- **Documentation**: Check the `docs/` directory first
- **Issues**: Report bugs and feature requests on GitHub Issues
- **Discussions**: Join community discussions on GitHub Discussions
- **Email**: Contact the development team at support@safespot.com

---

**SafeSpot** - Making tourism safer through blockchain technology and AI-powered insights.