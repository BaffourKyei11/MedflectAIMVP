# @medflect/blockchain

Blockchain integration package for Medflect AI consent management and audit logging.

## 🚀 Features

- **Smart Contracts**: ConsentAudit.sol for healthcare consent management
- **Hardhat Integration**: Complete development environment setup
- **TypeScript Support**: Full type safety and IntelliSense
- **Testing Suite**: Comprehensive test coverage with Chai and Ethers.js
- **Deployment Scripts**: Automated deployment to multiple networks
- **Gas Optimization**: Built-in gas reporting and optimization

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0
- Git

## 🛠️ Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Compile contracts:**
   ```bash
   npm run compile
   ```

## 🔧 Configuration

### Environment Variables

Copy `env.example` to `.env` and configure:

```bash
# Network Configuration
NETWORK=localhost
RPC_URL=http://127.0.0.1:8545
CHAIN_ID=1337

# Private Keys (NEVER commit to version control)
BLOCKCHAIN_PRIVATE_KEY=your_private_key_here

# API Keys for Verification
ETHERSCAN_API_KEY=your_etherscan_api_key_here
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key_here
```

### Networks

- **hardhat**: Local development network
- **localhost**: Local Hardhat node
- **ganache**: Ganache local blockchain
- **sepolia**: Ethereum testnet
- **mainnet**: Ethereum mainnet

## 📜 Available Scripts

### Development
```bash
npm run compile          # Compile smart contracts
npm run test            # Run test suite
npm run test:coverage   # Run tests with coverage
npm run node            # Start local Hardhat node
npm run console         # Open Hardhat console
```

### Deployment
```bash
npm run deploy:local    # Deploy to localhost
npm run deploy:ganache  # Deploy to Ganache
npm run deploy:sepolia  # Deploy to Sepolia testnet
npm run deploy:mainnet  # Deploy to mainnet
```

### Utilities
```bash
npm run build           # Build TypeScript
npm run clean           # Clean artifacts
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run format          # Format code with Prettier
npm run gas             # Run gas analysis
npm run size            # Check contract sizes
```

## 🏗️ Smart Contracts

### ConsentAudit.sol

Main smart contract for healthcare consent management:

- **grantConsent**: Grant consent for patient resources
- **checkConsent**: Verify consent validity
- **logAccess**: Log resource access events
- **revokeConsent**: Revoke existing consents
- **getStats**: Get contract statistics

### Key Features

- **Consent Management**: Grant, verify, and revoke consents
- **Access Logging**: Track all resource access events
- **Expiry Handling**: Automatic consent expiration
- **Audit Trail**: Complete audit history on-chain
- **Role-Based Access**: Provider and patient permissions

## 🧪 Testing

Run the complete test suite:

```bash
npm run test
```

Test coverage includes:
- Contract deployment
- Consent lifecycle
- Access logging
- Permission validation
- Edge cases and error handling

## 🚀 Deployment

### Local Development

1. **Start local node:**
   ```bash
   npm run node
   ```

2. **Deploy contracts:**
   ```bash
   npm run deploy:local
   ```

### Testnet Deployment

1. **Configure environment:**
   ```bash
   NETWORK=sepolia
   RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
   BLOCKCHAIN_PRIVATE_KEY=your_private_key
   ```

2. **Deploy:**
   ```bash
   npm run deploy:sepolia
   ```

## 📊 Gas Optimization

Monitor gas usage:

```bash
npm run gas
```

This will run tests with gas reporting enabled, showing:
- Deployment costs
- Function call costs
- Optimization recommendations

## 🔍 Verification

Verify contracts on Etherscan:

```bash
npm run verify
```

Requires:
- `ETHERSCAN_API_KEY` in environment
- Deployed contract address
- Constructor arguments

## 🏗️ Architecture

```
packages/blockchain/
├── contracts/          # Solidity smart contracts
├── src/               # TypeScript source code
│   ├── types/         # Type definitions
│   ├── utils/         # Utility functions
│   └── services/      # Service layer
├── test/              # Test files
├── scripts/           # Deployment scripts
├── hardhat.config.ts  # Hardhat configuration
└── tsconfig.json      # TypeScript configuration
```

## 🔒 Security

- **Private Keys**: Never commit private keys to version control
- **Environment Variables**: Use `.env` files for sensitive data
- **Access Control**: Implement proper role-based permissions
- **Audit Logging**: All operations are logged on-chain
- **Consent Validation**: Verify consents before resource access

## 🐛 Troubleshooting

### Common Issues

1. **Compilation Errors**
   - Ensure Solidity version compatibility
   - Check import paths
   - Verify OpenZeppelin contract versions

2. **Deployment Failures**
   - Check network configuration
   - Verify private key format
   - Ensure sufficient balance for gas

3. **Test Failures**
   - Check network connectivity
   - Verify test account setup
   - Review test environment variables

### Getting Help

- Check the [Hardhat documentation](https://hardhat.org/docs)
- Review [OpenZeppelin contracts](https://docs.openzeppelin.com/contracts/)
- Check [Ethers.js documentation](https://docs.ethers.io/)

## 📝 License

MIT License - see [LICENSE](../../LICENSE) for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📞 Support

For questions and support:
- Create an issue in the repository
- Check the documentation
- Review the test examples 