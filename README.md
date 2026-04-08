# Aleo Name Service

A decentralized domain name service built on the Aleo blockchain, enabling users to register, manage, and transfer human-readable `.aleo` domain names with privacy-preserving features.

## Features

- **Domain Registration**: Register unique `.aleo` domain names
- **Privacy-Preserving**: Built on Aleo's zero-knowledge proof technology
- **Domain Management**: Transfer, set primary, and configure resolver records
- **Credit System**: Claim and transfer credits for domain operations
- **Multiple Wallet Support**: Leo Wallet, Fox Wallet, Soter Wallet, Puzzle Wallet

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Blockchain**: Aleo Network, Leo Programming Language
- **Wallet**: @demox-labs/aleo-wallet-adapter-react
- **State Management**: Jotai, React Query
- **Caching**: Redis, Dexie (IndexedDB)

## Quick Start

### Prerequisites

- Node.js 18+ and Yarn

### Installation

```bash
git clone https://github.com/snowtigersoft/aleo-name-service
cd aleo_name_service/frontend
yarn install
```

### Configuration

Create a `.env.local` file in the `frontend/` directory with the following variables:

```env
NEXT_PUBLIC_RPC_URL=https://testnetbeta.aleorpc.com
NEXT_PUBLIC_API_URL=https://testnet-api.aleonames.id
NEXT_PUBLIC_ALEO_URL=https://api.explorer.aleo.org/v1/testnet/
NEXT_PUBLIC_EXPLORER_URL=https://testnet.aleoscan.io/address?a=
NEXT_PUBLIC_NETWORK=testnetbeta
```

### Development

```bash
cd frontend
yarn dev
```

Visit `http://localhost:3000` to view the application.

### Build for Production

```bash
cd frontend
yarn build
yarn start
```

## Project Structure

```
aleo_name_service/
├── frontend/              # Next.js web application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Application pages
│   │   ├── lib/           # Utilities and helpers
│   │   ├── context/       # React contexts
│   │   └── config/        # Configuration files
│   ├── public/            # Static assets
│   └── package.json
├── docker-compose.yml     # Docker services (Redis, API)
└── README.md
```

## Smart Contracts

The platform interacts with several Aleo smart contracts:

- `aleo_name_service_registry.aleo` - Core registry contract
- `ans_registrar_v3.aleo` - Domain registration
- `ans_credit_transfer.aleo` - Credit transfer
- `ans_resolver.aleo` - Domain resolution

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an Issue.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](./LICENSE) file for details.
