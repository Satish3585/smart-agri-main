# app.py
from flask import Flask, redirect, render_template, request, flash, url_for, session
from markupsafe import Markup

from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from dotenv import load_dotenv
import numpy as np
import pandas as pd
from utils.disease import disease_dic
from utils.fertilizer import fertilizer_dic
import requests
import config
from config import config as app_config
from models import db, User
import pickle
import io
import torch
from torchvision import transforms
from PIL import Image
from utils.model import ResNet9
from datetime import datetime
import os

# Load environment variables
load_dotenv()

# Disease Classes
disease_classes = [
    'Apple___Apple_scab', 'Apple___Black_rot', 'Apple___Cedar_apple_rust', 'Apple___healthy',
    'Blueberry___healthy', 'Cherry_(including_sour)___Powdery_mildew', 'Cherry_(including_sour)___healthy',
    'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot', 'Corn_(maize)___Common_rust_',
    'Corn_(maize)___Northern_Leaf_Blight', 'Corn_(maize)___healthy', 'Grape___Black_rot',
    'Grape___Esca_(Black_Measles)', 'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)', 'Grape___healthy',
    'Orange___Haunglongbing_(Citrus_greening)', 'Peach___Bacterial_spot', 'Peach___healthy',
    'Pepper,_bell___Bacterial_spot', 'Pepper,_bell___healthy', 'Potato___Early_blight', 'Potato___Late_blight',
    'Potato___healthy', 'Raspberry___healthy', 'Soybean___healthy', 'Squash___Powdery_mildew',
    'Strawberry___Leaf_scorch', 'Strawberry___healthy', 'Tomato___Bacterial_spot', 'Tomato___Early_blight',
    'Tomato___Late_blight', 'Tomato___Leaf_Mold', 'Tomato___Septoria_leaf_spot',
    'Tomato___Spider_mites Two-spotted_spider_mite', 'Tomato___Target_Spot',
    'Tomato___Tomato_Yellow_Leaf_Curl_Virus', 'Tomato___Tomato_mosaic_virus', 'Tomato___healthy'
]

# Load models
disease_model_path = 'models/plant_disease_model.pth'
disease_model = ResNet9(3, len(disease_classes))
disease_model.load_state_dict(torch.load(disease_model_path, map_location=torch.device('cpu')))
disease_model.eval()

crop_recommendation_model_path = 'models/RandomForest.pkl'
crop_recommendation_model = pickle.load(open(crop_recommendation_model_path, 'rb'))

# Minimum values
CROP_MINIMUMS = {'N': 0, 'P': 0, 'K': 0, 'ph': 0.0, 'rainfall': 0}
AGRONOMIC_MINIMUMS = {'N': 240, 'P': 11, 'K': 110, 'ph': 6.0, 'rainfall': 500}
FERTILIZER_MINIMUMS = {'N': 0, 'P': 0, 'K': 0}
AGRONOMIC_MAXIMUMS = {'N': 240, 'P': 200, 'K': 200, 'ph': 10.0, 'rainfall': 500}

# Create Flask app
app = Flask(__name__)

# Load configuration
env = os.environ.get('FLASK_ENV', 'development')
app.config.from_object(app_config[env])

# Initialize extensions
db.init_app(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Please log in to access this page.'
login_manager.login_message_category = 'info'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Create database tables
with app.app_context():
    try:
        db.create_all()
        print("✓ Database tables created successfully!")
    except Exception as e:
        print(f"✗ Database connection error: {e}")

# Helper Functions
def weather_fetch(city_name):
    try:
        api_key = config.weather_api_key
        url = f"https://api.weatherapi.com/v1/current.json?key={api_key}&q={city_name}&aqi=no"
        resp = requests.get(url).json()
        if 'error' in resp:
            return None
        temperature = resp['current']['temp_c']
        humidity = resp['current']['humidity']
        return temperature, humidity
    except Exception as e:
        print(f"Weather API Error: {e}")
        return None

def predict_image(img, model=disease_model):
    transform = transforms.Compose([transforms.Resize(256), transforms.ToTensor()])
    image = Image.open(io.BytesIO(img))
    img_t = transform(image)
    img_u = torch.unsqueeze(img_t, 0)
    yb = model(img_u)
    
    # Calculate probabilities using Softmax
    probs = torch.nn.functional.softmax(yb, dim=1)
    max_prob, preds = torch.max(probs, dim=1)
    
    # DEBUG: Print confidence score
    print(f"DEBUG: Prediction: {disease_classes[preds[0].item()]}, Confidence: {max_prob.item():.4f}")
    
    # Confidence Threshold (Increased to 0.8)
    if max_prob.item() < 0.8:
        print("DEBUG: Rejected due to low confidence")
        return None
        
    prediction = disease_classes[preds[0].item()]
    return prediction

# ============ PUBLIC ROUTES ============

@app.route('/')
def home():
    return render_template('index.html', title='Green Grow - Home')

# ============ MODEL DASHBOARD ROUTES ============

@app.route('/dashboard/crop-recommendation-stats')
@login_required
def crop_stats_dashboard():
    return render_template('dashboards/crop_recommendation_stats.html', title='Crop Recommendation Model Statistics')

@app.route('/dashboard/fertilizer-recommendation-stats')
@login_required
def fertilizer_stats_dashboard():
    return render_template('dashboards/fertilizer_recommendation_stats.html', title='Fertilizer Recommendation Model Statistics')

@app.route('/dashboard/disease-prediction-stats')
@login_required
def disease_stats_dashboard():
    return render_template('dashboards/disease_prediction_stats.html', title='Disease Prediction Model Statistics')


# ============ AUTHENTICATION ROUTES ============

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        session.pop('_flashes', None)  # Clear flash messages
        return redirect(url_for('home'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        full_name = request.form.get('full_name')
        phone = request.form.get('phone')
        
        # Validation
        if not all([username, email, password, confirm_password]):
            flash('All fields are required!', 'danger')
            return redirect(url_for('register'))
        
        if password != confirm_password:
            flash('Passwords do not match!', 'danger')
            return redirect(url_for('register'))
        
        if len(password) < 6:
            flash('Password must be at least 6 characters long!', 'danger')
            return redirect(url_for('register'))
        
        # Check if user exists
        if User.query.filter_by(username=username).first():
            flash('Username already exists!', 'danger')
            return redirect(url_for('register'))
        
        if User.query.filter_by(email=email).first():
            flash('Email already registered!', 'danger')
            return redirect(url_for('register'))
        
        # Create new user
        user = User(username=username, email=email, full_name=full_name, phone=phone)
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        flash('Registration successful! Please log in.', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html', title='Register')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        session.pop('_flashes', None)  # Clear flash messages
        return redirect(url_for('home'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        remember = request.form.get('remember', False)
        
        if not username or not password:
            flash('Please provide both username and password!', 'danger')
            return redirect(url_for('login'))
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            login_user(user, remember=remember)
            user.last_login = datetime.utcnow()
            db.session.commit()
            
            flash(f'Welcome back, {user.full_name or user.username}!', 'success')
            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('home'))
        else:
            flash('Invalid username or password!', 'danger')
            return redirect(url_for('login'))
    
    return render_template('login.html', title='Login')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out successfully!', 'success')
    return redirect(url_for('home'))

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html', title='Dashboard')

# ============ PROTECTED ROUTES ============

@app.route('/live-market-prices')
@login_required
def live_market_prices():
    return render_template('market-prices.html', title='Live Market Prices')

@app.route('/crop-recommend')
@login_required
def crop_recommend():
    return render_template('crop.html', title='Green Grow - Crop Recommendation')

@app.route('/fertilizer')
@login_required
def fertilizer_recommendation():
    return render_template('fertilizer.html', title='Green Grow - Fertilizer Suggestion')

@app.route('/crop-predict', methods=['POST'])
@login_required
def crop_prediction():
    title = 'Green Grow - Crop Recommendation'
    try:
        form = request.form
        N = int(form.get('nitrogen', "0").strip() or 0)
        P = int(form.get('phosphorous', "0").strip() or 0)
        K = int(form.get('pottasium', "0").strip() or 0)
        ph = float(form.get('ph', "0").strip() or 0)
        rainfall = float(form.get('rainfall', "0").strip() or 0)
        city = form.get("city", "").strip()

        if any([N < 0, P < 0, K < 0, ph < 0, rainfall < 0]):
            error = "Invalid data: Input values cannot be negative."
            return render_template('crop.html', title=title, error=error)

        if all(val == 0 for val in [N, P, K, ph, rainfall]) or not city:
            error = "Invalid data: Please enter proper crop values and city name."
            return render_template('crop.html', title=title, error=error)

        warnings = []
        has_critical_warnings = False
        
        if N <= CROP_MINIMUMS['N'] or N < AGRONOMIC_MINIMUMS['N']:
            if N <= CROP_MINIMUMS['N']:
                has_critical_warnings = True
            warnings.append(f"Nitrogen (N) is {'critically ' if N <= CROP_MINIMUMS['N'] else ''}low ({N} kg/ha)")
        
        if P <= CROP_MINIMUMS['P'] or P < AGRONOMIC_MINIMUMS['P']:
            if P <= CROP_MINIMUMS['P']:
                has_critical_warnings = True
            warnings.append(f"Phosphorous (P) is {'critically ' if P <= CROP_MINIMUMS['P'] else ''}low ({P} kg/ha)")
        
        if K <= CROP_MINIMUMS['K'] or K < AGRONOMIC_MINIMUMS['K']:
            if K <= CROP_MINIMUMS['K']:
                has_critical_warnings = True
            warnings.append(f"Potassium (K) is {'critically ' if K <= CROP_MINIMUMS['K'] else ''}low ({K} kg/ha)")
        
        if ph <= CROP_MINIMUMS['ph'] or ph < AGRONOMIC_MINIMUMS['ph']:
            if ph <= CROP_MINIMUMS['ph']:
                has_critical_warnings = True
            warnings.append(f"Soil pH is {'critically ' if ph <= CROP_MINIMUMS['ph'] else ''}low ({ph})")
        
        if rainfall <= CROP_MINIMUMS['rainfall'] or rainfall < AGRONOMIC_MINIMUMS['rainfall']:
            if rainfall <= CROP_MINIMUMS['rainfall']:
                has_critical_warnings = True
            warnings.append(f"Rainfall is {'critically ' if rainfall <= CROP_MINIMUMS['rainfall'] else ''}low ({rainfall} mm)")
        
        if N > AGRONOMIC_MAXIMUMS['N']:
            warnings.append(f"Nitrogen (N) is too high ({N} kg/ha). Max allowed is {AGRONOMIC_MAXIMUMS['N']} kg/ha")

        if P > AGRONOMIC_MAXIMUMS['P']:
            warnings.append(f"Phosphorous (P) is too high ({P} kg/ha). Max allowed is {AGRONOMIC_MAXIMUMS['P']} kg/ha")

        if K > AGRONOMIC_MAXIMUMS['K']:
            warnings.append(f"Potassium (K) is too high ({K} kg/ha). Max allowed is {AGRONOMIC_MAXIMUMS['K']} kg/ha")

        if ph > AGRONOMIC_MAXIMUMS['ph']:
             warnings.append(f"Soil pH is too high ({ph}). Max allowed is {AGRONOMIC_MAXIMUMS['ph']}")

        if rainfall > AGRONOMIC_MAXIMUMS['rainfall']:
            warnings.append(f"Rainfall is too high ({rainfall} mm). Max allowed is {AGRONOMIC_MAXIMUMS['rainfall']} mm")

        if has_critical_warnings:
            return render_template('crop-warning.html',
                                   warnings=warnings,
                                   title=title,
                                   input_values={'N': N, 'P': P, 'K': K, 'ph': ph, 'rainfall': rainfall, 'city': city})

        weather_data = weather_fetch(city)
        if weather_data is None:
            error = "Could not fetch weather data for the provided city. Please check the city name."
            return render_template('crop.html', title=title, error=error)

        temperature, humidity = weather_data
        data = np.array([[N, P, K, temperature, humidity, ph, rainfall]])
        prediction = crop_recommendation_model.predict(data)[0]

        return render_template('crop-result.html',
                               prediction=prediction,
                               warnings=warnings if warnings else None,
                               title=title)
    except ValueError as ve:
        error = "Invalid input: Please enter valid numeric values."
        return render_template('crop.html', title=title, error=error)
    except Exception as e:
        print(f"Crop prediction error: {e}")
        import traceback
        traceback.print_exc()
        return render_template('try_again.html', title=title)

@app.route('/fertilizer-predict', methods=['POST'])
@login_required
def fert_recommend():
    title = 'Green Grow - Fertilizer Suggestion'
    try:
        form = request.form
        crop_name = str(form.get('cropname', '')).strip()
        N = int(form.get('nitrogen', '0').strip() or 0)
        P = int(form.get('phosphorous', '0').strip() or 0)
        K = int(form.get('pottasium', '0').strip() or 0)

        errors = []
        if not crop_name or crop_name == '':
            errors.append("Crop name is required")
        if N < 0:
            errors.append("Nitrogen cannot be negative")
        if P < 0:
            errors.append("Phosphorous cannot be negative")
        if K < 0:
            errors.append("Potassium cannot be negative")

        if errors:
            error_txt = "Invalid input: " + ", ".join(errors)
            return render_template('fertilizer.html', title=title, error=error_txt)

        if N == 0 and P == 0 and K == 0:
            error = "Invalid data: All NPK values cannot be zero. Please enter actual soil nutrient levels."
            return render_template('fertilizer.html', title=title, error=error)

        df = pd.read_csv('Data/fertilizer.csv')
        crop_data = df[df['Crop'] == crop_name]
        
        if len(crop_data) == 0:
            error = f"Crop '{crop_name}' not found in database. Please select a valid crop."
            return render_template('fertilizer.html', title=title, error=error)

        nr = crop_data['N'].iloc[0]
        pr = crop_data['P'].iloc[0]
        kr = crop_data['K'].iloc[0]
        
        warnings = []
        has_critical_warnings = False
        
        if N <= 5:
            warnings.append(f"Nitrogen (N) is critically low ({N} kg/ha). Soil testing recommended.")
            if N == 0:
                has_critical_warnings = True
        
        if P <= 5:
            warnings.append(f"Phosphorous (P) is critically low ({P} kg/ha). Soil testing recommended.")
            if P == 0:
                has_critical_warnings = True
        
        if K <= 5:
            warnings.append(f"Potassium (K) is critically low ({K} kg/ha). Soil testing recommended.")
            if K == 0:
                has_critical_warnings = True

        if N > AGRONOMIC_MAXIMUMS['N']:
            warnings.append(f"Nitrogen (N) is too high ({N} kg/ha). Max allowed is {AGRONOMIC_MAXIMUMS['N']} kg/ha")
        
        if P > AGRONOMIC_MAXIMUMS['P']:
            warnings.append(f"Phosphorous (P) is too high ({P} kg/ha). Max allowed is {AGRONOMIC_MAXIMUMS['P']} kg/ha")

        if K > AGRONOMIC_MAXIMUMS['K']:
            warnings.append(f"Potassium (K) is too high ({K} kg/ha). Max allowed is {AGRONOMIC_MAXIMUMS['K']} kg/ha")
        
        if has_critical_warnings:
            return render_template('fertilizer-warning.html',
                                   warnings=warnings,
                                   title=title,
                                   crop_name=crop_name,
                                   input_values={'N': N, 'P': P, 'K': K})
        
        n = nr - N
        p = pr - P
        k = kr - K
        
        temp = {abs(n): "N", abs(p): "P", abs(k): "K"}
        max_value = temp[max(temp.keys())]

        if max_value == "N":
            key = 'NHigh' if n < 0 else "Nlow"
        elif max_value == "P":
            key = 'PHigh' if p < 0 else "Plow"
        else:
            key = 'KHigh' if k < 0 else "Klow"

        response = Markup(str(fertilizer_dic[key]))
        
        return render_template('fertilizer-result.html', 
                               recommendation=response, 
                               title=title,
                               crop_name=crop_name,
                               warnings=warnings if warnings else None)
    except ValueError:
        error = "Invalid input: Please enter valid numeric values."
        return render_template('fertilizer.html', title=title, error=error)
    except Exception as e:
        print(f"Fertilizer recommendation error: {e}")
        import traceback
        traceback.print_exc()
        return render_template('try_again.html', title=title)

@app.route('/disease-predict', methods=['GET', 'POST'])
@login_required
def disease_prediction():
    title = 'Green Grow - Disease Detection'
    if request.method == 'POST':
        if 'file' not in request.files:
            error = "No file uploaded. Please select an image."
            return render_template('disease.html', title=title, error=error)
        
        file = request.files.get('file')
        if not file or file.filename == '':
            error = "No file selected. Please choose an image to upload."
            return render_template('disease.html', title=title, error=error)
        
        try:
            img = file.read()
            prediction = predict_image(img)
            
            if prediction is None:
                error = "Could not detect a plant leaf (Low Confidence). Please upload a clear image of a crop leaf."
                return render_template('disease.html', title=title, error=error)
                
            prediction = Markup(str(disease_dic[prediction]))
            return render_template('disease-result.html', prediction=prediction, title=title)
        except Exception as e:
            print(f"Disease prediction error: {e}")
            import traceback
            traceback.print_exc()
            error = "Error processing image. Please upload a valid plant image."
            return render_template('disease.html', title=title, error=error)
    
    return render_template('disease.html', title=title)

if __name__ == '__main__':
    app.run(debug=True)
