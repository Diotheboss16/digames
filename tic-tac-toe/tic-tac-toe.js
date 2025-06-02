document.addEventListener("DOMContentLoaded", function() {
    const board = document.getElementById("board");
    const cells = [];
    let currentPlayer = "X";

    // Create the grid cells
    for (let i = 0; i < 9; i++) {
        let cell = document.createElement("div");
        cell.classList.add("cell");
        cell.dataset.index = i;
        cell.addEventListener("click", handleClick);
        board.appendChild(cell);
        cells.push(cell);
    }

    function handleClick(event) {
        let cell = event.target;
        if (!cell.textContent) {
            cell.textContent = currentPlayer;
            if (checkWin()) {
                alert(currentPlayer + " wins!");
                resetGame();
            } else if (cells.every(cell => cell.textContent !== "")) {
                alert("It's a draw!");
                resetGame();
            } else {
                currentPlayer = currentPlayer === "X" ? "O" : "X";
            }
        }
    }

    function checkWin() {
        const winningCombos = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], 
            [0, 3, 6], [1, 4, 7], [2, 5, 8], 
            [0, 4, 8], [2, 4, 6]
        ];
        return winningCombos.some(combo => 
            cells[combo[0]].textContent === currentPlayer &&
            cells[combo[1]].textContent === currentPlayer &&
            cells[combo[2]].textContent === currentPlayer
        );
    }

    function resetGame() {
        cells.forEach(cell => cell.textContent = "");
        currentPlayer = "X";
    }
});
