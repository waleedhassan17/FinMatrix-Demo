# FinMatrix — Final Completion Prompts (Inventory, Delivery & Full App Polish)

> **Goal:** After executing every prompt below the app must behave like a fully-connected production application running against a local dummy backend. Every screen must be reachable, every button must do something meaningful, every list must load/refresh/empty-state correctly, and the Delivery Personnel flow must include an embedded map placeholder. When real APIs are ready you only swap the network layer — zero UI changes.
>
> **Execution order:** Run P1 → P2 → P3 → P4 → P5 → P6 → P7 → P8 sequentially. Each prompt is self-contained but may depend on files created by earlier prompts.

---

## P1 — Inventory Module: Navigation & Quick-Actions Bar

**Context:** The Inventory module has 7 screens registered in `InventoryStack.tsx`, but 4 of them (AdjustmentScreen, StockTransferScreen, PhysicalCountScreen, InventoryReportsScreen) are **completely unreachable** — no button anywhere in the app navigates to them.

**Tasks:**

1. **Add a Quick-Actions bar to `InventoryListScreen.tsx`** between the header and the search/filter section. Render a horizontally-scrollable row of 4 icon-buttons:
   - "📦 Adjust" → navigates to `ROUTES.INVENTORY_ADJUSTMENT`
   - "🔄 Transfer" → navigates to `ROUTES.STOCK_TRANSFER`
   - "📋 Count" → navigates to `ROUTES.PHYSICAL_COUNT`
   - "📊 Reports" → navigates to `ROUTES.INVENTORY_REPORTS`
   Style each as a pill-shaped `TouchableOpacity` (`paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.primary + '12'`), icons on the left, label on the right. Use a horizontal `ScrollView` with `showsHorizontalScrollIndicator={false}`.

2. **Wire the Detail screen placeholder buttons:**
   - In `InventoryDetailScreen.tsx`, replace the `Alert.alert('Transfer', ...)` onPress with navigation to `ROUTES.STOCK_TRANSFER`, passing `{ preselectedItemId: item.itemId }`.
   - Replace the `Alert.alert('Create PO', ...)` onPress with navigation to `ROUTES.PO_FORM`, passing `{ prefillItems: [{ itemId: item.itemId, name: item.name, sku: item.sku, quantity: item.reorderQuantity, unitCost: item.unitCost }] }`.

3. **Add a "Delete" action to `InventoryDetailScreen.tsx`:**
   - Add a red "🗑️ Delete" button in the action bar (next to Edit, Adjust, Transfer, Create PO).
   - On press, show `Alert.alert('Delete Item', 'Are you sure? This cannot be undone.', [Cancel, {text: 'Delete', style: 'destructive', onPress}])`.
   - On confirm, dispatch a new `deleteInventoryItem` thunk, then `navigation.goBack()`.

4. **Add `deleteInventoryItem` async thunk and network function:**
   - In `inventoryNetwork.ts`, add `deleteInventoryItemAPI(itemId: string)` that removes from the in-memory store and returns `{ success: true }`.
   - In `inventorySlice.ts`, add a `deleteInventoryItem` async thunk calling the new API, and `fulfilled` handler that removes the item from `state.items` and re-applies filters.

5. **Delete the deprecated `InventoryHubScreen.tsx`** file entirely.

6. Verify: zero TypeScript errors, all 7 inventory screens are reachable, Detail screen buttons all work.

---

## P2 — Inventory Module: Fix Form, Slice & Data Integrity

**Context:** `InventoryFormScreen.tsx` has hardcoded values that corrupt data on edit, the Redux slice silently swallows errors, and the Adjustment/Transfer screens use module-level arrays that reset on hot-reload.

**Tasks:**

1. **Fix InventoryFormScreen.tsx data corruption on edit:**
   - When editing (`isEditMode`), do NOT overwrite `quantityOnOrder`, `quantityCommitted`, `isActive` with hardcoded values. Instead, spread the existing item's values for those fields: `quantityOnOrder: existingItem.quantityOnOrder, quantityCommitted: existingItem.quantityCommitted, isActive: existingItem.isActive`.
   - Remove hardcoded `companyId: 'comp_001'` — read it from the auth state (`useAppSelector(s => s.auth.user?.companyId) ?? 'comp_001'`).

2. **Add unsaved-changes guard to InventoryFormScreen.tsx:**
   - Track a `dirty` flag (set true on any field change).
   - On hardware back press and header back button, if `dirty && !saving`, show `Alert.alert('Discard Changes?', 'You have unsaved changes.', [{ text: 'Keep Editing' }, { text: 'Discard', style: 'destructive', onPress: navigation.goBack }])`.

3. **Fix inventorySlice.ts error handling:**
   - Add `pending` and `rejected` extra-reducer cases for `createInventoryItem`, `updateInventoryItem`, `deleteInventoryItem`, `toggleInventoryActive`, and `adjustInventoryQty`.
   - In each `pending`, set `isLoading: true` and clear `error`.
   - In each `fulfilled`, set `isLoading: false`.
   - In each `rejected`, set `isLoading: false` and `error: action.error.message`.

4. **Display error banner in InventoryListScreen.tsx:**
   - Read `error` from the inventory slice.
   - If `error` is truthy and `!isLoading`, show a red banner at the top of the list: `<View style={{ backgroundColor: Colors.dangerLight, padding: 12 }}><Text style={{ color: Colors.danger }}>⚠️ {error}</Text></View>`.

5. **Migrate AdjustmentScreen to Redux:**
   - Create a `createAdjustment` async thunk in `inventorySlice.ts` that calls a new `createAdjustmentAPI` in `inventoryNetwork.ts`. The API stores the record in a module-level `adjustmentStore` array (like existing patterns) AND calls `adjustQuantityAPI` to update the item.
   - In AdjustmentScreen, dispatch `createAdjustment` on save. Remove the module-level `adjustmentStore` and `nextRef` — let the network layer handle it. After successful dispatch, show success alert and `navigation.goBack()`.
   - Remove module-level `adjustmentStore` from AdjustmentScreen (move it to inventoryNetwork).

6. **Migrate StockTransferScreen to Redux:**
   - Create `createTransfer` async thunk in `inventorySlice.ts` calling the existing `transferStockAPI` in `inventoryNetwork.ts`.
   - Fix `transferStockAPI` to properly deduct from source location and add to destination (currently it only changes `locationId`).
   - In StockTransferScreen, dispatch `createTransfer` on save, then dispatch `fetchInventory()` to refresh the list. Remove module-level `transferStore`.

7. **Replace fake data in InventoryDetailScreen.tsx:**
   - Replace `generateMovements()` with data derived from the `adjustmentStore` in `inventoryNetwork.ts` — export a `getAdjustmentsForItem(itemId)` function and call it.
   - Replace `generateLocations()` with real location data — add a `locationBreakdown` field to each inventory item in `inventoryItems.ts` dummy data (array of `{ locationId, locationName, quantity }`), and read it in the detail screen.

8. Verify: zero TS errors, form edit preserves existing data, adjustments and transfers persist in Redux, detail screen shows real movements.

---

## P3 — Inventory Module: Reports, Physical Count & UX Polish

**Context:** Inventory reports have no date filtering or export, Physical Count loses data on navigation, and several UX issues remain.

**Tasks:**

1. **InventoryReportsScreen — add date-range filter:**
   - Add a date-range row at the top (two `TextInput` fields for "From" and "To" in YYYY-MM-DD format, same pattern as AuditTrailScreen).
   - Filter the Turnover report data by date range.
   - For Valuation/Status/Low Stock reports, show a "As of" date display (defaults to today).

2. **InventoryReportsScreen — make items tappable:**
   - In the Stock Status and Low Stock tabs, wrap each item row in `TouchableOpacity` and navigate to `ROUTES.INVENTORY_DETAIL` on press, passing `{ itemId }`.

3. **InventoryReportsScreen — replace fake turnover data:**
   - Import `getAdjustments()` from `inventoryNetwork.ts` (the function already exists) and use real adjustment records.
   - If no adjustments exist for an item, show turnover as 0.

4. **InventoryReportsScreen — add export button:**
   - Add an "📤 Export" button in the header.
   - On press, generate a text summary of the current report tab's data and show it in an Alert (simulating export). Include a message: "In production, this will generate a CSV/PDF file."

5. **PhysicalCountScreen — persist partial counts:**
   - Before moving from Step 0→1, save the `selectedLocation` and current date to a local ref.
   - When navigating away from the screen (Step 1 or 2), show a warning: "Your count will be lost if you leave. Continue?"
   - After successful count submission in Step 3, dispatch `fetchInventory()` to refresh the list with adjusted quantities.

6. **PhysicalCountScreen — fix footer overlap:**
   - Add `paddingBottom: 80` to the Step 1 FlatList `contentContainerStyle` so the "Review Variances" button doesn't overlap the last items.

7. **InventoryListScreen — fix summary bar scope:**
   - Change the summary bar to show filtered totals when a filter is active. Show "Showing X of Y items" text, and compute value/low-stock from `filteredItems` instead of `items`.

8. **InventoryListScreen — add sort direction toggle:**
   - Next to the sort dropdown, add a ↑/↓ button that toggles ascending/descending sort direction. Store direction in the slice as `sortDirection: 'asc' | 'desc'`.

9. Verify: zero TS errors, all reports show real data, physical count persists and syncs, exports work, sort direction toggles.

---

## P4 — Delivery Personnel: Fix Critical Dashboard & Data Flow Bugs

**Context:** The driver dashboard has 4 no-op buttons, uses the wrong Redux slice, and the shadow-inventory → approval pipeline is disconnected. These are the most critical breakages.

**Tasks:**

1. **Fix DPDashboardScreen.tsx "Start Delivery" button:**
   - Replace the empty `onPress={() => {}}` with navigation to `ROUTES.DP_DELIVERY_DETAIL`, passing `{ deliveryId: nextDelivery.deliveryId }`.

2. **Fix DPDashboardScreen.tsx Quick Actions:**
   - "My Deliveries" → navigate to the Deliveries tab. Use: `navigation.navigate('DeliveryTabs', { screen: 'Deliveries' })` (or the route constant if available).
   - "Inventory" → navigate to the Inventory tab: `navigation.navigate('DeliveryTabs', { screen: 'Inventory' })`.
   - "History" → navigate to `ROUTES.DP_HISTORY`.

3. **Fix DPDashboardScreen.tsx data source:**
   - Replace the import of `fetchDeliveries` from `deliveryAdminSlice` with `fetchMyDeliveries` from `deliveryPersonnelSlice`.
   - Read from `s.deliveryPersonnel.myDeliveries` instead of `s.deliveryAdmin.deliveries`.
   - Pass the current driver's `personId` to `fetchMyDeliveries`. Get the person ID from auth state or hardcode `'dp_001'` for the demo (add a comment: `// TODO: get from auth state`).

4. **Fix DPDashboardScreen.tsx performance metrics:**
   - Derive `rating`, `onTimeRate`, `deliveriesToday`, `completedToday` from the actual delivery data in the slice instead of hardcoded values.
   - Rating: calculate from delivered entries' average (use 4.8 as fallback if no data).
   - On-time: count delivered entries where `actualDeliveryTime <= estimatedDeliveryTime` (or use a threshold heuristic if no estimated field exists).
   - Today count: filter by today's date.

5. **Connect shadow inventory submit to approval store:**
   - In `deliveryPersonnelNetwork.ts`, import the `requestStore` from `inventoryApprovalNetwork.ts` (export it first if not already exported).
   - In `createInventoryRequestAPI`, after building the `InventoryUpdateRequest` object, `push` it into the imported `requestStore` so it appears when admin fetches the Approvals tab.
   - Test: Submit from DPShadowInventoryScreen → refresh admin Approvals tab → new request appears.

6. **Wire DPShadowInventoryScreen to Redux:**
   - Replace `const [items] = useState(shadowInventory)` with data from `deliveryPersonnelSlice` (add a `shadowItems` field to the slice state, populated by a `fetchShadowInventory` thunk).
   - The submit button should dispatch a `submitShadowUpdates` thunk that calls `createInventoryRequestAPI` for each pending item, then refreshes the list.
   - After successful submit, show a success message and update item statuses to 'pending' (awaiting admin approval).

7. **Add back buttons to DPHistoryScreen and DPSettingsScreen:**
   - Add a simple `← Back` `TouchableOpacity` header row at the top of each, calling `navigation.goBack()`.

8. Verify: zero TS errors, dashboard buttons all navigate correctly, shadow inventory submits flow to admin approvals, performance metrics are data-driven.

---

## P5 — Delivery Personnel: Per-Item Confirmation, Photo Proof & Partial Delivery

**Context:** Currently the delivery flow is all-or-nothing — the driver can't confirm individual item quantities, can't take photos, and can't do partial deliveries. A real delivery app needs these.

**Tasks:**

1. **Create `DeliveryItemConfirmScreen.tsx`** in `src/screens/Delivery/Personnel/`:
   - Receives `deliveryId` via route params. Fetches the delivery from the slice.
   - Shows a list of all delivery items, each with:
     - Item name, SKU, ordered quantity
     - An editable `TextInput` for "Delivered Qty" (defaults to ordered qty)
     - A status picker: "Delivered" / "Damaged" / "Returned" (defaults to "Delivered")
     - Optional notes `TextInput`
   - A "Confirm Items" button at the bottom. On press, saves the per-item confirmations to local state and navigates to `ROUTES.DELIVERY_PHOTO_PROOF`.
   - Data model: create a `DeliveryItemConfirmation` type: `{ itemId, orderedQty, deliveredQty, status: 'delivered'|'damaged'|'returned', notes }`.

2. **Create `DeliveryPhotoProofScreen.tsx`** in `src/screens/Delivery/Personnel/`:
   - Shows a gallery area (initially empty) with an "📷 Add Photo" button.
   - Since we can't use real camera in dummy mode, the "Add Photo" button generates a placeholder image (a colored rectangle with text "Photo 1", "Photo 2", etc.) added to a local array. Show max 4 photos.
   - Each photo has an "✕" remove button.
   - A "Continue to Signature" button navigates to `ROUTES.SIGNATURE_CAPTURE`, passing along the `deliveryId` and `photoUrls` array.
   - In production, this will use `expo-image-picker` or `expo-camera` — add a comment noting this.

3. **Update the delivery status flow in `DPDeliveryDetailScreen.tsx`:**
   - When status is "Arrived" (ready for delivery confirmation), the action button should be "Confirm Items" → navigates to `ROUTES.DELIVERY_ITEM_CONFIRM` instead of going directly to Signature.
   - Flow becomes: Pending → Picked Up → In Transit → Arrived → **Item Confirm → Photo Proof →** Signature → Customer Confirm → Complete.

4. **Register new screens in `DPDeliveriesStack.tsx`:**
   - Add `DeliveryItemConfirmScreen` and `DeliveryPhotoProofScreen` to the stack.
   - Add route constants `DELIVERY_ITEM_CONFIRM` and `DELIVERY_PHOTO_PROOF` to `Base.ts`.

5. **Update `CustomerConfirmScreen.tsx`:**
   - Show the per-item delivery summary (quantities delivered vs ordered, any damaged/returned items).
   - If there are returned/damaged items, show a warning banner: "⚠️ Partial delivery — X items not delivered".

6. **Update `deliveryPersonnelSlice.ts` to store per-item confirmations:**
   - Add a `confirmDeliveryItems` action/thunk that stores the item confirmations and photo URLs on the delivery record.
   - Update `deliveryPersonnelNetwork.ts` `updateDeliveryAPI` to accept and store `itemConfirmations` and `photoUrls`.

7. **Handle "Report Issue" in CustomerConfirmScreen:**
   - Replace the stub `Alert.alert('Issue Reported')` with a modal that has: issue type dropdown (Missing Items, Wrong Items, Damaged, Other), notes text input, and a Submit button.
   - On submit, update the delivery status to "failed" with the issue details, navigate back to delivery list.

8. Verify: zero TS errors, complete flow from item confirmation → photos → signature → customer confirm → complete all works.

---

## P6 — Delivery Personnel: Map Integration & Route Visualization

**Context:** The app has zero map integration. Drivers only see a "Maps" link that opens the system Maps app. Admin MonitorTab has a static placeholder. For a production-ready demo, we need embedded map components.

**Tasks:**

1. **Install `react-native-maps` package:**
   - Run `npx expo install react-native-maps` (Expo-compatible).
   - If there are peer dependency issues, use the expo-compatible `expo-maps` or the standard `react-native-maps` with Expo config plugin.

2. **Create a `DeliveryMapView` reusable component** in `src/components/DeliveryMapView.tsx`:
   - Props: `origin: { latitude, longitude, label }`, `destination: { latitude, longitude, label }`, `driverLocation?: { latitude, longitude }`, `style?: ViewStyle`.
   - Renders a `MapView` showing:
     - Origin marker (warehouse) with a 🏭 label
     - Destination marker (customer) with a 📍 label
     - If `driverLocation` provided, a 🚚 marker for the driver
     - Initial region calculated to fit all markers with padding
   - **Fallback mode:** If `react-native-maps` fails to load (e.g., no API key), show a styled fallback view with addresses, distance estimate, and a button to open external Maps. Wrap the MapView in a try-catch error boundary.
   - Add dummy coordinates to each delivery in `deliveries.ts` dummy data:
     - Warehouse: `{ lat: 40.7128, lng: -74.0060 }` (NYC)
     - Customer addresses: assign realistic NYC-area coordinates to each delivery's customer.

3. **Integrate map into `DPDeliveryDetailScreen.tsx`:**
   - Add the `DeliveryMapView` component between the status timeline and the items list.
   - Show it only when status is "in_transit" or "arrived" (when the driver is actively navigating).
   - Pass the warehouse as origin and the delivery address as destination.
   - Replace the existing "Maps" `Linking.openURL` button with a "Navigate" button that still opens external Maps but is styled better.

4. **Integrate map into admin `MonitorTab.tsx`:**
   - Replace the "Live Map — Real-time tracking coming soon" placeholder with the `DeliveryMapView` component.
   - Show ALL active (in_transit) deliveries as markers on a single map.
   - Each marker shows the driver name and delivery status on tap (using map callouts).
   - If no deliveries are in transit, show the empty placeholder with "No active deliveries to track".

5. **Add ETA display to `DPDeliveryDetailScreen.tsx`:**
   - Calculate a dummy ETA based on distance between origin and destination (straight-line distance × 1.4 for road factor, divide by 30mph average speed).
   - Display below the map: "📍 Estimated arrival: ~X min"
   - Update the `Delivery` type in `deliveries.ts` to include `estimatedMinutes?: number`.

6. **Add coordinates to `deliveries.ts` dummy data:**
   - Add `originCoords` and `destinationCoords` fields to the `Delivery` interface.
   - Populate with realistic coordinates for all 20 deliveries (use NYC area: Manhattan, Brooklyn, Queens locations).

7. Verify: zero TS errors, map renders on delivery detail during transit, MonitorTab shows active deliveries on map, ETA displays correctly.

---

## P7 — App-Wide: Fix All Remaining Placeholder Stubs & Dead Code

**Context:** Across the app there are ~12 Alert.alert placeholders, ~7 deprecated dead-code files, and a few broken flows that prevent the app from feeling complete.

**Tasks:**

1. **Fix General Ledger row press** (`GLScreen.tsx`):
   - Replace `Alert.alert('Journal Entry', '...coming soon')` with navigation to `ROUTES.JE_DETAIL`, passing `{ entryId: entry.entryId }`.
   - Add a GL export function: on "Export" button press, build a formatted text summary of all visible ledger entries and show it in a modal with a "Copy to Clipboard" button (using `Clipboard` API). Add comment: "// Production: generate CSV/PDF via backend".

2. **Fix Invoice stubs** (`InvoiceDetailScreen.tsx` and `InvoiceFormScreen.tsx`):
   - **Duplicate Invoice:** Instead of alert, create a duplicate of the invoice (same line items, new invoice number, draft status) by dispatching `createInvoice` with the copied data, then navigate to the new invoice's detail screen.
   - **View PDF:** Show a modal with a styled "PDF Preview" view — render the invoice data in a printable layout (company name, invoice header, line items table, totals, notes). Add comment: "// Production: use react-native-pdf or webview with server-generated PDF".
   - **Preview in Form:** Show the same PDF-style modal before saving.
   - **Resend/Reminder:** Update the invoice's `lastSentDate` field (add to model if missing), show success toast "Invoice resent to {customerEmail}".

3. **Fix Estimate duplicate stub** (`EstimateDetailScreen.tsx`):
   - Same pattern as Invoice duplicate: copy data, create new estimate with draft status, navigate to detail.

4. **Fix Admin Delivery "Contact Driver" stub** (`AdminDeliveryDetailScreen.tsx`):
   - Show a modal with the driver's name, phone, and email (from `deliveryPersonnel` data). Add "📞 Call" and "✉️ Email" buttons that call `Linking.openURL('tel:...')` and `Linking.openURL('mailto:...')`.

5. **Delete ALL deprecated/dead-code files (7 files):**
   - `src/screens/HomeScreen/AdminHomeScreen.tsx`
   - `src/screens/HomeScreen/DeliveryHomeScreen.tsx`
   - `src/screens/HomeScreen/DeliveryDashboard.tsx`
   - `src/screens/Inventory/InventoryHubScreen.tsx`
   - `src/screens/Delivery/Personnel/MyDeliveriesScreen.tsx`
   - `src/screens/Delivery/Personnel/ShadowInventoryScreen.tsx`
   - `src/screens/Delivery/Personnel/DeliveryProfileScreen.tsx`
   - Also remove any imports of these files from navigators or other files (they should already be unused, but verify).

6. **Remove the dead `comingSoon` function** from `TransactionsHubScreen.tsx`.

7. **Fix CompanyProfileScreen logo upload stub:**
   - Replace the alert with a mock flow: show a modal with 3 "sample logos" (colored circles with company initials), let user "select" one, update the local state to show the selected logo. Comment: "// Production: use expo-image-picker".

8. **Fix SplashScreen string literals:**
   - Replace `'AdminTabs'`, `'DeliveryTabs'`, `'RoleSelection'`, `'Onboarding'`, `'SignIn'` with `ROUTES.ADMIN_TABS`, `ROUTES.DELIVERY_TABS`, etc. Add any missing constants to `Base.ts`.

9. **Clean up `EMAIL_VERIFICATION` route:**
   - Remove `EMAIL_VERIFICATION` from `Base.ts` ROUTES and from `types/index.ts` since no screen exists for it.

10. Verify: zero TS errors, zero Alert.alert placeholders remaining (except legitimate confirmation dialogs), zero dead-code files, all navigation uses ROUTES constants.

---

## P8 — Full Integration Test: Dummy Backend Consistency & Flow Verification

**Context:** Final pass to ensure every module's dummy backend is consistent, all cross-module data flows work, and the app feels like a connected production app.

**Tasks:**

1. **Verify cross-module data flows work end-to-end:**
   - **Invoice → Payment → GL:** Creating a payment on an invoice should update the invoice's `amountPaid`, and the payment should appear in the GL. Verify the network layers connect.
   - **PO → Receive Items → Inventory → Bill:** Receiving items on a PO should update inventory quantities. Creating a bill from a PO should pre-fill correctly. Verify the chain.
   - **Estimate → Sales Order → Invoice:** Converting an estimate to a SO, then SO to Invoice, should carry line items through. Verify the chain works with dummy data.
   - **Delivery Complete → Shadow Inventory → Approval → Real Inventory:** When a delivery is completed, shadow inventory changes should flow to admin approvals, and when approved, real inventory updates. Verify the full chain.
   - For each chain, if any step is broken, fix the network/slice connection.

2. **Add a `DummyAPIInterceptor` utility** in `src/utils/dummyApiConfig.ts`:
   - Export a config object: `{ simulateLatency: true, latencyMs: 300, simulateErrors: false, errorRate: 0.1 }`.
   - Import this config in all network files. Wrap each API function's `setTimeout` to use `config.latencyMs` instead of hardcoded values.
   - This makes it easy to toggle latency simulation on/off and test error states.
   - Add a comment block at the top: "// Toggle these flags to test loading states and error handling. In production, remove this file and use real API calls."

3. **Ensure all list screens have consistent patterns:**
   - Every FlatList/ScrollView list screen must have: Loading spinner (ActivityIndicator), Empty state (icon + title + message), Pull-to-refresh (RefreshControl), Error banner (if applicable).
   - Cross-check against the 18 list screens from the C12 audit. Fix any that were missed.

4. **Add a "Demo Mode" banner:**
   - In `AppContainer.tsx` (or create it if not wired), add a small `<View>` at the bottom of the screen: "🔧 Demo Mode — Using local dummy data" in a subtle gray bar. This makes it clear to stakeholders that the app is running on dummy data.
   - Make this conditionally visible based on an env flag or constant: `const IS_DEMO = true; // Set to false when connecting real APIs`.

5. **Final smoke test checklist — verify each works:**
   - [ ] Login as admin → see dashboard with real data
   - [ ] Login as delivery_personnel → see driver dashboard with real data
   - [ ] Admin: Navigate to every module from dashboard/tabs (Invoices, Bills, PO, Estimates, SO, CreditMemos, Customers, Vendors, Employees, Payroll, Banking, Inventory, JournalEntries, ChartOfAccounts, GeneralLedger, Budgets, Reports, AuditTrail, Settings, Notifications, Delivery Management)
   - [ ] Admin: Create, edit, view detail for Invoice, Bill, PO, Estimate, Customer, Vendor, Employee, JE, Budget, Inventory Item
   - [ ] Admin: Record payment on invoice, record bill payment
   - [ ] Admin: Assign delivery to personnel, monitor on map, view analytics, approve inventory requests
   - [ ] Driver: View dashboard with next delivery, tap to start
   - [ ] Driver: Progress through delivery flow (Pick Up → In Transit → Arrived → Confirm Items → Photo Proof → Signature → Customer Confirm → Complete)
   - [ ] Driver: View delivery on map during transit
   - [ ] Driver: View shadow inventory, submit updates
   - [ ] Driver: View history, profile, settings
   - [ ] Global search works across all modules
   - [ ] Notifications tap navigates to correct screen
   - [ ] Settings all functional (fiscal year, export, clear data, etc.)
   - [ ] Pull-to-refresh works on every list screen
   - [ ] Empty states display on every list when data is cleared

6. **Fix any issues found during the smoke test.** Document what was found and fixed.

7. Verify: zero TS errors across the entire project (`npx tsc --noEmit`), zero runtime crashes on launch, every screen reachable, every button functional.

---

## Summary

| Prompt | Focus | Screens Affected | Est. Complexity |
|--------|-------|------------------|-----------------|
| **P1** | Inventory navigation & delete | InventoryListScreen, InventoryDetailScreen, inventorySlice, inventoryNetwork | Medium |
| **P2** | Inventory form fixes, Redux migration, real data | InventoryFormScreen, AdjustmentScreen, StockTransferScreen, InventoryDetailScreen, inventorySlice | High |
| **P3** | Inventory reports, physical count, UX polish | InventoryReportsScreen, PhysicalCountScreen, InventoryListScreen | Medium |
| **P4** | Delivery dashboard fixes & data flow | DPDashboardScreen, DPShadowInventoryScreen, deliveryPersonnelSlice, deliveryPersonnelNetwork | High |
| **P5** | Delivery item confirm, photos, partial delivery | NEW: DeliveryItemConfirmScreen, DeliveryPhotoProofScreen, DPDeliveryDetailScreen, CustomerConfirmScreen | High |
| **P6** | Map integration for delivery | NEW: DeliveryMapView, DPDeliveryDetailScreen, MonitorTab, deliveries.ts | High |
| **P7** | App-wide stub fixes & dead code cleanup | GLScreen, InvoiceDetail/Form, EstimateDetail, AdminDeliveryDetail, CompanyProfile, SplashScreen, + 7 file deletions | Medium |
| **P8** | Integration test & dummy backend consistency | All network files, all screens (smoke test), NEW: dummyApiConfig.ts, AppContainer | Medium |

**Total: 8 prompts. After completion: zero placeholders, zero dead code, zero broken buttons, full delivery flow with maps, all modules connected via dummy backend.**
