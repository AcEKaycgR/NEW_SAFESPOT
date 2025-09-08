# Tourist Registration Page Migration Plan

## Overview
Migrate the tourist registration page from the existing implementation to the new UI design while preserving all functionality.

## Current Implementation Analysis
The existing registration page has:
1. Three-step process with StepIndicator
2. Step 1: User type selection (new/returning)
3. Step 2: Personal information and KYC (Aadhaar/Passport)
4. Step 3: Wallet connection
5. All existing functionality must be preserved

## New UI Design Approach
Adapt the new visual design from travel-sprite while maintaining:
- Same step-by-step flow
- Same form fields and validation
- Same wallet connection functionality
- Same navigation and routing

## Implementation Steps

### Step 1: Update Page Structure
- Replace current Card-based layout with new animated design
- Add Framer Motion animations
- Maintain existing step logic

### Step 2: Implement New Visual Design
- Use gradient backgrounds and glassmorphism effects
- Add floating elements and animations
- Improve form styling with new UI components

### Step 3: Preserve All Functionality
- Keep all form validation logic
- Maintain wallet connection functionality
- Preserve toast notifications
- Keep all existing state management

### Step 4: Test and Validate
- Verify all form fields work correctly
- Test navigation between steps
- Validate wallet connection flow
- Check responsive design

## Key Components to Preserve
1. StepIndicator component
2. useStep hook
3. WalletConnection component
4. Form validation logic
5. Toast notifications
6. Routing and navigation

## New Features to Add
1. Animated transitions between steps
2. Enhanced visual feedback
3. Improved error handling display
4. Better loading states