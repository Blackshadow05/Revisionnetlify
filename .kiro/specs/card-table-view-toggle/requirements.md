# Requirements Document

## Introduction

This feature adds a view toggle functionality to the main page that allows users to switch between a card view and the existing table view for displaying revision data. The toggle will provide users with different ways to visualize the same data, with the card view offering a more visual and compact representation while the table view maintains the detailed tabular format.

## Requirements

### Requirement 1

**User Story:** As a user viewing the revision data, I want to toggle between card and table views, so that I can choose the most suitable visualization format for my needs.

#### Acceptance Criteria

1. WHEN the page loads THEN the system SHALL display a toggle button that allows switching between "Card View" and "Table View"
2. WHEN the user clicks the toggle button THEN the system SHALL switch the current view mode and update the button state
3. WHEN "Table View" is selected THEN the system SHALL show the existing table component and hide the card view
4. WHEN "Card View" is selected THEN the system SHALL show the card view component and hide the table view
5. WHEN the view mode changes THEN the system SHALL maintain all current filters, search terms, and pagination state

### Requirement 2

**User Story:** As a user, I want the card view to display the same data as the table view, so that I have consistent information regardless of the view mode.

#### Acceptance Criteria

1. WHEN displaying card view THEN the system SHALL show all revision records that match current filters
2. WHEN displaying card view THEN each card SHALL contain the essential revision information (casita, reviewer, date, status, notes count)
3. WHEN displaying card view THEN the system SHALL maintain the same pagination as the table view
4. WHEN displaying card view THEN the system SHALL show evidence thumbnails or indicators when available
5. WHEN a user clicks on a card THEN the system SHALL navigate to the detailed view, same as clicking on a table row

### Requirement 3

**User Story:** As a user, I want the card view to be responsive and visually appealing, so that I can easily scan and identify revision information on different devices.

#### Acceptance Criteria

1. WHEN viewing cards on desktop THEN the system SHALL display cards in a grid layout with multiple columns
2. WHEN viewing cards on mobile devices THEN the system SHALL display cards in a single column layout
3. WHEN displaying cards THEN the system SHALL use consistent styling with the existing design system
4. WHEN cards contain notes THEN the system SHALL highlight cards with notes using visual indicators
5. WHEN cards are displayed THEN the system SHALL show loading states and empty states appropriately

### Requirement 4

**User Story:** As a user, I want the view preference to be remembered during my session, so that I don't have to repeatedly select my preferred view mode.

#### Acceptance Criteria

1. WHEN the user selects a view mode THEN the system SHALL remember the preference for the current session
2. WHEN the user refreshes the page THEN the system SHALL maintain the previously selected view mode
3. WHEN the user navigates away and returns THEN the system SHALL restore the last selected view mode
4. IF no previous preference exists THEN the system SHALL default to table view