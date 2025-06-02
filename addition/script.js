function generateProblem() {
    const numDigits = document.getElementById("numDigits").value;
    const additionGrid = document.getElementById("additionGrid");
    additionGrid.innerHTML = ""; // Reset grid

    let num1 = generateNumber(numDigits);
    let num2 = generateNumber(numDigits);

    // Display the problem
    let carries = Array(numDigits).fill(""); // Placeholder for carry values
    let answers = Array(numDigits).fill(""); // Placeholder for result inputs

    for (let i = 0; i < numDigits; i++) {
        // Carry slots
        let carrySlot = document.createElement("input");
        carrySlot.className = "cell carry";
        carrySlot.id = `carry${i}`;
        additionGrid.appendChild(carrySlot);
    }

    for (let i = 0; i < numDigits; i++) {
        // Digits of the first number
        let digit1 = document.createElement("div");
        digit1.className = "cell";
        digit1.textContent = num1[i];
        additionGrid.appendChild(digit1);
    }

    for (let i = 0; i < numDigits; i++) {
        // Digits of the second number
        let digit2 = document.createElement("div");
        digit2.className = "cell";
        digit2.textContent = num2[i];
        additionGrid.appendChild(digit2);
    }

    for (let i = 0; i < numDigits; i++) {
        // Answer input slots
        let answerSlot = document.createElement("input");
        answerSlot.className = "cell";
        answerSlot.id = `answer${i}`;
        additionGrid.appendChild(answerSlot);
    }

    // Store the correct solution
    window.correctAnswer = calculateSolution(num1, num2);
}

function generateNumber(digits) {
    return Array.from({ length: digits }, () => Math.floor(Math.random() * 10));
}

function calculateSolution(num1, num2) {
    let sum = [];
    let carry = 0;

    for (let i = num1.length - 1; i >= 0; i--) {
        let digitSum = num1[i] + num2[i] + carry;
        carry = Math.floor(digitSum / 10); // Compute carry
        sum.unshift(digitSum % 10); // Store last digit of sum
    }

    return { sum, carry };
}

function checkAnswer() {
    let userSum = [];
    let numDigits = document.getElementById("numDigits").value;

    for (let i = 0; i < numDigits; i++) {
        userSum.push(parseInt(document.getElementById(`answer${i}`).value || 0, 10));
    }

    let correct = JSON.stringify(userSum) === JSON.stringify(window.correctAnswer.sum);

    document.getElementById("feedback").textContent = correct ? "Correct!" : "Try Again!";
}
