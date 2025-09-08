# train_safety_model.py
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
import joblib
import os

# ---------- CONFIG ----------
CSV_PATH = "./datasets/india_tourist_safety_100.csv"
MODEL_DIR = "models"
os.makedirs(MODEL_DIR, exist_ok=True)

# ---------- Load data ----------
df = pd.read_csv(CSV_PATH)

# ---------- Basic cleaning (ensure types) ----------
# Ensure status values are lowercase
df['status'] = df['status'].str.lower().map({'safe': 0, 'risk': 1})
if df['status'].isnull().any():
    raise ValueError("Target column 'status' contains values other than 'safe'/'risk'.")

# ---------- Feature engineering ----------
# 1) time_over_avg: how much current_spent_time exceeds avg (negative means under)
df['time_over_avg'] = df['current_spent_time'] - df['avg_safe_time']

# 2) relative_time_ratio: ratio current / avg (useful scale-invariant feature)
df['time_ratio'] = df['current_spent_time'] / (df['avg_safe_time'] + 1e-6)

# 3) latitude and longitude are left as numeric features (for spatial patterns)
# 4) short category encoding using LabelEncoder (save encoder for later)
cat_col = 'category'
le_cat = LabelEncoder()
df['cat_encoded'] = le_cat.fit_transform(df[cat_col].astype(str))

# 5) optional: create simple boolean flag if time exceeds avg
df['exceeds_avg'] = (df['current_spent_time'] > df['avg_safe_time']).astype(int)

# Final feature list
FEATURES = [
    'latitude',
    'longitude',
    'avg_safe_time',
    'current_spent_time',
    'time_over_avg',
    'time_ratio',
    'exceeds_avg',
    'cat_encoded'
]

X = df[FEATURES].values
y = df['status'].values   # 0 = safe, 1 = risk

# ---------- Train/test split ----------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)

# ---------- Model training ----------
# You can skip GridSearch for speed; but an example grid is provided and commented.
rf = RandomForestClassifier(
    n_estimators=200,
    max_depth=6,
    min_samples_leaf=3,
    random_state=42,
    n_jobs=-1
)

# Optionally tune hyperparams (uncomment to run; will increase runtime)
# param_grid = {
#     "n_estimators": [100, 200],
#     "max_depth": [4, 6, 8],
#     "min_samples_leaf": [1, 3, 5]
# }
# grid = GridSearchCV(rf, param_grid, cv=3, scoring='f1', n_jobs=-1)
# grid.fit(X_train, y_train)
# model = grid.best_estimator_
# print("Best params:", grid.best_params_)

rf.fit(X_train, y_train)
model = rf

# ---------- Evaluation ----------
y_pred = model.predict(X_test)
y_prob = None
try:
    y_prob = model.predict_proba(X_test)[:, 1]
except Exception:
    pass

print("\nClassification report (test):")
print(classification_report(y_test, y_pred, target_names=['safe','risk']))

print("Confusion matrix (test):")
print(confusion_matrix(y_test, y_pred))

if y_prob is not None and len(np.unique(y_test)) == 2:
    try:
        auc = roc_auc_score(y_test, y_prob)
        print("ROC AUC (test):", round(auc, 4))
    except Exception:
        pass

# Print feature importances
importances = model.feature_importances_
for f, imp in zip(FEATURES, importances):
    print(f"{f:20s}: {imp:.4f}")

# ---------- Save model + metadata ----------
model_bundle = {
    'model': model,
    'features': FEATURES,
    'label_encoder_category': le_cat,
    'meta': {
        'source_csv': CSV_PATH
    }
}
model_path = os.path.join(MODEL_DIR, "tourist_safety_rf_v1.joblib")
joblib.dump(model_bundle, model_path)
print("\nSaved model bundle to:", model_path)

# ---------- Helper: single-record predict function ----------
def predict_single(record_dict, model_bundle_path=model_path):
    """
    record_dict should contain:
      - latitude, longitude, avg_safe_time, current_spent_time, category (string)
    returns: dict with predicted_label ('safe'/'risk'), probability (risk prob), used_features
    """
    bundle = joblib.load(model_bundle_path)
    model = bundle['model']
    FEATURES = bundle['features']
    le_cat = bundle['label_encoder_category']

    # Build features in same order
    lat = float(record_dict['latitude'])
    lon = float(record_dict['longitude'])
    avg_t = float(record_dict['avg_safe_time'])
    cur_t = float(record_dict['current_spent_time'])
    cat_raw = str(record_dict['category'])

    time_over_avg = cur_t - avg_t
    time_ratio = cur_t / (avg_t + 1e-6)
    exceeds_avg = 1 if cur_t > avg_t else 0
    # encode category (if unseen, use -1)
    try:
        cat_encoded = int(le_cat.transform([cat_raw])[0])
    except Exception:
        # unseen category -> append a simple fallback (max+1)
        cat_encoded = max(le_cat.transform(le_cat.classes_)) + 1 if len(le_cat.classes_)>0 else 0

    feat_arr = np.array([[
        lat, lon, avg_t, cur_t, time_over_avg, time_ratio, exceeds_avg, cat_encoded
    ]])
    proba = None
    try:
        proba = model.predict_proba(feat_arr)[0, 1]
    except Exception:
        proba = None
    pred = model.predict(feat_arr)[0]
    return {
        'pred_label': 'risk' if pred == 1 else 'safe',
        'risk_probability': float(proba) if proba is not None else None,
        'features': dict(zip(FEATURES, feat_arr.flatten().tolist()))
    }

# ---------- Example usage ----------
example = {
    'latitude': 28.6129,
    'longitude': 77.2295,
    'avg_safe_time': 1.5,
    'current_spent_time': 2.2,
    'category': 'attraction'
}
print("\nExample prediction for India Gate-like record:")
print(predict_single(example, model_path))
