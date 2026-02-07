---
name: API Design Guidelines
description: Conventions for designing RESTful APIs with OpenAPI, Hono, and Zod
---

# API Design Guidelines

You are building RESTful APIs for a SaaS e-commerce platform. Follow these conventions strictly.

## Tech Stack

- **Framework**: Hono
- **Validation**: Zod
- **Documentation**: OpenAPI 3.1 (auto-generated from Zod schemas)
- **Database**: PostgreSQL with Drizzle ORM

## URL Structure

### Resource Naming
- Use **plural nouns** for collections: `/products`, `/orders`, `/customers`
- Use **kebab-case** for multi-word resources: `/order-items`, `/product-categories`
- Nest resources logically: `/orders/{orderId}/items`
- Limit nesting to 2 levels maximum

### Versioning
- Version in URL path: `/api/v1/products`
- Only increment major version for breaking changes

### Query Parameters
- **Filtering**: `?status=active&category=electronics`
- **Sorting**: `?sort=createdAt:desc` or `?sort=-createdAt`
- **Pagination**: `?page=1&limit=20` or `?cursor=abc123&limit=20`
- **Field selection**: `?fields=id,name,price`
- **Search**: `?q=searchterm`

## HTTP Methods

| Method | Purpose | Idempotent | Request Body |
|--------|---------|------------|--------------|
| GET | Retrieve resource(s) | Yes | No |
| POST | Create resource | No | Yes |
| PUT | Replace entire resource | Yes | Yes |
| PATCH | Partial update | Yes | Yes |
| DELETE | Remove resource | Yes | No |

## Response Structure

### Success Responses

```typescript
// Single resource
{
  "data": { ... },
  "meta": { ... }  // optional
}

// Collection
{
  "data": [ ... ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}

// Action without return data
{
  "success": true,
  "message": "Email sent successfully"
}
```

### Error Responses

```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Error Codes

Use consistent, machine-readable error codes:

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Missing or invalid auth |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `CONFLICT` | 409 | Resource state conflict |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

## Status Codes

### Success
- `200 OK` - GET, PUT, PATCH success
- `201 Created` - POST success (include `Location` header)
- `204 No Content` - DELETE success

### Client Errors
- `400 Bad Request` - Validation errors, malformed request
- `401 Unauthorized` - Missing/invalid authentication
- `403 Forbidden` - Authenticated but not authorized
- `404 Not Found` - Resource doesn't exist
- `409 Conflict` - State conflict (duplicate, version mismatch)
- `422 Unprocessable Entity` - Semantically invalid (business logic)

### Server Errors
- `500 Internal Server Error` - Unexpected server error
- `503 Service Unavailable` - Temporary outage

## Zod Schema Conventions

### Naming
- Input schemas: `CreateProductInput`, `UpdateProductInput`
- Response schemas: `ProductResponse`, `ProductListResponse`
- Query params: `ProductQueryParams`

### Structure

```typescript
// Input schema (what client sends)
export const createProductInput = z.object({
  name: z.string().min(1).max(255),
  price: z.number().positive(),
  categoryId: z.string().uuid(),
  description: z.string().optional(),
});

// Database schema (Drizzle insert type)
export const insertProductSchema = createInsertSchema(products);

// Response schema (what API returns)
export const productResponse = z.object({
  id: z.string().uuid(),
  name: z.string(),
  price: z.number(),
  category: categoryResponse.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Infer types
export type CreateProductInput = z.infer<typeof createProductInput>;
export type ProductResponse = z.infer<typeof productResponse>;
```

### OpenAPI Metadata

```typescript
export const createProductInput = z.object({
  name: z.string().min(1).max(255).openapi({
    description: "Product display name",
    example: "Wireless Earbuds",
  }),
  price: z.number().positive().openapi({
    description: "Price in cents",
    example: 4999,
  }),
}).openapi("CreateProductInput");
```

## Route Organization

### File Structure

```
src/routes/
├── products/
│   ├── products.routes.ts    # Route definitions
│   ├── products.handlers.ts  # Request handlers
│   ├── products.schemas.ts   # Zod schemas (if not in shared)
│   └── products.index.ts     # Barrel export
├── orders/
│   └── ...
└── index.ts                  # Main router
```

### Handler Pattern

```typescript
// products.handlers.ts
import { AppRouteHandler } from "@/types";
import { CreateProductRoute, GetProductRoute } from "./products.routes";

export const createProduct: AppRouteHandler<CreateProductRoute> = async (c) => {
  const input = c.req.valid("json");
  const product = await productService.create(input);
  return c.json({ data: product }, 201);
};

export const getProduct: AppRouteHandler<GetProductRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const product = await productService.findById(id);
  
  if (!product) {
    return c.json({ 
      error: { code: "NOT_FOUND", message: "Product not found" } 
    }, 404);
  }
  
  return c.json({ data: product });
};
```

## Authentication & Authorization

### Headers
- Use `Authorization: Bearer <token>` for JWT
- Use custom headers sparingly: `X-Store-Id`, `X-Request-Id`

### Middleware Pattern

```typescript
// Require authentication
app.use("/api/v1/*", authMiddleware);

// Check permissions in handler or dedicated middleware
export const requirePermission = (permission: string) => {
  return async (c: Context, next: Next) => {
    const user = c.get("user");
    if (!user.permissions.includes(permission)) {
      return c.json({ error: { code: "FORBIDDEN", message: "..." } }, 403);
    }
    await next();
  };
};
```

## Pagination

### Offset-based (simpler, for admin UIs)

```typescript
const paginationParams = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
```

### Cursor-based (for infinite scroll, large datasets)

```typescript
const cursorParams = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Response includes next cursor
{
  "data": [...],
  "meta": {
    "nextCursor": "eyJpZCI6MTIzfQ==",
    "hasMore": true
  }
}
```

## Rate Limiting

- Include rate limit headers in responses:
  - `X-RateLimit-Limit: 100`
  - `X-RateLimit-Remaining: 95`
  - `X-RateLimit-Reset: 1640995200`
- Return `429 Too Many Requests` when exceeded
- Apply different limits per endpoint sensitivity

## Best Practices

### Do
✅ Return created/updated resource in response body  
✅ Use `createdAt` and `updatedAt` timestamps (ISO 8601)  
✅ Include request ID in responses for debugging  
✅ Validate all input with Zod  
✅ Use transactions for multi-step operations  
✅ Log errors with context (don't expose to client)  

### Don't
❌ Return database IDs if using UUIDs internally  
❌ Include sensitive data in error messages  
❌ Use GET for state-changing operations  
❌ Return 200 for errors  
❌ Nest resources beyond 2 levels  
❌ Use verbs in URLs (`/getProducts`, `/createOrder`)  

---

**Remember**: APIs are contracts. Breaking changes require versioning. Design for the client's needs, not the database structure.
