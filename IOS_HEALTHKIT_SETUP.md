# iOS HealthKit & 7-Day History Sync

## Overview

iOS uses Apple HealthKit to retrieve step data, ensuring step counts match exactly what users see in the Apple Health app. This provides the most accurate and reliable step tracking on iOS devices.

## Key Features

✅ **Matches Apple Health Exactly** - Step counts pulled directly from HealthKit
✅ **7-Day History Sync** - Sync past week's data to Supabase with one tap
✅ **Real-Time Updates** - Steps update every 5 seconds while app is open
✅ **No Baseline Required** - HealthKit provides accurate daily totals automatically

## Setup Requirements

### 1. Install Dependencies

```bash
npm install react-native-health@^1.19.2
```

### 2. Native Build Required

Since `react-native-health` requires native code, you **cannot use Expo Go**. You must create a development build:

**Option A: Local Development Build**
```bash
npx expo prebuild
npx expo run:ios
```

**Option B: EAS Build (Recommended)**
```bash
eas build --profile development --platform ios
```

### 3. Permissions (app.json)

Already configured in `app.json`:

```json
{
  "ios": {
    "infoPlist": {
      "NSHealthShareUsageDescription": "This app needs access to your step count data from Apple Health to track your daily activity and earn charity contributions for your company.",
      "NSHealthUpdateUsageDescription": "This app does not write data to Apple Health."
    },
    "entitlements": {
      "com.apple.developer.healthkit": true,
      "com.apple.developer.healthkit.access": []
    }
  }
}
```

## How It Works

### Today's Steps
- Queries HealthKit from **midnight (00:00)** to **current time**
- Returns exact step count matching Apple Health
- Updates every 5 seconds while app is open

```typescript
import { getTodaySteps } from '@/utils/pedometerService';

const steps = await getTodaySteps();
// Returns: 5,432 steps (matches Apple Health exactly)
```

### 7-Day History
- Queries each of the last 7 days individually
- Gets full day totals (00:00 to 23:59:59) for each date
- Syncs all data to Supabase database

```typescript
import { getLast7DaysSteps } from '@/utils/pedometerService';

const history = await getLast7DaysSteps();
// Returns: [
//   { date: '2025-10-05', steps: 8234 },
//   { date: '2025-10-06', steps: 9123 },
//   ...
// ]
```

### Syncing to Supabase
- Available via button in the app (iOS only)
- Syncs last 7 days of step data
- Updates goal achievement and charity earned
- Shows success message with number of days synced

```typescript
import { sync7DayHistoryToSupabase } from '@/utils/stepHistoryService';

const result = await sync7DayHistoryToSupabase(employeeId, deviceId);
if (result.success) {
  console.log(`Synced ${result.data?.length} days`);
}
```

## User Experience

### First Time Setup
1. App requests HealthKit permission on launch
2. User grants "Read Steps" permission
3. Today's steps appear immediately
4. User can tap "Sync 7-Day History" to populate past week

### Daily Usage
- Steps update automatically every 5 seconds
- Pull down to refresh manually
- Data matches Apple Health exactly
- No manual syncing required

### Permission Management
Users can revoke access anytime:
- Settings > Health > Data Access & Devices > [App Name]
- Toggle "Steps" permission off/on

## Implementation Details

### File Structure

```
utils/
├── healthKitService.ts       # HealthKit API wrapper
├── pedometerService.ts       # Unified iOS + Android API
├── stepHistoryService.ts     # 7-day history sync logic
└── permissionsService.ts     # Permission handling

app/(tabs)/
└── individual.tsx            # UI with sync button

types/
└── react-native-health.d.ts  # TypeScript definitions
```

### HealthKit Service API

**Initialize HealthKit**
```typescript
const initialized = await initializeHealthKit();
// Requests read permission for steps
```

**Get Today's Steps**
```typescript
const steps = await getTodaySteps();
// Queries from 00:00 to now
```

**Get Steps for Specific Date**
```typescript
const date = new Date('2025-10-11');
const steps = await getStepsForDate(date);
// Queries full day (00:00 to 23:59:59)
```

**Get Last 7 Days**
```typescript
const history = await getLast7DaysSteps();
// Returns array of { date, steps }
```

**Subscribe to Updates**
```typescript
const unsubscribe = subscribeToStepUpdates((steps) => {
  console.log('Steps updated:', steps);
});
// Polls every 5 seconds
// Call unsubscribe() to stop
```

## Testing

### Test Today's Steps
1. Open Apple Health app
2. Check today's step count
3. Open this app
4. Verify step count matches exactly

### Test 7-Day History
1. Open this app
2. Scroll to "Step Tracking Info" section
3. Tap "Sync 7-Day History from Apple Health"
4. Wait for success message
5. Verify "Last 7 Days Performance" chart shows data

### Test Real-Time Updates
1. Keep app open
2. Walk around with iPhone
3. Watch steps update every 5 seconds
4. Compare with Apple Health app

## Debugging

### Console Logs

```bash
# Successful initialization
[HealthKit] Initialized successfully

# Today's steps
[HealthKit] Today's steps: 5432

# Historical query
[HealthKit] Steps for 2025-10-11: 10234

# 7-day history
[HealthKit] Retrieved 7-day history: [...]

# History sync
[StepHistory] Starting 7-day history sync for employee: emp_123
[StepHistory] Synced 2025-10-11: 10234 steps
[StepHistory] Sync complete. Synced 7 days
```

### Common Issues

**❌ "HealthKit not available"**
- **Cause**: Running in iOS Simulator or non-iOS device
- **Solution**: Test on real iOS device (iPhone 5S or later)

**❌ Steps show 0**
- **Cause**: Permission not granted or no data in Health app
- **Solution**:
  - Check Settings > Health > Data Access & Devices
  - Verify Apple Health app has step data

**❌ "Failed to sync history"**
- **Cause**: No internet connection or database error
- **Solution**:
  - Check internet connection
  - Verify Supabase configuration
  - Check console logs for detailed error

## Security & Privacy

### Data Access
- **Read Only**: App only reads step data, never writes
- **Limited Scope**: Only accesses step count, no other health data
- **User Control**: Users can revoke access anytime in Settings

### Data Storage
- **Source**: Step data stored in Apple HealthKit (controlled by Apple)
- **Local**: No step data stored locally on device
- **Remote**: Only daily totals synced to Supabase (no minute-by-minute data)

### Privacy Compliance
- Follows Apple Health guidelines
- Clear permission descriptions
- No sharing of health data with third parties
- Users can review data access in Health app

## Production Deployment

### Pre-Launch Checklist
- [ ] Test on real iOS device (not simulator)
- [ ] Verify HealthKit capability in Apple Developer Portal
- [ ] Test permission flow
- [ ] Verify step counts match Apple Health
- [ ] Test 7-day history sync
- [ ] Add App Store screenshots showing permission dialog

### App Store Review
- Required: Clear explanation of HealthKit usage in App Store description
- Required: Privacy policy mentioning health data access
- Recommended: Screenshots showing permission dialog
- Note: Apple reviews HealthKit apps carefully

### Important Notes
- HealthKit is **not available on iPad**
- Minimum iOS version: iOS 8.0 (adjust in app.json if needed)
- TestFlight builds work with HealthKit
- App Store reviewers will test HealthKit functionality

## Comparison: iOS vs Android

| Feature | iOS (HealthKit) | Android (Sensor) |
|---------|----------------|------------------|
| Data Source | Apple Health | Device Sensor |
| Historical Data | ✅ 7-day sync | ❌ No history |
| Accuracy | Exact match | Accurate with baseline |
| Setup | Requires native build | Works with Expo |
| Background | ✅ Native iOS | ❌ App must be open |
| External Apps | None required | None required |

## Support & Resources

- [Apple HealthKit Documentation](https://developer.apple.com/documentation/healthkit)
- [react-native-health GitHub](https://github.com/agencyenterprise/react-native-health)
- [App Store Review Guidelines - HealthKit](https://developer.apple.com/app-store/review/guidelines/#healthkit)

For issues:
1. Check console logs for detailed errors
2. Verify permissions in Settings > Health
3. Test on real iOS device
4. Review this documentation
