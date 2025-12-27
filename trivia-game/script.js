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
    const ttsEnabledSelect = document.getElementById("tts-enabled");

    let questions = [];
    let currentQuestionIndex = 0;
    let score = 0;

    function htmlToText(html) {
        const div = document.createElement("div");
        div.innerHTML = html;
        return (div.textContent || "").trim();
    }

    function stopTTS() {
        if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    }

    let ttsPrimed = false;
    let pendingSpeechText = null;

    // Edge sometimes won’t speak until voices are loaded and speech starts from a user gesture.
    function primeTTS() {
        if (ttsPrimed) return;
        if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;

        // Trigger voice loading without audibly speaking.
        window.speechSynthesis.getVoices();
        ttsPrimed = true;
    }

    function speakText(text) {
        if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
            console.warn("Text-to-speech not supported in this browser.");
            return;
        }

        const synth = window.speechSynthesis;
        const lang = document.documentElement.lang || "en-US";

        const doSpeak = () => {
            stopTTS();
            const utter = new SpeechSynthesisUtterance(text);
            utter.lang = lang;

            const voices = synth.getVoices();
            if (voices && voices.length) {
                const langPrefix = lang.toLowerCase().slice(0, 2);
                utter.voice = voices.find(v => (v.lang || "").toLowerCase().startsWith(langPrefix)) || voices[0];
            }

            synth.speak(utter);
        };

        const voices = synth.getVoices();
        if (voices && voices.length) {
            doSpeak();
            return;
        }

        pendingSpeechText = text;
        synth.onvoiceschanged = () => {
            if (!pendingSpeechText) return;
            const t = pendingSpeechText;
            pendingSpeechText = null;
            doSpeak(t);
        };

        // Fallback in case onvoiceschanged doesn’t fire.
        setTimeout(() => {
            if (!pendingSpeechText) return;
            const t = pendingSpeechText;
            pendingSpeechText = null;
            doSpeak(t);
        }, 250);
    }

    let lastSpoken = null;

    function speakQuestionAndOptions(questionHtml, answersHtml) {
        if (ttsEnabledSelect?.value !== "yes") return;

        const parts = [htmlToText(questionHtml)];
        answersHtml.forEach((ans, i) => {
            const label = String.fromCharCode(65 + i);
            parts.push(`Option ${label}: ${htmlToText(ans)}`);
        });

        speakText(parts.join(". "));
    }

    function setInGame(inGame) {
        startButton.disabled = inGame;
        categorySelect.disabled = inGame;
        difficultySelect.disabled = inGame;
        amountInput.disabled = inGame;
    }

    function resetToMenu(message = "Press Start Trivia to begin!") {
        stopTTS();
        lastSpoken = null;
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

        lastSpoken = { questionHtml: questionData.question, answersHtml: allAnswers };

        answersContainer.innerHTML = "";
        allAnswers.forEach(answer => {
            const button = document.createElement("button");
            button.textContent = htmlToText(answer);
            button.onclick = () => checkAnswer(answer, questionData.correct_answer);
            answersContainer.appendChild(button);
        });

        speakQuestionAndOptions(lastSpoken.questionHtml, lastSpoken.answersHtml);
    }

    let audioCtx;

    function playSound(type) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;

        if (!audioCtx) audioCtx = new AudioCtx();

        // iOS Safari commonly starts AudioContext in "suspended" until a user gesture.
        if (audioCtx.state === "suspended") {
            audioCtx.resume().catch(() => {});
        }

        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();

        o.type = "sine";
        o.frequency.value = type === "correct" ? 880 : 220;

        const now = audioCtx.currentTime;
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

        o.connect(g);
        g.connect(audioCtx.destination);

        o.start(now);
        o.stop(now + 0.2);
    }

    function checkAnswer(selected, correct) {
        const isCorrect = selected === correct;

        const correctText = htmlToText(correct);
        const selectedText = htmlToText(selected);

        answersContainer.querySelectorAll("button").forEach(btn => {
            btn.disabled = true;
            if (btn.textContent === correctText) btn.classList.add("correct");
            if (btn.textContent === selectedText && !isCorrect) btn.classList.add("wrong");
        });

        playSound(isCorrect ? "correct" : "wrong");

        if (isCorrect) {
            score++;
            scoreElement.textContent = `Score: ${score}`;
        }

        nextButton.disabled = false;
    }

    function showGameOver() {
        stopTTS();
        lastSpoken = null;
        const total = questions.length;
        questionElement.textContent = "Game Over!";
        answersContainer.innerHTML = "";
        nextButton.style.display = "none";
        summaryEl.textContent = `You got ${score} out of ${total} correct.`;
        endScreen.classList.remove("hidden");
        setInGame(false);
    }

    nextButton.onclick = () => {
        primeTTS();
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            showQuestion();
        } else {
            showGameOver();
        }
    };

    const savedTts = localStorage.getItem("ttsEnabled");
    if (ttsEnabledSelect) ttsEnabledSelect.value = savedTts === "yes" ? "yes" : "no";

    ttsEnabledSelect?.addEventListener("change", () => {
        localStorage.setItem("ttsEnabled", ttsEnabledSelect.value);
        if (ttsEnabledSelect.value !== "yes") {
            stopTTS();
            return;
        }
        primeTTS();
        speakText("Text to speech on.");
        if (lastSpoken) speakQuestionAndOptions(lastSpoken.questionHtml, lastSpoken.answersHtml);
    });

    function startGame() {
        primeTTS();
        fetchQuestions();
    }

    restartButton.onclick = startGame;
    quitButton.onclick = () => resetToMenu("Thanks for playing!");
    startButton.onclick = startGame;

    loadCategories();
    resetToMenu();
});
