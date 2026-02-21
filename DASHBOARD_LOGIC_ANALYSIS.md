# Hospital Dashboard Logic Analysis

## Overview
The Hospital Dashboard at `http://localhost:8000/dashboard` is a comprehensive real-time analytics system that provides hospital administrators with key metrics, statistics, and activity monitoring. It's built on Laravel (backend) and React with TypeScript (frontend).

---

## Architecture Overview

```
Route: /dashboard
    ↓
DashboardController (app/Http/Controllers/Dashboard/DashboardController.php)
    ↓
DashboardService (app/Services/DashboardService.php)
    ↓
Dashboard Component (resources/js/Pages/Dashboard.tsx)
```

---

## 1. BACKEND LOGIC

### A. DashboardController (Entry Point)

**Location:** `app/Http/Controllers/Dashboard/DashboardController.php`

#### Main Method: `index()`

**Flow:**
```
1. Authentication Check → Verify user is logged in
2. Authorization Check → Verify user has 'view-dashboard' permission
3. Period Validation → Accept: 'today', 'week', 'month', 'year'
4. Service Call → Get comprehensive dashboard stats
5. Admin Data → If user is Super Admin or has permission, fetch:
   - Admin Activities (last 20)
   - Admin Statistics
6. Error Handling → Return empty data structure on failure
7. Render → Inertia component with JSON data
```

**Key Features:**
- Middleware: `['auth']` - Required authentication
- Permission Check: `view-dashboard`
- Admin-only data conditional rendering
- Comprehensive error logging to `logs/`
- Default fallback data on exception

#### API Methods:

1. **`data()` Method**
   - JSON API endpoint for dashboard data
   - Returns period-based statistics
   - Used for AJAX refreshes or mobile apps

2. **`realtime()` Method**
   - Real-time WebSocket updates
   - Returns only summary stats
   - Lightweight for frequent polling

---

### B. DashboardService (Business Logic)

**Location:** `app/Services/DashboardService.php`

This service handles all data aggregation and calculations.

#### Main Method: `getDashboardStats(period)`

**Process:**
```
Input: period (today|week|month|year)
    ↓
Get Date Range (based on period)
    ↓
Parallel Data Collection:
├── getSummaryStats()
├── getPatientStats()
├── getAppointmentStats()
├── getFinancialStats()
├── getPharmacyStats()
├── getLaboratoryStats()
├── getDepartmentStats()
├── getRecentActivities()
└── getTrendsData()
    ↓
Return Aggregated Array
```

#### Key Data Structures:

### 1. **Summary Stats** (`getSummaryStats()`)

```php
All-Time Metrics:
├── total_patients          // All patients ever created
├── total_doctors           // All active doctors
├── total_departments       // All departments

Period-Based Metrics:
├── new_patients            // Patients created in period
├── total_appointments      // Appointments in period
├── completed_appointments  // Completed in period
└── total_revenue           // Sum of appointment + pharmacy

Financial (Today/Period):
├── total_revenue           // appointment_revenue + pharmacy_revenue
├── appointment_revenue     // Sum of completed appointment fees
├── pharmacy_revenue        // Sum of pharmacy sales
├── pending_bills           // Count: payment_status = 'pending'
└── outstanding_amount      // Sum: amount_due for pending bills
```

**Database Queries:**
- Patients: `count()` + filtered by date range
- Doctors: `count()` (all time)
- Appointments: `whereBetween()` date range
- Revenue: Sum from Appointments & Sales tables

### 2. **Patient Stats** (`getPatientStats()`)

```php
Demographics:
├── gender_distribution     // Count by gender
├── age_distribution        // Groups: 0-17, 18-30, 31-45, 46-60, 60+
└── blood_group_distribution

Growth Metrics:
├── total                   // All patients
├── new_today              // Patients created today
└── new_this_period        // Patients created in period
```

### 3. **Appointment Stats** (`getAppointmentStats()`)

```php
Status Breakdown:
└── by_status              // Count by: scheduled, confirmed, completed, cancelled, no-show

Department Analysis:
└── by_department          // Top 5 departments by appointment count

Today's Schedule:
├── today_schedule         // Next 10 appointments with:
│   ├── patient_name
│   ├── doctor_name
│   ├── time
│   └── status
├── completed_count        // Completed + Confirmed
└── upcoming_count         // Scheduled, Rescheduled, Confirmed in future
```

**Joins:**
- appointments JOIN patients
- appointments JOIN doctors
- appointments JOIN departments

### 4. **Financial Stats** (`getFinancialStats()`)

```php
Revenue Breakdown:
├── appointment_revenue    // Sum from completed appointments
├── pharmacy_revenue       // Sum from completed sales
└── bill_revenue           // Sum from completed payments

Payment Methods:
├── method_name            // e.g., 'cash', 'card', 'check'
├── amount                 // Total by method
└── count                  // Transaction count

Outstanding Bills (Aging):
├── current                // Created ≥ 30 days ago
├── 30_60                  // 30-60 days past
├── 60_90                  // 60-90 days past
└── 90_plus                // 90+ days past

Metrics:
├── outstanding_bills      // Count of pending bills
├── outstanding_amount     // Total amount due
└── avg_bill_amount        // Average bill value
```

### 5. **Pharmacy Stats** (`getPharmacyStats()`)

```php
Inventory Alerts:
├── low_stock_count        // stock_quantity ≤ reorder_level
├── expiring_count         // Expiry in next 30 days
└── expired_count          // Already expired

Sales Metrics:
├── today_sales            // Count of completed sales today
├── today_revenue          // Sum of completed sales today
├── period_revenue         // Sum for specified period
└── total_medicines        // Total medicine count

Top Items:
└── top_medicines          // 5 best-selling medicines with quantities

Pending:
└── pending_prescriptions  // Count with status = 'pending'
```

**Joins:**
- sales_items JOIN medicines
- sales_items JOIN sales

### 6. **Laboratory Stats** (`getLaboratoryStats()`)

```php
Test Counts:
├── total_today            // Created today
├── completed_today        // Completed today
└── pending_count          // Status = 'pending'

Status Breakdown:
└── by_status              // Count by status

Pending Tests (Last 5):
├── test_type
├── patient_name
├── doctor_name
└── requested_at           // Time ago

```

### 7. **Department Stats** (`getDepartmentStats()`)

```php
Per Department:
├── name                   // Department name
├── doctors_count          // Doctor count
├── appointments_count     // Appointment count
└── revenue                // Completed appointment fees

Sorted by: appointments_count (descending)
Limited to: All departments
```

### 8. **Recent Activities** (`getRecentActivities()`)

```php
From: AuditLog table
├── user_name
├── action
├── description
├── module              // patients|appointments|billing|pharmacy|laboratory|doctors
├── time                // Relative (e.g., '2 hours ago')
└── type                // For color coding in UI

Limit: 20 most recent
Filtered: Only specific modules
```

### 9. **Admin Activities** (`getAdminActivities()`)

```php
Additional Admin Tracking:
├── severity             // high|medium|low
├── ip_address           // Source IP
└── timestamp            // ISO format

Limit: 20 or custom
Ordered by: Most recent first
```

### 10. **Admin Stats** (`getAdminStats()`)

```php
Admin Users:
├── total_admins         // Count of admin roles
├── online_admins        // Last login > 30 mins ago
└── admin_users[]        // Per user:
    ├── name
    ├── role
    ├── last_login
    ├── activity_count   // Audits in last 7 days
    └── is_online

Activity Summary:
├── activity_by_module   // Count by module (7 days)
├── total_activities_24h // Total audits in 24h
└── total_activities_7d  // Total audits in 7 days
```

### 11. **Trends Data** (`getTrendsData()`)

```php
Daily Trends (7 days):
├── appointments_count
├── patients_count
└── revenue

Monthly Trends (6 months):
├── appointments_count
├── patients_count
└── revenue
```

---

### C. Date Range Logic

```php
today:  [start of today, end of today]
week:   [start of week, end of week]
month:  [start of month, end of month]
year:   [start of year, end of year]
```

Uses Carbon for date manipulation.

---

## 2. FRONTEND LOGIC

### A. Dashboard Component (`resources/js/Pages/Dashboard.tsx`)

**Structure:**
```
Dashboard Component
├── State Management
│   ├── isRefreshing      // Refresh loading state
│   ├── activityPage      // Pagination for activity log
│   └── canViewAdminActivities
│
├── Utility Functions
│   ├── formatCurrency()  // AFN format
│   └── formatNumber()    // Locale format
│
├── Sub-Components
│   ├── StatCard          // Metric display
│   ├── RevenueCard       // Large revenue display
│   ├── ActivityItem      // Activity log item
│   └── AdminUserCard     // Admin user display
│
└── Main Render
    ├── Header
    ├── Revenue Overview (3 cards)
    ├── Main Stats Grid (3 columns)
    │   ├── Left: Key Metrics (Patients, Doctors, Appointments)
    │   ├── Middle: Department Status (Pharmacy, Lab, Today's Apts)
    │   └── Right: Alerts & Notifications
    ├── Admin Section (conditional)
    │   ├── Admin Activity Log
    │   └── Admin Users
    └── Recent Activities (paginated)
```

### B. Data Props Structure

```typescript
interface DashboardProps {
  summary: {
    total_patients: number
    new_patients: number
    total_doctors: number
    total_departments: number
    total_appointments: number
    completed_appointments: number
    total_revenue: number
    appointment_revenue: number
    pharmacy_revenue: number
    pending_bills: number
    outstanding_amount: number
  }
  
  appointments: {
    total: number
    upcoming_count: number
    today_schedule: Array<{
      id: number
      patient_name: string
      time: string
      status: string
    }>
  }
  
  pharmacy: {
    today_revenue: number
    low_stock_count: number
    expiring_count: number
    expired_count: number
    pending_prescriptions: number
  }
  
  laboratory: {
    total_today: number
    completed_today: number
    pending_count: number
  }
  
  recent_activities: Array<{
    id: number
    user_name: string
    user_role: string
    title: string
    description: string
    time: string
    type: string
  }>
  
  admin_activities?: AdminActivity[]
  admin_stats?: AdminStats
  period: string
  last_updated: string
  error?: string
}
```

### C. Frontend Rendering Logic

#### 1. **Revenue Section** (Top 3 Cards)
- Total Revenue (appointment + pharmacy)
- Appointment Revenue
- Pharmacy Revenue

**Colors:** Purple, Blue, Green

#### 2. **Main Stats Grid** (3-Column Layout)

**Left Column:**
- Total Patients (with new count)
- Total Doctors
- Total Appointments (with completed count)

**Middle Column:**
- Pharmacy Today Revenue (with pending prescriptions)
- Laboratory Tests Completed/Total (with pending)
- Today's Appointments (with upcoming)
- Total Departments

**Right Column (Alerts):**
- Low Stock Alert (if > 0)
- Expiring Soon Alert (if > 0)
- Expired Medicines Alert (if > 0)
- Pending Bills Alert (if > 0)
- "No Active Alerts" (if all = 0)

#### 3. **Admin Section** (Conditional - Super Admin Only)

**Left Card: Activity Log**
- Last 10 admin activities
- Color-coded by severity
- Module-specific icons
- Link to full activity logs

**Right Card: Admin Users**
- User avatars
- Online/Offline status
- Last login time
- Activity count (7 days)
- Link to manage users

#### 4. **Recent Activities Section**

- Grid: 1 column (mobile) → 2 columns (desktop)
- Pagination: 6 items per page
- Color-coded by type:
  - Patients: Blue
  - Appointments: Yellow
  - Billing: Purple
  - Pharmacy: Green
  - Laboratory: Cyan
  - Doctors: Red
- Hover effects with gradient backgrounds
- Shows: User, Role, Time, Description

---

## 3. SECURITY & PERMISSIONS

### Authentication
- All dashboard routes require `auth` middleware
- Checked in controller: `if (!$user->hasPermission('view-dashboard'))`

### Authorization Levels

```
1. Regular User
   └── View: Dashboard with basic metrics

2. Department Admin (Pharmacy, Lab, etc.)
   ├── View: Department-specific stats
   └── Cannot: Admin activities

3. Super Admin / Sub Super Admin
   ├── View: All dashboard data
   ├── View: Admin activities & stats
   └── Can: Manage admin users
```

### Data Filtering
- AuditLog filters by module type
- Admin activities hidden from non-admins
- Permission checks for each data section

---

## 4. DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser Request                          │
│          GET /dashboard (with auth middleware)              │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────↓────────────────────────────────────────┐
│          DashboardController::index()                       │
│  ├─ Authenticate User                                       │
│  ├─ Check Permission: view-dashboard                        │
│  ├─ Get Period from Query (default: today)                  │
│  └─ Call DashboardService                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────↓────────────────────────────────────────┐
│       DashboardService::getDashboardStats()                 │
│                                                              │
│  ├─ getDateRange(period)          → [start, end]           │
│  ├─ getSummaryStats()              → counts & revenue      │
│  ├─ getPatientStats()              → demographics          │
│  ├─ getAppointmentStats()          → buckets & schedule    │
│  ├─ getFinancialStats()            → revenue & aging       │
│  ├─ getPharmacyStats()             → inventory & sales     │
│  ├─ getLaboratoryStats()           → tests & pending       │
│  ├─ getDepartmentStats()           → dept breakdown        │
│  ├─ getRecentActivities()          → 20 most recent        │
│  ├─ getAdminActivities() [if admin]→ admin actions         │
│  ├─ getAdminStats() [if admin]     → admin users & stats   │
│  └─ getTrendsData()                → 7d & 6m trends        │
│                                                              │
│  Returns: Associative Array with all above data            │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────↓────────────────────────────────────────┐
│     Inertia::render('Dashboard', $dashboardData)            │
│         (React component receives props)                    │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────↓────────────────────────────────────────┐
│          Dashboard.tsx (React Component)                    │
│                                                              │
│  ├─ Display: Header with refresh button                     │
│  ├─ Display: Revenue cards (3 cards)                        │
│  ├─ Display: Main stats grid (3 columns)                    │
│  ├─ Display: Admin section [if authorized]                 │
│  ├─ Display: Recent activities (paginated)                  │
│  └─ Features:                                               │
│     ├─ Real-time refresh with icon animation               │
│     ├─ Error banner display                                │
│     ├─ Responsive grid layout                              │
│     ├─ Color-coded alerts                                  │
│     ├─ Activity pagination (6 per page)                    │
│     └─ Currency formatting (AFN)                           │
│                                                              │
│  Browser Renders: Rich HTML Dashboard                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     v
              User Sees Dashboard
```

---

## 5. KEY CALCULATIONS

### Revenue Calculation
```
Total Revenue = Appointment Revenue + Pharmacy Revenue

Appointment Revenue = SUM(fee) WHERE status='completed'
Pharmacy Revenue = SUM(total_amount) WHERE status='completed'
```

### Active Appointments
```
Upcoming Count = Count WHERE appointment_date > NOW()
            AND status IN ['scheduled', 'rescheduled', 'confirmed']
            
Completed Count = Count WHERE status IN ['completed', 'confirmed']
```

### Outstanding Amount (Aging)
```
Current      = SUM(amount_due) WHERE created_at >= NOW() - 30 days
30-60 Days   = SUM(amount_due) WHERE created_at BETWEEN NOW()-60 AND NOW()-30
60-90 Days   = SUM(amount_due) WHERE created_at BETWEEN NOW()-90 AND NOW()-60
90+ Days     = SUM(amount_due) WHERE created_at < NOW() - 90 days
```

### Admin Online Status
```javascript
is_online = last_login_at > NOW() - 30 minutes
```

---

## 6. PERFORMANCE CONSIDERATIONS

### Database Queries
- Queries are grouped by data category
- Uses `count()`, `sum()`, `whereBetween()` for efficiency
- Limit applied for: top medicines (5), pending tests (5), activities (20)

### Caching Opportunities (Not Currently Implemented)
```php
// Could cache these:
- summary stats (5-10 min cache)
- department stats (hourly cache)
- trend data (hourly cache)
- avoid caching: recent activities, admin activities
```

### Frontend Optimization
- Component reusability (StatCard, RevenueCard)
- Conditional rendering for admin sections
- Pagination for activity scrolling (not infinite load)
- Responsive grid layout

---

## 7. ERROR HANDLING

### Backend
```
DatabaseException
    ↓
Log Error (color-coded with trace)
    ↓
Return Default Stats (all zeros)
    ↓
Frontend: Shows error banner
          Displays empty dashboard
```

### Frontend
```
Error Prop Display:
└─ Yellow alert box: "Unable to load dashboard data"
   Shows at top of page
```

---

## 8. API ENDPOINTS

### Main Dashboard
```
GET /dashboard
    Returns: Inertia rendered page with all stats
    Auth: Required
    Permission: view-dashboard
```

### JSON API
```
GET /dashboard/data?period=today|week|month|year
    Returns: JSON with all stats
    Auth: Required
    Permission: view-dashboard
    Use: Mobile apps, external dashboards
```

### Real-time Updates
```
GET /dashboard/realtime
    Returns: Only summary stats
    Auth: Required
    Permission: view-dashboard
    Use: WebSocket polling, live updates
```

---

## 9. UI/LAYOUT STRUCTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    Header                                    │
│  Title: "Hospital Management Dashboard"                     │
│  Last Updated: [timestamp]                                  │
│  [Refresh Button]                                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Revenue Overview (3 cards)                      │
│  [Total Revenue] [Appointment Revenue] [Pharmacy Revenue]  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Main Stats Grid (3 columns)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Key        │  │  Department  │  │  Alerts &    │     │
│  │  Metrics     │  │  Status      │  │  Notifications
│  │              │  │              │  │              │     │
│  │ Patients     │  │ Pharmacy     │  │ Low Stock    │     │
│  │              │  │              │  │              │     │
│  │ Doctors      │  │ Laboratory   │  │ Expiring     │     │
│  │              │  │              │  │              │     │
│  │ Appointments │  │ Today's Apts  │  │ Expired      │     │
│  │              │  │              │  │              │     │
│  │              │  │ Departments  │  │ Pending Bills│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│          Admin Section (if Super Admin)                      │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │ Admin Activity Log   │  │ Admin Users          │        │
│  │                      │  │                      │        │
│  │ (10 recent actions)  │  │ (Total + Online)     │        │
│  ],└──────────────────────┘  └──────────────────────┘        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│          Recent System Activities                           │
│  (Grid: 2 columns, with pagination)                         │
│                                                              │
│  [Activity] [Activity]  Page 1 of X                         │
│  [Activity] [Activity]  [< Prev] [1] [2] [Next >]          │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. KEY FEATURES SUMMARY

| Feature | Type | Data Source | Update | Permission |
|---------|------|-------------|--------|-----------|
| Revenue Cards | Display | Calculations | Refresh | view-dashboard |
| Patient Stats | Display | Demographics | Refresh | view-dashboard |
| Department Status | Display | Aggregates | Refresh | view-dashboard |
| Alerts | Dynamic | Real-time checks | Refresh | view-dashboard |
| Admin Activities | Conditional | AuditLog | Refresh | view-admin-activities |
| Admin Users | Conditional | User table | Refresh | view-admin-activities |
| Recent Activities | Paginated | AuditLog | Refresh | view-dashboard |
| Trends | Charts (future) | Calculations | Hourly | view-dashboard |

---

## 11. FUTURE IMPROVEMENTS

1. **Chart Implementation**
   - Daily/Monthly trend charts
   - Department revenue comparison
   - Patient age distribution visualizations

2. **Real-time Updates**
   - WebSocket integration for live stats
   - Notification system for alerts
   - Activity stream updates

3. **Caching Strategy**
   - Redis cache for high-load stats
   - Cache invalidation on data changes
   - Dashboard stats API rate limiting

4. **Export Features**
   - PDF report generation
   - Excel data export
   - Period-based report builders

5. **Advanced Filtering**
   - Custom date ranges
   - Department filtering
   - Doctor/Staff filtering
   - Status filtering

6. **Mobile Optimization**
   - Simplified dashboard view
   - Swipeable cards
   - Native app integration

---

## 12. TESTING CHECKLIST

```
□ Authentication (without login → redirects to /login)
□ Permission Check (without view-dashboard → 403)
□ Period Switching (today, week, month, year)
□ Data Accuracy
  □ Revenue calculations
  □ Patient counts
  □ Appointment statuses
  □ Financial aging
□ Admin Section (visible only for admins)
□ Activity Pagination (6 items per page)
□ Error Handling (invalid period, DB error)
□ Refresh Button (reloads data)
□ Responsive Design (mobile, tablet, desktop)
□ Performance (load time < 2s)
```

---

## Conclusion

The HMS Dashboard is a comprehensive analytics system that aggregates data from multiple hospital modules (Patients, Appointments, Pharmacy, Laboratory, Billing) and presents it through an intuitive React UI. It uses a service-oriented backend architecture with role-based access control and includes detailed audit logging for admin oversight.
