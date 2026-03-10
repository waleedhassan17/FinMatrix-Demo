# FinMatrix - Completion Prompts
## Fill Every Gap, Fix Every Stub, Wire Every Dead Button
### 12 Ordered Prompts to Make the App 100% Complete
#### Version 1.0 - March 2026

---

## Gap Analysis Summary

After thorough codebase analysis against the 38-prompt specification, here are all identified gaps:

| # | Gap | Severity |
|---|-----|----------|
| 1 | AdminDashboard quick actions are ALL stubs ("Coming Soon" alerts) | High |
| 2 | AdminDashboard "Manage Deliveries" button is dead (no onPress nav) | High |
| 3 | AdminDashboard Profile modal "My Profile" / "Settings" are stubs | Medium |
| 4 | CustomerDetail "Create Invoice" / "Record Payment" buttons are stubs | High |
| 5 | VendorDetail "Enter Bill" / "Pay Vendor" buttons are stubs | High |
| 6 | ReportsHub: 12 of 21 report rows are dead (no route, no screen) | High |
| 7 | No `budgetSlice.ts` — Budgets use local state only, not persisted to Redux | Medium |
| 8 | No `notificationSlice.ts` — NotificationCenter uses local dummy data only | Medium |
| 9 | No `settingsSlice.ts` — Settings preferences not persisted | Low |
| 10 | `NotificationsScreen.tsx` (61-line stub) still in DashboardStack alongside real `NotificationCenterScreen` | Medium |
| 11 | PO Detail Screen missing status timeline visualization | Medium |
| 12 | CreditMemo Form missing "Apply to Invoices" allocation UI | Medium |
| 13 | No shared `SimpleTabBar.tsx` — duplicated inline in 4+ screens | Low |
| 14 | 6 orphaned dead files: MyDeliveriesScreen, ShadowInventoryScreen, DeliveryProfileScreen, InventoryHubScreen, DeliveryDashboard, RoleSelection.tsx | Low |
| 15 | `homeScreenSlice.ts` exists but not registered in Redux store | Low |
| 16 | Settings "Fiscal Year", "Export", "Import", "Clear Demo", "About" rows are stubs | Low |
| 17 | AdminHomeScreen.tsx, DeliveryHomeScreen.tsx orphaned and unused | Low |

---

## How to Use

Feed these 12 prompts **in order** to your AI coding assistant. Each prompt:
- Specifies exact file paths
- Describes what to fix/create
- References existing working code
- Produces working changes that build on previous prompts

**Start with Prompt C1. Do not skip prompts.**

---

## PROMPT C1: Shared SimpleTabBar Component + Dead File Cleanup + Store Fix

```
You are continuing work on FinMatrix, a React Native TypeScript accounting app at d:\FinMatrix-App\FinMatrix. The app has ~220 files and ~55K lines of code already built. We are now filling gaps and fixing incomplete features.

TASK 1 - Create shared SimpleTabBar component:
FILE: src/Custom-Components/SimpleTabBar.tsx
Currently, SimpleTabBar is duplicated inline in CustomerDetailScreen, VendorDetailScreen, EmployeeDetailScreen, InventoryDetailScreen, and COADetailScreen. Create a SINGLE reusable component.
Props: { tabs: string[], activeTab: string, onTabChange: (tab: string) => void, accentColor?: string }
Style: horizontal row, each tab is a TouchableOpacity, active tab has bottom border (2px) in accentColor (default #1B3A5C), active text is bold + accentColor, inactive text is #999. Background white, bottom border 1px #E8ECF0. Height 44px. Tabs evenly spaced with flex:1.
After creating, update these files to import and use the shared SimpleTabBar instead of their inline implementations:
- src/screens/Customers/CustomerDetailScreen.tsx
- src/screens/Vendors/VendorDetailScreen.tsx 
- src/screens/Employees/EmployeeDetailScreen.tsx
- src/screens/Inventory/InventoryDetailScreen.tsx
- src/screens/ChartOfAccounts/COADetailScreen.tsx

TASK 2 - Register homeScreenSlice in store:
FILE: src/store/store.ts - Import homeScreenSlice from '../screens/HomeScreen/homeScreenSlice' and add it to the reducer object as `homeScreen`.

TASK 3 - Remove orphaned stub files (these are dead code, replaced by real implementations):
DELETE (or empty out with a comment "Deprecated - see DP equivalent") these files:
- src/screens/Delivery/Personnel/MyDeliveriesScreen.tsx (replaced by DPDeliveryListScreen)
- src/screens/Delivery/Personnel/ShadowInventoryScreen.tsx (replaced by DPShadowInventoryScreen)
- src/screens/Delivery/Personnel/DeliveryProfileScreen.tsx (replaced by DPProfileScreen)
- src/screens/Inventory/InventoryHubScreen.tsx (replaced by InventoryListScreen)
- src/screens/HomeScreen/DeliveryDashboard.tsx (replaced by DPDashboardScreen)

TASK 4 - Fix DashboardStack NotificationsScreen stub:
FILE: src/navigators/stacks/DashboardStack.tsx - The route 'AdminNotifications' points to NotificationsScreen (a 61-line stub). Either remove this route entirely OR redirect it to the real NotificationCenterScreen. The bell icon in AdminDashboard already navigates to 'NotificationCenter' which uses the real NotificationCenterScreen. Remove the stub route.

Make sure all existing tests and navigation still work after these changes.
```

---

## PROMPT C2: AdminDashboard - Wire All Quick Actions + Fix Dead Buttons

```
Continue FinMatrix. Shared SimpleTabBar is now in place.

TASK: Fix ALL stub buttons and dead navigation in AdminDashboard.

FILE: src/screens/HomeScreen/AdminDashboard.tsx

CHANGE 1 - Replace handleQuickAction stub with real navigation:
The current implementation shows "Coming Soon" alert for all 8 quick actions. Replace with actual navigation:
- "New Invoice" → navigation.navigate('AdminTabs', {screen: 'Transactions', params: {screen: 'InvoiceForm'}})
- "Record Payment" → navigation.navigate('AdminTabs', {screen: 'Transactions', params: {screen: 'ReceivePayment'}})
- "New Expense" → navigation.navigate('AdminTabs', {screen: 'Transactions', params: {screen: 'BillForm'}})
- "Run Payroll" → navigation.navigate('AdminTabs', {screen: 'More', params: {screen: 'RunPayroll'}})
- "Check Inventory" → navigation.navigate('AdminTabs', {screen: 'Inventory'})
- "Assign Delivery" → navigation.navigate('AdminTabs', {screen: 'More', params: {screen: 'DeliveryManagement'}})
- "View Reports" → navigation.navigate('AdminTabs', {screen: 'Reports'})
- "Reconcile" → navigation.navigate('AdminTabs', {screen: 'More', params: {screen: 'BankAccounts'}})

CHANGE 2 - Fix "Manage Deliveries" button in Delivery Overview card:
The "Manage Deliveries →" button currently has no onPress handler. Wire it to:
navigation.navigate('AdminTabs', {screen: 'More', params: {screen: 'DeliveryManagement'}})

CHANGE 3 - Fix Profile Modal actions:
- "My Profile" currently shows "Coming Soon" alert → Navigate to Settings (or show a profile view if available): navigation.navigate('AdminTabs', {screen: 'More', params: {screen: 'Settings'}})
- "Settings" currently shows "Coming Soon" alert → Navigate: navigation.navigate('AdminTabs', {screen: 'More', params: {screen: 'Settings'}})

CHANGE 4 - Fix Alert items navigation:
Make the 3 alerts tappable with real navigation:
- "3 items below reorder point" → navigate to Inventory tab
- "5 invoices overdue" → navigate to Transactions > InvoiceList
- "2 inventory updates pending" → navigate to More > DeliveryManagement

All changes should use the existing ROUTES constants from src/navigations-map/Base.ts where available.
```

---

## PROMPT C3: CustomerDetail + VendorDetail - Wire Action Buttons

```
Continue FinMatrix. AdminDashboard fully wired.

TASK: Replace "Coming Soon" stub buttons with real navigation in Customer and Vendor detail screens.

FILE: src/screens/Customers/CustomerDetailScreen.tsx
CHANGES:
1. "Create Invoice" button → navigation.navigate(ROUTES.INVOICE_FORM, { customerId: customer.customerId }) — this should pre-fill the customer in the invoice form.
2. "Record Payment" button → navigation.navigate(ROUTES.RECEIVE_PAYMENT, { customerId: customer.customerId }) — this should pre-fill the customer in the payment screen.
3. Make sure both buttons are in the bottom action bar and use the existing ROUTES constants.

FILE: src/screens/Vendors/VendorDetailScreen.tsx
CHANGES:
1. "Enter Bill" button → navigation.navigate(ROUTES.BILL_FORM, { vendorId: vendor.vendorId }) — pre-fill vendor in bill form.
2. "Pay Vendor" button → navigation.navigate(ROUTES.PAY_BILLS) — navigate to Pay Bills screen (vendor can be pre-selected there).
3. Wire both buttons with real navigation.

Both screens should import ROUTES from '../../navigations-map/Base' if not already imported.
Ensure the target screens (InvoiceFormScreen, ReceivePaymentScreen, BillFormScreen, PayBillsScreen) already accept these route params — they should, as the spec required customerId/vendorId params.
```

---

## PROMPT C4: Budget Redux Slice + Notification Slice + Settings Slice

```
Continue FinMatrix. Detail screen buttons all wired.

TASK: Create missing Redux slices for Budgets, Notifications, and Settings, and register them in the store.

FILE: src/screens/Budgets/budgetSlice.ts (CREATE NEW)
State: { budgets: Budget[], currentBudget: Budget|null, isLoading: boolean, error: string|null }
Type Budget: { budgetId: string, companyId: string, year: number, monthlyBreakdown: Record<string, number[]>, totalBudget: number, status: 'draft'|'active', createdAt: string }
Thunks: fetchBudgets (800ms delay, return dummy data from budgets.ts), createBudget, updateBudget.
Reducers: setBudgets, setCurrentBudget, setLoading, setError.
Export the reducer.

FILE: src/screens/Notifications/notificationSlice.ts (CREATE NEW)
State: { notifications: Notification[], unreadCount: number, filter: string, isLoading: boolean }
Type Notification: use shape from dummy-data/notifications.ts.
Thunks: fetchNotifications (600ms delay, return dummy data), markAsRead(id), markAllRead, dismissNotification(id).
Reducers: setFilter, updateNotification, removeNotification.
Export the reducer.

FILE: src/screens/Settings/settingsSlice.ts (CREATE NEW)  
State: { dateFormat: 'MM/DD/YYYY'|'DD/MM/YYYY'|'YYYY-MM-DD', numberFormat: '1,234.56'|'1.234,56', currency: 'USD'|'EUR'|'GBP', invoicePrefix: string, invoiceStartNumber: number, defaultTerms: string, defaultNotes: string, notificationPrefs: { invoices: boolean, payments: boolean, overdue: boolean, inventory: boolean, payroll: boolean } }
Reducers: setDateFormat, setNumberFormat, setCurrency, setInvoicePrefix, setInvoiceStartNumber, setDefaultTerms, setDefaultNotes, toggleNotificationPref.
No thunks needed (local preferences). Export the reducer.

FILE: src/store/store.ts (UPDATE)
Import and register all 3 new slices: budgets (budgetSlice), notifications (notificationSlice), settings (settingsSlice).

FILE: src/screens/Budgets/BudgetListScreen.tsx (UPDATE)
Replace direct dummy-data import with Redux: useAppDispatch + useAppSelector. Dispatch fetchBudgets on mount. Read from state.budgets.budgets.

FILE: src/screens/Notifications/NotificationCenterScreen.tsx (UPDATE)
Replace local dummy-data state with Redux: useAppDispatch + useAppSelector. Dispatch fetchNotifications on mount. Use markAsRead, markAllRead, dismissNotification actions.

FILE: src/screens/Settings/SettingsScreen.tsx (UPDATE)
Replace local useState for preferences with Redux: read from state.settings, dispatch setDateFormat/setNumberFormat etc on change. This persists preference changes across screen navigation.
```

---

## PROMPT C5: Missing Report Screens - Part 1 (Cash Flow, AP Aging, Customer/Vendor Balances)

```
Continue FinMatrix. Redux slices all in place.

TASK: Build the 4 most critical missing report screens that are listed in ReportsHub but have no route or screen.

FILE: src/screens/Reports/CashFlowScreen.tsx (CREATE NEW)
Cash Flow Statement report. DateRangePicker at top.
Three sections:
- OPERATING ACTIVITIES: Net Income (from P&L calc), Adjustments (Depreciation add-back, AR changes, AP changes, Inventory changes). Net Cash from Operations.
- INVESTING ACTIVITIES: Equipment purchases (negative). Net Cash from Investing.
- FINANCING ACTIVITIES: Notes Payable changes, Owner Draws. Net Cash from Financing.
- NET CHANGE IN CASH (bold, green/red). Beginning Cash Balance + Net Change = Ending Cash Balance.
Calculate from COA dummy data (chartOfAccounts.ts). Use formatCurrency from utils/formatters.

FILE: src/screens/Reports/APAgingScreen.tsx (CREATE NEW)
Same pattern as existing ARAgingScreen but for vendors/bills.
Table: Vendor | Current | 1-30 | 31-60 | 61-90 | 90+ | Total.
Calculate aging buckets from dummy bills data (bills.ts) based on dueDate vs today's date.
Totals row at bottom. Pull-to-refresh. Color-code overdue amounts in red.

FILE: src/screens/Reports/CustomerBalancesScreen.tsx (CREATE NEW)
Table: Customer Name | Total Invoiced | Total Paid | Balance Due.
Data from customers.ts. Sort by balance descending. Summary: Total Outstanding at top.
Tap row → navigate to CustomerDetail.

FILE: src/screens/Reports/VendorBalancesScreen.tsx (CREATE NEW)  
Table: Vendor Name | Total Billed | Total Paid | Balance Due.
Data from vendors.ts. Sort by balance descending. Summary: Total Outstanding at top.
Tap row → navigate to VendorDetail.

FILE: src/navigators/stacks/ReportsStack.tsx (UPDATE)
Add all 4 new screens: CashFlow, APAging, CustomerBalances, VendorBalances.

FILE: src/navigations-map/Base.ts (UPDATE)
Add route constants: REPORT_CASH_FLOW, REPORT_AP_AGING, REPORT_CUSTOMER_BALANCES, REPORT_VENDOR_BALANCES.

FILE: src/screens/Reports/ReportsHubScreen.tsx (UPDATE)
Wire the 4 new routes:
- "Cash Flow" → REPORT_CASH_FLOW
- "AP Aging" → REPORT_AP_AGING  
- "Customer Balances" → REPORT_CUSTOMER_BALANCES
- "Vendor Balances" → REPORT_VENDOR_BALANCES

All screens should use AppContainer wrapper, have pull-to-refresh, use theme colors, and use formatCurrency/formatDate from utils/formatters.
```

---

## PROMPT C6: Missing Report Screens - Part 2 (Stock Status, Low Stock, Sales Reports, Tax Report)

```
Continue FinMatrix. Cash Flow, AP Aging, Customer/Vendor Balances reports done.

TASK: Build the remaining 6 missing report screens.

FILE: src/screens/Reports/StockStatusScreen.tsx (CREATE NEW)
All inventory items with status indicators. Columns: Item | SKU | On Hand | On Order | Available | Status.
Status logic: Green "In Stock" if qty > reorderPoint, Amber "Low Stock" if qty <= reorderPoint && qty > 0, Red "Out of Stock" if qty === 0.
Filter chips: All, In Stock, Low Stock, Out of Stock. Category filter dropdown.
Summary bar: Total Items | In Stock count | Low Stock count | Out of Stock count.
Data from inventoryItems.ts.

FILE: src/screens/Reports/LowStockAlertScreen.tsx (CREATE NEW)
Items at or below reorder point. Columns: Item | SKU | Current Qty | Reorder Point | Shortage | Suggested Order Qty.
Shortage = reorderPoint - quantityOnHand (if positive). Suggested = reorderQuantity from item data.
Sorted by shortage descending (most urgent first). "Create PO" button per item → navigate to POForm.
Data from inventoryItems.ts filtered by quantityOnHand <= reorderPoint.

FILE: src/screens/Reports/SalesByCustomerScreen.tsx (CREATE NEW)
Table: Customer | Invoice Count | Total Sales | % of Total.
Calculated from invoices.ts grouped by customerId. Sorted by total descending.
Summary: Total Sales, Average per Customer, Top Customer highlighted.
Horizontal bar chart (View-based, same pattern as AnalyticsScreen) showing top 5 customers.

FILE: src/screens/Reports/SalesByItemScreen.tsx (CREATE NEW)
Table: Item/Description | Qty Sold | Revenue | % of Revenue.
Calculated from invoice line items in invoices.ts. Grouped by description.
Sorted by revenue descending. Top 10 items shown with bar visualization.

FILE: src/screens/Reports/SalesTaxReportScreen.tsx (CREATE NEW)
DateRangePicker at top. Table: Tax Name | Rate | Tax Collected (from invoices) | Tax Paid (from bills) | Net Liability.
Data from taxRates.ts cross-referenced with invoice/bill tax amounts.
Total row. "Record Payment" button → navigate to TaxPayment screen.

FILE: src/screens/Reports/PayrollSummaryScreen.tsx (CREATE NEW)
DateRangePicker. Table: Employee | Department | Gross Pay | Deductions | Net Pay.
Data from payrollRuns.ts entries. Department grouping with subtotals.
Summary cards: Total Gross, Total Deductions, Total Net, Employee Count.
Tap row → PayStub screen.

FILE: src/navigators/stacks/ReportsStack.tsx (UPDATE)
Add all 6 new screens.

FILE: src/navigations-map/Base.ts (UPDATE)
Add constants: REPORT_STOCK_STATUS, REPORT_LOW_STOCK, REPORT_SALES_BY_CUSTOMER, REPORT_SALES_BY_ITEM, REPORT_SALES_TAX, REPORT_PAYROLL_SUMMARY.

FILE: src/screens/Reports/ReportsHubScreen.tsx (UPDATE)
Wire all 6 routes to their respective rows.

All screens: AppContainer, pull-to-refresh, theme colors, formatCurrency, formatDate.
```

---

## PROMPT C7: Missing Report Screens - Part 3 (Payroll Tax Liability, Delivery Reports)

```
Continue FinMatrix. 10 of 12 missing report screens done.

TASK: Build the final 2 missing report screens + link Payroll Tax Liability to existing Tax screen.

FILE: src/screens/Reports/DeliveryDailySummaryScreen.tsx (CREATE NEW)
Date picker at top (single date, default today).
Summary cards: Total Deliveries | Completed | In Transit | Failed | Success Rate %.
Delivery list for selected date: columns Time | Customer | Delivery Person | Items | Status badge.
Status color: delivered=green, in_transit=blue, failed=red, pending=gray.
Data from deliveries.ts filtered by date. If no deliveries on date, show EmptyState.
Pull-to-refresh.

FILE: src/screens/Reports/DeliveryPerformanceScreen.tsx (CREATE NEW)
DateRangePicker at top (default: this month).
PERSONNEL SCOREBOARD: Card per delivery person showing Name | Total Deliveries | Completed | Failed | On-Time Rate % | Rating stars.
Sorted by completion rate descending. #1 gets a gold badge.
METRICS SECTION: Average delivery time, Busiest day of week, Most common failure reason.
Data from deliveries.ts + deliveryPersonnel.ts.

FILE: src/navigators/stacks/ReportsStack.tsx (UPDATE)
Add DeliveryDailySummary and DeliveryPerformance screens.

FILE: src/navigations-map/Base.ts (UPDATE)
Add: REPORT_DELIVERY_DAILY, REPORT_DELIVERY_PERFORMANCE, REPORT_PAYROLL_TAX_LIABILITY.

FILE: src/screens/Reports/ReportsHubScreen.tsx (UPDATE)
Wire remaining 3 rows:
- "Payroll Tax Liability" in PAYROLL section → navigate to TAX_LIABILITY (reuse existing TaxLiabilityScreen in MoreStack, navigate cross-tab: navigation.navigate('AdminTabs', {screen: 'More', params: {screen: 'TaxLiability'}}))
- "Daily Summary" in DELIVERY section → REPORT_DELIVERY_DAILY
- "Performance" in DELIVERY section → REPORT_DELIVERY_PERFORMANCE

VERIFY: After this prompt, ALL 21 rows in ReportsHubScreen must be tappable and navigate to a real screen. Zero dead rows remaining.
```

---

## PROMPT C8: PO Status Timeline + CreditMemo Apply-to-Invoices UI

```
Continue FinMatrix. All report screens complete.

TASK 1: Add status timeline to PO Detail Screen.

FILE: src/screens/PurchaseOrders/PODetailScreen.tsx (UPDATE)
Add a StatusTimeline component above the line items table. Visual stepper showing:
Steps: Draft → Sent → Partially Received → Fully Received → Closed
Each step: circle with number, label below, connecting line between steps.
Completed steps: filled circle (green #27AE60), bold label.
Current step: filled circle (blue #2E75B6), bold label with pulse/highlight.
Future steps: gray outlined circle, gray label.
Map PO status to current step: draft=0, sent=1, partially_received=2, fully_received=3, closed=4.
Build the StatusTimeline as a local component within PODetailScreen (or create src/Custom-Components/StatusTimeline.tsx if you prefer reusability — it could be reused for delivery status too).

TASK 2: Add "Apply to Invoices" UI in CreditMemo Form.

FILE: src/screens/CreditMemos/CreditMemoFormScreen.tsx (UPDATE)
After the line items / totals section, add an "Apply to Invoices" section:
- Header: "Apply Credit to Outstanding Invoices"
- Load unpaid invoices for the selected customer from invoices dummy data (filter by customerId where status is 'sent'|'overdue'|'viewed' and amountPaid < total).
- Table: Checkbox | Invoice# | Date | Due Date | Balance Due | Amount to Apply (editable per row).
- Auto-distribute: credit amount applied to oldest invoice first.
- Running total: "Credit Amount: $X | Applied: $Y | Remaining: $Z"
- Validation: total applied cannot exceed credit memo total.
- On save, store the appliedToInvoices array with [{invoiceId, invoiceNumber, amount}].
- If no customer selected yet, show message "Select a customer to apply credit to invoices."
```

---

## PROMPT C9: Settings Screen - Complete All Stubs

```
Continue FinMatrix.

TASK: Complete all stub functionality in SettingsScreen and sub-screens.

FILE: src/screens/Settings/SettingsScreen.tsx (UPDATE)
Replace ALL "Coming Soon" Alert.alert stubs with real functionality:

1. "Fiscal Year" → Show a modal/picker with options: "Jan-Dec (Calendar)", "Apr-Mar", "Jul-Jun", "Oct-Sep". On select, dispatch to settingsSlice (add fiscalYear to the slice state if not present).

2. "Export Data" → Show a simulated export flow: Alert with options ["Export as CSV", "Export as PDF", "Cancel"]. On select, show ActivityIndicator for 1.5s then show success Alert "Data exported successfully! (Demo mode - no actual file created)".

3. "Import Data" → Similarly simulated: Alert "Import functionality is available in the cloud version. Demo mode does not support import." with "OK" button.

4. "Clear Demo Data" → Confirmation Alert "This will reset all demo data to defaults. Are you sure?" with Cancel/Reset. On Reset: dispatch reset actions to all slices (each slice should have a reset reducer or you reload from dummy data). Show success toast.

5. "Version" → no change needed (static display is fine).
6. "Terms of Service" → Show a ScrollView modal with placeholder terms text (Lorem ipsum style but professional - "These Terms of Service govern your use of FinMatrix accounting software...").
7. "Privacy Policy" → Show a ScrollView modal with placeholder privacy text.
8. "Help & Support" → Show modal with: "Email: support@finmatrix.app", "Documentation: docs.finmatrix.app", "FAQ" section with 3-4 common Q&As about the app.

All modals should be dismissible and use theme colors.
```

---

## PROMPT C10: Notification Center Deep Integration + Audit Trail Slice

```
Continue FinMatrix. Settings complete.

TASK 1: Make notification taps navigate to relevant screens.

FILE: src/screens/Notifications/NotificationCenterScreen.tsx (UPDATE)
Currently, tapping a notification does nothing useful. Add real navigation based on notification type and data:
- type "delivery_update" → navigate to DeliveryManagement (if admin) or DPDeliveryDetail (if delivery person)
- type "inventory_approval" → navigate to DeliveryManagement Approvals tab
- type "invoice_overdue" → navigate to InvoiceDetail with data.invoiceId (if present) or InvoiceList
- type "low_stock" → navigate to Inventory tab
- type "general" → no navigation (just mark as read)

Use navigation.navigate() with proper tab nesting. If data field contains an ID (invoiceId, deliveryId, etc.), pass it as a route param.

TASK 2: Create Audit Trail slice.

FILE: src/screens/AuditTrail/auditTrailSlice.ts (CREATE NEW)
State: { entries: AuditEntry[], filteredEntries: AuditEntry[], filters: { dateRange: {from, to}, userId: string|null, module: string|null, action: string|null }, isLoading: boolean }
Thunks: fetchAuditTrail (700ms delay, return from auditTrail.ts).
Reducers: setDateFilter, setUserFilter, setModuleFilter, setActionFilter, applyFilters.

FILE: src/store/store.ts (UPDATE)
Import and register auditTrailSlice as 'auditTrail'.

FILE: src/screens/AuditTrail/AuditTrailScreen.tsx (UPDATE)
Replace any direct dummy-data usage with Redux. Dispatch fetchAuditTrail on mount. Read from state.auditTrail. Wire filter dropdowns to dispatched filter actions.
```

---

## PROMPT C11: Global Search Enhancement + Cross-Module Navigation Polish

```
Continue FinMatrix. Almost complete.

TASK 1: Enhance GlobalSearch for complete cross-module search.

FILE: src/components/GlobalSearch.tsx (UPDATE)
The current GlobalSearch should search across ALL dummy data modules. Verify it searches:
- Customers (by name, company, email)
- Vendors (by companyName, contactPerson, email)
- Invoices (by invoiceNumber, customerName)
- Bills (by billNumber, vendorName)
- Employees (by firstName, lastName, email)
- Inventory Items (by name, sku)
- Journal Entries (by reference, memo)
- Purchase Orders (by poNumber, vendorName)
- Estimates (by estimateNumber/id, customerName)
- Sales Orders (by soNumber/id, customerName)
- Deliveries (by deliveryId, customerName)

Each result should show: module badge (colored), primary text, secondary text.
Tap navigates to the detail screen for that item.
Navigation should work cross-tab: e.g., from Dashboard tab, tapping an inventory result navigates to Inventory tab > InventoryDetail.

If the current implementation already covers most of this, just verify and fix any missing modules (especially Deliveries, Employees, POs, Estimates, Sales Orders).

Add "Recent Searches" when input is empty (store last 5 searches in local state).

TASK 2: Verify and fix any remaining cross-module navigation gaps.

Check that these navigation paths work end-to-end:
1. InvoiceDetail "Record Payment" → ReceivePaymentScreen (with invoiceId param)
2. EstimateDetail "Convert to Invoice" → InvoiceFormScreen (with estimate data pre-filled)
3. EstimateDetail "Convert to Sales Order" → SOFormScreen (with estimate data pre-filled)
4. SODetail "Create Invoice" → InvoiceFormScreen (with SO data pre-filled)
5. PODetail "Convert to Bill" → BillFormScreen (with PO data pre-filled)
6. PODetail "Receive Items" → ReceiveItemsScreen (with poId param)
7. ReceiveItems "Receive & Create Bill" → BillFormScreen
8. LowStockAlert "Create PO" → POFormScreen
9. BankRegister "Reconcile" button → ReconciliationScreen

For any that are broken or using wrong param names, fix them.
```

---

## PROMPT C12: Final Polish, Empty States, & Consistency Verification

```
Continue FinMatrix. THIS IS THE FINAL PROMPT.

TASK: Final polish pass to make the app 100% complete and consistent.

TASK 1 - Empty States on ALL list screens:
Verify that every list screen uses the EmptyState component (src/components/EmptyState.tsx) when the data array is empty. Check and fix if missing on:
- InvoiceListScreen
- BillListScreen
- POListScreen
- EstimateListScreen
- SOListScreen
- CreditMemoListScreen
- CustomerListScreen
- VendorListScreen
- EmployeeListScreen
- JEListScreen
- InventoryListScreen
- BankAccountsScreen
- PayrollHistoryScreen
- BudgetListScreen
- NotificationCenterScreen
- AuditTrailScreen
- DPDeliveryListScreen
- DPShadowInventoryScreen
Each should show EmptyState with relevant title, message, and "Add New" action button when applicable.

TASK 2 - Loading states on ALL data screens:
Verify that every screen that fetches data shows an ActivityIndicator while isLoading is true. Screens should show a centered spinner with "Loading..." text during the simulated API delay.

TASK 3 - Pull-to-refresh on ALL list screens:
Verify RefreshControl is present on all ScrollView/FlatList/SectionList in list screens.

TASK 4 - formatCurrency and formatDate consistency:
Verify all money values use formatCurrency() from src/utils/formatters.ts (not raw number display).
Verify all dates use formatDate() or formatDateTime() (not raw ISO strings).
Fix any screens that display raw values.

TASK 5 - Theme color consistency:
All screens should use colors from src/theme/colors.ts or src/theme/index.ts.
No hardcoded color values that don't match the theme. Primary=#1B3A5C, Secondary=#2E75B6, Success=#27AE60, Warning=#F39C12, Danger=#E74C3C, Background=#F5F7FA.

TASK 6 - AppContainer wrapper:
All screens should be wrapped in AppContainer (src/components/AppContainer.tsx). Verify and fix any that render directly without it.

After completing all tasks, the app should be a fully functional FinMatrix with:
- 89+ working screens
- All navigation paths connected
- All buttons functional (zero "Coming Soon" stubs)
- All list screens with empty state, loading state, pull-to-refresh
- Consistent formatting and theming
- Full dummy data integration via Redux
- Complete admin and delivery personnel experiences
```

---

## Completion Checklist

After running all 12 prompts, verify:

| # | Check | Target |
|---|-------|--------|
| 1 | Every list screen taps to detail | All 15+ list screens |
| 2 | Every detail Edit button → form | All detail screens |
| 3 | Every form Save → back with data | All form screens |
| 4 | Back buttons work everywhere | All screens |
| 5 | Tab switching maintains state | 5 admin + 4 delivery tabs |
| 6 | Logout → RoleSelection | From any screen |
| 7 | Admin → AdminTabNavigator | On admin login |
| 8 | Delivery → DeliveryTabNavigator | On delivery login |
| 9 | All screens use AppContainer | ~89 screens |
| 10 | All lists have pull-to-refresh | ~20 list screens |
| 11 | All forms use CustomInput/CustomButton/CustomDropdown | ~15 form screens |
| 12 | Loading ActivityIndicator on data fetches | All data screens |
| 13 | EmptyState on all lists when empty | ~20 list screens |
| 14 | Theme colors consistent | All screens |
| 15 | formatCurrency for all money | All screens |
| 16 | formatDate for all dates | All screens |
| 17 | Zero "Coming Soon" alert stubs | Entire app |
| 18 | All ReportsHub rows navigable | 21/21 rows |
| 19 | All TransactionsHub rows navigable | 9/9 rows |
| 20 | All MoreHub rows navigable | 12/12 rows |
| 21 | Quick Actions all navigate | 8/8 actions |
| 22 | Redux slices for all modules | budgets, notifications, settings, auditTrail added |
| 23 | GlobalSearch covers all modules | 11+ modules |
| 24 | Delivery personnel flow complete | List→Detail→Signature→Confirm→Complete |
| 25 | Shadow inventory + approval flow | Personnel submit → Admin approve/reject |
