function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function digitsOf(num, digits) {
    return String(num).padStart(digits, "0").split("").map(Number);
}

function generateMinuendAndSubtrahend(digits) {
    const minVal = Math.pow(10, digits - 1);
    const maxVal = Math.pow(10, digits) - 1;

    const minuend = randomInt(minVal, maxVal);
    const subtrahend = randomInt(0, minuend);

    return {
        minuendDigits: digitsOf(minuend, digits),
        subtrahendDigits: digitsOf(subtrahend, digits),
    };
}

function calculateSolution(minuendDigits, subtrahendDigits) {
    const n = minuendDigits.length;
    const borrows = Array(n).fill(0); // marks which column lent a borrow to the right
    const diff = [];

    let borrowIn = 0;

    for (let i = n - 1; i >= 0; i--) {
        let top = minuendDigits[i] - borrowIn;
        const bottom = subtrahendDigits[i];

        if (top < bottom) {
            top += 10;
            borrowIn = 1;
            if (i - 1 >= 0) borrows[i - 1] = 1;
        } else {
            borrowIn = 0;
        }

        diff.unshift(top - bottom);
    }

    return { diff, borrows };
}

function generateProblem() {
    const numDigits = parseInt(document.getElementById("numDigits").value);

    const borrowTable = document.getElementById("borrowTable");
    const numberTable = document.getElementById("numberTable");
    const resultTable = document.getElementById("resultTable");

    const subtractionArea = document.getElementById("subtractionArea");
    subtractionArea.style.display = "";
    subtractionArea.classList.add("shown");

    document.getElementById("checkAnswerBtn").style.display = "inline-block";

    borrowTable.innerHTML = "";
    numberTable.innerHTML = "";
    resultTable.innerHTML = "";

    const feedback = document.getElementById("feedback");
    feedback.textContent = "";
    feedback.className = "feedback";
    feedback.style.display = "none";

    const { minuendDigits, subtrahendDigits } = generateMinuendAndSubtrahend(numDigits);

    // Borrow row: blank operator cell + N-1 borrow inputs (rightmost column never lends)
    const borrowRow = borrowTable.insertRow();
    borrowRow.insertCell();
    for (let i = 0; i < numDigits - 1; i++) {
        const cell = borrowRow.insertCell();
        const input = document.createElement("input");
        input.className = "borrow";
        input.id = `borrow${i}`;
        cell.appendChild(input);
    }
    // alignment cell for the rightmost digit column
    borrowRow.insertCell();

    // Number rows
    const topRow = numberTable.insertRow();
    topRow.insertCell();
    for (const digit of minuendDigits) {
        const cell = topRow.insertCell();
        const input = document.createElement("input");
        input.className = "given";
        input.value = digit;
        input.readOnly = true;
        cell.appendChild(input);
    }

    const bottomRow = numberTable.insertRow();
    const opCell = bottomRow.insertCell();
    opCell.textContent = "-";
    opCell.className = "operatorCell";
    for (const digit of subtrahendDigits) {
        const cell = bottomRow.insertCell();
        const input = document.createElement("input");
        input.className = "given";
        input.value = digit;
        input.readOnly = true;
        cell.appendChild(input);
    }

    // Result row: blank operator cell + one answer input per digit
    const resultRow = resultTable.insertRow();
    resultRow.insertCell();
    for (let i = 0; i < numDigits; i++) {
        const cell = resultRow.insertCell();
        const input = document.createElement("input");
        input.className = "result";
        input.id = `answer${i}`;
        cell.appendChild(input);
    }

    window.correctAnswer = calculateSolution(minuendDigits, subtrahendDigits);
}

function checkAnswer() {
    const numDigits = parseInt(document.getElementById("numDigits").value);

    const correct = window.correctAnswer;
    if (!correct || !Array.isArray(correct.diff) || !Array.isArray(correct.borrows)) return;

    let resultCorrect = true;
    for (let i = 0; i < numDigits; i++) {
        const v = document.getElementById(`answer${i}`).value;
        const d = v === "" ? NaN : parseInt(v, 10);
        if (d !== correct.diff[i]) resultCorrect = false;
    }

    let borrowsCorrect = true;
    for (let i = 0; i < numDigits - 1; i++) {
        const v = document.getElementById(`borrow${i}`).value;
        const b = v === "" ? 0 : parseInt(v, 10);
        if (b !== correct.borrows[i]) borrowsCorrect = false;
    }

    let message;
    let feedbackClass;
    if (resultCorrect && borrowsCorrect) {
        message = "Correct: result and borrows.";
        feedbackClass = "success";
    } else if (resultCorrect && !borrowsCorrect) {
        message = "Result is correct, but borrows need adjustment.";
        feedbackClass = "warn";
    } else if (!resultCorrect && borrowsCorrect) {
        message = "Borrows are correct, but result is incorrect.";
        feedbackClass = "warn";
    } else {
        message = "Both result and borrows are incorrect. Try again.";
        feedbackClass = "error";
    }

    const feedback = document.getElementById("feedback");
    feedback.textContent = message;
    feedback.className = `feedback ${feedbackClass}`;
    feedback.style.display = "block";
}
