# Implementation Plan

- [x] 1. Set up view mode state management and toggle infrastructure


  - Add viewMode state ('table' | 'card') to Home component
  - Implement session storage for view preference persistence
  - Add conditional rendering logic for table/card views
  - _Requirements: 1.1, 1.2, 4.1, 4.2, 4.3, 4.4_



- [ ] 2. Create ViewToggle component
  - Design and implement toggle button component with segmented control style
  - Add smooth transitions and active state indicators
  - Integrate with existing UI design system (gold accents, glassmorphism)


  - Handle view mode switching and state updates
  - _Requirements: 1.1, 1.2_

- [ ] 3. Implement basic CardView component structure
  - Create CardView component that accepts revision data array

  - Implement responsive grid layout (desktop: 3-4 columns, tablet: 2-3, mobile: 1)
  - Add loading and empty states matching existing design patterns
  - Integrate with existing pagination system
  - _Requirements: 2.1, 2.3, 3.1, 3.2, 3.5_

- [x] 4. Create RevisionCard component

  - Implement individual card component displaying key revision information
  - Add glassmorphism styling consistent with existing components
  - Display casita, reviewer, date, and status information
  - Implement click handler for navigation to detail view
  - _Requirements: 2.2, 2.5, 3.3_


- [ ] 5. Add notes count indicator to cards
  - Implement visual indicator for cards with notes (orange badge)
  - Display notes count in card component
  - Style indicator to match existing notes highlighting in table
  - _Requirements: 2.2, 3.4_



- [ ] 6. Implement evidence thumbnails in cards
  - Add evidence thumbnail display in card footer
  - Handle image loading states and error fallbacks


  - Implement click handlers for opening image modal
  - Style thumbnails to fit card layout
  - _Requirements: 2.4_



- [ ] 7. Integrate card view with existing filters and search
  - Ensure card view respects current search term filtering
  - Maintain caja fuerte filter functionality in card view
  - Verify pagination works correctly with filtered card data
  - _Requirements: 1.5, 2.1, 2.3_




- [ ] 8. Add responsive behavior and mobile optimization
  - Test and refine card layout on different screen sizes
  - Ensure touch interactions work properly on mobile
  - Optimize card spacing and sizing for mobile devices
  - _Requirements: 3.1, 3.2_

- [ ] 9. Implement error handling and loading states
  - Add error boundaries around card components
  - Implement graceful fallback to table view on card errors
  - Add loading skeletons for card view
  - Handle individual card rendering errors
  - _Requirements: 3.5_

- [ ] 10. Add animations and polish
  - Implement smooth transitions when switching between views
  - Add hover effects and micro-interactions for cards
  - Optimize performance for large datasets
  - Final styling refinements and consistency checks
  - _Requirements: 3.3_