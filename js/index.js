const computerSymbol = document.querySelector('#computer-symbol');
const computerScores = document.querySelector('#computer-scores');
const playerSymbol = document.querySelector('#player-symbol');
const playerScores = document.querySelector('#player-scores');
const firstPlayBtn = document.querySelector('#x-first');
const secondPlayBtn = document.querySelector('#second-player');
const startGameBtn = document.querySelector('#start-game');
const squares = document.querySelectorAll('.square');
const displayResponse = document.querySelector('#display-response');

const winningCombinations = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
    [1, 4, 7],
    [2, 5, 8],
    [3, 6, 9],
    [1, 5, 9],
    [3, 5, 7]
];

let computer, player, game, gameOver = false;

[firstPlayBtn, secondPlayBtn].forEach(button => {
    button.addEventListener('click', () => {
        if (button.classList.contains("x-selected")) return;
        const choosePlayBtn = button === firstPlayBtn ? secondPlayBtn : firstPlayBtn;
        choosePlayBtn.classList.remove("x-selected");
        button.classList.add("x-selected");
        playerSymbol.dataset.symbol = button.dataset.symbol;
        computerSymbol.dataset.symbol = choosePlayBtn.dataset.symbol;
    });
});

startGameBtn.addEventListener('click', () => {
    [startGameBtn, firstPlayBtn, secondPlayBtn].forEach(buttons => buttons.disabled = true);
    squares.forEach(square => {
        square.textContent = '';
        square.classList.remove('t-letter');
    });
    game = Game();
    player = Player(playerSymbol.dataset.symbol, game);
    computer = Player(computerSymbol.dataset.symbol, game);
    gameOver = false;
    displayResponse.textContent = "You will play as " + player.symbol;
    displayResponse.style.color = 'blue';
    if (computer.symbol === 'X') {
        const computerMove = random(game.squares);
        computer.makeAIMove(computerMove, player);
        document.getElementById(`square-${computerMove}`).textContent = 'X';
    }
});

squares.forEach(square => {
    square.addEventListener('click', () => {
        if (square.textContent !== '' || gameOver) return;
        const index = parseInt(square.dataset.index);
        let gameState = player.makeAIMove(index, computer);
        square.textContent = player.symbol;
        if (gameState) {
            highlightBoardCells(square);
            return result(gameState);
        }

        if (game.movesCounter === 1) {
            game.firstMove = index;
        }
        const computerMove = computer.evaluateBoard(player);
        gameState = computer.makeAIMove(computerMove, player);
        const computersquare = document.getElementById(`square-${computerMove}`);
        computersquare.textContent = computer.symbol;
        if (gameState) {
            highlightBoardCells(computersquare);
            return result(gameState);
        }
    });
});

function result(gameState) {
    gameOver = true;
    [startGameBtn, firstPlayBtn, secondPlayBtn].forEach(buttons => buttons.disabled = false);

    switch (gameState) {
        case "draw":
            displayResponse.textContent = "It's a Tie!";
            displayResponse.style.color = '#0099ff';
            break;
        case player:
            displayResponse.textContent = "You won the game! Conglatulations!";
            displayResponse.style.color = '#0F9D58';
            playerScores.textContent = parseInt(playerScores.textContent) + 1;
            break;
        case computer:
            displayResponse.textContent = "Sorry, You lost this game!";
            displayResponse.style.color = 'red';
            computerScores.textContent = parseInt(computerScores.textContent) + 1;
            break;
    }
}

function highlightBoardCells(square) {
    const index = parseInt(square.dataset.index);
    const symbol = square.textContent;

    winningCombinations.filter(p => p.includes(index)).forEach(pattern => {
        const squaresInARow = [square];

        pattern.filter(n => n !== index).forEach(num => {
            const anotherSquare = document.getElementById(`square-${num}`);
            if (anotherSquare.textContent === symbol) {
                squaresInARow.push(anotherSquare);
            }
        });

        if (squaresInARow.length === 3) {
            squaresInARow.forEach(c => c.classList.add('t-letter'));
        }
    });
}

function Game() {
    const movesCounter = 0;
    const squares = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const combinations = winningCombinations.map(p => [...p]);
    return { movesCounter, squares, combinations }
}

function Player(symbol, game) {
    const combinations = [];

    function makeAIMove(index, rival) {
        for (const pattern of this.combinations.filter(p => p.includes(index))) {
            pattern.splice(pattern.indexOf(index), 1);
            if (pattern.length === 0) return this;
        }
        this.game.combinations.filter(p => p.includes(index)).forEach(pattern => {
            pattern.splice(pattern.indexOf(index), 1);
            this.game.combinations.splice(this.game.combinations.indexOf(pattern), 1);
            this.combinations.push(pattern);
        });

        rival.combinations.filter(p => p.includes(index)).forEach(pattern => {
            rival.combinations.splice(rival.combinations.indexOf(pattern), 1);
        });

        rival.combinations.filter(p => p.includes(index)).forEach(pattern => rival.combinations.splice(rival.combinations.indexOf(pattern, 1)));

        this.game.squares.splice(this.game.squares.indexOf(index), 1);
        if (this.game.squares.length === 0) return 'draw';

        this.game.movesCounter++;
    }

    function evaluateBoard(rival) {
        if (this.game.movesCounter === 1 && this.game.firstMove === 5)
            return random([1, 3, 7, 9]);
        else if (this.game.movesCounter === 1) return 5;

        for (const combinations of [this.combinations, rival.combinations]) {
            const winningMoves = combinations.filter(p => p.length === 1);
            if (winningMoves.length > 0) return random(random(winningMoves));
        }

        const potentialTraps = identifySimilarOccurrences(this.combinations);
        if (potentialTraps.length > 0) return random(potentialTraps);

        const possibleRivalTraps = identifySimilarOccurrences(rival.combinations);
        if (possibleRivalTraps.length === 1) return random(possibleRivalTraps);

        if (possibleRivalTraps.length > 1) {
            const securedMoves = [];
            this.combinations.forEach(pattern => {
                pattern.forEach(num => {
                    const otherNum = pattern.filter(n => n !== num)[0];
                    if (!possibleRivalTraps.includes(otherNum))
                        securedMoves.push(num);
                });
            });
            return random(securedMoves);
        }

        let indexes;
        let maximumScore = -2;
        this.game.squares.forEach(num => {
            const score = this.simulateMove(num, rival);
            if (score > maximumScore) {
                indexes = [num];
                maximumScore = score;
            } else if (score === maximumScore) indexes.push(num);
        });
        return random(indexes);
    }

    function simulateMove(num, rival) {
        const playAgain = replayGame(this.game);
        const newPlayer = anotherGamePlayer(this, playAgain);
        const newRival = anotherGamePlayer(rival, playAgain);

        let currentPlayer = newPlayer;
        let currentRival = newRival;
        let gameState = newPlayer.makeAIMove(num, newRival);
        while (!gameState) {
            currentPlayer = currentPlayer === newPlayer ? newRival : newPlayer;
            currentRival = currentRival === newPlayer ? newRival : newPlayer;
            const move = currentPlayer.evaluateBoard(currentRival);
            gameState = currentPlayer.makeAIMove(move, currentRival);
        }

        if (gameState === 'draw') return 0;
        else if (currentPlayer === newPlayer) return 1;
        else return -1;
    }
    return { symbol, game, combinations, makeAIMove, evaluateBoard, simulateMove };
}

function replayGame(game) {
    const playAgain = Game();
    playAgain.movesCounter = game.movesCounter;
    playAgain.squares = [...game.squares];
    playAgain.combinations = game.combinations.map(p => [...p]);
    return playAgain;
}

function anotherGamePlayer(player, game) {
    const newPlayer = Player(player.symbol, game);
    newPlayer.combinations = player.combinations.map(p => [...p]);
    return newPlayer;
}

function identifySimilarOccurrences(combinations) {
    const nums = [];
    const commonOccurrences = [];
    combinations.forEach(pattern => {
        pattern.forEach(num => {
            if (!nums.includes(num)) {
                nums.push(num);
            }
            else if (!commonOccurrences.includes(num)) {
                commonOccurrences.push(num);
            }
        });
    });
    return commonOccurrences;
}

function random(gameArray) {
    const index = Math.floor(Math.random() * Math.floor(gameArray.length));
    return gameArray[index];
}
