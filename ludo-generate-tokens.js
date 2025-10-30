async function generateTokenArray(color) {
    var tokens = [];
    for (var i = 0; i < 4; i++) {
        const token = {
            color: color,
            step: 0,
            ordinal: i+1,
            ended: false
        };

        tokens.push(token);
    }
    return tokens;
}

module.exports = {
    generateTokenArray: generateTokenArray
}