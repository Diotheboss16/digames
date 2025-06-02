document.addEventListener("DOMContentLoaded", () => {
    const API_URL = "https://opentdb.com/api.php?amount=10&type=multiple";
    const questionElement = document.getElementById("question");
    const answersContainer = document.getElementById("answers");
    const nextButton = document.getElementById("next-btn");
    const scoreElement = document.getElementById("score");

    let questions = [];
    let currentQuestionIndex = 0;
    let score = 0;

    async function fetchQuestions() {
        try {
            const response = await fetch(API_URL);
            const data = await response.json();
            questions = data.results;
            showQuestion();
        } catch (error) {
            console.error("Error fetching questions:", error);
        }
    }

    function showQuestion() {
        nextButton.disabled = true;
        const questionData = questions[currentQuestionIndex];
        questionElement.innerHTML = questionData.question;

        const allAnswers = [...questionData.incorrect_answers, questionData.correct_answer];
        allAnswers.sort(() => Math.random() - 0.5); // Randomize answers

        answersContainer.innerHTML = "";
        allAnswers.forEach(answer => {
            const button = document.createElement("button");
            button.textContent = answer;
            button.onclick = () => checkAnswer(answer, questionData.correct_answer);
            answersContainer.appendChild(button);
        });
    }

    function checkAnswer(selected, correct) {
        document.querySelectorAll("button").forEach(btn => {
            btn.disabled = true;
            if (btn.textContent === correct) btn.classList.add("correct");
            if (btn.textContent === selected && selected !== correct) btn.classList.add("wrong");
        });

        if (selected === correct) {
            score++;
            scoreElement.textContent = `Score: ${score}`;
        }

        nextButton.disabled = false;
    }

    nextButton.onclick = () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            showQuestion();
        } else {
            questionElement.textContent = "Game Over! Your final score: " + score;
            answersContainer.innerHTML = "";
            nextButton.style.display = "none";
        }
    };

    fetchQuestions();
});
