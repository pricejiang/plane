# 🔍 Widget Debugging Instructions

## Current Status
I've added extensive debug logging to help identify why widgets show as "title" overlays instead of colored widget overlays.

## Debug Logging Added

### 1. Widget Detection Stage (Worker)
- Logs every text being checked for widget patterns
- Shows pattern matches and confidence scores
- Located in `detectWidgetFromText()` function

### 2. Role Assignment Stage (Worker) 
- Logs widget detection results for CHART/MAP elements
- Shows role override logic (widget detection → 'widget' role)
- Located in `convertToSemanticComponents()` function

### 3. Overlay Generation Stage (Manager)
- Logs components with 'widget' role or widget metadata
- Shows category assignment process
- Located in `extractForOverlay()` function

## How to Test and Debug

### Step 1: Open Browser Console
1. Go to http://localhost:3004
2. Open browser developer tools (F12)
3. Go to Console tab

### Step 2: Create Test Elements
1. Draw rectangles in Excalidraw
2. Add these exact texts:
   - `CHART: sales data`
   - `MAP: San Francisco`
   - `[CHART: Q4 data]` (bracket version)
   - `[MAP: Central Park]` (bracket version)

### Step 3: Scan and Check Logs
1. Click "Scan Canvas" button
2. Watch console for these debug messages:

```
[Widget Detection] Checking text: "CHART: sales data"
[Widget Detection] ✅ MATCH! "CHART: sales data" → chart (0.8)

[Widget Debug] Element abc123:
  Text: "CHART: sales data"
  Original role: title
  Widget detection found: true
  Is widget: true
  Widget type: chart
  Widget confidence: 0.8
  Final role: widget
  Final role === 'widget': true

[Overlay Debug] Component abc123:
  Role: "widget"
  Has widget metadata: true
  Widget type: chart
  Label: "chart widget"
  Category: "widget"
```

### Step 4: Check Overlay Colors
After scanning, you should see:
- **Green overlays** for MAP widgets 🗺️
- **Amber overlays** for CHART widgets 📊
- **Blue overlays** for non-widgets

## Expected Console Output

### ✅ Working Correctly:
```
Stage 6 complete: Found 2 widgets
[Widget Detection] ✅ MATCH! "CHART: sales data" → chart (0.8)
[Widget Debug] Final role: widget
[Overlay Debug] Category: "widget"
```

### ❌ If Still Broken:
```
Stage 6 complete: Found 0 widgets
[Widget Detection] ❌ No match for: "CHART: sales data"
[Widget Debug] Widget detection found: false
[Widget Debug] Final role: title
[Overlay Debug] Category: "text"
```

## Debug Analysis

Based on the console output, I can determine:

1. **Widget Detection Issue**: If no widget patterns match
2. **Role Assignment Issue**: If widgets detected but role stays "title"  
3. **Category Assignment Issue**: If role is "widget" but category is wrong
4. **Overlay Rendering Issue**: If category is "widget" but still shows blue

## Most Likely Issues

1. **Text not reaching detector**: Element text might be empty/different
2. **Element ID mismatch**: Widget detection and role assignment use different IDs
3. **Pattern not matching**: Text format might be different than expected
4. **TypeScript compilation**: Enum values might not match runtime values

## Next Steps

After testing, share the console output and I can:
1. Fix pattern matching if text format is different
2. Fix element ID mapping if widget detection isn't linking properly  
3. Fix category assignment if role conversion is broken
4. Fix overlay styling if category is correct but colors are wrong

The debug logs will show exactly where the widget detection pipeline is breaking down! 🕵️‍♂️