# Component System Setup

## Installation

Before using the component system, install the required dependencies:

```bash
npm install clsx tailwind-merge
```

Or if you're using PowerShell and encounter execution policy issues:

```bash
# Option 1: Run in Command Prompt (cmd) instead
cmd /c npm install clsx tailwind-merge

# Option 2: Change execution policy (requires admin)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Quick Start

### 1. Import Components

```tsx
import { Button, Card, Input, Page, Heading, Text } from '@/components/ui';
```

### 2. Use in Your Pages

```tsx
export default function MyPage() {
  return (
    <Page>
      <Heading level={1}>Welcome</Heading>
      <Card>
        <Input label="Name" />
        <Button variant="primary">Submit</Button>
      </Card>
    </Page>
  );
}
```

## Benefits

✅ **Centralized** - Change design in one place, affects entire app  
✅ **Flexible** - Override with className when needed  
✅ **Consistent** - Same components = same look everywhere  
✅ **Maintainable** - Easy to update and extend  

## Documentation

See `docs/engineering/component-system.md` for full documentation.

