# Component System Setup Instructions

## Quick Setup

The component system is ready to use, but you need to install two dependencies first:

```bash
npm install clsx tailwind-merge
```

### Why These Packages?

- **clsx**: Conditionally joins classNames together
- **tailwind-merge**: Intelligently merges Tailwind CSS classes, resolving conflicts

### Installation Options

#### Option 1: Standard npm (Recommended)
```bash
npm install clsx tailwind-merge
```

#### Option 2: If PowerShell Execution Policy Blocks npm
```bash
# Use Command Prompt instead
cmd /c npm install clsx tailwind-merge

# OR change PowerShell execution policy (requires admin)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Option 3: Manual Installation
Add to `package.json` dependencies:
```json
{
  "dependencies": {
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  }
}
```
Then run `npm install`

## What's Included

### Base UI Components (`components/ui/`)
- ✅ Button (primary, secondary, ghost, danger variants)
- ✅ Card (default, elevated, outlined variants)
- ✅ Input (with label and error states)
- ✅ Select (with label and error states)
- ✅ Page (page wrapper)
- ✅ Container (content container)
- ✅ Section (spacing wrapper)
- ✅ Heading (h1-h6 typography)
- ✅ Text (typography with variants)

### Utility Classes (`app/globals.css`)
- `.btn-base`, `.btn-primary`, `.btn-secondary`
- `.card-base`
- `.input-base`
- `.page-container`
- `.content-container`

### Design Tokens (`tailwind.config.ts`)
- Japandi color palette
- Typography settings
- Border radius
- Shadows

## Usage Example

```tsx
import { Button, Card, Input, Page, Heading } from '@/components/ui';

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

✅ **No more duplicate styles** - Use components instead  
✅ **Easy to update** - Change design in one place  
✅ **Flexible** - Override with className when needed  
✅ **Consistent** - Same components = same look everywhere  

## Next Steps

1. Install dependencies: `npm install clsx tailwind-merge`
2. Start using components in your pages
3. See `docs/engineering/component-system.md` for full documentation

