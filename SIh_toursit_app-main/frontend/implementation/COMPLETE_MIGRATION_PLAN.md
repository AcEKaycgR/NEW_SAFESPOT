# Complete Tourist UI Migration Plan

## Overview
This document outlines the plan to migrate all tourist workflow UI pages from the `travel-sprite-main` project to the existing `sih_toursit_app-main` project, replacing the current UI with the new design while preserving all existing functionality.

## Current Status
- ✅ Main dashboard page (`/dashboard`) - COMPLETED
- ⬜ Landing page (`/`)
- ⬜ Login/Registration pages (`/auth/tourist/*`)
- ⬜ Map page (`/dashboard/map`)
- ⬜ Itinerary page (`/dashboard/itinerary`)
- ⬜ Profile page (`/dashboard/profile`)
- ⬜ Location sharing page (`/dashboard/location`)
- ⬜ Privacy controls page (`/dashboard/privacy`)
- ⬜ Notifications page (`/dashboard/notifications`)
- ⬜ SOS page (`/dashboard/sos`)
- ⬜ Assistant page (`/dashboard/assistant`)
- ⬜ Groups page (`/dashboard/groups`)
- ⬜ Settings page (`/dashboard/settings`)

## Implementation Priority
1. Landing page - High priority (entry point)
2. Login/Registration pages - High priority (user onboarding)
3. Core dashboard pages (map, itinerary, profile) - High priority
4. Supporting pages (location, privacy, notifications) - Medium priority
5. Specialized pages (sos, assistant, groups, settings) - Low priority

## Migration Steps

### Phase 1: Landing Page & Authentication
1. Update landing page (`/src/app/page.tsx`) with new design
2. Update tourist registration page (`/src/app/auth/tourist/register/page.tsx`)
3. Update login page (`/src/app/auth/login/page.tsx`)

### Phase 2: Core Dashboard Pages
1. Update map page (`/src/app/dashboard/map/page.tsx`)
2. Update itinerary page (`/src/app/dashboard/itinerary/page.tsx`)
3. Update profile page (`/src/app/dashboard/profile/page.tsx`)

### Phase 3: Supporting Pages
1. Update location sharing page (`/src/app/dashboard/location/page.tsx`)
2. Update privacy controls page (`/src/app/dashboard/privacy/page.tsx`)
3. Update notifications page (`/src/app/dashboard/notifications/page.tsx`)

### Phase 4: Specialized Pages
1. Update SOS page (`/src/app/dashboard/sos/page.tsx`)
2. Update assistant page (`/src/app/dashboard/assistant/page.tsx`)
3. Update groups page (`/src/app/dashboard/groups/page.tsx`)
4. Update settings page (`/src/app/dashboard/settings/page.tsx`)

## Key Principles for Migration
1. Preserve all existing functionality and data flows
2. Maintain all API integrations and backend connections
3. Keep existing authentication and authorization systems
4. Ensure responsive design works on all device sizes
5. Maintain accessibility standards
6. Keep consistent navigation and user flow
7. Preserve all existing routes and URL structures