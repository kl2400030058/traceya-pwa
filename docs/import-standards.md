# Import Standards

## Lucide Icons

When importing Lucide icons in this project, use the direct import from the `lucide-react` package:

```typescript
// Correct
import { Icon1, Icon2, Icon3 } from "lucide-react";

// Incorrect - do not use this pattern
import { Icon1, Icon2, Icon3 } from "@/node_modules/lucide-react";
```

This standard ensures consistency across the codebase and follows the recommended import pattern for external packages.

### Special Cases

For Lucide Lab icons (experimental icons), use the appropriate import from `@lucide/lab`:

```typescript
import { Icon } from "lucide-react";
import { experimentalIcon } from "@lucide/lab";

// Usage
<Icon iconNode={experimentalIcon} />
```

See the example in `app/test-lucide-lab/page.tsx` for reference.