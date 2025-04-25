# CPXTB Platform Technical Architecture

## System Overview

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
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Client Application                          │
├─────────────────────────────────────────────────────────────────┤
│  Technologies: React, TypeScript, Tailwind CSS, shadcn/ui       │
│                                                                 │
│  ┌───────────────────┐   ┌───────────────────┐                  │
│  │   Components      │   │     Pages         │                  │
│  │                   │   │                   │                  │
│  │ - MiningPlan      │   │ - Home           │                  │
│  │ - PaymentNotif.   │   │ - Mining         │                  │
│  │ - ConnectWallet   │   │ - MerchantDash.  │                  │
│  │ - TransactionStat.│   │ - PaymentPage    │                  │
│  │ - PriceDisplay    │   │ - Auth           │                  │
│  └───────────────────┘   └───────────────────┘                  │
│                                                                 │
│  ┌───────────────────┐   ┌───────────────────┐                  │
│  │     Hooks         │   │  State Management │                  │
│  │                   │   │                   │                  │
│  │ - useAuth         │   │ - TanStack Query  │                  │
│  │ - useWallet       │   │ - React Context   │                  │
│  │ - useToast        │   │ - Local state     │                  │
│  └───────────────────┘   └───────────────────┘                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
         │                                      │
         ▼                                      ▼
┌───────────────────────┐           ┌────────────────────────────┐
│   API Integration     │           │   Blockchain Integration    │
│                       │           │                            │
│ - REST API Endpoints  │           │ - Web3Modal               │
│ - WebSocket for       │           │ - wagmi/viem              │
│   real-time updates   │           │ - Contract Interactions    │
└───────────────────────┘           └────────────────────────────┘
```

## Backend Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Server Application                          │
├─────────────────────────────────────────────────────────────────┤
│  Technologies: Express.js, TypeScript, PostgreSQL, Drizzle ORM  │
│                                                                 │
│  ┌───────────────────┐   ┌───────────────────┐                  │
│  │   API Routes      │   │  Authentication   │                  │
│  │                   │   │                   │                  │
│  │ - /api/user       │   │ - Passport.js    │                  │
│  │ - /api/mining     │   │ - JWT            │                  │
│  │ - /api/payments   │   │ - Cookie Sessions │                  │
│  │ - /api/merchants  │   │ - API Keys       │                  │
│  └───────────────────┘   └───────────────────┘                  │
│                                                                 │
│  ┌───────────────────┐   ┌───────────────────┐                  │
│  │  Storage Layer    │   │ Blockchain Layer  │                  │
│  │                   │   │                   │                  │
│  │ - Database Storage│   │ - Transaction     │                  │
│  │ - Drizzle Schema  │   │   Listener        │                  │
│  │ - CRUD Operations │   │ - Event Processing│                  │
│  └───────────────────┘   └───────────────────┘                  │
│                                                                 │
│  ┌───────────────────┐                                          │
│  │ WebSocket Server  │                                          │
│  │                   │                                          │
│  │ - Live user count │                                          │
│  │ - Payment updates │                                          │
│  │ - Transaction     │                                          │
│  │   notifications   │                                          │
│  └───────────────────┘                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow - Payment Processing

```
┌──────────────┐     ┌───────────────┐     ┌───────────────┐
│              │     │               │     │               │
│   Merchant   │ 1   │ Create Payment│ 2   │  Payment Page │
│   Dashboard  │────►│   Request     │────►│  Generation   │
│              │     │               │     │               │
└──────────────┘     └───────────────┘     └───────────────┘
                                                   │
                                                   │ 3
                                                   ▼
┌──────────────┐     ┌───────────────┐     ┌───────────────┐
│              │     │               │     │               │
│ Blockchain   │ 6   │   WebSocket   │ 5   │   Customer    │
│ Verification │◄────│ Notification  │◄────│   Payment     │
│              │     │               │     │               │
└──────────────┘     └───────────────┘     └───────────────┘
       │                                           │
       │ 7                                         │ 4
       ▼                                           ▼
┌──────────────┐                          ┌───────────────┐
│  Payment     │                          │ Blockchain    │
│  Status      │                          │ Transaction   │
│  Update      │                          │               │
└──────────────┘                          └───────────────┘

1. Merchant creates payment request in dashboard
2. System generates payment details and themed payment page
3. Customer views payment page with merchant's branding
4. Customer makes payment on the blockchain 
5. Transaction is detected by blockchain listener
6. System verifies transaction details
7. Payment status is updated and notifications sent
```

## Merchant Theme Customization Flow

```
┌──────────────┐     ┌───────────────┐     ┌───────────────┐
│              │     │               │     │               │
│   Theme      │ 1   │ Apply Theme   │ 2   │ Theme Data    │
│   Selection  │────►│ Template      │────►│ Storage       │
│              │     │               │     │               │
└──────────────┘     └───────────────┘     └───────────────┘
                                                   │
                                                   │ 3
                                                   ▼
┌──────────────┐     ┌───────────────┐     ┌───────────────┐
│              │     │               │     │               │
│   Payment    │ 6   │ Generate      │ 4   │  Database     │
│   Page View  │◄────│ Payment URL   │◄────│  Query        │
│              │     │               │     │               │
└──────────────┘     └───────────────┘     └───────────────┘
       │                     ▲
       │ 7                   │ 5
       ▼                     │
┌──────────────┐     ┌───────────────┐
│  Customer    │     │  Merchant     │
│  Experience  │────►│  Dashboard    │
│              │     │               │
└──────────────┘     └───────────────┘

1. Merchant selects theme template from dashboard
2. System applies predefined theme settings
3. Theme settings stored in merchant record
4. When creating payment, system retrieves theme data
5. Payment URL generated with reference ID
6. When customer visits payment page, theme applied
7. Customer sees branded payment experience
```

## Database Schema

```
┌───────────────────────────┐      ┌───────────────────────────┐
│          users            │      │       mining_plans         │
├───────────────────────────┤      ├───────────────────────────┤
│ id: integer (PK)          │      │ id: integer (PK)          │
│ username: text            │      │ walletAddress: text       │
│ password: text            │      │ withdrawalAddress: text   │
│ email: text               │      │ planType: enum            │
│ walletAddress: text       │      │ amount: text              │
│ referralCode: text        │      │ dailyRewardCPXTB: text    │
│ joinedAt: timestamp       │      │ activatedAt: timestamp    │
│ lastLoginAt: timestamp    │      │ expiresAt: timestamp      │
│                           │      │ isActive: boolean         │
└───────────────────┬───────┘      │ transactionHash: text     │
                    │              │ hasWithdrawn: boolean     │
                    │              │ referralCode: text        │
                    │              └─────────────┬─────────────┘
                    │                            │
                    │                            │
┌───────────────────▼───────┐      ┌────────────▼────────────┐
│       merchants           │      │      payments            │
├───────────────────────────┤      ├───────────────────────────┤
│ id: integer (PK)          │      │ id: integer (PK)          │
│ userId: integer (FK)      │      │ merchantId: integer (FK)   │
│ businessName: text        │      │ reference: text           │
│ businessType: text        │      │ amountUsd: numeric        │
│ walletAddress: text       │      │ amountCpxtb: text         │
│ contactEmail: text        │      │ status: enum              │
│ contactPhone: text        │      │ createdAt: timestamp      │
│ website: text             │      │ expiresAt: timestamp      │
│ description: text         │      │ tokenAddress: text        │
│ apiKey: text              │      │ merchantWalletAddress: text│
│ createdAt: timestamp      │      │ transactionHash: text     │
│ updatedAt: timestamp      │      │ orderId: text             │
│ primaryColor: text        │      │ description: text         │
│ secondaryColor: text      │      │                           │
│ accentColor: text         │      │                           │
│ fontFamily: text          │      │                           │
│ borderRadius: integer     │      │                           │
│ darkMode: boolean         │      │                           │
│ customCss: text           │      │                           │
│ customHeader: text        │      │                           │
│ customFooter: text        │      │                           │
│ themeTemplate: text       │      │                           │
└───────────────────────────┘      └───────────────────────────┘
```

## Data Retention & Compliance Strategy

```
┌───────────────────────────────────────────────────────────────────┐
│                 Data Retention Architecture                        │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────┐        │
│  │ Merchant      │   │ Data          │   │ Compliance    │        │
│  │ Settings      │   │ Classification│   │ Engine        │        │
│  └───────┬───────┘   └───────┬───────┘   └───────┬───────┘        │
│          │                   │                   │                │
│          ▼                   ▼                   ▼                │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │                 Policy Enforcement Layer                   │   │
│  │                                                           │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐           │   │
│  │  │ Retention  │  │ Archival   │  │ Deletion   │           │   │
│  │  │ Rules      │  │ Process    │  │ Process    │           │   │
│  │  └────────────┘  └────────────┘  └────────────┘           │   │
│  └───────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │                 Data Storage Tiers                        │   │
│  │                                                           │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐           │   │
│  │  │ Active     │  │ Archived   │  │ Anonymized │           │   │
│  │  │ Data       │  │ Data       │  │ Data       │           │   │
│  │  └────────────┘  └────────────┘  └────────────┘           │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### Data Retention Flow

```
┌──────────────┐     ┌───────────────┐     ┌───────────────┐
│              │     │               │     │               │
│   Merchant   │ 1   │ Configure     │ 2   │  Policy       │
│   Dashboard  │────►│ Retention     │────►│  Storage      │
│              │     │ Policy        │     │               │
└──────────────┘     └───────────────┘     └───────────────┘
                                                   │
                                                   │ 3
                                                   ▼
┌──────────────┐     ┌───────────────┐     ┌───────────────┐
│              │     │               │     │               │
│  Scheduled   │ 6   │ Process       │ 4   │ Monitoring    │
│  Jobs        │◄────│ Trigger       │◄────│ Service       │
│              │     │               │     │               │
└──────────────┘     └───────────────┘     └───────────────┘
       │                                           
       │ 7                                         
       ▼                                           
┌──────────────────────────────────────────────────┐
│  Data Processing Actions                          │
│                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  │
│  │ Archive    │  │ Anonymize  │  │ Delete     │  │
│  │ Records    │  │ Personal   │  │ Expired    │  │
│  │            │  │ Data       │  │ Records    │  │
│  └────────────┘  └────────────┘  └────────────┘  │
└──────────────────────────────────────────────────┘

1. Merchant configures data retention policy
2. Policy settings stored in merchant profile
3. Monitoring service regularly checks for applicable records
4. When matching records found, process is triggered
5. Scheduled jobs execute the appropriate action
6. Data is archived, anonymized, or deleted based on policy
```