# Thermal Printer Paper Size Implementation (58mm & 80mm)

## 📋 Overview

This document explains how we've implemented support for both **58mm** and **80mm** thermal printer paper sizes in the Store Saathi App. The implementation allows users to select their paper size preference and automatically formats bills accordingly.

---

## 🎯 Key Features

1. **Dual Paper Size Support** - 58mm (default) and 80mm thermal paper
2. **Persistent Preference** - Paper size selection is saved using AsyncStorage
3. **Auto-Formatting** - Bills automatically format based on selected paper size
4. **Dynamic Column Widths** - Different column layouts for each paper size
5. **Optimized Text Layout** - Character limits adjusted per paper width

---

## 📏 Paper Size Specifications

### 58mm Paper (Default)
- **Character Width**: ~32 characters per line
- **Common Use**: Small shops, kiosks, mobile POS
- **Column Layout**: `[14, 8, 10]` (Item, Qty, Amount)
- **Divider**: 32 equals signs (`================================`)
- **QR Code Size**: 240px

### 80mm Paper
- **Character Width**: ~48 characters per line
- **Common Use**: Restaurants, retail stores, supermarkets
- **Column Layout**: `[22, 10, 8, 8]` (Item, Qty, Rate, Amount)
- **Divider**: 48 equals signs (`================================================`)
- **QR Code Size**: 300px
- **Extra Column**: Shows individual item rate (not just total)

---

## 🏗️ Architecture

### File Structure
```
store-saathi-app/
├── utils/
│   ├── printerManager.ts        # Paper size storage & retrieval
│   └── thermalPrinter.ts        # Print templates for both sizes
└── app/
    ├── PrintTest.tsx            # Paper size selector UI
    └── billing/
        └── index.tsx            # Billing integration
```

---

## 🔧 Implementation Details

### 1. Paper Size Storage (printerManager.ts)

```typescript
const PAPER_SIZE_KEY = "@printer_paper_size";
export type PaperSize = "58" | "80";

/**
 * Save paper size preference (58mm or 80mm)
 */
export const setPaperSize = async (size: PaperSize): Promise<void> => {
  try {
    await AsyncStorage.setItem(PAPER_SIZE_KEY, size);
    console.log("Paper size saved:", size);
  } catch (error) {
    console.warn("Failed to save paper size:", error);
  }
};

/**
 * Get saved paper size preference (defaults to 58mm)
 */
export const getPaperSize = async (): Promise<PaperSize> => {
  try {
    const saved = await AsyncStorage.getItem(PAPER_SIZE_KEY);
    if (saved === "58" || saved === "80") return saved;
  } catch (error) {
    console.warn("Failed to load paper size:", error);
  }
  return "58"; // default fallback
};
```

**Key Points:**
- Uses AsyncStorage for persistence across app restarts
- Type-safe with `PaperSize` type ("58" | "80")
- Always returns a valid paper size (defaults to 58mm)
- Graceful error handling

---

### 2. Print Templates (thermalPrinter.ts)

#### A. 58mm Template (`printBill`)

```typescript
export const printBill = async (bill: any): Promise<void> => {
  // ... shop data extraction ...

  const DIVIDER = "================================\n\r"; // 32 chars

  await BluetoothEscposPrinter.printerInit();
  
  // Header (centered)
  await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
  await BluetoothEscposPrinter.printText(`${shopName.toUpperCase()}\n\r`, { bold: true });
  
  // ... shop details ...
  
  // Items table - 3 columns
  await BluetoothEscposPrinter.printColumn(
    [14, 8, 10],  // Column widths (total = 32)
    [
      BluetoothEscposPrinter.ALIGN.LEFT,    // Item name
      BluetoothEscposPrinter.ALIGN.CENTER,  // Quantity
      BluetoothEscposPrinter.ALIGN.RIGHT,   // Amount
    ],
    ["Item", "Qty", "Amount"],
    { bold: true }
  );
  
  // Item loop
  for (const item of bill.items || []) {
    let name = item.name || "Item";
    if (name.length > 13) name = name.substring(0, 12) + "."; // Truncate long names
    
    const shorthand = getUnitShorthand(item.unit);
    const qtyAndUnit = `${item.quantity || 1} ${shorthand}`;
    const amount = `Rs.${item.total || 0}`;
    
    await BluetoothEscposPrinter.printColumn(
      [14, 8, 10],
      [
        BluetoothEscposPrinter.ALIGN.LEFT,
        BluetoothEscposPrinter.ALIGN.CENTER,
        BluetoothEscposPrinter.ALIGN.RIGHT,
      ],
      [name, qtyAndUnit, amount],
      {}
    );
  }
  
  // QR Code for UPI payment
  if (upiId) {
    await BluetoothEscposPrinter.printQRCode(
      upiLink,
      240,  // Smaller QR for 58mm
      BluetoothEscposPrinter.ERROR_CORRECTION.L
    );
  }
  
  await BluetoothEscposPrinter.cutOnePoint();
};
```

**58mm Layout Example:**
```
================================
        MY SHOP NAME
     123 Main Street
    Phone: +91 1234567890
   GSTIN: 29ABCDE1234F1Z5
================================
Bill No: #123
Date: 31/05/2026 10:30 AM
Customer: John Doe
================================
Item            Qty      Amount
--------------------------------
Milk            2 ltr   Rs.120
Eggs (Large)    1 dzn    Rs.80
Sugar Packet    5 kg    Rs.250
--------------------------------
Sub Total:           Rs.450
Discount:            -Rs.50
CGST (2.5%):         Rs.10
SGST (2.5%):         Rs.10
Total:               Rs.420
Balance Due:          Rs.20
================================
     Scan QR to Pay:
      [QR CODE 240px]

   Thank you! Visit again
```

---

#### B. 80mm Template (`printBill80mm`)

```typescript
export const printBill80mm = async (bill: any): Promise<void> => {
  // ... shop data extraction ...

  const DIVIDER_HEAVY = "================================================\n\r"; // 48 chars
  const DIVIDER_LIGHT = "------------------------------------------------\n\r";

  await BluetoothEscposPrinter.printerInit();
  
  // Header (centered)
  await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
  await BluetoothEscposPrinter.printText(`${shopName.toUpperCase()}\n\r`, { bold: true });
  
  // ... shop details ...
  
  // Items table - 4 columns (extra "Rate" column)
  await BluetoothEscposPrinter.printColumn(
    [22, 10, 8, 8],  // Column widths (total = 48)
    [
      BluetoothEscposPrinter.ALIGN.LEFT,    // Item name
      BluetoothEscposPrinter.ALIGN.CENTER,  // Quantity
      BluetoothEscposPrinter.ALIGN.RIGHT,   // Rate (per unit)
      BluetoothEscposPrinter.ALIGN.RIGHT,   // Amount (total)
    ],
    ["Item", "Qty", "Rate", "Amt"],
    { bold: true }
  );
  
  // Item loop
  for (const item of bill.items || []) {
    let name = item.name || "Item";
    if (name.length > 21) name = name.substring(0, 20) + "."; // More space for names
    
    const shorthand = getUnitShorthand(item.unit);
    const qtyAndUnit = `${item.quantity || 1} ${shorthand}`;
    const rate = `${item.price || 0}`;       // ← NEW: Shows unit price
    const amount = `${item.total || 0}`;
    
    await BluetoothEscposPrinter.printColumn(
      [22, 10, 8, 8],
      [
        BluetoothEscposPrinter.ALIGN.LEFT,
        BluetoothEscposPrinter.ALIGN.CENTER,
        BluetoothEscposPrinter.ALIGN.RIGHT,
        BluetoothEscposPrinter.ALIGN.RIGHT,
      ],
      [name, qtyAndUnit, rate, amount],
      {}
    );
  }
  
  // QR Code for UPI payment
  if (upiId) {
    await BluetoothEscposPrinter.printQRCode(
      upiLink,
      300,  // Larger QR for 80mm
      BluetoothEscposPrinter.ERROR_CORRECTION.L
    );
  }
  
  await BluetoothEscposPrinter.cutOnePoint();
};
```

**80mm Layout Example:**
```
================================================
              MY SHOP NAME
           123 Main Street
        Phone: +91 1234567890
       GSTIN: 29ABCDE1234F1Z5
================================================
Bill No: #123
Date: 31/05/2026 10:30 AM
Customer: John Doe
================================================
Item                   Qty       Rate      Amt
------------------------------------------------
Milk                   2 ltr       60      120
Eggs (Large Brown)     1 dzn       80       80
Sugar Packet           5 kg        50      250
------------------------------------------------
Sub Total:                           Rs.450
Discount:                           -Rs.50
CGST (2.5%):                         Rs.10
SGST (2.5%):                         Rs.10
Total:                               Rs.420
Paid:                                Rs.400
Balance Due:                          Rs.20
================================================
          Scan QR to Pay:
          [QR CODE 300px]

        Thank you! Visit again
```

---

#### C. Auto-Print Function (`printBillAuto`)

```typescript
/**
 * Auto-print bill using the saved paper size preference.
 * This is what billing screens should call — it reads AsyncStorage
 * and routes to the correct 58mm or 80mm template automatically.
 */
export const printBillAuto = async (bill: any): Promise<void> => {
  const size = await getPaperSize();
  if (size === "80") {
    await printBill80mm(bill);
  } else {
    await printBill(bill);  // Default to 58mm
  }
};
```

**Usage in Billing:**
```typescript
import { printBillAuto } from "../utils/thermalPrinter";

// After successful checkout
await printBillAuto(billData);  // Automatically uses correct template
```

---

### 3. User Interface (PrintTest.tsx)

#### Paper Size Selector UI

```typescript
const [paperSize, setPaperSizeState] = useState<"58" | "80">("58");

// Load saved preference on mount
useEffect(() => {
  const initialize = async () => {
    const saved = await getPaperSize();
    setPaperSizeState(saved);
  };
  initialize();
}, []);

// Paper size selector buttons
<View style={styles.paperSizeRow}>
  <Text style={styles.paperSizeLabel}>Paper Size:</Text>
  
  <TouchableOpacity
    style={[
      styles.paperSizeBtn,
      paperSize === "58" && styles.paperSizeBtnActive
    ]}
    onPress={() => {
      setPaperSizeState("58");
      setPaperSize("58");  // Save to AsyncStorage
    }}
  >
    <Text style={[
      styles.paperSizeBtnText,
      paperSize === "58" && styles.paperSizeBtnTextActive
    ]}>
      58 mm
    </Text>
  </TouchableOpacity>
  
  <TouchableOpacity
    style={[
      styles.paperSizeBtn,
      paperSize === "80" && styles.paperSizeBtnActive
    ]}
    onPress={() => {
      setPaperSizeState("80");
      setPaperSize("80");  // Save to AsyncStorage
    }}
  >
    <Text style={[
      styles.paperSizeBtnText,
      paperSize === "80" && styles.paperSizeBtnTextActive
    ]}>
      80 mm
    </Text>
  </TouchableOpacity>
</View>
```

**Visual Design:**
```
┌─────────────────────────────────┐
│ Paper Size:  [58 mm]  [ 80 mm ] │  ← Selected = Blue background
└─────────────────────────────────┘
```

#### Test Print with Selected Size

```typescript
// Test print button passes current paper size
<TouchableOpacity
  style={styles.secondaryButton}
  onPress={() => printTestBill(paperSize)}  // ← Pass selected size
>
  <Text>Test Print</Text>
</TouchableOpacity>
```

---

### 4. Test Print Function

```typescript
/**
 * Test print — pass paperSize "58" (default) or "80"
 */
export const printTestBill = async (paperSize: "58" | "80" = "58"): Promise<void> => {
  const dummyBill = {
    dailyBillNumber: "T-01",
    subTotal: 200,
    taxPercentage: 5,
    totalAmount: 210,
    discount: 0,
    paidAmount: 210,
    paymentStatus: "PAID",
    createdAt: new Date().toISOString(),
    items: [
      { name: "Milk", quantity: 2, unit: "liter", price: 60, total: 120 },
      { name: "Eggs", quantity: 1, unit: "dozen", price: 80, total: 80 },
    ],
  };

  if (paperSize === "80") {
    await printBill80mm(dummyBill);
  } else {
    await printBill(dummyBill);
  }
};
```

---

## 🎨 Column Width Calculations

### 58mm Paper (32 chars)
```typescript
// Item Table
[14, 8, 10] = 32 chars
│←─14 chars──→│←8 ch→│←─10 ch──→│
│ Item Name   │ Qty  │   Amount │
│ Milk        │2 ltr │   Rs.120 │

// Text truncation
if (name.length > 13) {
  name = name.substring(0, 12) + ".";
}
// Example: "Coconut Oil Extra Virgin" → "Coconut Oil."
```

### 80mm Paper (48 chars)
```typescript
// Item Table
[22, 10, 8, 8] = 48 chars
│←───22 chars────→│←─10 ch─→│←8ch→│←─8 ch─→│
│ Item Name      │   Qty    │ Rate│   Amt  │
│ Milk           │   2 ltr  │  60 │   120  │

// Text truncation
if (name.length > 21) {
  name = name.substring(0, 20) + ".";
}
// Example: "Coconut Oil Extra Virgin" → "Coconut Oil Extra V."
```

---

## 🔄 Complete User Flow

### 1. Initial Setup
```
User opens app → Navigate to Printer Setup
   ↓
Select Paper Size: [58mm] or [80mm]
   ↓
Scan for printers → Connect to printer
   ↓
Test print with selected size
   ↓
Paper size saved to AsyncStorage
```

### 2. Daily Usage
```
User creates bill → Adds items → Checkout
   ↓
App reads saved paper size from AsyncStorage
   ↓
Calls printBillAuto(bill)
   ↓
Automatically uses correct template (58mm or 80mm)
   ↓
Bill prints with proper formatting
```

### 3. Changing Paper Size
```
User swaps to different paper roll (58mm → 80mm)
   ↓
Navigate to Printer Setup
   ↓
Select new paper size: [80mm]
   ↓
Preference saved immediately to AsyncStorage
   ↓
Future bills will use 80mm template
```

---

## 💡 Helper Functions

### Unit Shorthand Conversion
```typescript
/**
 * Helper to convert long unit names to shorthand for receipt space
 */
const getUnitShorthand = (unit: string): string => {
  const lowerUnit = (unit || "").toLowerCase().trim();
  switch (lowerUnit) {
    case "liter":
    case "liters":
    case "litre":
    case "litres":
      return "ltr";
    case "dozen":
    case "dozens":
      return "dzn";
    case "kilogram":
    case "kilograms":
    case "kg":
      return "kg";
    case "piece":
    case "pieces":
      return "pcs";
    default:
      return lowerUnit || "unit";
  }
};
```

**Why?** Saves precious horizontal space on narrow receipts:
- "2 liters" → "2 ltr" (saves 3 chars)
- "1 dozen" → "1 dzn" (saves 2 chars)
- "5 kilograms" → "5 kg" (saves 7 chars)

---

## 📊 Comparison Table

| Feature | 58mm Paper | 80mm Paper |
|---------|-----------|-----------|
| **Character Width** | 32 chars | 48 chars |
| **Divider Line** | 32 `=` | 48 `=` |
| **Item Columns** | 3 (Item, Qty, Amount) | 4 (Item, Qty, Rate, Amt) |
| **Column Widths** | [14, 8, 10] | [22, 10, 8, 8] |
| **Item Name Limit** | 13 chars | 21 chars |
| **QR Code Size** | 240px | 300px |
| **Shows Unit Price** | ❌ No | ✅ Yes |
| **Total Section Padding** | Compact | Spacious |
| **Best For** | Small shops, kiosks | Restaurants, retail |

---

## 🧪 Testing Checklist

### Test 58mm Paper
- [ ] Prints header centered
- [ ] Shop details fit on paper
- [ ] Items table aligns properly (3 columns)
- [ ] Long item names truncate correctly (>13 chars)
- [ ] Totals section right-aligned
- [ ] GST lines visible when applicable
- [ ] QR code prints (240px size)
- [ ] Footer text centered
- [ ] Paper cuts at end

### Test 80mm Paper
- [ ] Prints header centered
- [ ] Shop details fit on paper
- [ ] Items table aligns properly (4 columns)
- [ ] Long item names truncate correctly (>21 chars)
- [ ] Rate column shows unit price
- [ ] Totals section right-aligned with more padding
- [ ] GST lines visible when applicable
- [ ] QR code prints (300px size)
- [ ] Footer text centered
- [ ] Paper cuts at end

### Test Paper Size Switching
- [ ] Selecting 58mm saves preference
- [ ] Selecting 80mm saves preference
- [ ] Preference persists after app restart
- [ ] Test print uses correct template
- [ ] Real bills use correct template
- [ ] Switching mid-session works correctly

---

## 🚨 Common Issues & Solutions

### Issue 1: Text Overflows on 58mm
**Problem:** Long item names or totals overflow paper width  
**Solution:**
```typescript
// Truncate item names
if (name.length > 13) {
  name = name.substring(0, 12) + ".";
}

// Use shorthand units
const shorthand = getUnitShorthand(item.unit);
```

### Issue 2: Columns Misaligned
**Problem:** Columns don't add up to paper width  
**Solution:**
```typescript
// 58mm: [14, 8, 10] = 32 ✅
// 80mm: [22, 10, 8, 8] = 48 ✅

// WRONG: [15, 8, 10] = 33 ❌ (too wide)
```

### Issue 3: QR Code Too Large
**Problem:** QR code doesn't fit on 58mm paper  
**Solution:**
```typescript
// 58mm: Use size 240 or less
await BluetoothEscposPrinter.printQRCode(upiLink, 240, ...);

// 80mm: Can use size 300
await BluetoothEscposPrinter.printQRCode(upiLink, 300, ...);
```

### Issue 4: Paper Size Not Persisting
**Problem:** Paper size resets after app restart  
**Solution:**
```typescript
// Make sure AsyncStorage is working
import AsyncStorage from "@react-native-async-storage/async-storage";

// Test storage
await AsyncStorage.setItem("@test_key", "test_value");
const test = await AsyncStorage.getItem("@test_key");
console.log(test); // Should log "test_value"
```

---

## 🎯 Best Practices

### 1. Always Test Both Sizes
```typescript
// Test with actual printers
await printTestBill("58");
await printTestBill("80");
```

### 2. Use Auto-Print in Production
```typescript
// ✅ GOOD: Automatically uses correct size
await printBillAuto(bill);

// ❌ BAD: Hardcoded size
await printBill(bill);  // Always uses 58mm
```

### 3. Provide Clear UI Feedback
```typescript
// Show current paper size in UI
<Text>Selected: {paperSize}mm</Text>

// Confirm after selection
Alert.alert("Paper Size Changed", `Now using ${paperSize}mm paper`);
```

### 4. Handle Edge Cases
```typescript
// Missing shop data
const shopName = shop?.shopName || "Our Shop";

// Missing item data
const name = item.name || "Item";
const quantity = item.quantity || 1;
const total = item.total || 0;

// Missing bill data
const billNumber = bill.dailyBillNumber || "N/A";
```

### 5. Keep Dividers Consistent
```typescript
// 58mm: 32 chars
const DIVIDER_58 = "================================\n\r";

// 80mm: 48 chars
const DIVIDER_80 = "================================================\n\r";
```

---

## 📚 API Reference

### setPaperSize(size: PaperSize)
Saves paper size preference to AsyncStorage.

**Parameters:**
- `size`: "58" | "80"

**Returns:** `Promise<void>`

**Example:**
```typescript
await setPaperSize("80");
```

---

### getPaperSize()
Retrieves saved paper size preference.

**Returns:** `Promise<PaperSize>` (defaults to "58")

**Example:**
```typescript
const size = await getPaperSize();
console.log(size); // "58" or "80"
```

---

### printBill(bill: any)
Prints bill using 58mm paper template.

**Parameters:**
- `bill`: Bill object with items, totals, shop info

**Returns:** `Promise<void>`

**Example:**
```typescript
await printBill(billData);
```

---

### printBill80mm(bill: any)
Prints bill using 80mm paper template.

**Parameters:**
- `bill`: Bill object with items, totals, shop info

**Returns:** `Promise<void>`

**Example:**
```typescript
await printBill80mm(billData);
```

---

### printBillAuto(bill: any)
Automatically prints bill using saved paper size preference.

**Parameters:**
- `bill`: Bill object with items, totals, shop info

**Returns:** `Promise<void>`

**Example:**
```typescript
await printBillAuto(billData); // Uses saved size
```

---

### printTestBill(paperSize?: "58" | "80")
Prints test receipt with dummy data.

**Parameters:**
- `paperSize`: "58" | "80" (optional, defaults to "58")

**Returns:** `Promise<void>`

**Example:**
```typescript
await printTestBill("80");
```

---

## 🔄 Migration Guide

### Upgrading Existing Implementation

If you have an existing single-size implementation:

#### Step 1: Add Paper Size Storage
```typescript
// Add to printerManager.ts
const PAPER_SIZE_KEY = "@printer_paper_size";

export const setPaperSize = async (size: "58" | "80"): Promise<void> => {
  await AsyncStorage.setItem(PAPER_SIZE_KEY, size);
};

export const getPaperSize = async (): Promise<"58" | "80"> => {
  const saved = await AsyncStorage.getItem(PAPER_SIZE_KEY);
  return (saved === "80" ? "80" : "58");
};
```

#### Step 2: Create 80mm Template
```typescript
// Copy printBill() and rename to printBill80mm()
// Update column widths: [14, 8, 10] → [22, 10, 8, 8]
// Update dividers: 32 chars → 48 chars
// Update QR size: 240 → 300
```

#### Step 3: Add Auto-Print Function
```typescript
export const printBillAuto = async (bill: any): Promise<void> => {
  const size = await getPaperSize();
  if (size === "80") {
    await printBill80mm(bill);
  } else {
    await printBill(bill);
  }
};
```

#### Step 4: Update Billing Integration
```typescript
// OLD
await printBill(bill);

// NEW
await printBillAuto(bill);
```

#### Step 5: Add UI Selector
```typescript
// Add paper size buttons to printer setup screen
<TouchableOpacity onPress={() => setPaperSize("58")}>
  <Text>58 mm</Text>
</TouchableOpacity>
<TouchableOpacity onPress={() => setPaperSize("80")}>
  <Text>80 mm</Text>
</TouchableOpacity>
```

---

## 📖 Rebuilding from Scratch

### Quick Setup Steps

1. **Install Dependencies**
```bash
npm install @vardrz/react-native-bluetooth-escpos-printer
npm install @react-native-async-storage/async-storage
```

2. **Create printerManager.ts**
- Add `setPaperSize()` and `getPaperSize()` functions
- Use AsyncStorage with key `@printer_paper_size`

3. **Create thermalPrinter.ts**
- Implement `printBill()` for 58mm (32 chars, [14, 8, 10])
- Implement `printBill80mm()` for 80mm (48 chars, [22, 10, 8, 8])
- Implement `printBillAuto()` to route based on saved size

4. **Create Printer Setup UI**
- Add paper size selector (58mm / 80mm buttons)
- Save selection immediately on click
- Show current selection visually

5. **Integrate with Billing**
- Call `printBillAuto(bill)` after checkout
- Paper size is automatically applied

---

## 🎉 Summary

This implementation provides:
- ✅ Flexible support for both 58mm and 80mm thermal paper
- ✅ Persistent user preference across app sessions
- ✅ Automatic template selection for printing
- ✅ Optimized layouts for each paper size
- ✅ Easy testing with `printTestBill()`
- ✅ Graceful handling of edge cases
- ✅ Simple migration path for existing implementations

The key insight is **separation of concerns**:
- Storage layer (`printerManager.ts`) handles preferences
- Print layer (`thermalPrinter.ts`) handles formatting
- UI layer (`PrintTest.tsx`) handles user interaction
- Auto-routing (`printBillAuto`) ties everything together

---

**Created for Store Saathi App**  
Last Updated: June 6, 2026
