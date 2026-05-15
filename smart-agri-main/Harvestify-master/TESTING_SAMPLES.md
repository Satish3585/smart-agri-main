# Testing Samples for Validation Logic

Based on the current configuration in `app.py`, here are test cases to verify the validation warnings.

**Current Limits:**
- **Nitrogen (N)**: Min 24 | Max 240
- **Phosphorous (P)**: Min 11 | Max 200
- **Potassium (K)**: Min 110 | Max 200
- **pH**: Min 6.0 | Max 10.0
- **Rainfall**: Min 500 | Max 500

---

## 1. Valid Logic Test (No Warnings)
**Scenario**: Entering values that satisfy all defined standards.
*Note: Due to strict overlapping limits for N and Rainfall, exact values are needed.*

- **Nitrogen**: 240
- **Phosphorous**: 50
- **Potassium**: 150
- **pH**: 7.0
- **Rainfall**: 500
- **City**: Mumbai

**Expected Result**: Successful prediction with **NO** warnings.

---

## 2. "Too High" Warning Test
**Scenario**: Entering values slightly above the maximums you defined.

- **Nitrogen**: 250  *(> 240)*
- **Phosphorous**: 210 *(> 200)*
- **Potassium**: 210 *(> 200)*
- **pH**: 10.5     *(> 10.0)*
- **Rainfall**: 550  *(> 500)*
- **City**: Mumbai

**Expected Result**: Prediction displayed, but with **"Too High" warnings** for all fields.

---

## 3. "Low" Warning Test
**Scenario**: Entering values below the agronomic minimums (existing logic).

- **Nitrogen**: 100   *(< 240)*
- **Phosphorous**: 5  *(< 11)*
- **Potassium**: 50   *(< 110)*
- **pH**: 5.0       *(< 6.0)*
- **Rainfall**: 300   *(< 500)*
- **City**: Mumbai

**Expected Result**: Prediction displayed, with **"Low" or "Critically Low" warnings** for all fields.

---

## 4. Fertilizer Recommendation Test
**Scenario**: Testing the same logic on the Fertilizer page.

**Input:**
- **Crop**: Rice
- **Nitrogen**: 250
- **Phosphorous**: 210
- **Potassium**: 210

**Expected Result**: **"Too High" warnings** for N, P, and K.
