

# E-Commerce Platform

Modern, scalable, and cross-platform e-commerce solution built with React, Next.js, React Native, and Supabase.

## Architecture

This is a **Turborepo monorepo** containing:

- **apps/web**: Next.js web application
- **apps/mobile**: React Native mobile app (iOS & Android)
- **apps/admin**: Refine admin panel
- **packages/shared**: Shared types, utilities, and Supabase client
- **packages/ui**: Shared UI components

## Tech Stack

- **Frontend**: Next.js, React Native, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, APIs)
- **Admin Panel**: Refine
- **State Management**: Zustand
- **Payment**: Flutterwave
- **Deployment**: Vercel
- **Monorepo**: Turborepo

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- React Native CLI (for mobile development)
- Android Studio / Xcode (for mobile development)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ecommerce-platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your actual values
```

4. Set up Supabase:
   - Create a new Supabase project
   - Run the SQL schema from `supabase/schema.sql`
   - Update environment variables with your Supabase URL and keys

### Development

Run all applications in development mode:
```bash
npm run dev
```

This will start:
- Web app on http://localhost:3000
- Admin panel on http://localhost:3001
- Mobile app metro bundler

### Individual App Development

```bash
# Web app only
cd apps/web && npm run dev

# Admin panel only
cd apps/admin && npm run dev

# Mobile app only
cd apps/mobile && npm run start
```

## Project Structure

```
├── apps/
│   ├── web/           # Next.js web application
│   ├── mobile/        # React Native mobile app
│   └── admin/         # Refine admin panel
├── packages/
│   ├── shared/        # Shared types and utilities
│   └── ui/           # Shared UI components
├── supabase/
│   └── schema.sql    # Database schema
└── turbo.json        # Turborepo configuration
```

## Database Schema

The platform includes these main entities:
- **Categories**: Product categories with hierarchical support
- **Products**: Product catalog with inventory, pricing, images
- **Orders**: Order management with status tracking
- **Users**: User profiles and authentication
- **Cart**: Shopping cart functionality

## Features

### Web Application
- Product catalog with search and filters
- Shopping cart and checkout
- User authentication and profiles
- Order history and tracking
- Responsive design

### Mobile Application
- Native iOS and Android apps
- Same features as web app
- Optimized mobile UX
- Push notifications (planned)

### Admin Panel
- Product and category management
- Order management and fulfillment
- User management
- Analytics dashboard
- Inventory tracking

## Environment Variables

See `.env.example` for required environment variables.

## Deployment

### Web Applications (Vercel)
```bash
# Deploy web app
cd apps/web && vercel

# Deploy admin panel
cd apps/admin && vercel
```

### Mobile Applications
Follow React Native deployment guides for iOS App Store and Google Play Store.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.