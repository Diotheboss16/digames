function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function digitsOf(num, digits) {
    return String(num).padStart(digits, "0").split("").map(Number);
}

function generateDividendDigits(digits) {
    const minVal = Math.pow(10, digits - 1);
    const maxVal = Math.pow(10, digits) - 1;
    const dividend = randomInt(minVal, maxVal);
    return digitsOf(dividend, digits);
}

function calculateSolution(dividendDigits, divisor) {
    const quotientDigits = [];
    const steps = [];

    let remainder = 0;
    for (let i = 0; i < dividendDigits.length; i++) {
        const current = remainder * 10 + dividendDigits[i];
        const q = Math.floor(current / divisor);
        const product = q * divisor;
        const newRemainder = current - product;

        quotientDigits.push(q);
        steps.push({
            bringDown: dividendDigits[i],
            current,
            q,
            product,
            remainder: newRemainder,
        });

        remainder = newRemainder;
    }

    return { quotientDigits, remainder, steps, divisor };
}

function generateProblem() {
    const numDigits = parseInt(document.getElementById("numDigits").value, 10);
    const divisor = parseInt(document.getElementById("divisor").value, 10);

    const quotientTable = document.getElementById("quotientTable");
    const divisionTable = document.getElementById("divisionTable");

    const divisionArea = document.getElementById("divisionArea");
    divisionArea.style.display = "";
    divisionArea.classList.add("shown");

    document.getElementById("checkAnswerBtn").style.display = "inline-block";

    quotientTable.innerHTML = "";
    divisionTable.innerHTML = "";

    const feedback = document.getElementById("feedback");
    feedback.textContent = "";
    feedback.className = "feedback";
    feedback.style.display = "none";

    const stepsDetails = document.getElementById("stepsDetails");
    stepsDetails.style.display = "none";
    stepsDetails.open = false;
    document.getElementById("steps").innerHTML = "";

    document.getElementById("remainder").value = "";

    const dividendDigits = generateDividendDigits(numDigits);

    // Quotient row: blank divisor cell + N quotient inputs
    const qRow = quotientTable.insertRow();
    qRow.insertCell();
    for (let i = 0; i < numDigits; i++) {
        const cell = qRow.insertCell();
        const input = document.createElement("input");
        input.className = "quotient";
        input.id = `q${i}`;
        input.inputMode = "numeric";
        cell.appendChild(input);
    }

    // Division row: divisor + dividend digits under the bracket
    const dRow = divisionTable.insertRow();
    const divisorCell = dRow.insertCell();
    divisorCell.className = "divisorCell";
    const divisorInput = document.createElement("input");
    divisorInput.className = "given";
    divisorInput.value = divisor;
    divisorInput.readOnly = true;
    divisorCell.appendChild(divisorInput);

    for (let i = 0; i < numDigits; i++) {
        const cell = dRow.insertCell();
        cell.className = `dividendCell${i === 0 ? " first" : ""}`;
        const input = document.createElement("input");
        input.className = "given";
        input.value = dividendDigits[i];
        input.readOnly = true;
        cell.appendChild(input);
    }

    window.correctAnswer = calculateSolution(dividendDigits, divisor);
}

function checkAnswer() {
    const numDigits = parseInt(document.getElementById("numDigits").value, 10);
    const correct = window.correctAnswer;
    if (!correct || !Array.isArray(correct.quotientDigits)) return;

    // Quotient: allow leading blanks (treated as 0), but not blanks after first entry.
    const raw = [];
    for (let i = 0; i < numDigits; i++) {
        raw.push(document.getElementById(`q${i}`).value);
    }

    let firstEntered = raw.findIndex(v => v !== "");
    if (firstEntered === -1) firstEntered = numDigits; // all blank

    let quotientCorrect = true;
    for (let i = 0; i < numDigits; i++) {
        const expected = correct.quotientDigits[i];
        const v = raw[i];

        if (i < firstEntered) {
            // leading blanks are treated as 0
            if (expected !== 0 && v === "") quotientCorrect = false;
            if (v !== "") {
                const d = parseInt(v, 10);
                if (d !== expected) quotientCorrect = false;
            } else if (expected !== 0) {
                quotientCorrect = false;
            }
            continue;
        }

        if (v === "") {
            quotientCorrect = false;
            continue;
        }

        const d = parseInt(v, 10);
        if (d !== expected) quotientCorrect = false;
    }

    const remVal = document.getElementById("remainder").value;
    const userRemainder = remVal === "" ? 0 : parseInt(remVal, 10);
    const remainderCorrect = userRemainder === correct.remainder;

    let message;
    let feedbackClass;
    if (quotientCorrect && remainderCorrect) {
        message = "Correct: quotient and remainder.";
        feedbackClass = "success";
    } else if (quotientCorrect && !remainderCorrect) {
        message = "Quotient is correct, but remainder needs adjustment.";
        feedbackClass = "warn";
    } else if (!quotientCorrect && remainderCorrect) {
        message = "Remainder is correct, but quotient is incorrect.";
        feedbackClass = "warn";
    } else {
        message = "Both quotient and remainder are incorrect. Try again.";
        feedbackClass = "error";
    }

    const feedback = document.getElementById("feedback");
    feedback.textContent = message;
    feedback.className = `feedback ${feedbackClass}`;
    feedback.style.display = "block";

    renderSteps(correct);
}

function renderSteps(correct) {
    const stepsDetails = document.getElementById("stepsDetails");
    const stepsDiv = document.getElementById("steps");

    const ol = document.createElement("ol");
    for (const s of correct.steps) {
        const li = document.createElement("li");
        li.textContent = `${s.current} ÷ ${correct.divisor} = ${s.q}, ${s.q}×${correct.divisor} = ${s.product}, ${s.current}−${s.product} = ${s.remainder}`;
        ol.appendChild(li);
    }

    stepsDiv.innerHTML = "";
    stepsDiv.appendChild(ol);
    stepsDetails.style.display = "block";
}
