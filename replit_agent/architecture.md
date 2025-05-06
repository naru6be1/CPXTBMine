# CPXTB Platform Architecture

## Overview

The CPXTB Platform is a dual-purpose blockchain platform focused on cryptocurrency mining education and merchant payment processing solutions. Built on the Base network (Coinbase's Layer 2 solution), the platform allows users to:

1. Participate in mining rewards and education through tiered mining plans
2. Process cryptocurrency payments for merchants with customizable payment pages

The application is structured as a full-stack web application with a React frontend and Express.js backend, using PostgreSQL for data persistence. It integrates with blockchain technologies for cryptocurrency transactions and implements various security features to protect against common attacks.

## System Architecture

The CPXTB Platform follows a client-server architecture with the following major components:

```
┌─────────────────────────────────────────────────────────────────┐
│                      CPXTB Platform                             │
├───────────────┬───────────────────────────┬────────────────────┤
│  Mining Module │     Merchant Module       │  Payment Processing │
│               │                           │                    │
│ ┌───────────┐ │ ┌─────────────────────┐   │  ┌──────────────┐  │
│ │ User      │ │ │ Merchant Dashboard  │   │  │ Transaction   │  │
│ │ Dashboard │ │ │                     │   │  │ Listener     │  │
│ └───────────┘ │ └─────────────────────┘   │  └──────────────┘  │
│               │                           │                    │
│ ┌───────────┐ │ ┌─────────────────────┐   │  ┌──────────────┐  │
│ │ Mining    │ │ │ Payment Creation    │   │  │ Blockchain    │  │
│ │ Plans     │ │ │                     │   │  │ Verification  │  │
│ └───────────┘ │ └─────────────────────┘   │  └──────────────┘  │
│               │                           │                    │
│ ┌───────────┐ │ ┌─────────────────────┐   │  ┌──────────────┐  │
│ │ Referral  │ │ │ Theme Customization │   │  │ WebSocket     │  │
│ │ System    │ │ │                     │   │  │ Notifications │  │
│ └───────────┘ │ └─────────────────────┘   │  └──────────────┘  │
│               │                           │                    │
└───────────────┴───────────────────────────┴────────────────────┘
         │                 │                        │
         ▼                 ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Database Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL + Drizzle ORM                                       │
│                                                                 │
│  ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐  │
│  │  Users    │   │  Mining   │   │ Merchants │   │ Payments  │  │
│  │  Table    │   │  Plans    │   │  Table    │   │  Table    │  │
│  └───────────┘   └───────────┘   └───────────┘   └───────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
         │                 │                        │
         ▼                 ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Blockchain Layer                            │
├─────────────────────────────────────────────────────────────────┤
│  Base Network Integration                                       │
│                                                                 │
│  ┌───────────┐   ┌───────────┐   ┌───────────────────────────┐  │
│  │  Web3     │   │  Smart    │   │  Transaction Monitoring   │  │
│  │  Modal    │   │  Contract │   │                           │  │
│  └───────────┘   └───────────┘   └───────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Frontend Architecture

The frontend is built with React and TypeScript, following a component-based architecture. Key frontend design decisions include:

- **UI Component Library**: Uses shadcn/ui components with Radix UI primitives for consistent styling and accessibility
- **Routing**: Implemented with wouter for lightweight client-side routing
- **State Management**: Mix of React Context (for auth, social login) and React Query for API data fetching
- **Build System**: Vite for fast development and optimized production builds
- **Code Organization**: Feature-based organization with shared components

### Backend Architecture

The backend is implemented as an Express.js server with the following key design decisions:

- **API Structure**: RESTful API endpoints organized by resource
- **Database Access**: Drizzle ORM for type-safe database operations
- **Authentication**: Combination of traditional JWT and social login (Google)
- **Blockchain Integration**: Ethers.js for blockchain interaction and transaction monitoring
- **WebSockets**: Real-time updates for payment status and blockchain events
- **Security Middleware**: Custom anti-DDoS protection with mathematical challenges

### Database Schema

The database uses PostgreSQL with Drizzle ORM and includes the following main tables:

- **users**: User accounts, authentication, and referral information
- **mining_plans**: Mining investments tracking activation, expiration, and rewards
- **merchants**: Business profiles with customization and integration settings
- **payments**: Payment processing records with status tracking and blockchain verification
- **email_log**: Anti-duplicate email protection with unique constraints

## Key Components

### Mining Module

Provides cryptocurrency mining-as-a-service functionality with tiered investment plans:

- **Mining Plans**: Bronze, Silver, and Gold tiers with different reward structures
- **Reward System**: Daily CPXTB token rewards calculated based on plan type
- **Referral System**: Reward distribution for referring new users
- **Mining Dashboard**: User interface for tracking investments and rewards

### Merchant Module

Offers payment processing capabilities for businesses:

- **Merchant Dashboard**: Business management interface for payment settings
- **Payment Creation**: Generation of customized payment requests
- **Payment Pages**: Branded customer-facing payment interfaces
- **Theme Customization**: Visual customization options for payment pages
- **Transaction History**: Record of all payment transactions

### Payment Processing

Handles the blockchain interaction for cryptocurrency transactions:

- **Transaction Listener**: Monitors the blockchain for incoming payments
- **Payment Verification**: Validates that received payments match expected amounts
- **Notification System**: Real-time updates on payment status changes
- **Email Confirmation**: Sends payment confirmations with duplicate prevention

### Security Features

Implements multiple layers of security:

- **Enhanced Challenge Middleware**: Anti-DDoS protection with mathematical challenges
- **Rate Limiting**: Request throttling for sensitive endpoints
- **WebSocket Security**: Authenticated WebSocket connections for real-time updates
- **Email Duplication Prevention**: Database-level constraints to prevent duplicate emails

## Data Flow

### User Registration and Authentication Flow

1. User registers with email/password or social login (Google)
2. System generates a unique referral code for the user
3. Authentication tokens are issued for subsequent requests
4. User profile is stored in the database

### Mining Plan Purchase Flow

1. User selects a mining plan tier (Bronze, Silver, Gold)
2. User initiates blockchain transaction for the plan amount
3. Transaction is monitored and verified on the Base network
4. Upon confirmation, mining plan is activated in the database
5. Daily rewards are calculated and accumulated

### Merchant Payment Flow

1. Merchant creates a payment request with amount and details
2. System generates a unique payment reference and URL
3. Customer visits payment page and connects wallet
4. Customer initiates blockchain transaction
5. Transaction listener monitors the blockchain for the payment
6. Upon verification, payment status is updated and notifications are sent
7. Merchant receives confirmation of completed payment

## External Dependencies

### Blockchain Integration

- **Base Network**: Layer 2 Ethereum scaling solution by Coinbase
- **CPXTB Token**: ERC-20 token used for platform transactions and rewards
- **Web3Modal**: Wallet connection interface for user interactions
- **Wagmi/Viem**: React hooks for Ethereum interactions

### Third-Party Services

- **Email Services**: SendGrid for transactional emails
- **Payment Processors**: Integration with PayPal for alternative payment methods
- **OAuth Providers**: Google for social authentication
- **Stripe**: Alternative payment processing for fiat currency

## Deployment Strategy

The application is configured for deployment on Replit with the following setup:

- **Containerization**: Replit's built-in container system
- **Runtime**: Node.js 20 with Web and PostgreSQL 16 modules
- **Build Process**: Vite build for frontend, ESBuild for backend TypeScript
- **Database**: PostgreSQL via Neon Serverless
- **Environment Configuration**: Environment variables for secrets and configuration
- **CI/CD**: Automatic deployment triggered by repository updates

### Scaling Considerations

- **Database Scaling**: PostgreSQL with connection pooling
- **Load Balancing**: Managed by the hosting platform
- **Caching**: In-memory caching for frequent blockchain queries
- **Horizontal Scaling**: Stateless design allows for multiple instances

### Monitoring and Maintenance

- **Error Tracking**: Client-side error modal for capturing runtime issues
- **Database Migrations**: Drizzle Kit for schema migrations
- **Performance Optimization**: Memory cleanup scheduling and image preloading
- **Security Updates**: Regular dependency updates and security patches