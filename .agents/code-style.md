---
name: Code Style Guidelines
description: TypeScript conventions, naming, file structure, and best practices
---

# Code Style Guidelines

You are writing TypeScript code for a production SaaS application. Follow these conventions for consistency across the codebase.

## TypeScript

### Strict Mode
- Enable `strict: true` in tsconfig
- **No `any` types** — use `unknown` and narrow, or define proper types
- No `// @ts-ignore` without a comment explaining why
- Prefer `type` over `interface` unless extending

### Type Declarations

```typescript
// ✅ Prefer type aliases
type User = {
  id: string;
  email: string;
  role: UserRole;
};

// ✅ Use interface only when extending
interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Product extends BaseEntity {
  name: string;
  price: number;
}

// ✅ Extract types from Zod schemas
type CreateUserInput = z.infer<typeof createUserSchema>;

// ✅ Use const assertions for literal types
const ROLES = ["admin", "user", "guest"] as const;
type Role = typeof ROLES[number];
```

### Function Signatures

```typescript
// ✅ Explicit return types for exported functions
export function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// ✅ Use arrow functions for callbacks and short functions
const formatPrice = (cents: number): string => 
  new Intl.NumberFormat("en-US", { 
    style: "currency", 
    currency: "USD" 
  }).format(cents / 100);

// ✅ Generic constraints
function getById<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id);
}
```

### Null Handling

```typescript
// ✅ Use optional chaining
const city = user?.address?.city;

// ✅ Use nullish coalescing
const name = user.displayName ?? user.email;

// ✅ Early returns for null checks
function processOrder(order: Order | null): void {
  if (!order) return;
  // order is now Order, not Order | null
}

// ❌ Avoid non-null assertions unless absolutely necessary
const value = obj!.property; // Don't do this
```

## Naming Conventions

### Files and Directories
- **kebab-case** for all files: `user-profile.tsx`, `order-service.ts`
- **Suffix by type**: `.routes.ts`, `.handlers.ts`, `.schema.ts`, `.test.ts`
- Group by feature, not by type:
  ```
  ✅ src/features/orders/order.routes.ts
  ❌ src/routes/orders.ts
  ```

### Variables and Functions
- **camelCase** for variables and functions: `getUserById`, `orderTotal`
- **PascalCase** for types, interfaces, classes, components: `User`, `OrderService`
- **SCREAMING_SNAKE_CASE** for constants: `MAX_RETRIES`, `API_BASE_URL`
- **Prefix booleans** with `is`, `has`, `should`, `can`: `isActive`, `hasPermission`

### React Specific
- Components: `PascalCase` — `ProductCard.tsx`
- Hooks: `camelCase` with `use` prefix — `useCart`, `useProducts`
- Event handlers: `handle` prefix — `handleSubmit`, `handleClick`
- Render helpers: `render` prefix — `renderItem`, `renderEmptyState`

## Imports

### Order
Organize imports in this order (with blank lines between groups):

```typescript
// 1. React/framework imports
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// 2. External libraries
import { z } from "zod";
import { eq, and } from "drizzle-orm";

// 3. Internal aliases (@/)
import { db } from "@/db";
import { Button } from "@/components/ui/button";

// 4. Relative imports
import { calculateTotal } from "./utils";
import type { CartItem } from "./types";
```

### Type Imports
- Use `import type` for type-only imports

```typescript
import type { User, Order } from "@/types";
import { userSchema } from "@/schemas";
```

## Error Handling

### Try-Catch Pattern

```typescript
// ✅ Typed errors
try {
  await processPayment(order);
} catch (error) {
  if (error instanceof PaymentError) {
    // Handle specific error
    logger.error("Payment failed", { orderId: order.id, error: error.message });
    throw new AppError("PAYMENT_FAILED", "Unable to process payment");
  }
  // Re-throw unknown errors
  throw error;
}

// ✅ Result pattern for expected failures
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

async function findUser(id: string): Promise<Result<User, "NOT_FOUND">> {
  const user = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!user) return { success: false, error: "NOT_FOUND" };
  return { success: true, data: user };
}
```

### Never Swallow Errors

```typescript
// ❌ Bad
try {
  await riskyOperation();
} catch (e) {
  // Silent failure
}

// ✅ Good
try {
  await riskyOperation();
} catch (error) {
  logger.error("Operation failed", { error });
  // Re-throw, return error state, or handle appropriately
}
```

## Async Patterns

### Prefer async/await

```typescript
// ✅ Clean async/await
async function getOrderWithItems(orderId: string) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: { items: true },
  });
  return order;
}

// ✅ Parallel operations
const [user, orders, notifications] = await Promise.all([
  getUser(userId),
  getOrders(userId),
  getNotifications(userId),
]);
```

### Handle Promise Rejections

```typescript
// ✅ Promise.allSettled for partial failures
const results = await Promise.allSettled(
  productIds.map(id => fetchProduct(id))
);

const products = results
  .filter((r): r is PromiseFulfilledResult<Product> => r.status === "fulfilled")
  .map(r => r.value);
```

## React Patterns

### Component Structure

```tsx
// 1. Imports
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types";

// 2. Types
type ProductCardProps = {
  product: Product;
  onAddToCart: (productId: string) => void;
};

// 3. Component
export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  // Hooks first
  const [isLoading, setIsLoading] = useState(false);
  
  // Derived state
  const formattedPrice = formatPrice(product.price);
  
  // Handlers
  const handleClick = async () => {
    setIsLoading(true);
    await onAddToCart(product.id);
    setIsLoading(false);
  };

  // Early returns for edge cases
  if (!product.isAvailable) {
    return <OutOfStockCard product={product} />;
  }

  // Main render
  return (
    <div className="...">
      {/* ... */}
    </div>
  );
}
```

### Hooks

```typescript
// ✅ Custom hooks return object for named properties
function useProducts(categoryId: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // ... fetch logic

  return { products, isLoading, error, refetch };
}

// Usage
const { products, isLoading } = useProducts(categoryId);
```

## Comments

### When to Comment
- Explain **why**, not **what**
- Document non-obvious business logic
- Add TODO with ticket reference: `// TODO(JIRA-123): Optimize this query`

```typescript
// ✅ Good: Explains why
// Delay to prevent rate limiting from payment provider
await delay(500);

// ❌ Bad: States the obvious
// Increment counter
counter++;
```

### JSDoc for Public APIs

```typescript
/**
 * Calculates the total price including tax and discounts.
 * 
 * @param items - Cart items to calculate
 * @param taxRate - Tax rate as decimal (e.g., 0.08 for 8%)
 * @returns Total price in cents
 */
export function calculateOrderTotal(items: CartItem[], taxRate: number): number {
  // ...
}
```

## Testing

### File Naming
- Unit tests: `*.test.ts` next to source file
- Integration tests: `*.integration.test.ts`
- E2E tests: `e2e/*.spec.ts`

### Test Structure

```typescript
describe("OrderService", () => {
  describe("calculateTotal", () => {
    it("should sum item prices correctly", () => {
      // Arrange
      const items = [{ price: 100 }, { price: 200 }];
      
      // Act
      const total = calculateTotal(items);
      
      // Assert
      expect(total).toBe(300);
    });

    it("should return 0 for empty cart", () => {
      expect(calculateTotal([])).toBe(0);
    });
  });
});
```

## Anti-Patterns to Avoid

❌ Magic numbers — use named constants  
❌ Deep nesting — extract functions  
❌ Boolean parameters — use options object  
❌ Long parameter lists — use object destructuring  
❌ Mutation — prefer immutable patterns  
❌ Abbreviations — use full words (`btn` → `button`)  
❌ Hungarian notation — no `strName`, `arrItems`  

---

**Remember**: Code is read more often than written. Optimize for readability.
