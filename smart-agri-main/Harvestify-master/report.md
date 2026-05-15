# Project Report

## NPK Values and Validation Ranges

The application implements specific validation rules and agronomic standards to ensure data integrity for crop prediction.

### Validation Logic
The system enforces the following constraints on input data:
- **Non-Negative Constraint**: Inputs for Nitrogen (N), Phosphorous (P), Potassium (K), pH, and Rainfall cannot be negative (< 0).
- **Non-Zero Constraint**: It is invalid for *all* input values (N, P, K, pH, Rainfall) to be zero simultaneously.

### Standard Agronomic Ranges
The application compares input values against standard agronomic minimums. Warnings are issued if values fall below these thresholds:

| Parameter | Minimum Standard | Unit | Critical Low Threshold |
| :--- | :--- | :--- | :--- |
| **Nitrogen (N)** | 240 | kg/ha | ≤ 0 |
| **Phosphorous (P)** | 200  | kg/ha | ≤ 0 |
| **Potassium (K)** | 200 | kg/ha | ≤ 0 |
| **pH** | 10.0 | - | ≤ 0.0 |
| **Rainfall** | 500 | mm | ≤ 0 |



### Dataset Statistics (`crop_recommendation.csv`)
The following table shows the range of values present in the training dataset used for the crop recommendation model.

| Column | Min | Max |
| :--- | :--- | :--- |
| **N** (Nitrogen) | 0 | 140 |
| **P** (Phosphorus) | 5 | 145 |
| **K** (Potassium) | 5 | 205 |
| **Temperature** | 8.83 | 43.68 |
| **Humidity** | 14.26 | 99.98 |
| **pH** | 3.50 | 9.94 |
| **Rainfall** | 20.21 | 298.56 |

## Project Limitations

1.  **Dataset Specificity:** The crop recommendation model is trained on a specific dataset (`crop_recommendation.csv`) relevant to Indian agriculture. Its accuracy might decrease for other geographical regions with different soil types or climatic conditions.
2.  **Disease Model Scope:** The disease detection model can identify 38 specific classes. It employs an **80% confidence threshold** to filter out uncertain predictions, meaning it may reject valid but unclear images or images of diseases it hasn't been trained on.
3.  **Controlled Environment:** The disease model was trained on the `PlantVillage` dataset (lab setting). Its performance may be affected by real-world conditions like complex backgrounds or poor lighting.
4.  **Weather Dependency:** Real-time recommendations depend on the Weather API. Connectivity issues may revert the system to manual input modes or limit functionality.

