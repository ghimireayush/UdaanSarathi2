# API Types

This directory contains type helper utilities for working with generated API types.

## Purpose

Type helpers provide convenient utilities for extracting and using types from the generated OpenAPI types.

## Files

- `helpers.ts` - Type utility functions for extracting request/response types
- Additional type utilities as needed

## Usage

```typescript
import type { RequestBody, Response, Schema } from '@api/types/helpers';

// Extract request body type
type UpdateAgencyRequest = RequestBody<'/agencies/owner/agency', 'patch'>;

// Extract response type
type AgencyProfile = Response<'/agencies/owner/agency', 'get'>;

// Direct schema access
type AgencyDto = Schema<'AgencyResponseDto'>;
```

## Path Alias

Import using the `@api/types/*` path alias:

```typescript
import type { RequestBody } from '@api/types/helpers';
```
