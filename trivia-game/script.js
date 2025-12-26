document.addEventListener("DOMContentLoaded", () => {
    const questionElement = document.getElementById("question");
    const answersContainer = document.getElementById("answers");
    const scoreElement = document.getElementById("score");
    const nextButton = document.getElementById("next-btn");
    const startButton = document.getElementById("start-btn");
    const categorySelect = document.getElementById("category");
    const difficultySelect = document.getElementById("difficulty");
    const endScreen = document.getElementById("end-screen");
    const summaryEl = document.getElementById("summary");
    const restartButton = document.getElementById("restart-btn");
    const quitButton = document.getElementById("quit-btn");

    let questions = [];
    let currentQuestionIndex = 0;
    let score = 0;

    function setInGame(inGame) {
        startButton.disabled = inGame;
        categorySelect.disabled = inGame;
        difficultySelect.disabled = inGame;
    }

    function resetToMenu(message = "Press Start Trivia to begin!") {
        questions = [];
        currentQuestionIndex = 0;
        score = 0;
        scoreElement.textContent = `Score: ${score}`;
        questionElement.textContent = message;
        answersContainer.innerHTML = "";
        nextButton.disabled = true;
        nextButton.style.display = "none";
        endScreen.classList.add("hidden");
        setInGame(false);
    }

    async function fetchQuestions() {
        const category = categorySelect.value;
        const difficulty = difficultySelect.value;
        const API_URL = `https://opentdb.com/api.php?amount=10&category=${category}&difficulty=${difficulty}&type=multiple`;

        try {
            setInGame(true);
            endScreen.classList.add("hidden");
            nextButton.style.display = "block";
            nextButton.disabled = true;
            questionElement.textContent = "Loading...";
            answersContainer.innerHTML = "";

            const response = await fetch(API_URL);
            const data = await response.json();

            questions = data.results || [];
            currentQuestionIndex = 0;
            score = 0;
            scoreElement.textContent = `Score: ${score}`;

            if (questions.length === 0) {
                resetToMenu("No questions returned. Try a different category/difficulty.");
                return;
            }

            showQuestion();
        } catch (error) {
            console.error("Error fetching questions:", error);
            resetToMenu("Failed to load questions. Please try again.");
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
        answersContainer.querySelectorAll("button").forEach(btn => {
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

    function showGameOver() {
        const total = questions.length;
        questionElement.textContent = "Game Over!";
        answersContainer.innerHTML = "";
        nextButton.style.display = "none";
        summaryEl.textContent = `You got ${score} out of ${total} correct.`;
        endScreen.classList.remove("hidden");
        setInGame(false);
    }

    nextButton.onclick = () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            showQuestion();
        } else {
            showGameOver();
        }
    };

    restartButton.onclick = fetchQuestions;
    quitButton.onclick = () => resetToMenu("Thanks for playing!");
    startButton.onclick = fetchQuestions;

    resetToMenu();
});
