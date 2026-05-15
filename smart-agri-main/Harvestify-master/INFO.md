# Project Demonstration Preparation Notes

## 1. Crop Recommendation System

### **Goal**
To recommend the most suitable crop for cultivation based on soil composition and weather conditions.

### **Data**
*   **Source:** `crop-recommendation.csv`
*   **Features (Inputs):**
    1.  **N** - Ratio of Nitrogen content in soil
    2.  **P** - Ratio of Phosphorous content in soil
    3.  **K** - Ratio of Potassium content in soil
    4.  **Temperature** - Temperature in degree Celsius (Fetched via Weather API)
    5.  **Humidity** - Relative humidity in % (Fetched via Weather API)
    6.  **pH** - pH value of the soil
    7.  **Rainfall** - Rainfall in mm
*   **Target (Output):** Crop Name
*   **Crops Supported (22 Types):**
    *   *Grains:* Rice, Maize
    *   *Pulses:* Chickpea, Kidneybeans, Pigeonpeas, Mothbeans, Mungbean, Blackgram, Lentil
    *   *Fruits:* Pomegranate, Banana, Mango, Grapes, Watermelon, Muskmelon, Apple, Orange, Papaya, Coconut
    *   *Fibers/Others:* Cotton, Jute, Coffee

### **Dataset Statistics (Min/Max Values)**
Understanding the range of data values is crucial for input validation and demonstrating the model's capabilities.
*   **N (Nitrogen):** Min = 0.0, Max = 140.0
*   **P (Phosphorous):** Min = 5.0, Max = 145.0
*   **K (Potassium):** Min = 5.0, Max = 205.0
*   **Temperature:** Min = 8.83°C, Max = 43.68°C
*   **Humidity:** Min = 14.26%, Max = 99.98%
*   **pH:** Min = 3.50, Max = 9.94
*   **Rainfall:** Min = 20.21 mm, Max = 298.56 mm

### **Models Evaluated**
The following algorithms were tested with their respective accuracies:
1.  **Decision Tree:** ~90.0%
2.  **Logistic Regression:** ~95.22%
3.  **Support Vector Machine (SVM):** ~97.95%
4.  **Gaussian Naive Bayes:** ~99.05%
5.  **Random Forest:** ~99.09%
6.  **XGBoost:** ~99.03%

### **Selected Model: Random Forest**
*   **File:** `models/RandomForest.pkl`
*   **Why Random Forest?**
    *   **High Accuracy:** It achieved 99.09% accuracy, which is excellent and on par with the best performing models.
    *   **Robustness:** Random Forest is an ensemble learning method (Bagging). It builds multiple decision trees and merges them together to get a more accurate and stable prediction. It reduces the risk of overfitting compared to a single Decision Tree.
    *   **Stability:** It handles non-linear relationships between features (like soil nutrients and weather) very well.

---

## 2. Plant Disease Detection System

### **Goal**
To detect plant diseases from leaf images and identify the specific disease type.

### **Data**
*   **Source:** The dataset is derived from the **PlantVillage Dataset** (originally from **Pennsylvania State University**).

*   **Size:** ~87,000 RGB images
*   **Classes:** 38 Total Classes (spanning 14 unique plant species)
    *   **Plants:** Apple, Blueberry, Cherry, Corn (Maize), Grape, Orange, Peach, Pepper (Bell), Potato, Raspberry, Soybean, Squash, Strawberry, Tomato.
    *   **Conditions:** Includes healthy leaves and various diseases (e.g., Late Blight, Early Blight, Powdery Mildew, Bacterial Spot, etc.).

### **Model Architecture: ResNet-9**
*   **File:** `models/plant_disease_model.pth` (Architecture defined in `app/utils/model.py`)
*   **Framework:** PyTorch
*   **Specific Architecture Details:**
    The model is a custom 9-layer Residual Network constructed as follows:
    1.  **Conv1:** Convolution (64 filters) + BatchNorm + ReLU
    2.  **Conv2:** Convolution (128 filters) + BatchNorm + ReLU + **MaxPool (4x4)**
    3.  **Res1:** Residual Block (Input + [Conv(128) -> Conv(128)])
    4.  **Conv3:** Convolution (256 filters) + BatchNorm + ReLU + **MaxPool (4x4)**
    5.  **Conv4:** Convolution (512 filters) + BatchNorm + ReLU + **MaxPool (4x4)**
    6.  **Res2:** Residual Block (Input + [Conv(512) -> Conv(512)])
    7.  **Classifier:** MaxPool (4x4) -> Flatten -> Fully Connected Layer (512 -> 38 classes)
*   **Key Features:**
    *   **Residual Connections:** The `res1` and `res2` blocks add the input back to the output (`out = block(out) + out`), allowing the model to learn identity functions and preventing gradient degradation.
    *   **Aggressive Pooling:** Uses 4x4 MaxPooling in multiple stages to rapidly reduce spatial dimensions, making the model very lightweight.
    *   **Batch Normalization:** Applied after every convolution to stabilize training and accelerate convergence.


---

## 3. System Limitations

Transparency about the system's capabilities and constraints is essential.

### **General System**
*   **Internet Dependency:** The system relies on an active internet connection to fetch real-time weather data (temperature and humidity) from the external Weather API. Without this, manual input is required (if supported) or the feature may fail.
*   **Deployment:** Currently running on a local development server (`Flask`). For production use, it would need a robust WSGI server (like Gunicorn) and a proper database host.

### **Crop Recommendation Module**
*   **Static Data:** The recommendation is based on a static dataset (`crop_recommendation.csv`). It does not dynamically account for:
    *   Changing soil conditions over time without new soil tests.
    *   Localized pest outbreaks or disease prevalence in the specific region.
    *   Market demand or economic factors (prices).
*   **Geographic Scope:** The training data is largely consistent with Indian agricultural conditions. Predictions might be less accurate for regions with vastly different climatic or soil profiles.

### **Disease Detection Module**
*   **Confidence Threshold (80%):**
    *   To prevent false positives, we have implemented a strict **confidence threshold of 80%** (0.8).
    *   If the model's highest predicted probability for a class is below this threshold, the system will reject the image and prompt the user to upload a clearer one. This helps avoid classifying random non-plant images as diseases.
*   **Domain Shift:** The model was trained on **PlantVillage** images, which are mostly taken in controlled environments with simple backgrounds.
    *   **Limitation:** Real-world field images with complex backgrounds (soil, weeds, hands), shadowing, or poor lighting may reduce accurate detection.
*   **Limited Classes:** It can only detect the **38 specific classes** it was trained on. A disease not in this list will either be misclassified or rejected due to low confidence.

### **Fertilizer Logic**
*   **Rule-Based:** The fertilizer recommendation is a logical calculation (Target NPK - Current NPK), not a machine learning model. It provides standard recommendations but doesn't account for slow-release fertilizers or organic alternatives dynamically.

---

## 4. Future Scope

*   **Mobile Application:** Developing a React Native or Flutter app for easier field access.
*   **Real-time Community:** Adding a forum for farmers to share issues and solutions.
*   **Market Integration:** Integrating real-time 'Mandi' (market) prices to help farmers decide *when* to sell, not just *what* to grow.
*   **Advanced Computer Vision:** Implementing object detection (like YOLO) to identify multiple diseases on a single leaf or whole plant, rather than just classification of a single leaf.


