# Traceya Backend

Backend server for Traceya, a Progressive Web App (PWA) for geo-tagged Ayurvedic herb collection events with offline-first capabilities, SMS fallback, and blockchain anchoring.

## 🔑 Tech Stack

- **Node.js + Express**: REST API framework
- **TypeScript**: Type-safe JavaScript
- **PostgreSQL + Prisma ORM**: Database and ORM
- **Redis + BullMQ**: Background job processing and queues
- **JWT Authentication**: Simple OTP-based login flow for farmers
- **Hyperledger Fabric SDK**: Blockchain integration (mock implementation)
- **IPFS**: Decentralized storage for evidence files and documentation

## 📋 Features

- **Authentication**: OTP-based login for farmers
- **Collection Events**: Create, retrieve, and list collection events
- **Background Sync**: Queue worker for Fabric blockchain anchoring
- **SMS Fallback**: Webhook for parsing and storing collection events from SMS gateway
- **Admin Utilities**: Stats, retry failed events, and farmer management

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+)
- Docker and Docker Compose
- Git

### Installation

1. Clone the repository

```bash
git clone <repository-url>
cd traceya/backend
```

2. Install dependencies

```bash
npm install
```

3. Set up environment variables

```bash
cp .env.example .env
# Edit .env file with your configuration
```

4. Start PostgreSQL and Redis using Docker Compose

```bash
docker-compose up -d
```

5. Run database migrations

```bash
npm run prisma:migrate
```

6. Start the development server

```bash
npm run dev
```

## 🗄️ Database Schema

The application uses PostgreSQL with Prisma ORM. The main models are:

- **Farmer**: Represents a farmer who collects herbs
- **CollectionEvent**: Represents a collection event with geo-tagging
- **OtpRequest**: Stores OTP requests for authentication
- **SyncJob**: Tracks blockchain synchronization jobs
- **AuditLog**: Logs system activities for auditing

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/request-otp`: Request an OTP for login
- `POST /api/auth/verify-otp`: Verify OTP and get JWT token
- `POST /api/auth/refresh`: Refresh JWT token

### Collection Events

- `POST /api/collection`: Create a new collection event
- `GET /api/collection/:id`: Get collection event details
- `GET /api/collection`: List collection events (with optional filters)
- `GET /api/collection/stats`: Get collection statistics

### SMS Webhook

- `POST /api/sms/webhook`: Handle incoming SMS from gateway
- `GET /api/sms/format`: Get SMS format documentation

### IPFS Storage

- `POST /api/ipfs/upload`: Upload a file to IPFS
- `GET /api/ipfs/get`: Get a file from IPFS by CID
- `GET /api/ipfs/user-files`: Get all files for a user

### Admin Utilities

- `GET /api/admin/stats`: Get system statistics
- `POST /api/admin/retry-failed`: Retry failed collection events
- `GET /api/admin/farmers`: List registered farmers
- `GET /api/admin/farmers/:id`: Get farmer details

## 🔄 Background Processing

The application uses BullMQ with Redis for background processing:

- **Fabric Sync Worker**: Processes collection events and anchors them to the blockchain

To start the worker:

```bash
npm run worker:fabric
```

## 🔐 Security

- JWT-based authentication
- Rate limiting for API endpoints
- Input validation using Joi
- Error handling middleware
- Audit logging for sensitive operations

## 🧪 Testing

Run tests with:

```bash
npm test
```

## 🛠️ Development

### Available Scripts

- `npm run dev`: Start development server with hot-reload
- `npm run build`: Build for production
- `npm start`: Start production server
- `npm run lint`: Run ESLint
- `npm run prisma:generate`: Generate Prisma client
- `npm run prisma:migrate`: Run database migrations
- `npm run prisma:studio`: Open Prisma Studio
- `npm run worker:fabric`: Start Fabric sync worker

## 📦 Docker

The project includes Docker Compose configuration for PostgreSQL and Redis:

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f
```

## 🔗 Integration with Frontend

The backend is designed to work seamlessly with the Traceya PWA frontend:

- Handles API requests from the frontend
- Processes offline/queued events
- Parses and stores SMS fallback data
- Returns proper status and transaction IDs to the frontend

## 📝 License

[MIT](LICENSE)