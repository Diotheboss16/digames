function generateProblem() {
    const numDigits = parseInt(document.getElementById("numDigits").value);

    // Ensure tables exist
    let carryTable = document.getElementById("carryTable");
    let numberTable = document.getElementById("numberTable");
    let resultTable = document.getElementById("resultTable");

    // Debug logs
    console.log("carryTable:", carryTable);
    console.log("numberTable:", numberTable);
    console.log("resultTable:", resultTable);

    // Reset tables
    carryTable.innerHTML = "";
    numberTable.innerHTML = "";
    resultTable.innerHTML = "";

    let num1 = generateNumber(numDigits);
    let num2 = generateNumber(numDigits);

    let carries = Array(numDigits).fill("");
    let answers = Array(numDigits + 1).fill("");  // Result can have extra digit

    // Generate carry row
    let carryRow = carryTable.insertRow();
    for (let i = 0; i <= numDigits; i++) {  // Extra space for carry overflow
        let cell = carryRow.insertCell();
        let input = document.createElement("input");
        input.className = "carry";
        input.id = `carry${i}`;
        cell.appendChild(input);
    }

    // Generate number rows
    for (let rowData of [num1, num2]) {
        let row = numberTable.insertRow();
        for (let digit of rowData) {
            let cell = row.insertCell();
            cell.textContent = digit;
        }
    }

    // Generate result row
    let resultRow = resultTable.insertRow();
    for (let i = 0; i <= numDigits; i++) {  // Can have extra digit in result
        let cell = resultRow.insertCell();
        let input = document.createElement("input");
        input.className = "result";
        input.id = `answer${i}`;
        cell.appendChild(input);
    }

    // Store correct solution
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
        carry = Math.floor(digitSum / 10);  // Compute carry
        sum.unshift(digitSum % 10);  // Store last digit of sum
    }

    if (carry > 0) sum.unshift(carry);  // Account for extra carry in result

    return { sum, carry };
}

function checkAnswer() {
    let numDigits = parseInt(document.getElementById("numDigits").value);

    // Convert user input into a number
    let userSumStr = "";
    for (let i = 0; i <= numDigits; i++) {
        let userInput = document.getElementById(`answer${i}`).value;
        userSumStr += userInput !== "" ? userInput : "";  // Ignore blanks
    }
    let userSum = parseInt(userSumStr, 10);

    // Convert correct answer array into a number
    let correctAnswerStr = window.correctAnswer.sum.join("");
    let correctSum = parseInt(correctAnswerStr, 10);

    console.log("User sum: " + userSum);
    console.log("Answer sum: " + correctSum);
    // Compare as actual numbers
    let correct = userSum === correctSum;

    document.getElementById("feedback").textContent = correct ? "Correct!" : "Try Again!";
}
