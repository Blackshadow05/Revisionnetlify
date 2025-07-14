# Design Document

## Overview

The card/table view toggle feature will be implemented as a state-managed component that controls the rendering of two different view modes for the same data. The implementation will leverage React's state management and conditional rendering to switch between views while maintaining consistent data flow, filtering, and pagination.

## Architecture

### Component Structure
```
Home Component
├── View Toggle Button (new)
├── Search and Filters (existing)
├── Conditional Rendering:
│   ├── Table View (existing)
│   └── Card View (new)
└── Pagination (existing, shared)
```

### State Management
- Add `viewMode` state: `'table' | 'card'`
- Add `setViewMode` state setter
- Implement session storage for persistence
- Maintain existing states (data, filters, pagination)

### Data Flow
- Same data source (`paginatedData`) for both views
- Same filtering logic applies to both views
- Same pagination logic applies to both views
- Same search functionality applies to both views

## Components and Interfaces

### ViewToggle Component
```typescript
interface ViewToggleProps {
  currentView: 'table' | 'card';
  onViewChange: (view: 'table' | 'card') => void;
}
```

**Responsibilities:**
- Render toggle button with current state
- Handle view mode switching
- Provide visual feedback for active state

### CardView Component
```typescript
interface CardViewProps {
  data: RevisionData[];
  onCardClick: (id: string) => void;
  onImageClick: (imageUrl: string) => void;
}
```

**Responsibilities:**
- Render revision data in card format
- Handle card interactions (click to details)
- Display evidence thumbnails
- Show notes indicators
- Responsive grid layout

### RevisionCard Component
```typescript
interface RevisionCardProps {
  revision: RevisionData;
  onClick: () => void;
  onImageClick: (imageUrl: string) => void;
}
```

**Responsibilities:**
- Render individual revision card
- Display key information (casita, reviewer, date, status)
- Show notes count indicator
- Display evidence thumbnails
- Handle click events

## Data Models

### ViewMode Type
```typescript
type ViewMode = 'table' | 'card';
```

### Card Display Data
The card view will display a subset of the full revision data:
- `casita` - Primary identifier
- `quien_revisa` - Reviewer name
- `created_at` - Date/time formatted
- `caja_fuerte` - Status indicator
- `notas_count` - Notes count with visual indicator
- `evidencia_01`, `evidencia_02`, `evidencia_03` - Evidence thumbnails

## Error Handling

### View Toggle Errors
- Handle localStorage/sessionStorage access errors
- Fallback to default table view if stored preference is invalid
- Graceful degradation if card view fails to render

### Card Rendering Errors
- Error boundaries around card components
- Fallback to table view if card view encounters errors
- Individual card error handling to prevent full view failure

### Image Loading Errors
- Placeholder images for failed evidence loads
- Graceful handling of missing image URLs
- Loading states for evidence thumbnails

## Testing Strategy

### Unit Tests
- ViewToggle component state changes
- Card component rendering with different data
- View mode persistence logic
- Responsive layout behavior

### Integration Tests
- View switching maintains filters and pagination
- Data consistency between table and card views
- Navigation from card to detail view
- Search and filter functionality in card view

### Visual Tests
- Card layout responsiveness
- Toggle button states and styling
- Card styling consistency with design system
- Loading and empty states

### User Acceptance Tests
- Toggle between views maintains data state
- Card view displays correct information
- Mobile responsiveness works correctly
- Session persistence functions properly

## Implementation Approach

### Phase 1: Core Toggle Infrastructure
1. Add view mode state management
2. Implement basic toggle button
3. Add conditional rendering logic
4. Implement session storage persistence

### Phase 2: Card View Components
1. Create basic CardView component
2. Implement RevisionCard component
3. Add responsive grid layout
4. Integrate with existing data flow

### Phase 3: Enhanced Features
1. Add evidence thumbnail display
2. Implement notes count indicators
3. Add loading and empty states
4. Optimize performance and animations

### Phase 4: Polish and Testing
1. Refine styling and animations
2. Add comprehensive error handling
3. Implement full test coverage
4. Performance optimization

## Styling and Design

### Toggle Button Design
- Segmented control style matching existing UI
- Gold accent colors (`#c9a45c`, `#f0c987`)
- Smooth transitions between states
- Clear visual indication of active state

### Card Design
- Glassmorphism effect matching existing components
- Gradient backgrounds consistent with theme
- Rounded corners and subtle shadows
- Hover effects and transitions

### Responsive Behavior
- Desktop: 3-4 cards per row
- Tablet: 2-3 cards per row  
- Mobile: 1 card per row
- Consistent spacing and alignment

### Visual Indicators
- Notes count badge (orange for notes present)
- Evidence thumbnails in card footer
- Status indicators matching table view
- Loading skeletons for better UX