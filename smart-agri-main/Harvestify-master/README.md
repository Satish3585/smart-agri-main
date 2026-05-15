# Harvestify 🌾
### Smart Farming Solution using Machine Learning & Deep Learning

Harvestify is a comprehensive web application designed to assist farmers in making informed decisions. It leverages the power of Machine Learning and Deep Learning to recommend the best crops, suggest appropriate fertilizers, and detect plant diseases from leaf images.

## 🚀 Key Features

### 1. Crop Recommendation 🌱
*   **Goal:** Suggests the most suitable crop to grow based on soil and weather conditions.
*   **Inputs:** Nitrogen (N), Phosphorous (P), Potassium (K), pH level, and location (City).
*   **Technology:** Uses a **Random Forest** algorithm (99% accuracy).
*   **Smart Integration:** Automatically fetches real-time **Temperature** and **Humidity** for the given location using a Weather API.

### 2. Fertilizer Recommendation 🧪
*   **Goal:** Recommends the right fertilizer to boost soil health.
*   **Inputs:** Soil nutrient levels (N, P, K) and the crop you intend to grow.
*   **Technology:** Rule-based system based on agricultural standards.
*   **Output:** Suggests specific fertilizers (e.g., Urea, DAP) to correct nutrient imbalances.

### 3. Plant Disease Detection 🍃
*   **Goal:** Identifies plant diseases from images and provides treatment suggestions.
*   **Inputs:** Image of a plant leaf.
*   **Technology:** **ResNet-9** (Deep Learning CNN) built with PyTorch.
*   **Capabilities:** Detects 38 different classes of diseases across 14 plant species (e.g., Apple, Tomato, Potato).

---

## 🛠️ Tech Stack

*   **Frontend:** HTML, CSS, JavaScript, Bootstrap
*   **Backend:** Flask (Python)
*   **Machine Learning:** Scikit-learn, Pandas, NumPy
*   **Deep Learning:** PyTorch
*   **Database:** SQLite (for user authentication)
*   **API:** OpenWeatherMap API

---

## 💻 How to Run Locally

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/Gladiator07/Harvestify.git
    cd Harvestify
    ```

2.  **Create a Virtual Environment (Optional but Recommended)**
    ```bash
    python -m venv venv
    # Windows
    venv\Scripts\activate
    # Mac/Linux
    source venv/bin/activate
    ```

3.  **Install Dependencies**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Run the Application**
    ```bash
    python app.py
    ```

5.  **Access the App**
    Open your browser and go to `http://localhost:5000`

---



