# Digital Equb Backend

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

A robust backend service for managing digital Equb (a traditional rotating savings and credit association) built with NestJS, TypeScript, PostgreSQL, and Redis.

## 🏗 Project Structure

This project follows a **Modular Monolith** architecture, logically separated into feature-based modules for better maintainability and scalability.

```
src/
├── auth/               # Authentication & authorization (JWT, Google OAuth, OTP)
├── users/              # User management and profiles
├── equb-groups/        # Core business logic for Equb groups and transactions
├── common/             # Shared utilities and services
│   ├── upstash.service.ts  # Redis-based caching and rate limiting
│   ├── twilio.service.ts   # SMS notifications
│   └── email.service.ts    # Email notifications
├── app.module.ts       # Root application module
└── main.ts             # Application entry point
```

## 🚀 Features

- 🔒 **Authentication**

  - JWT-based authentication
  - Google OAuth 2.0
  - Phone number verification via OTP
  - Role-based access control

- 💰 **Equb Management**

  - Create and manage Equb groups
  - Member management
  - Payment cycle tracking
  - Transaction history
  - Payout automation

- 📱 **Real-time Updates**

  - WebSocket integration for live updates
  - Event-driven architecture

- 🛡 **Security**
  - Rate limiting
  - Input validation and sanitization
  - Secure password hashing
  - CORS protection

## 🛠 Prerequisites

- Node.js (v18+)
- npm or yarn
- Docker and Docker Compose
- PostgreSQL (or use Docker)
- Redis (or use Docker)
- Twilio account (for SMS verification)
- Google OAuth credentials (for social login)

## 🚀 Quick Start with Docker

The easiest way to get started is using Docker Compose:

1. **Clone the repository**

   ```bash
   git clone https://github.com/Yab112/digital-equb-backend.git
   cd digital-equb-backend
   ```

2. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Build and start services**

   ```bash
   docker-compose up --build
   ```

   This will start:

   - NestJS application on port 3000
   - PostgreSQL on port 5432
   - Redis on port 6379
   - Redis Commander (GUI) on port 8081

4. **Access the API**
   The API will be available at `http://localhost:3000`

## 🛠 Manual Installation

If you prefer to run the services manually:

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up the database**

   - Create a PostgreSQL database
   - Update the `DATABASE_URL` in your `.env` file

3. **Run database migrations**

   ```bash
   npm run typeorm migration:run
   ```

4. **Start the development server**
   ```bash
   npm run start:dev
   ```

## 🔧 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/equb_db

# JWT
JWT_SECRET=your_jwt_secret_key

# Redis
REDIS_URL=redis://localhost:6379

# Twilio (for SMS)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Email (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASSWORD=your_email_password
SMTP_FROM=noreply@example.com
```

## 🧪 Testing

Run the test suite:

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🐳 Docker Commands

```bash
# Build the application
npm run build

# Build Docker image
docker build -t digital-equb-backend .

# Run with Docker
docker run -p 3000:3000 --env-file .env digital-equb-backend

# View running containers
docker ps

# View logs
docker logs <container_id>

# Stop all containers
docker-compose down
```

## 🔄 Database Migrations

```bash
# Generate new migration
npm run typeorm migration:generate src/migrations/NameOfMigration

# Run migrations
npm run typeorm migration:run

# Revert last migration
npm run typeorm migration:revert
```

## API Documentation

After starting the server, you can access the automatically generated Swagger (OpenAPI) documentation at:

```
http://localhost:3000/api
```

This provides an interactive UI to explore and test all available endpoints, view request/response schemas, and see authentication requirements.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - A progressive Node.js framework
- [TypeORM](https://typeorm.io/) - Amazing ORM for TypeScript and JavaScript
- [Twilio](https://www.twilio.com/) - For SMS verification
- [Redis](https://redis.io/) - For caching and rate limiting
