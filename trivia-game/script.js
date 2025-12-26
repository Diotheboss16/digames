document.addEventListener("DOMContentLoaded", () => {
    const questionElement = document.getElementById("question");
    const answersContainer = document.getElementById("answers");
    const scoreElement = document.getElementById("score");
    const nextButton = document.getElementById("next-btn");
    const startButton = document.getElementById("start-btn");
    const categorySelect = document.getElementById("category");
    const difficultySelect = document.getElementById("difficulty");
    const amountInput = document.getElementById("amount");
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
        amountInput.disabled = inGame;
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

    async function loadCategories() {
        try {
            const response = await fetch("https://opentdb.com/api_category.php");
            const data = await response.json();
            const categories = data.trivia_categories;

            if (!Array.isArray(categories) || categories.length === 0) return;

            const previous = categorySelect.value;
            categorySelect.innerHTML = "";

            categories.forEach(({ id, name }) => {
                const opt = document.createElement("option");
                opt.value = String(id);
                opt.textContent = name;
                categorySelect.appendChild(opt);
            });

            if (previous && categorySelect.querySelector(`option[value="${CSS.escape(previous)}"]`)) {
                categorySelect.value = previous;
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    }

    async function fetchQuestions() {
        const category = categorySelect.value;
        const difficulty = difficultySelect.value;

        let amount = parseInt(amountInput.value, 10);
        if (!Number.isFinite(amount) || amount < 1) amount = 10;
        if (amount > 50) amount = 50;
        amountInput.value = String(amount);

        const API_URL = `https://opentdb.com/api.php?amount=${amount}&category=${category}&difficulty=${difficulty}&type=multiple`;

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

    function playSound(type) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;

        const ctx = new AudioCtx();
        const o = ctx.createOscillator();
        const g = ctx.createGain();

        o.type = "sine";
        o.frequency.value = type === "correct" ? 880 : 220;

        const now = ctx.currentTime;
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

        o.connect(g);
        g.connect(ctx.destination);

        o.start(now);
        o.stop(now + 0.2);
        o.onended = () => ctx.close();
    }

    function checkAnswer(selected, correct) {
        const isCorrect = selected === correct;

        answersContainer.querySelectorAll("button").forEach(btn => {
            btn.disabled = true;
            if (btn.textContent === correct) btn.classList.add("correct");
            if (btn.textContent === selected && !isCorrect) btn.classList.add("wrong");
        });

        playSound(isCorrect ? "correct" : "wrong");

        if (isCorrect) {
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

    loadCategories();
    resetToMenu();
});
