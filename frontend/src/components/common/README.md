# BamikaHub Design System & Component Library

## Overview
This is the unified design system and reusable component library for BamikaHub. All components follow Bamika Engineering's brand guidelines and support both light and dark themes automatically.

---

## 🎨 Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| 🟡 Gold | `#D6A329` | Primary actions, highlights, active states |
| 🔵 Sky Blue | `#46C1EB` | Secondary actions, info, links |
| ⚫ Black | `#000000` | Text, contrast base |
| ⚪ White | `#FFFFFF` | Background, surfaces |
| ⚙️ Gray | `#7B7B7B` | Muted text, borders |

---

## 📦 Components

### Button
Primary and secondary button styles with variants.

```jsx
import { Button } from '../components/common';

<Button variant="primary" onClick={handleClick}>
  Save Changes
</Button>

<Button variant="secondary" onClick={handleCancel}>
  Cancel
</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'danger' | 'outline'
- `size`: 'sm' | 'md' | 'lg'
- `disabled`: boolean
- `loading`: boolean

---

### Card
Container component with consistent styling and shadows.

```jsx
import { Card } from '../components/common';

<Card title="Project Details" footer={<Button>View More</Button>}>
  <p>Card content goes here</p>
</Card>
```

**Props:**
- `title`: string
- `subtitle`: string
- `footer`: ReactNode
- `hoverable`: boolean

---

### Input
Form input with validation styling and icons.

```jsx
import { Input } from '../components/common';

<Input
  label="Email Address"
  type="email"
  required
  error={errors.email}
  hint="We'll never share your email"
/>
```

**Props:**
- `label`: string
- `type`: string
- `error`: string
- `hint`: string
- `required`: boolean
- `icon`: ReactNode

---

### Badge
Small status indicator or count badge.

```jsx
import { Badge } from '../components/common';

<Badge variant="primary" count={5} />
<Badge variant="success">Active</Badge>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'success' | 'danger' | 'warning'
- `count`: number
- `children`: ReactNode

---

### Alert
Notification alert with auto-dismiss.

```jsx
import { Alert } from '../components/common';

<Alert
  variant="success"
  title="Success!"
  message="Your changes have been saved"
  onClose={handleClose}
/>
```

**Props:**
- `variant`: 'success' | 'info' | 'warning' | 'danger'
- `title`: string
- `message`: string (required)
- `onClose`: function
- `dismissible`: boolean

---

### Modal
Dialog overlay for forms and confirmations.

```jsx
import { Modal } from '../components/common';

<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Confirm Deletion"
  footer={
    <>
      <Button variant="outline" onClick={handleClose}>Cancel</Button>
      <Button variant="danger" onClick={handleDelete}>Delete</Button>
    </>
  }
>
  <p>Are you sure you want to delete this item?</p>
</Modal>
```

**Props:**
- `isOpen`: boolean (required)
- `onClose`: function (required)
- `title`: string (required)
- `footer`: ReactNode
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `closeOnOverlay`: boolean

---

### Spinner
Loading indicator with overlay option.

```jsx
import { Spinner } from '../components/common';

<Spinner size="md" variant="primary" label="Loading..." />
<Spinner overlay label="Please wait..." />
```

**Props:**
- `size`: 'sm' | 'md' | 'lg'
- `variant`: 'primary' | 'secondary' | 'light' | 'dark'
- `label`: string
- `overlay`: boolean

---

### Table
Responsive data table with loading and empty states.

```jsx
import { Table } from '../components/common';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status', render: (val) => <Badge>{val}</Badge> }
];

<Table
  columns={columns}
  data={items}
  loading={isLoading}
  emptyState={<EmptyState />}
  striped
  hoverable
/>
```

**Props:**
- `columns`: array (required) - Column definitions
- `data`: array (required)
- `loading`: boolean
- `emptyState`: ReactNode
- `striped`: boolean
- `hoverable`: boolean

---

### EmptyState
Display when no data is available with optional CTA.

```jsx
import { EmptyState } from '../components/common';

<EmptyState
  icon="📦"
  title="No Projects Yet"
  message="Create your first project to get started"
  actionLabel="Create Project"
  onAction={handleCreate}
/>
```

**Props:**
- `icon`: string (emoji)
- `title`: string
- `message`: string
- `actionLabel`: string
- `onAction`: function
- `illustration`: ReactNode

---

### SkeletonLoader
Loading placeholder with shimmer effect.

```jsx
import { SkeletonLoader } from '../components/common';

<SkeletonLoader variant="card" />
<SkeletonLoader variant="table" />
<SkeletonLoader variant="text" count={3} />
```

**Props:**
- `variant`: 'text' | 'circle' | 'rect' | 'card' | 'table'
- `count`: number
- `height`: string
- `width`: string

---

### Toast Notifications
Global toast notification system.

```jsx
import { ToastProvider, useToast } from '../components/common';

// Wrap app with ToastProvider
<ToastProvider>
  <App />
</ToastProvider>

// Use in components
const { success, error, warning, info } = useToast();

success('Changes saved successfully!');
error('Failed to delete item');
warning('Low stock alert');
info('New notification received');
```

---

### ThemeToggle
Button to switch between light/dark modes.

```jsx
import { ThemeToggle } from '../components/common';

<ThemeToggle />
```

**useTheme Hook:**
```jsx
import { useTheme } from '../hooks/useTheme';

const { theme, toggleTheme, isDark, setLightTheme, setDarkTheme } = useTheme();
```

---

## 🎭 Theming

### Light/Dark Mode
All components automatically adapt to theme using CSS variables.

```scss
:root {
  --color-primary: #D6A329;
  --color-secondary: #46C1EB;
  --color-text: #000000;
  --color-bg: #FFFFFF;
  --color-muted: #7B7B7B;
}

[data-theme="dark"] {
  --color-text: #FFFFFF;
  --color-bg: #000000;
}
```

### Using Theme in Custom Components
```jsx
// Use CSS variables
<div style={{ color: 'var(--color-primary)' }}>Gold Text</div>

// Or use theme-aware classes
<div className="text-primary">Gold Text</div>
```

---

## 📐 Responsive Breakpoints

- **Mobile**: `max-width: 768px`
- **Tablet**: `768px - 1024px`
- **Desktop**: `min-width: 1024px`

All components are mobile-first and responsive by default.

---

## ♿ Accessibility

All components include:
- ✅ ARIA labels and roles
- ✅ Keyboard navigation support
- ✅ Focus indicators
- ✅ Screen reader compatibility
- ✅ WCAG AA+ color contrast

---

## 📝 Best Practices

1. **Always import from common index:**
   ```jsx
   import { Button, Card, Input } from '../components/common';
   ```

2. **Use theme variables instead of hardcoded colors:**
   ```css
   /* ❌ Bad */
   color: #D6A329;
   
   /* ✅ Good */
   color: var(--color-primary);
   ```

3. **Provide meaningful labels for accessibility:**
   ```jsx
   <Button aria-label="Delete project">🗑️</Button>
   ```

4. **Use EmptyState and SkeletonLoader for better UX:**
   ```jsx
   {loading ? <SkeletonLoader variant="table" /> : <Table data={data} />}
   {data.length === 0 && <EmptyState />}
   ```

---

## 🚀 Examples

See `src/pages/` for real-world usage examples in:
- Dashboard
- Inventory Management
- Project Management
- User Management
- Support Tickets
- Finance Requisitions

---

## 🛠️ Development

To add a new component:

1. Create component file: `src/components/common/ComponentName.jsx`
2. Create styles file: `src/components/common/ComponentName.css`
3. Export from `src/components/common/index.js`
4. Document in this README

---

**Last Updated:** October 19, 2025  
**Version:** 1.0.0  
**Maintained by:** Bamika Engineering Platform Team
