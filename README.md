# FinMatrix - Enterprise Accounting & Delivery Management Platform

## Overview
FinMatrix combines the complete accounting features of Sage Peachtree and Intuit QuickBooks with an innovative real-time delivery management system. Built with React Native (TypeScript), Redux Toolkit, and Firebase.

## Architecture
```
src/
  screens/          - Feature-based screens with co-located Redux slices
  serializers/      - Data transformation before API calls
  store/            - Redux global store configuration
  components/       - Global reusable UI components
  Custom-Components/- Styled reusable building blocks
  firebase/         - Firebase configuration & initialization
  hooks/            - Custom React/Redux hooks
  models/           - Data models & validation schemas
  navigations-map/  - Centralized route constants
  navigators/       - Navigation setup
  network/          - API services & network calls
  theme/            - Design system (colors, typography, spacing)
  types/            - TypeScript type definitions
  dummy-data/       - Mock data for development
```

## Getting Started
1. `npm install`
2. `npx react-native run-ios` or `npx react-native run-android`

## Demo Credentials
- **Administrator**: admin@finmatrix.com / Admin@123
- **Delivery Personnel**: delivery@finmatrix.com / Delivery@123

## Key Features
- Complete double-entry accounting (Chart of Accounts, GL, AR, AP)
- Real-time cloud-based inventory management
- Invoicing, Purchase Orders, Sales Orders
- Payroll management
- Delivery assignment and tracking
- Digital signature capture with customer verification
- Copy-on-write inventory system for delivery personnel
- Role-based access control
- Push notification system
- Financial reporting and analytics
# FinMatrix-Demo
