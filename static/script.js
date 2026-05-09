const analyzeButton = document.getElementById("analyzeButton");
const userText = document.getElementById("userText");
const message = document.getElementById("message");
const resultCard = document.getElementById("resultCard");
const sentimentLabel = document.getElementById("sentimentLabel");
const confidenceLabel = document.getElementById("confidenceLabel");
const historyList = document.getElementById("historyList");
const chartCanvas = document.getElementById("confidenceChart");
let confidenceChart = null;
let history = [];

function showMessage(text) {
    message.textContent = text;
}

function clearMessage() {
    message.textContent = "";
}

function renderHistory() {
    historyList.innerHTML = "";

    if (history.length === 0) {
        historyList.innerHTML = "<li>No history yet.</li>";
        return;
    }

    history.slice().reverse().forEach((item) => {
        const li = document.createElement("li");
        li.innerHTML = `
            <strong>${item.sentiment}</strong> (${item.confidence})<br />
            ${item.text}
        `;
        historyList.appendChild(li);
    });
}

function updateChart(prediction) {
    const labels = ["Positive", "Negative", "Neutral"];
    const data = [0, 0, 0];

    if (prediction.sentiment === "positive") {
        data[0] = prediction.confidence;
    } else if (prediction.sentiment === "negative") {
        data[1] = prediction.confidence;
    } else {
        data[2] = prediction.confidence;
    }

    const chartData = {
        labels,
        datasets: [
            {
                label: "Sentiment confidence",
                data,
                backgroundColor: ["#10b981", "#ef4444", "#f59e0b"],
                borderRadius: 8,
            },
        ],
    };

    if (confidenceChart) {
        confidenceChart.data = chartData;
        confidenceChart.update();
        return;
    }

    confidenceChart = new Chart(chartCanvas, {
        type: "bar",
        data: chartData,
        options: {
            responsive: true,
            animation: {
                duration: 400,
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 1,
                },
            },
        },
    });
}

async function analyzeText() {
    clearMessage();
    const text = userText.value.trim();

    if (!text) {
        showMessage("Please enter text before clicking analyze.");
        return;
    }

    analyzeButton.disabled = true;
    analyzeButton.textContent = "Analyzing...";

    try {
        const response = await fetch("/predict", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ text }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            showMessage(errorData.error || "An error occurred.");
            return;
        }

        const data = await response.json();
        resultCard.classList.remove("hidden");
        sentimentLabel.textContent = data.sentiment;
        confidenceLabel.textContent = `${data.confidence}`;

        const prediction = {
            text,
            sentiment: data.sentiment,
            confidence: data.confidence,
        };

        history.push(prediction);
        renderHistory();
        updateChart(prediction);
    } catch (error) {
        showMessage("Unable to reach the server. Make sure the Flask app is running.");
    } finally {
        analyzeButton.disabled = false;
        analyzeButton.textContent = "Analyze Sentiment";
    }
}

analyzeButton.addEventListener("click", analyzeText);
userText.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && event.shiftKey === false) {
        event.preventDefault();
        analyzeText();
    }
});

renderHistory();
