function generateProblem() {
    const numDigits = parseInt(document.getElementById("numDigits").value);
    const numAddends = parseInt(document.getElementById("numAddends").value);

    // Ensure tables exist
    let carryTable = document.getElementById("carryTable");
    let numberTable = document.getElementById("numberTable");
    let resultTable = document.getElementById("resultTable");

    // Debug logs
    console.log("carryTable:", carryTable);
    console.log("numberTable:", numberTable);
    console.log("resultTable:", resultTable);

    const additionArea = document.getElementById("additionArea");
    additionArea.style.display = "";
    additionArea.classList.add("shown");

    document.getElementById("checkAnswerBtn").style.display = "inline-block";

    // Reset tables
    carryTable.innerHTML = "";
    numberTable.innerHTML = "";
    resultTable.innerHTML = "";
    const feedback = document.getElementById("feedback");
    feedback.textContent = "";
    feedback.className = "feedback";
    feedback.style.display = "none";

    let numbers = Array.from({ length: numAddends }, () => generateNumber(numDigits));

    // Generate carry row (numDigits inputs on the left; one blank cell on the right)
    let carryRow = carryTable.insertRow();
    for (let i = 0; i < numDigits; i++) {
        let cell = carryRow.insertCell();
        let input = document.createElement("input");
        input.className = "carry";
        input.id = `carry${i}`;
        cell.appendChild(input);
    }
    carryRow.insertCell();

    // Generate number rows (right-aligned within numDigits+1 columns)
    numbers.forEach((rowData, rowIndex) => {
        let row = numberTable.insertRow();
        let opCell = row.insertCell();
        if (rowIndex === numbers.length - 1) {
            opCell.textContent = "+";
            opCell.className = "operatorCell";
        }
        for (let digit of rowData) {
            let cell = row.insertCell();
            let input = document.createElement("input");
            input.className = "given";
            input.value = digit;
            input.readOnly = true;
            cell.appendChild(input);
        }
    });

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
    window.correctAnswer = calculateSolution(numbers);
}

function generateNumber(digits) {
    return Array.from({ length: digits }, () => Math.floor(Math.random() * 10));
}

function calculateSolution(numbers) {
    let sum = [];
    let carry = 0;
    // carry-out value for each column (left-to-right), matching carry0..carry{n-1}
    let carries = Array(numbers[0].length).fill(0);

    for (let i = numbers[0].length - 1; i >= 0; i--) {
        let digitSum = carry;
        for (let n of numbers) digitSum += n[i];
        carry = Math.floor(digitSum / 10); // carry-out to next (left) column
        carries[i] = carry;
        sum.unshift(digitSum % 10);
    }

    if (carry > 0) sum.unshift(carry); // extra digit in result

    return { sum, carry: carries };
}

function checkAnswer() {
    let numDigits = parseInt(document.getElementById("numDigits").value);

    if (!Array.isArray(window.correctAnswer.carry)) {
	window.correctAnswer.carry = [];
    }

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

    // Compute user-entered carry value as a number
    let userCarryStr = "";
    for (let i = 0; i < numDigits; i++) {
        let userCarry = document.getElementById(`carry${i}`).value || "0";  // Default to 0
        userCarryStr += userCarry;
    }
    let userCarryNum = parseInt(userCarryStr, 10);

    // Compute correct carry value as a number
    let correctCarryStr = Array.isArray(window.correctAnswer.carry)
        ? window.correctAnswer.carry.map(num => num || 0).join("")
        : "0";

    let correctCarryNum = parseInt(correctCarryStr, 10);

    // Compare results
    let sumCorrect = (userSum === correctSum);
    let carryCorrect = (userCarryNum === correctCarryNum);

    // Determine result message
    let message;
    let feedbackClass;
    if (sumCorrect && carryCorrect) {
        message = "Correct: result and carries.";
        feedbackClass = "success";
    } else if (sumCorrect && !carryCorrect) {
        message = "Result is correct, but carries need adjustment.";
        feedbackClass = "warn";
    } else if (!sumCorrect && carryCorrect) {
        message = "Carries are correct, but result is incorrect.";
        feedbackClass = "warn";
    } else {
        message = "Both result and carries are incorrect. Try again.";
        feedbackClass = "error";
    }

    const feedback = document.getElementById("feedback");
    feedback.textContent = message;
    feedback.className = `feedback ${feedbackClass}`;
    feedback.style.display = "block";

    // Debugging Output
    console.log(`User Sum: ${userSum}, Correct Sum: ${correctSum}`);
    console.log(`User Carry: ${userCarryNum}, Correct Carry: ${correctCarryNum}`);
}


