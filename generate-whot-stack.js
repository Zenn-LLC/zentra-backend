async function generateStack() {
    var whotStack = [];
    // Circles
    for (var i = 0; i < 14; i++) {
        if (i+1 != 6 && i+1 != 9) {
            var whotCard = {
                shape: "Circle",
                number: i+1,
                cardID: await require('./generate-string.js').generateRandomString(8),
            }

            whotStack.push(whotCard);
        }
    }
    
    // Triangles
    for (var i = 0; i < 14; i++) {
        if (i+1 != 6 && i+1 != 9) {
            var whotCard = {
                shape: "Triangle",
                number: i+1,
                cardID: await require('./generate-string.js').generateRandomString(8),
            }

            whotStack.push(whotCard);
        }
    }
    
    // Crosses
    for (var i = 0; i < 14; i++) {
        if ((i+1 != 6 && i+1 != 9) && (i+1 != 4 && i+1 != 8) && i+1 != 12) {
            var whotCard = {
                shape: "Cross",
                number: i+1,
                cardID: await require('./generate-string.js').generateRandomString(8),
            }

            whotStack.push(whotCard);
        }
    }
    
    // Squares
    for (var i = 0; i < 14; i++) {
        if ((i+1 != 6 && i+1 != 9) && (i+1 != 4 && i+1 != 8) && i+1 != 12) {
            var whotCard = {
                shape: "Square",
                number: i+1,
                cardID: await require('./generate-string.js').generateRandomString(8),
            }

            whotStack.push(whotCard);
        }
    }
    
    // Stars
    for (var i = 0; i < 14; i++) {
        if (i+1 <= 8) {
            if (i+1 != 6) {
                var whotCard = {
                    shape: "Star",
                    number: i+1,
                    cardID: await require('./generate-string.js').generateRandomString(8),
                }

                whotStack.push(whotCard);
            }
        }
    }
    
    // Whots
    for (var i = 0; i < 5; i++) {
        var whotCard = {
            shape: "Whot",
            number: 20,
            cardID: await require('./generate-string.js').generateRandomString(8),
        }

        // whotStack.push(whotCard);
    }

    shuffleArray(whotStack);
    return whotStack;
}

async function generatePlayerStack(stack) {
    var playerStack = [];
    for (let i = 0; i < 6; i++) {
        var card = {
            shape: stack[stack.length - 1].shape,
            number: stack[stack.length - 1].number,
            cardID: stack[stack.length - 1].cardID,
        };
        playerStack.push(card);
        stack.pop();
    }

    return playerStack;
}

async function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

module.exports = {
    generateStack: generateStack,
    generatePlayerStack: generatePlayerStack,
    shuffleArray: shuffleArray
}
  