from flask import Flask, render_template, request, jsonify
from transformers import pipeline

app = Flask(__name__)

# Load the pretrained sentiment analysis pipeline from HuggingFace.
# "distilbert-base-uncased-finetuned-sst-2-english" is a small model fine-tuned for sentiment.
sentiment_pipeline = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")

# A small sample dataset for confusion matrix demonstration and accuracy display.
sample_sentences = [
    {"text": "I love this movie, it was amazing!", "label": "positive"},
    {"text": "This is the worst product I have ever used.", "label": "negative"},
    {"text": "I am very happy with the results.", "label": "positive"},
    {"text": "I do not recommend this to anyone.", "label": "negative"},
    
]

# Map model output to sentiment with an optional neutral class.
def normalize_sentiment(prediction):
    label = prediction["label"].lower()
    score = float(prediction["score"])

    # If the model is not confident enough, return neutral.
    if score < 0.60:
        return "neutral", score
    return label, score


def evaluate_sample_data():
    confusion = {"positive": 0, "negative": 0, "neutral": 0}
    correct = 0

    # We use the same normalize_sentiment function to derive predictions.
    for item in sample_sentences:
        result = sentiment_pipeline(item["text"])[0]
        predicted_label, _ = normalize_sentiment(result)

        if predicted_label == item["label"]:
            correct += 1

        # Only count the predicted label for the confusion matrix display.
        confusion[predicted_label] += 1

    accuracy = correct / len(sample_sentences)
    return confusion, accuracy

sample_confusion, sample_accuracy = evaluate_sample_data()


@app.route("/")
def index():
    # Render the UI and pass the sample accuracy and confusion matrix to the template.
    return render_template(
        "index.html",
        sample_accuracy=round(sample_accuracy * 100, 1),
        confusion_matrix=sample_confusion,
    )


@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(force=True)
    text = data.get("text", "").strip()

    if not text:
        return jsonify({"error": "Please enter some text to analyze."}), 400

    prediction = sentiment_pipeline(text)[0]
    sentiment, confidence = normalize_sentiment(prediction)

    return jsonify(
        {
            "sentiment": sentiment,
            "confidence": round(confidence, 3),
            "raw_label": prediction["label"].lower(),
            "raw_score": round(float(prediction["score"]), 3),
        }
    )


if __name__ == "__main__":
    # Run the app in debug mode for local development.
    app.run(debug=True)
