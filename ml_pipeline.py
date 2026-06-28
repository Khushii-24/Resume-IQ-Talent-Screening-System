# ml_pipeline.py
# Core ML functions — imported by FastAPI in Week 2

import joblib
import numpy as np
import pandas as pd
import spacy
from sklearn.metrics.pairwise import cosine_similarity
from shap import TreeExplainer

# Load models once at module level (not on every request)
xgb_model = joblib.load('model_xgb.pkl')
vectorizer = joblib.load('tfidf_vectorizer.pkl')
encoder = joblib.load('label_encoder.pkl')
nlp = spacy.load("en_core_web_sm")
explainer = TreeExplainer(xgb_model)

def clean_resume(text):
    doc = nlp(text.lower())
    return " ".join([
        token.lemma_ for token in doc
        if not token.is_stop and not token.is_punct and token.is_alpha
    ])

def predict_resume(resume_text, top_n_shap=10):
    cleaned = clean_resume(resume_text)

    # Dense vector for XGBoost + SHAP
    vector = vectorizer.transform([cleaned]).toarray()
    print("=" * 60)
    print("Vector sum:", np.sum(vector))
    print("Non-zero features:", np.count_nonzero(vector))
    print("First 20 values:", vector[0][:20])
    print("=" * 60)
    
    pred_num = int(xgb_model.predict(vector)[0])
    pred_label = encoder.inverse_transform([pred_num])[0]

    confidence = float(
        xgb_model.predict_proba(vector)[0][pred_num]
    )
    probs = xgb_model.predict_proba(vector)[0]

    top5 = np.argsort(probs)[::-1][:5]
    
    print("\nTop 5 Predictions")
    print("-" * 40)
    for idx in top5:
        print(
            f"{encoder.inverse_transform([idx])[0]:25} {probs[idx]:.4f}"
        )
    print("-" * 40)
    # -------- SHAP --------
    shap_exp = explainer(vector)

    # Your SHAP shape is (1, 1500, 25)
    shap_arr = shap_exp.values

    class_shap = shap_arr[0, :, pred_num]

    feature_names = np.array(vectorizer.get_feature_names_out())

    word_shap = pd.DataFrame({
        "word": feature_names,
        "shap_value": class_shap
    })

    # Sort by absolute contribution
    word_shap = word_shap.loc[
        word_shap["shap_value"].abs().sort_values(ascending=False).index
    ].reset_index(drop=True)

    return {
        "predicted_category": pred_label,
        "confidence": round(confidence, 4),
        "top_words": word_shap.head(top_n_shap).to_dict(orient="records")
    }

def screen_candidates(job_description, candidates, top_n=10):
    """
    candidates: list of dicts with 'name' and 'text'
    returns: ranked list with similarity + prediction + shap
    """
    cleaned_jd = clean_resume(job_description)
    jd_vector = vectorizer.transform([cleaned_jd])
    
    results = []
    for candidate in candidates:
        prediction = predict_resume(candidate['text'])
        
        cleaned_resume = clean_resume(candidate['text'])
        resume_vector = vectorizer.transform([cleaned_resume])
        similarity = float(cosine_similarity(jd_vector, resume_vector)[0][0])
        
        results.append({
            "name": candidate['name'],
            "similarity_score": round(similarity, 4),
            **prediction
        })
    
    return sorted(results, key=lambda x: x['similarity_score'], reverse=True)[:top_n]