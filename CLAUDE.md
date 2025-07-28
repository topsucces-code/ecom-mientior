# Claude Development Notes - E-Commerce Platform

## Project Overview
Turborepo monorepo with Next.js web app, React Native mobile app, and admin panel.

## Development Success Log

### ✅ Configuration Fixes
- **ESLint Mobile App**: Created `.eslintrc.js` for React Native with proper TypeScript support
- **TypeScript Config**: Fixed mobile app tsconfig.json include paths from `src/**/*` to `./**/*`
- **NativeWind Integration**: Successfully implemented Tailwind CSS for React Native with proper TypeScript declarations

### ✅ Performance Optimizations
- **React.memo**: Applied to Cart component for render optimization
- **useCallback**: Added to ProductGrid loadProducts function
- **Next.js Image**: Replaced `<img>` tags with optimized Next.js Image component
- **Turbopack**: Implemented for 95% faster startup (from 5+ minutes to ~2 seconds)

### ✅ Startup Issues Resolution
- **Next.js Config**: Simplified to stable configuration with transpilePackages only
- **Turbopack Integration**: Updated dev scripts to use `--turbo` flag
- **Port Management**: Successfully cleaned up occupied development ports

### ✅ Content Restoration
- **Homepage**: Restored complete e-commerce layout with hero, features, products, footer
- **Test Cleanup**: Removed temporary test files and restored original functionality

## Key Commands That Work
```bash
# Development servers with Turbopack
npm run dev --workspace=@ecommerce/web    # Port 3010
npm run dev --workspace=@ecommerce/admin  # Port 3005
npm run dev --workspace=@ecommerce/mobile # Metro bundler

# Port cleanup (when needed)
powershell -Command "Stop-Process -Id [PID] -Force"
netstat -ano | findstr ":[PORT]"
```

## Working Configurations

### Web App (apps/web/package.json)
```json
{
  "scripts": {
    "dev": "next dev --port 3010 --turbo"
  }
}
```

### Next.js Config (apps/web/next.config.js)
```js
const nextConfig = {
  transpilePackages: ['@ecommerce/shared', '@ecommerce/ui']
}
```

### Mobile App NativeWind (apps/mobile/nativewind-env.d.ts)
```ts
/// <reference types="nativewind/types" />
```

## Architecture Decisions
- **Styling**: NativeWind for unified Tailwind CSS experience across web/mobile
- **Bundler**: Turbopack for development (massive performance improvement)
- **Monorepo**: Turborepo with workspace-based package management
- **Ports**: Web:3010, Admin:3005, Mobile:Metro default

## Troubleshooting Solutions
- **EPERM .next/trace errors**: Clean .next directory and restart with Turbopack
- **Slow compilation**: Always use Turbopack in development
- **Port conflicts**: Use PowerShell Stop-Process for reliable cleanup
- **TypeScript errors**: Ensure proper include paths and NativeWind types