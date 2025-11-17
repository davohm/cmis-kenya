# Super Admin Features Implementation Plan

## Current State Analysis

### What Exists (But May Have Issues)
- ✅ County Management Tab - Can view counties, assign roles through county details
- ✅ Cooperatives Management Tab - Nested under Cooperatives > Management
- ✅ User creation via County Management flow (through AssignCountyAdminModal)
- ✅ Database schema with 38 tables covering all 17 services
- ✅ Basic RLS policies for viewing data
- ✅ Basic document storage in Supabase Storage (registration-documents bucket)

### Critical Issues Identified
1. **Missing RLS INSERT Policies** - Super Admin cannot create cooperatives or users due to missing INSERT policies
2. **Feature Discoverability** - Cooperatives Management is nested, not immediately visible
3. **Limited User Management** - Only through county context, no dedicated user management interface
4. **Missing Super Admin Features** - No system settings, audit logs, bulk operations, advanced analytics
5. **No Enterprise Document Management System** - Documents are scattered, no centralized management, no advanced search/filter capabilities

---

## Phase 1: Fix Critical RLS Policies & Permissions (Priority: CRITICAL)

### 1.1 Add Missing INSERT Policies for Cooperatives
**Files created:**
- ✅ `supabase/migrations/20251117003900_add_super_admin_cooperative_policies.sql`

**Tasks:**
- [x] Add INSERT policy for Super Admin to create cooperatives
- [x] Add UPDATE policy for Super Admin to modify cooperatives
- [x] Add DELETE policy for Super Admin (soft delete via is_active) - Note: Using UPDATE to set is_active=false
- [ ] Test cooperative creation from Super Admin dashboard
- [ ] Verify RLS policies don't break existing county admin permissions

**Database Changes:**
```sql
-- Super Admin can insert cooperatives
CREATE POLICY "super_admin_insert_cooperatives" ON cooperatives
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'SUPER_ADMIN'
      AND ur.is_active = true
    )
  );

-- Super Admin can update cooperatives
CREATE POLICY "super_admin_update_cooperatives" ON cooperatives
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'SUPER_ADMIN'
      AND ur.is_active = true
    )
  );
```

### 1.2 Add Missing INSERT Policy for Users
**Files created:**
- ✅ `supabase/migrations/20251117003901_add_super_admin_user_insert_policy.sql`

**Tasks:**
- [x] Add INSERT policy for Super Admin to create users directly
- [x] Ensure policy works with Supabase auth.signUp flow
- [ ] Test user creation from Super Admin interface
- [ ] Verify user creation through County Management still works

**Database Changes:**
```sql
-- Super Admin can insert users
CREATE POLICY "super_admin_insert_users" ON users
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'SUPER_ADMIN'
      AND ur.is_active = true
    )
  );
```

### 1.3 Verify All RLS Policies
**Tasks:**
- [ ] Audit all 38 tables for missing Super Admin policies
- [ ] Document which tables need INSERT/UPDATE/DELETE policies
- [ ] Create comprehensive RLS policy migration
- [ ] Test each policy with Super Admin account

---

## Phase 2: Enterprise Document Management System (EDMS) (Priority: HIGH)

### 2.1 Database Schema for EDMS
**Files to create:**
- `supabase/migrations/YYYYMMDDHHMMSS_create_edms_schema.sql`

**Tasks:**
- [ ] Create `documents` table with comprehensive metadata:
  - id, document_number, title, description
  - document_type (REGISTRATION, COMPLIANCE, AUDIT, AMENDMENT, FINANCIAL, LEGAL, etc.)
  - cooperative_id (nullable - for cooperative-specific docs)
  - tenant_id (county or National HQ)
  - sectoral_category (SACCO, AGRICULTURAL, DAIRY, TRANSPORT, etc.)
  - storage_path (Supabase Storage path)
  - file_name, file_size, mime_type
  - uploaded_by, uploaded_at
  - status (ACTIVE, ARCHIVED, DELETED)
  - version_number, parent_document_id (for versioning)
  - tags (array for flexible tagging)
  - metadata (JSONB for additional fields)
- [ ] Create `document_versions` table for version control
- [ ] Create `document_access_logs` table for audit trail
- [ ] Create `document_tags` table for advanced tagging
- [ ] Create indexes for performance:
  - Index on tenant_id, cooperative_id, document_type
  - Index on sectoral_category
  - Index on tags (GIN index for array search)
  - Full-text search index on title and description

**Database Schema:**
```sql
-- Documents table
CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_number text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  document_type text NOT NULL, -- REGISTRATION, COMPLIANCE, AUDIT, etc.
  cooperative_id uuid REFERENCES cooperatives(id),
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  sectoral_category text, -- SACCO, AGRICULTURAL, DAIRY, etc.
  storage_path text NOT NULL,
  storage_bucket text NOT NULL DEFAULT 'documents',
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  uploaded_by uuid REFERENCES users(id) NOT NULL,
  uploaded_at timestamptz DEFAULT now(),
  status text DEFAULT 'ACTIVE', -- ACTIVE, ARCHIVED, DELETED
  version_number integer DEFAULT 1,
  parent_document_id uuid REFERENCES documents(id),
  tags text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Document versions for version control
CREATE TABLE document_versions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  uploaded_by uuid REFERENCES users(id) NOT NULL,
  uploaded_at timestamptz DEFAULT now(),
  change_summary text,
  UNIQUE(document_id, version_number)
);

-- Document access logs for audit trail
CREATE TABLE document_access_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) NOT NULL,
  action text NOT NULL, -- VIEW, DOWNLOAD, UPLOAD, UPDATE, DELETE
  ip_address inet,
  user_agent text,
  accessed_at timestamptz DEFAULT now()
);

-- Document tags for advanced categorization
CREATE TABLE document_tags (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL,
  category text, -- SYSTEM, USER_DEFINED
  color text,
  created_at timestamptz DEFAULT now()
);
```

### 2.2 RLS Policies for EDMS
**Files to create:**
- `supabase/migrations/YYYYMMDDHHMMSS_add_edms_rls.sql`

**Tasks:**
- [ ] Add RLS policies for documents table:
  - Super Admin can view all documents
  - County Admin can view documents in their county
  - Cooperative Admin can view documents for their cooperative
  - Users can view documents they uploaded
- [ ] Add INSERT policies (who can upload)
- [ ] Add UPDATE policies (who can modify)
- [ ] Add DELETE policies (soft delete only)
- [ ] Add policies for document_access_logs
- [ ] Test all policies with different user roles

### 2.3 Create Documents Storage Bucket
**Tasks:**
- [ ] Create new Supabase Storage bucket: `documents`
- [ ] Set up folder structure: `{tenant_id}/{cooperative_id}/{document_type}/`
- [ ] Configure RLS policies for storage bucket
- [ ] Set up automatic cleanup for deleted documents

### 2.4 EDMS Management Interface
**Files to create:**
- `src/components/tabs/DocumentManagementTab.tsx`
- `src/hooks/useDocumentManagement.ts`
- `src/components/documents/DocumentUploadModal.tsx`
- `src/components/documents/DocumentViewer.tsx`
- `src/components/documents/DocumentFilters.tsx`
- `src/components/documents/DocumentSearch.tsx`

**Tasks:**
- [ ] Create DocumentManagementTab with:
  - Document list/grid view
  - Advanced search bar (full-text search)
  - Multi-level filters:
    - By County (tenant_id)
    - By Cooperative (cooperative_id)
    - By Sectoral Category (SACCO, Agricultural, Dairy, etc.)
    - By Document Type (Registration, Compliance, Audit, etc.)
    - By Status (Active, Archived, Deleted)
    - By Date Range (uploaded_at)
    - By Tags
    - By File Type (PDF, DOC, XLS, etc.)
  - Sort options:
    - Date (newest/oldest)
    - Name (A-Z, Z-A)
    - Size (largest/smallest)
    - Type
    - County
    - Cooperative
  - Bulk operations:
    - Bulk download
    - Bulk archive
    - Bulk tag assignment
    - Bulk export metadata
- [ ] Create document upload modal with:
  - File selection (single or multiple)
  - Metadata form (title, description, type, tags)
  - Cooperative selection (if applicable)
  - Sectoral category selection
  - Automatic document number generation
  - Progress tracking for uploads
- [ ] Create document viewer with:
  - Document preview (PDF, images)
  - Download button
  - Version history
  - Access log
  - Edit metadata
  - Share/link generation
- [ ] Create advanced search component with:
  - Full-text search across title, description, tags
  - Search suggestions
  - Recent searches
  - Saved search queries
- [ ] Create filter panel with:
  - Collapsible filter sections
  - Active filter chips
  - Clear all filters
  - Save filter presets

### 2.5 Document Upload & Processing
**Files to create:**
- `src/hooks/useDocumentUpload.ts` (enhance existing)
- `src/services/documentProcessor.ts`

**Tasks:**
- [ ] Enhance document upload hook to:
  - Support multiple file uploads
  - Generate unique document numbers
  - Extract metadata from files (if possible)
  - Create document records in database
  - Handle upload progress
  - Support drag-and-drop
- [ ] Create document processor service for:
  - File type validation
  - Virus scanning (future enhancement)
  - OCR processing for scanned documents (future)
  - Thumbnail generation for images
  - PDF metadata extraction

### 2.6 Document Version Control
**Tasks:**
- [ ] Implement version control system:
  - Upload new version of existing document
  - View version history
  - Compare versions (future enhancement)
  - Restore previous version
  - Version numbering (auto-increment)
  - Change summary for each version

### 2.7 Document Access Control & Audit
**Tasks:**
- [ ] Implement access control:
  - Document-level permissions
  - Role-based access
  - County-based access
  - Cooperative-based access
- [ ] Implement audit logging:
  - Log all document access (view, download)
  - Log all document modifications
  - Log all document deletions
  - Display access history in document viewer
  - Export access logs

### 2.8 Document Tagging & Categorization
**Tasks:**
- [ ] Implement tagging system:
  - Pre-defined system tags
  - User-defined tags
  - Tag management interface
  - Tag autocomplete
  - Tag suggestions based on content
  - Bulk tag assignment
  - Tag-based filtering

### 2.9 Document Search & Discovery
**Tasks:**
- [ ] Implement advanced search:
  - Full-text search with PostgreSQL tsvector
  - Search by document number
  - Search by tags
  - Search by metadata fields
  - Search within document content (future - requires OCR)
  - Search suggestions and autocomplete
- [ ] Implement search results:
  - Relevance ranking
  - Highlight search terms
  - Filter search results
  - Export search results
  - Save search queries

### 2.10 Document Statistics & Analytics
**Tasks:**
- [ ] Create document statistics dashboard:
  - Total documents by county
  - Total documents by cooperative
  - Total documents by sectoral category
  - Total documents by type
  - Storage usage by county
  - Storage usage by cooperative
  - Most accessed documents
  - Recent uploads
  - Documents pending review
- [ ] Create analytics charts:
  - Documents uploaded over time
  - Documents by type distribution
  - Storage usage trends
  - Access patterns

### 2.11 Document Lifecycle Management
**Tasks:**
- [ ] Implement document lifecycle:
  - Active documents (current)
  - Archived documents (old but kept)
  - Deleted documents (soft delete, recoverable)
  - Permanent deletion (after retention period)
- [ ] Implement retention policies:
  - Configurable retention periods by document type
  - Automatic archiving after period
  - Automatic deletion after retention
  - Manual archiving/deletion
- [ ] Implement document expiration:
  - Set expiration dates
  - Notifications before expiration
  - Automatic archival on expiration

### 2.12 Bulk Document Operations
**Tasks:**
- [ ] Implement bulk operations:
  - Bulk upload (zip file extraction)
  - Bulk download (zip file creation)
  - Bulk archive
  - Bulk delete
  - Bulk tag assignment
  - Bulk metadata update
  - Bulk export to CSV/Excel

### 2.13 Document Export & Reporting
**Tasks:**
- [ ] Implement export functionality:
  - Export document list (CSV/Excel)
  - Export document metadata
  - Export with filters applied
  - Export access logs
  - Generate document reports
- [ ] Create document reports:
  - Documents by county report
  - Documents by cooperative report
  - Documents by type report
  - Storage usage report
  - Access activity report

### 2.14 Integration with Existing Services
**Tasks:**
- [ ] Integrate EDMS with registration applications:
  - Link documents to registration applications
  - Auto-categorize registration documents
- [ ] Integrate with compliance reports:
  - Link compliance documents
  - Auto-tag compliance documents
- [ ] Integrate with audit reports:
  - Link audit documents
  - Version control for audit reports
- [ ] Integrate with all 17 services:
  - Ensure documents from all services are managed in EDMS
  - Service-specific document types
  - Service-specific metadata

### 2.15 Super Admin EDMS Features
**Tasks:**
- [ ] Super Admin specific features:
  - View all documents across all counties
  - Search across all counties
  - Filter by any county
  - Filter by any cooperative
  - Filter by any sectoral category
  - Access any document (override permissions)
  - Manage document types
  - Manage tags
  - Configure retention policies
  - View system-wide statistics
  - Export country-wide reports
  - Manage storage quotas
  - Monitor storage usage

---

## Phase 3: Improve Feature Discoverability & Navigation (Priority: HIGH)

### 3.1 Enhance Super Admin Dashboard Navigation
**Files to modify:**
- `src/components/Dashboard.tsx`
- `src/components/dashboards/SuperAdminDashboard.tsx`

**Tasks:**
- [ ] Make "Cooperatives Management" a top-level menu item (not nested)
- [ ] Add "User Management" as a dedicated top-level menu item
- [ ] Add "Document Management" as a dedicated top-level menu item
- [ ] Add quick action buttons on overview dashboard
- [ ] Add "Create Cooperative" button prominently on overview
- [ ] Add "Create User" button prominently on overview
- [ ] Add "Upload Document" button prominently on overview
- [ ] Improve visual hierarchy for Super Admin features

### 3.2 Add Quick Actions to Overview Dashboard
**Files to modify:**
- `src/components/dashboards/SuperAdminDashboard.tsx`

**Tasks:**
- [ ] Add "Quick Actions" section with prominent buttons:
  - Create New Cooperative
  - Create New User
  - Upload Document
  - Manage Counties
  - View System Logs
- [ ] Add recent activity feed showing created cooperatives/users/documents
- [ ] Add pending approvals count
- [ ] Add system health indicators
- [ ] Add document statistics summary

---

## Phase 4: Comprehensive User Management Interface (Priority: HIGH)

### 4.1 Create Dedicated User Management Tab
**Files to create:**
- `src/components/tabs/UserManagementTab.tsx`
- `src/hooks/useUserManagement.ts`

**Tasks:**
- [ ] Create UserManagementTab component with:
  - List all users with filters (role, county, status)
  - Search functionality
  - User details view
  - Create user button
  - Edit user button
  - Deactivate/reactivate user
- [ ] Create useUserManagement hook with:
  - loadUsers() - Load all users with pagination
  - createUser() - Create new user
  - updateUser() - Update user details
  - deactivateUser() - Soft delete user
  - assignRole() - Assign/change user role
  - searchUsers() - Search users by name/email/ID

### 4.2 Create Standalone User Creation Modal
**Files to create:**
- `src/components/admin/CreateStandaloneUserModal.tsx`

**Tasks:**
- [ ] Create modal for creating users without county context
- [ ] Allow selecting role (all 7 roles)
- [ ] Allow selecting tenant (county or National HQ)
- [ ] Include all user fields (name, email, phone, ID number)
- [ ] Generate temporary password
- [ ] Show password to Super Admin for sharing
- [ ] Send welcome email (future enhancement)

### 4.3 User Role Management
**Files to modify:**
- `src/components/tabs/UserManagementTab.tsx`

**Tasks:**
- [ ] Display all roles for each user
- [ ] Allow adding multiple roles to a user
- [ ] Allow removing roles from a user
- [ ] Show role assignment history
- [ ] Show who assigned each role and when

### 4.4 User Activity & Audit
**Tasks:**
- [ ] Show last login time for each user
- [ ] Show user creation date and creator
- [ ] Show recent actions by user
- [ ] Link to audit logs for specific user

---

## Phase 5: Enhanced Cooperative Management (Priority: MEDIUM)

### 5.1 Improve Cooperatives Management Tab
**Files to modify:**
- `src/components/tabs/CooperativesManagementTab.tsx`

**Tasks:**
- [ ] Add bulk operations (bulk deactivate, bulk export)
- [ ] Add advanced filters (by registration date range, share capital range, member count)
- [ ] Add cooperative statistics dashboard
- [ ] Add cooperative detail view with full information
- [ ] Add cooperative history/audit trail
- [ ] Add document management for cooperatives (link to EDMS)

### 5.2 Cooperative Member Management
**Tasks:**
- [ ] Allow Super Admin to view all members across all cooperatives
- [ ] Add member search across all cooperatives
- [ ] Add member statistics (total members, active members per county)
- [ ] Add member export functionality

### 5.3 Cooperative Officials Management
**Tasks:**
- [ ] View all cooperative officials
- [ ] Track official appointments and terms
- [ ] Add official term expiration alerts
- [ ] Export officials directory

---

## Phase 6: System Administration Features (Priority: MEDIUM)

### 6.1 System Settings Management
**Files to create:**
- `src/components/tabs/SystemSettingsTab.tsx`
- `src/hooks/useSystemSettings.ts`

**Tasks:**
- [ ] Create system settings interface
- [ ] Allow configuring:
  - System name and branding
  - Email templates
  - Notification settings
  - Feature flags
  - Default values
  - Document retention policies
  - Storage quotas
- [ ] Add settings audit trail
- [ ] Add settings export/import

### 6.2 Audit Log Viewer
**Files to create:**
- `src/components/tabs/AuditLogTab.tsx`
- `src/hooks/useAuditLogs.ts`

**Tasks:**
- [ ] Create audit log viewer interface
- [ ] Filter by:
  - User
  - Action type
  - Resource type
  - Date range
  - Tenant
- [ ] Show detailed audit log entries
- [ ] Export audit logs
- [ ] Add audit log search

### 6.3 System Health Monitoring
**Files to create:**
- `src/components/tabs/SystemHealthTab.tsx`

**Tasks:**
- [ ] Display system statistics:
  - Total users by role
  - Total cooperatives by status
  - Total applications by status
  - Database size
  - Storage usage (by bucket)
  - Document count and storage
- [ ] Show recent errors/warnings
- [ ] Display system uptime
- [ ] Show active sessions count

---

## Phase 7: Advanced Reporting & Analytics (Priority: MEDIUM)

### 7.1 Super Admin Analytics Dashboard
**Files to create:**
- `src/components/tabs/AnalyticsTab.tsx`
- `src/hooks/useSuperAdminAnalytics.ts`

**Tasks:**
- [ ] Create analytics dashboard with:
  - Registration trends (chart)
  - County performance comparison
  - Compliance rates by county
  - Revenue trends
  - User activity metrics
  - Document statistics
- [ ] Add date range filters
- [ ] Add export functionality
- [ ] Add scheduled report generation

### 7.2 Custom Reports Builder
**Tasks:**
- [ ] Create report builder interface
- [ ] Allow selecting:
  - Data source (cooperatives, users, applications, documents, etc.)
  - Fields to include
  - Filters
  - Grouping
  - Sorting
- [ ] Generate reports in PDF/Excel/CSV
- [ ] Save report templates
- [ ] Schedule automatic report generation

### 7.3 County Performance Dashboard
**Tasks:**
- [ ] Create county comparison dashboard
- [ ] Show metrics:
  - Cooperatives per county
  - Compliance rates
  - Application processing times
  - User activity
  - Document counts
- [ ] Add ranking/leaderboard
- [ ] Add export functionality

---

## Phase 8: Bulk Operations & Data Management (Priority: LOW)

### 8.1 Bulk User Operations
**Tasks:**
- [ ] Bulk user creation (CSV import)
- [ ] Bulk role assignment
- [ ] Bulk user deactivation
- [ ] Bulk user export
- [ ] User import template generation

### 8.2 Bulk Cooperative Operations
**Tasks:**
- [ ] Bulk cooperative creation (CSV import)
- [ ] Bulk cooperative update
- [ ] Bulk cooperative deactivation
- [ ] Bulk cooperative export
- [ ] Cooperative import template generation

### 8.3 Data Import/Export
**Tasks:**
- [ ] Create data import interface
- [ ] Support CSV/Excel import
- [ ] Validate imported data
- [ ] Show import preview
- [ ] Handle import errors gracefully
- [ ] Create export functionality for all major entities

---

## Phase 9: Integration & API Management (Priority: LOW)

### 9.1 Integration Status Dashboard
**Files to modify:**
- `src/components/tabs/IntegrationsTab.tsx`

**Tasks:**
- [ ] Show status of all integrations:
  - eCitizen
  - IPRS
  - KRA
  - SASRA
- [ ] Display last sync time
- [ ] Show integration errors
- [ ] Add manual sync buttons
- [ ] Add integration logs

### 9.2 API Key Management
**Tasks:**
- [ ] Create API key management interface
- [ ] Generate API keys for external systems
- [ ] Revoke API keys
- [ ] Show API usage statistics
- [ ] Add API key expiration

---

## Implementation Guidelines

### Code Quality Standards
- Use TypeScript with strict type checking
- Follow existing code patterns and component structure
- Add comprehensive error handling
- Include loading states for all async operations
- Add user-friendly error messages
- Write reusable hooks for data operations
- Use consistent naming conventions

### Security Requirements
- All RLS policies must be tested
- Super Admin permissions must be verified
- No sensitive data in client-side code
- All user inputs must be validated
- SQL injection prevention (use parameterized queries)
- XSS prevention (sanitize user inputs)
- Document access must be logged
- Document downloads must be tracked

### Testing Requirements
- Test each feature with Super Admin account
- Test RLS policies prevent unauthorized access
- Test error handling and edge cases
- Test responsive design on mobile/tablet
- Verify data integrity after operations
- Test document upload/download with large files
- Test search performance with large datasets
- Test bulk operations with large datasets

### Documentation Requirements
- Update FEATURES_STATUS.md after each phase
- Document new database migrations
- Add code comments for complex logic
- Update user guides if needed
- Document EDMS usage and best practices

### Performance Requirements
- Document search must be fast (< 2 seconds for typical queries)
- Document list must support pagination
- Bulk operations must show progress
- Large file uploads must support resumable uploads
- Document preview must load quickly
- Filters must be applied efficiently

---

## Success Criteria

### Phase 1 Complete When:
- ✅ Super Admin can create cooperatives without errors
- ✅ Super Admin can create users without errors
- ✅ All RLS policies are in place and tested
- ✅ No permission errors in console

### Phase 2 Complete When:
- ✅ EDMS database schema is created and migrated
- ✅ Super Admin can upload documents
- ✅ Super Admin can search documents by county, cooperative, and sectoral category
- ✅ Super Admin can filter and sort documents effectively
- ✅ Document version control works
- ✅ Document access logging works
- ✅ Document statistics are accurate
- ✅ All documents from existing services are accessible through EDMS

### Phase 3 Complete When:
- ✅ All Super Admin features are easily discoverable
- ✅ Navigation is intuitive and clear
- ✅ Quick actions are accessible from overview

### Phase 4 Complete When:
- ✅ Dedicated user management interface is functional
- ✅ Super Admin can create users with any role
- ✅ User role management works correctly
- ✅ User search and filtering works

### Phase 5 Complete When:
- ✅ Enhanced cooperative management features work
- ✅ Bulk operations are functional
- ✅ Member and official management is accessible

### Phase 6 Complete When:
- ✅ System settings can be managed
- ✅ Audit logs are viewable and searchable
- ✅ System health is monitorable

### Phase 7 Complete When:
- ✅ Analytics dashboard displays correctly
- ✅ Reports can be generated and exported
- ✅ County performance is trackable

### Phase 8 Complete When:
- ✅ Bulk operations work without errors
- ✅ Data import/export is functional
- ✅ Import validation works correctly

### Phase 9 Complete When:
- ✅ Integration status is visible
- ✅ API keys can be managed
- ✅ Integration logs are accessible

---

## Estimated Timeline

- **Phase 1**: 1-2 days (Critical - must complete first)
- **Phase 2**: 5-7 days (EDMS is comprehensive and critical)
- **Phase 3**: 1 day
- **Phase 4**: 3-4 days
- **Phase 5**: 2-3 days
- **Phase 6**: 2-3 days
- **Phase 7**: 3-4 days
- **Phase 8**: 2-3 days
- **Phase 9**: 1-2 days

**Total Estimated Time**: 20-29 days

---

## Notes

- Start with Phase 1 as it blocks all other features
- Phase 2 (EDMS) is critical for country-wide document management and should be prioritized after Phase 1
- Test thoroughly after each phase before moving to next
- Use Supabase MCP server for all database operations
- Follow existing code patterns for consistency
- Mark off completed features in this plan as you go
- EDMS must be robust enough to handle documents from all 47 counties plus National HQ
- Document search and filtering must be performant even with millions of documents
- Consider implementing document indexing and caching for better performance

---

## EDMS Specific Requirements

### Search & Filter Capabilities
- **By County**: Filter documents by any of the 47 counties or National HQ
- **By Cooperative**: Filter documents by specific cooperative (with search/autocomplete)
- **By Sectoral Category**: Filter by SACCO, Agricultural, Dairy, Transport, Marketing, Housing, etc.
- **By Document Type**: Registration, Compliance, Audit, Amendment, Financial, Legal, etc.
- **By Date Range**: Upload date, modification date, expiration date
- **By Tags**: User-defined and system tags
- **By File Type**: PDF, DOC, XLS, images, etc.
- **By Status**: Active, Archived, Deleted
- **Full-Text Search**: Search in document titles, descriptions, and content (future)

### Sort Capabilities
- Date (newest/oldest first)
- Name (A-Z, Z-A)
- Size (largest/smallest)
- Type
- County
- Cooperative
- Uploader

### Performance Requirements
- Search results must load in < 2 seconds
- Filter application must be instant
- Document list must support virtual scrolling for large datasets
- Bulk operations must show progress and be cancellable

### Scalability
- Must handle millions of documents
- Must support concurrent access from all 47 counties
- Must support large file uploads (up to 100MB per file)
- Must efficiently store and retrieve documents

---

*Last Updated: [Current Date]*
*Plan Version: 1.0*

