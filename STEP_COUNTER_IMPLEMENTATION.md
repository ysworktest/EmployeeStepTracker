# Step Counter Implementation Guide

## Overview
This document explains how the step counter works using the device's built-in step sensor via expo-sensors Pedometer API.

## How It Works

### 1. Baseline System
The step counter uses a baseline system to calculate daily steps:

- **At app start:** The total step count from midnight to now is recorded as the baseline
- **During the day:** Current steps = Total steps - Baseline
- **At midnight:** The baseline automatically resets for the new day

### 2. Step Calculation Flow

```
Device Total Steps: 15,432 (since device was last restarted)
Baseline (stored at app start): 15,000
Today's Steps: 15,432 - 15,000 = 432 steps
```

### 3. Components

#### stepStorageService.ts
- Stores and retrieves the baseline step count using AsyncStorage
- Manages baseline date to detect when a new day starts
- Provides utility functions for date handling

#### permissionsService.ts
- Handles Android 10+ runtime permission requests for ACTIVITY_RECOGNITION
- Provides permission checking functionality
- Falls back gracefully for older Android versions

#### pedometerService.ts
- Main service for step counting operations
- Initializes and manages the baseline
- Subscribes to real-time step updates
- Automatically resets baseline at midnight

#### individual.tsx
- User interface for displaying step counts
- Real-time step updates via Pedometer.watchStepCount
- Pull-to-refresh functionality
- Comprehensive error handling and loading states

## Key Features

### ✅ Accurate Step Counting
- Uses device's native step counter sensor
- Baseline system ensures accurate daily counts
- Handles midnight rollover automatically

### ✅ Real-Time Updates
- Steps update automatically while app is open
- Uses Pedometer.watchStepCount for live updates
- No polling required

### ✅ Persistence
- Baseline stored in AsyncStorage
- Survives app restarts
- Detects and handles day changes

### ✅ Permission Handling
- Requests ACTIVITY_RECOGNITION permission on Android 10+
- Motion & Fitness permission on iOS
- Clear error messages when permissions are denied

### ✅ Error Recovery
- Handles sensor unavailability
- Graceful fallback when permissions denied
- Comprehensive logging for debugging

## Android Permissions

### Manifest Permissions (app.json)
```json
"android": {
  "permissions": [
    "ACTIVITY_RECOGNITION"
  ]
}
```

### Runtime Permission (Android 10+)
The app requests ACTIVITY_RECOGNITION permission at runtime using PermissionsAndroid API.

## iOS Configuration

### Info.plist (via expo-sensors plugin)
```json
[
  "expo-sensors",
  {
    "motionPermission": "Allow $(PRODUCT_NAME) to access your motion and fitness data."
  }
]
```

## Debugging

### Console Logs
The implementation includes comprehensive logging:

```
[Pedometer] Initialized baseline: 15000 on 2025-10-11
[Pedometer] Total: 15432, Baseline: 15000, Today: 432
[Pedometer] Step update: 433
[Pedometer] Day changed, resetting baseline
```

### Common Issues

**Steps show 0 or not updating:**
- Check if ACTIVITY_RECOGNITION permission is granted
- Verify device has a step counter sensor (check console logs)
- Ensure baseline was initialized properly
- Check if the baseline value is corrupted (device reboot may reset sensor)
- Look for "[Pedometer] Sensor reset detected" in logs

**Steps are inconsistent:**
- Device step counter may reset after reboot (baseline will auto-reset)
- Wait for baseline to stabilize after app start
- Check if midnight rollover occurred
- Verify polling interval is working (every 3 seconds)

**Real-time updates not working:**
- Ensure step subscription is active (check for initialization logs)
- Verify Pedometer.watchStepCount is receiving events
- Check if polling fallback is running every 3 seconds
- Look for subscription cleanup in logs

**Historical data not syncing:**
- Verify device has historical step data available
- Check network connectivity for Supabase sync
- Look for sync errors in console logs
- Ensure employee data is loaded correctly

**Permission denied:**
- User needs to manually enable in device settings
- Show clear error message with instructions

## Testing

### Test Scenarios

1. **First Launch:** Baseline should initialize with current step count
2. **App Restart:** Baseline should persist from AsyncStorage
3. **Midnight Rollover:** Baseline should reset automatically
4. **Real-time Updates:** Steps should update as you walk
5. **Pull-to-Refresh:** Should reload current step count

### Test Commands

Check pedometer availability:
```javascript
const available = await checkPedometerAvailability();
console.log('Pedometer available:', available);
```

Check permissions:
```javascript
const hasPermission = await getPedometerPermissions();
console.log('Permission granted:', hasPermission);
```

Get current steps:
```javascript
const steps = await getTodaySteps();
console.log('Today steps:', steps);
```

## Architecture

```
┌─────────────────────────────────────┐
│      individual.tsx (UI Layer)      │
│  - Display steps                    │
│  - Handle user interactions         │
│  - Subscribe to updates             │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   pedometerService.ts (Logic)       │
│  - Calculate daily steps            │
│  - Manage baseline                  │
│  - Subscribe to sensor updates      │
└──────────────┬──────────────────────┘
               │
        ┌──────┴───────┐
        │              │
        ▼              ▼
┌─────────────┐  ┌─────────────┐
│stepStorage  │  │permissions  │
│Service.ts   │  │Service.ts   │
└─────────────┘  └─────────────┘
        │              │
        ▼              ▼
   AsyncStorage   PermissionsAndroid
```

## Migration from Health Connect

This implementation replaces the previous Health Connect integration:

### Removed Dependencies
- `expo-health-connect`
- `react-native-health-connect`
- `androidx.health.connect:connect-client`

### Benefits
- ✅ No minSdkVersion 26 requirement (works on Android API 19+)
- ✅ No dependency on Google Fit or Samsung Health
- ✅ Simpler codebase with unified API
- ✅ Direct access to device step sensor
- ✅ Faster and more reliable step counts

### Trade-offs
- ⚠️ Cannot access historical data from other apps
- ⚠️ Cannot sync with Google Fit or Samsung Health
- ⚠️ Device-specific step counting (phone must be carried)

## Recent Fixes (October 2025)

### Android Step Counter Issues Resolved

**Problem:** Steps showing as zero and not updating on Android devices

**Root Causes:**
1. Baseline initialization not working properly on Android
2. Real-time subscription failing to trigger updates
3. Sensor reset detection not handling device reboots
4. No historical data retrieval for Android

**Solutions Implemented:**

1. **Enhanced Baseline Management:**
   - Added initialization guard to prevent concurrent baseline setup
   - Implemented sensor reset detection when total steps < baseline
   - Added comprehensive logging for debugging baseline issues
   - Auto-reset baseline when device sensor resets

2. **Improved Real-time Updates:**
   - Added polling fallback (every 3 seconds) alongside sensor events
   - Fixed subscription lifecycle management
   - Implemented proper cleanup on unmount
   - Added step change detection to prevent unnecessary updates

3. **Historical Data Support:**
   - Implemented `getLast7DaysSteps()` for Android using Pedometer API
   - Removed iOS-only restriction from 7-day history sync
   - Added date-range queries for each of the past 7 days
   - Proper error handling for missing historical data

4. **Better Error Messages:**
   - Platform-specific permission instructions
   - Clear guidance for troubleshooting step tracking issues
   - Improved user feedback during sync operations

### Testing Checklist

After deploying these fixes, test the following:

- [ ] Steps display correctly on app launch (not zero)
- [ ] Steps update in real-time as you walk
- [ ] Pull-to-refresh updates step count accurately
- [ ] Baseline persists across app restarts
- [ ] Baseline resets properly at midnight
- [ ] Sensor reset detected after device reboot
- [ ] 7-day history sync works on Android
- [ ] Error messages are clear and actionable
- [ ] Permissions are requested properly
- [ ] Console logs show detailed debugging info

## Future Enhancements

Potential improvements:

1. **Background Step Tracking:** Implement background tasks to count steps even when app is closed
2. **Step History:** Store historical step data in Supabase for analytics
3. **Multi-Device Sync:** Allow users to track steps from multiple devices
4. **Calibration:** Allow users to calibrate step sensitivity
5. **Battery Optimization:** Implement smart polling to reduce battery usage
