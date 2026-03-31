# Acervo TV - TODO List

## Database & Schema
- [x] Generate migration SQL with `pnpm drizzle-kit generate`
- [x] Apply migration via `webdev_execute_sql`
- [x] Verify videos table with indexes created successfully

## Backend - tRPC Procedures
- [x] Create video.create procedure (insert new video)
- [x] Create video.list procedure (list all videos with pagination)
- [x] Create video.search procedure (search by name, channel, type, HD, date range)
- [x] Create video.update procedure (edit video record)
- [x] Create video.delete procedure (delete video record)
- [x] Create video.export procedure (export filtered results as PDF data)
- [x] Add proper error handling and validation for all procedures
- [x] Write vitest tests for all procedures

## Frontend - UI Components
- [x] Create VideoForm component (add/edit video modal)
- [x] Create VideoTable component (display videos with pagination)
- [x] Create FilterPanel component (search and filter controls)
- [x] Create ColumnHeader component (sortable column headers)
- [x] Create DeleteConfirmDialog component (confirmation before delete)
- [x] Create ExportButton component (export to PDF)

## Frontend - Pages & Features
- [x] Update Home.tsx to main catalog page
- [x] Implement video listing with pagination (default 50 per page)
- [x] Implement add video form (modal or dedicated page)
- [x] Implement edit video functionality
- [x] Implement delete video with confirmation
- [x] Implement search and filter functionality
- [x] Implement column sorting (click header to sort)
- [x] Implement date range picker for filtering
- [x] Implement responsive layout for mobile/tablet

## PDF Export
- [x] Implement PDF generation on backend
- [x] Format PDF in landscape orientation (A4)
- [x] Include filtered data in PDF
- [x] Add table headers and styling to PDF
- [x] Test PDF export with various data sizes

## Performance & Optimization
- [x] Add database indexes for common queries (done in schema)
- [x] Implement pagination for large datasets
- [x] Optimize queries with proper WHERE clauses
- [ ] Test with 10,000+ records
- [ ] Implement lazy loading if needed
- [ ] Monitor query performance

## UI/UX & Styling
- [x] Choose modern color palette (professional/dark theme)
- [x] Implement responsive design (mobile-first)
- [ ] Add theme toggle (light/dark mode)
- [x] Style form inputs and buttons
- [x] Add loading states and spinners
- [x] Add empty state messaging
- [x] Add success/error toast notifications
- [x] Ensure accessibility (ARIA labels, keyboard navigation)

## Testing & Validation
- [x] Test CRUD operations (create, read, update, delete)
- [x] Test search and filter functionality
- [x] Test pagination with large datasets
- [x] Test PDF export
- [x] Test responsive design on different screen sizes
- [x] Test authentication flow
- [x] Test error handling and edge cases

## Deployment & Delivery
- [ ] Final code review and cleanup
- [ ] Create checkpoint before delivery
- [ ] Test live deployment
- [ ] Provide user with access link
- [ ] Document usage instructions if needed
