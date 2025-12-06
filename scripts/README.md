# Scripts Directory

This directory contains automation scripts for the API contract synchronization system.

## Purpose

The scripts in this directory automate the process of:
- Fetching OpenAPI specifications from the backend
- Generating TypeScript types from the OpenAPI spec
- Watching for changes during development
- Validating type consistency in CI/CD

## Structure

- `generate-types.js` - Main type generation script
- `watch-types.js` - Development watch mode script
- `validate-types.js` - CI/CD validation script

## Usage

Scripts are typically run via npm scripts defined in `package.json`:

```bash
# Generate types once
npm run generate:types

# Watch for changes during development
npm run generate:types:watch

# Validate types in CI
npm run validate:types
```

## Configuration

Scripts can be configured via environment variables:
- `BACKEND_URL` - Backend server URL (default: http://localhost:3000)
- `OPENAPI_ENDPOINT` - OpenAPI spec endpoint (default: /docs-yaml)
- `POLL_INTERVAL` - Watch mode poll interval in ms (default: 5000)

## Generated Output

Generated types are placed in:
- `src/api/generated/types.ts` - Main generated types file
- `src/api/generated/index.ts` - Barrel export file

## Path Aliases

The following path aliases are configured for easy imports:
- `@api/generated` - Access generated types
- `@api/types/*` - Access type helper utilities
- `@api/*` - Access API-related modules
- `@/*` - Access any src module
