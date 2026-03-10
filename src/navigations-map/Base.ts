// ============================================================
// FINMATRIX - Route Constants
// ============================================================

export const ROUTES = {
  // Pre-Auth
  ONBOARDING: 'Onboarding' as const,
  WELCOME: 'Welcome' as const,
  ROLE_SELECTION: 'RoleSelection' as const,
  COMPANY_REGISTRATION: 'CompanyRegistration' as const,
  SIGN_IN: 'SignIn' as const,
  SIGN_UP: 'SignUp' as const,
  FORGOT_PASSWORD: 'ForgotPassword' as const,

  // Company Setup (Post-Auth, Pre-Main)
  COMPANY_SETUP: 'CompanySetup' as const,
  CREATE_COMPANY: 'CreateCompany' as const,
  JOIN_COMPANY: 'JoinCompany' as const,

  // Company Management
  COMPANY_SWITCHER: 'CompanySwitcher' as const,
  COMPANY_DETAIL: 'CompanyDetail' as const,
  COMPANY_PROFILE_EDIT: 'CompanyProfileEdit' as const,

  // Delivery Signup & Onboarding
  DELIVERY_SIGNUP: 'DeliverySignup' as const,
  DELIVERY_ONBOARDING: 'DeliveryOnboarding' as const,

  // Admin Tabs
  ADMIN_MAIN: 'AdminMain' as const,
  ADMIN_TABS: 'AdminTabs' as const,
  ADMIN_DASHBOARD: 'Dashboard' as const,
  ADMIN_DASHBOARD_STACK: 'DashboardStack' as const,
  ADMIN_NOTIFICATIONS: 'Notifications' as const,
  ADMIN_TRANSACTIONS: 'Transactions' as const,
  ADMIN_TRANSACTIONS_STACK: 'TransactionsStack' as const,
  ADMIN_TRANSACTIONS_HUB: 'TransactionsHub' as const,
  ADMIN_REPORTS: 'Reports' as const,
  ADMIN_REPORTS_STACK: 'ReportsStack' as const,
  ADMIN_REPORTS_HUB: 'ReportsHub' as const,
  ADMIN_INVENTORY: 'Inventory' as const,
  ADMIN_INVENTORY_STACK: 'InventoryStack' as const,
  ADMIN_INVENTORY_HUB: 'InventoryHub' as const,
  INVENTORY_FORM: 'InventoryForm' as const,
  INVENTORY_DETAIL: 'InventoryDetail' as const,
  INVENTORY_ADJUSTMENT: 'InventoryAdjustment' as const,
  PHYSICAL_COUNT: 'PhysicalCount' as const,
  STOCK_TRANSFER: 'StockTransfer' as const,
  INVENTORY_REPORTS: 'InventoryReports' as const,
  ADMIN_MORE: 'More' as const,
  ADMIN_MORE_STACK: 'MoreStack' as const,
  ADMIN_MORE_HUB: 'MoreHub' as const,

  // More Sub-screens
  CHART_OF_ACCOUNTS: 'ChartOfAccounts' as const,
  COA_FORM: 'COAForm' as const,
  COA_DETAIL: 'COADetail' as const,
  GENERAL_LEDGER: 'GeneralLedger' as const,
  JE_LIST: 'JournalEntries' as const,
  JE_FORM: 'JournalEntryForm' as const,
  JE_DETAIL: 'JournalEntryDetail' as const,
  CUSTOMER_LIST: 'CustomerList' as const,
  CUSTOMER_FORM: 'CustomerForm' as const,
  CUSTOMER_DETAIL: 'CustomerDetail' as const,
  VENDOR_LIST: 'VendorList' as const,
  VENDOR_FORM: 'VendorForm' as const,
  VENDOR_DETAIL: 'VendorDetail' as const,

  // Transactions Sub-screens
  INVOICE_LIST: 'InvoiceList' as const,
  INVOICE_FORM: 'InvoiceForm' as const,
  INVOICE_DETAIL: 'InvoiceDetail' as const,
  RECEIVE_PAYMENT: 'ReceivePayment' as const,
  ESTIMATE_LIST: 'EstimateList' as const,
  ESTIMATE_FORM: 'EstimateForm' as const,
  ESTIMATE_DETAIL: 'EstimateDetail' as const,
  SO_LIST: 'SalesOrderList' as const,
  SO_FORM: 'SalesOrderForm' as const,
  SO_DETAIL: 'SalesOrderDetail' as const,
  CM_LIST: 'CreditMemoList' as const,
  CM_FORM: 'CreditMemoForm' as const,
  BILL_LIST: 'BillList' as const,
  BILL_FORM: 'BillForm' as const,
  BILL_DETAIL: 'BillDetail' as const,
  PAY_BILLS: 'PayBills' as const,
  PO_LIST: 'PurchaseOrderList' as const,
  PO_FORM: 'PurchaseOrderForm' as const,
  PO_DETAIL: 'PurchaseOrderDetail' as const,
  RECEIVE_ITEMS: 'ReceiveItems' as const,
  VC_FORM: 'VendorCreditForm' as const,

  // Banking
  BANK_ACCOUNTS: 'BankAccounts' as const,
  BANK_REGISTER: 'BankRegister' as const,
  ADD_TRANSACTION: 'AddTransaction' as const,
  BANK_TRANSFER: 'BankTransfer' as const,
  RECONCILIATION: 'Reconciliation' as const,
  RECONCILIATION_HISTORY: 'ReconciliationHistory' as const,

  // Employees
  EMPLOYEE_LIST: 'EmployeeList' as const,
  EMPLOYEE_FORM: 'EmployeeForm' as const,
  EMPLOYEE_DETAIL: 'EmployeeDetail' as const,

  // Payroll
  RUN_PAYROLL: 'RunPayroll' as const,
  PAYROLL_HISTORY: 'PayrollHistory' as const,
  PAY_STUB: 'PayStub' as const,

  // Reports
  REPORT_PROFIT_LOSS: 'ReportProfitLoss' as const,
  REPORT_BALANCE_SHEET: 'ReportBalanceSheet' as const,
  REPORT_TRIAL_BALANCE: 'ReportTrialBalance' as const,
  REPORT_AR_AGING: 'ReportARAging' as const,
  REPORT_INVENTORY_VALUATION: 'ReportInventoryValuation' as const,
  REPORT_CASH_FLOW: 'ReportCashFlow' as const,
  REPORT_AP_AGING: 'ReportAPAging' as const,
  REPORT_CUSTOMER_BALANCES: 'ReportCustomerBalances' as const,
  REPORT_VENDOR_BALANCES: 'ReportVendorBalances' as const,
  REPORT_STOCK_STATUS: 'ReportStockStatus' as const,
  REPORT_LOW_STOCK: 'ReportLowStock' as const,
  REPORT_SALES_BY_CUSTOMER: 'ReportSalesByCustomer' as const,
  REPORT_SALES_BY_ITEM: 'ReportSalesByItem' as const,
  REPORT_SALES_TAX: 'ReportSalesTax' as const,
  REPORT_PAYROLL_SUMMARY: 'ReportPayrollSummary' as const,

  // Analytics & Budgets
  ANALYTICS: 'Analytics' as const,
  BUDGET_LIST: 'BudgetList' as const,
  BUDGET_FORM: 'BudgetForm' as const,
  BUDGET_VS_ACTUAL: 'BudgetVsActual' as const,

  // Tax Management
  TAX_SETTINGS: 'TaxSettings' as const,
  TAX_LIABILITY: 'TaxLiability' as const,
  TAX_PAYMENT: 'TaxPayment' as const,

  // Settings
  SETTINGS: 'Settings' as const,
  COMPANY_PROFILE: 'CompanyProfile' as const,
  USER_MANAGEMENT: 'UserManagement' as const,

  // Cross-cutting
  NOTIFICATION_CENTER: 'NotificationCenter' as const,
  AUDIT_TRAIL: 'AuditTrail' as const,

  // Delivery Admin
  DELIVERY_MANAGEMENT: 'DeliveryManagement' as const,
  ADMIN_DELIVERY_DETAIL: 'AdminDeliveryDetail' as const,
  DELIVERY_ANALYTICS: 'DeliveryAnalytics' as const,
  DELIVERY_PERSONNEL_LIST: 'DeliveryPersonnelList' as const,
  DELIVERY_PERSONNEL_DETAIL: 'DeliveryPersonnelDetail' as const,
  ADD_DELIVERY_PERSONNEL: 'AddDeliveryPersonnel' as const,
  ASSIGN_WORK: 'AssignWork' as const,

  // Delivery Personnel Tabs & Stacks
  DELIVERY_MAIN: 'DeliveryMain' as const,
  DP_TABS: 'DPTabs' as const,
  DP_DASHBOARD_STACK: 'DPDashboardStack' as const,
  DP_DELIVERIES_STACK: 'DPDeliveriesStack' as const,
  DP_INVENTORY_STACK: 'DPInventoryStack' as const,
  DP_PROFILE_STACK: 'DPProfileStack' as const,

  // Delivery Personnel Screens
  DELIVERY_DASHBOARD: 'DeliveryDashboard' as const,
  MY_DELIVERIES: 'MyDeliveries' as const,
  SHADOW_INVENTORY: 'ShadowInventory' as const,
  DELIVERY_PROFILE: 'DeliveryProfile' as const,

  // Delivery Execution Flow
  DP_DELIVERY_DETAIL: 'DPDeliveryDetail' as const,
  DELIVERY_ITEM_CONFIRM: 'DeliveryItemConfirm' as const,
  DELIVERY_PHOTO_PROOF: 'DeliveryPhotoProof' as const,
  SIGNATURE_CAPTURE: 'SignatureCapture' as const,
  CUSTOMER_CONFIRM: 'CustomerConfirm' as const,
  DELIVERY_COMPLETE: 'DeliveryComplete' as const,

  // Delivery Personnel Sub-screens
  DP_SHADOW_INVENTORY_DETAIL: 'DPShadowInventoryDetail' as const,
  DP_HISTORY: 'DPHistory' as const,
  DP_SETTINGS: 'DPSettings' as const,

  // Agency / Warehouse
  AGENCY_LIST: 'AgencyList' as const,
  AGENCY_DETAIL: 'AgencyDetail' as const,
  AGENCY_FORM: 'AgencyForm' as const,
  AGENCY_INVENTORY_SYNC: 'AgencyInventorySync' as const,
};
