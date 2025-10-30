async function mapper(color, ordinal, steps) {
    if (color == "Red") {
        if (steps == 0) {
            if (ordinal == 1) {
                return [-5, -4];
            } else if (ordinal == 2) {
                return [-4, -4];
            } else if (ordinal == 3) {
                return [-5, -5];
            } else if (ordinal == 4) {
                return [-4, -5];
            } else {
                return [0, 0];
            }
        } else if (steps == 1) {
            return [-1, -6];
        } else if (steps == 2) {
            return [-1, -5];
        } else if (steps == 3) {
            return [-1, -4];
        } else if (steps == 4) {
            return [-1, -3];
        } else if (steps == 5) {
            return [-1, -2];
        } else if (steps == 6) {
            return [-2, -1];
        } else if (steps == 7) {
            return [-3, -1];
        } else if (steps == 8) {
            return [-4, -1];
        } else if (steps == 9) {
            return [-5, -1];
        } else if (steps == 10) {
            return [-6, -1];
        } else if (steps == 11) {
            return [-7, -1];
        } else if (steps == 12) {
            return [-7, 0];
        } else if (steps == 13) {
            return [-7, 1];
        } else if (steps == 14) {
            return [-6, 1];
        } else if (steps == 15) {
            return [-5, 1];
        } else if (steps == 16) {
            return [-4, 1];
        } else if (steps == 17) {
            return [-3, 1];
        } else if (steps == 18) {
            return [-2, 1];
        } else if (steps == 19) {
            return [-1, 2];
        } else if (steps == 20) {
            return [-1, 3];
        } else if (steps == 21) {
            return [-1, 4];
        } else if (steps == 22) {
            return [-1, 5];
        } else if (steps == 23) {
            return [-1, 6];
        } else if (steps == 24) {
            return [-1, 7];
        } else if (steps == 25) {
            return [0, 7];
        } else if (steps == 26) {
            return [1, 7];
        } else if (steps == 27) {
            return [1, 6];
        } else if (steps == 28) {
            return [1, 5];
        } else if (steps == 29) {
            return [1, 4];
        } else if (steps == 30) {
            return [1, 3];
        } else if (steps == 31) {
            return [1, 2];
        } else if (steps == 32) {
            return [2, 1];
        } else if (steps == 33) {
            return [3, 1];
        } else if (steps == 34) {
            return [4, 1];
        } else if (steps == 35) {
            return [5, 1];
        } else if (steps == 36) {
            return [6, 1];
        } else if (steps == 37) {
            return [7, 1];
        } else if (steps == 38) {
            return [7, 0];
        } else if (steps == 39) {
            return [7, -1];
        } else if (steps == 40) {
            return [6, -1];
        } else if (steps == 41) {
            return [5, -1];
        } else if (steps == 42) {
            return [4, -1];
        } else if (steps == 43) {
            return [3, -1];
        } else if (steps == 44) {
            return [2, -1];
        } else if (steps == 45) {
            return [1, -2];
        } else if (steps == 46) {
            return [1, -3];
        } else if (steps == 47) {
            return [1, -4];
        } else if (steps == 48) {
            return [1, -5];
        } else if (steps == 49) {
            return [1, -6];
        } else if (steps == 50) {
            return [1, -7];
        } else if (steps == 51) {
            return [0, -7];
        } else if (steps == 52) {
            return [0, -6];
        } else if (steps == 53) {
            return [0, -5];
        } else if (steps == 54) {
            return [0, -4];
        } else if (steps == 55) {
            return [0, -3];
        } else if (steps == 56) {
            return [0, -2];
        } else if (steps == 57) {
            return [0, -1];
        } else {
            return [0, 0];
        }
    } else if (color == "Yellow") {
        if (steps == 0) {
            if (ordinal == 1) {
                return [5, -4];
            } else if (ordinal == 2) {
                return [4, -4];
            } else if (ordinal == 3) {
                return [5, -5];
            } else if (ordinal == 4) {
                return [4, -5];
            } else {
                return [0, 0];
            }
        } else if (steps == 1) {
            return [6, -1];
        } else if (steps == 2) {
            return [5, -1];
        } else if (steps == 3) {
            return [4, -1];
        } else if (steps == 4) {
            return [3, -1];
        } else if (steps == 5) {
            return [2, -1];
        } else if (steps == 6) {
            return [1, -2];
        } else if (steps == 7) {
            return [1, -3];
        } else if (steps == 8) {
            return [1, -4];
        } else if (steps == 9) {
            return [1, -5];
        } else if (steps == 10) {
            return [1, -6];
        } else if (steps == 11) {
            return [1, -7];
        } else if (steps == 12) {
            return [0, -7];
        } else if (steps == 13) {
            return [-1, -7];
        } else if (steps == 14) {
            return [-1, -6];
        } else if (steps == 15) {
            return [-1, -5];
        } else if (steps == 16) {
            return [-1, -4];
        } else if (steps == 17) {
            return [-1, -3];
        } else if (steps == 18) {
            return [-1, -2];
        } else if (steps == 19) {
            return [-2, -1];
        } else if (steps == 20) {
            return [-3, -1];
        } else if (steps == 21) {
            return [-4, -1];
        } else if (steps == 22) {
            return [-5, -1];
        } else if (steps == 23) {
            return [-6, -1];
        } else if (steps == 24) {
            return [-7, -1];
        } else if (steps == 25) {
            return [-7, 0];
        } else if (steps == 26) {
            return [-7, 1];
        } else if (steps == 27) {
            return [-6, 1];
        } else if (steps == 28) {
            return [-5, 1];
        } else if (steps == 29) {
            return [-4, 1];
        } else if (steps == 30) {
            return [-3, 1];
        } else if (steps == 31) {
            return [-2, 1];
        } else if (steps == 32) {
            return [-1, 2];
        } else if (steps == 33) {
            return [-1, 3];
        } else if (steps == 34) {
            return [-1, 4];
        } else if (steps == 35) {
            return [-1, 5];
        } else if (steps == 36) {
            return [-1, 6];
        } else if (steps == 37) {
            return [-1, 7];
        } else if (steps == 38) {
            return [0, 7];
        } else if (steps == 39) {
            return [1, 7];
        } else if (steps == 40) {
            return [1, 6];
        } else if (steps == 41) {
            return [1, 5];
        } else if (steps == 42) {
            return [1, 4];
        } else if (steps == 43) {
            return [1, 3];
        } else if (steps == 44) {
            return [1, 2];
        } else if (steps == 45) {
            return [2, 1];
        } else if (steps == 46) {
            return [3, 1];
        } else if (steps == 47) {
            return [4, 1];
        } else if (steps == 48) {
            return [5, 1];
        } else if (steps == 49) {
            return [6, 1];
        } else if (steps == 50) {
            return [7, 1];
        } else if (steps == 51) {
            return [7, 0];
        } else if (steps == 52) {
            return [6, 0];
        } else if (steps == 53) {
            return [5, 0];
        } else if (steps == 54) {
            return [4, 0];
        } else if (steps == 55) {
            return [3, 0];
        } else if (steps == 56) {
            return [2, 0];
        } else if (steps == 57) {
            return [1, 0];
        } else {
            return [0, 0];
        }
    } else if (color == "Green") {
        if (steps == 0) {
            if (ordinal == 1) {
                return [-5, 4];
            } else if (ordinal == 2) {
                return [-4, 4];
            } else if (ordinal == 3) {
                return [-5, 5];
            } else if (ordinal == 4) {
                return [-4, 5];
            } else {
                return [0, 0];
            }
        } else if (steps == 1) {
            return [-6, 1];
        } else if (steps == 2) {
            return [-5, 1];
        } else if (steps == 3) {
            return [-4, 1];
        } else if (steps == 4) {
            return [-3, 1];
        } else if (steps == 5) {
            return [-2, 1];
        } else if (steps == 6) {
            return [-1, 2];
        } else if (steps == 7) {
            return [-1, 3];
        } else if (steps == 8) {
            return [-1, 4];
        } else if (steps == 9) {
            return [-1, 5];
        } else if (steps == 10) {
            return [-1, 6];
        } else if (steps == 11) {
            return [-1, 7];
        } else if (steps == 12) {
            return [0, 7];
        } else if (steps == 13) {
            return [1, 7];
        } else if (steps == 14) {
            return [1, 6];
        } else if (steps == 15) {
            return [1, 5];
        } else if (steps == 16) {
            return [1, 4];
        } else if (steps == 17) {
            return [1, 3];
        } else if (steps == 18) {
            return [1, 2];
        } else if (steps == 19) {
            return [2, 1];
        } else if (steps == 20) {
            return [3, 1];
        } else if (steps == 21) {
            return [4, 1];
        } else if (steps == 22) {
            return [5, 1];
        } else if (steps == 23) {
            return [6, 1];
        } else if (steps == 24) {
            return [7, 1];
        } else if (steps == 25) {
            return [7, 0];
        } else if (steps == 26) {
            return [7, -1];
        } else if (steps == 27) {
            return [6, -1];
        } else if (steps == 28) {
            return [5, -1];
        } else if (steps == 29) {
            return [4, -1];
        } else if (steps == 30) {
            return [3, -1];
        } else if (steps == 31) {
            return [2, -1];
        } else if (steps == 32) {
            return [1, -2];
        } else if (steps == 33) {
            return [1, -3];
        } else if (steps == 34) {
            return [1, -4];
        } else if (steps == 35) {
            return [1, -5];
        } else if (steps == 36) {
            return [1, -6];
        } else if (steps == 37) {
            return [1, -7];
        } else if (steps == 38) {
            return [0, -7];
        } else if (steps == 39) {
            return [-1, -7];
        } else if (steps == 40) {
            return [-1, -6];
        } else if (steps == 41) {
            return [-1, -5];
        } else if (steps == 42) {
            return [-1, -4];
        } else if (steps == 43) {
            return [-1, -3];
        } else if (steps == 44) {
            return [-1, -2];
        } else if (steps == 45) {
            return [-2, -1];
        } else if (steps == 46) {
            return [-3, -1];
        } else if (steps == 47) {
            return [-4, -1];
        } else if (steps == 48) {
            return [-5, -1];
        } else if (steps == 49) {
            return [-6, -1];
        } else if (steps == 50) {
            return [-7, -1];
        } else if (steps == 51) {
            return [-7, 0];
        } else if (steps == 52) {
            return [-6, 0];
        } else if (steps == 53) {
            return [-5, 0];
        } else if (steps == 54) {
            return [-4, 0];
        } else if (steps == 55) {
            return [-3, 0];
        } else if (steps == 56) {
            return [-2, 0];
        } else if (steps == 57) {
            return [-1, 0];
        } else {
            return [0, 0];
        }
    } else if (color == "Blue") {
        if (steps == 0) {
            if (ordinal == 1) {
                return [5, 4];
            } else if (ordinal == 2) {
                return [4, 4];
            } else if (ordinal == 3) {
                return [5, 5];
            } else if (ordinal == 4) {
                return [4, 5];
            } else {
                return [0, 0];
            }
        } else if (steps == 1) {
            return [1, 6];
        } else if (steps == 2) {
            return [1, 5];
        } else if (steps == 3) {
            return [1, 4];
        } else if (steps == 4) {
            return [1, 3];
        } else if (steps == 5) {
            return [1, 2];
        } else if (steps == 6) {
            return [2, 1];
        } else if (steps == 7) {
            return [3, 1];
        } else if (steps == 8) {
            return [4, 1];
        } else if (steps == 9) {
            return [5, 1];
        } else if (steps == 10) {
            return [6, 1];
        } else if (steps == 11) {
            return [7, 1];
        } else if (steps == 12) {
            return [7, 0];
        } else if (steps == 13) {
            return [7, -1];
        } else if (steps == 14) {
            return [6, -1];
        } else if (steps == 15) {
            return [5, -1];
        } else if (steps == 16) {
            return [4, -1];
        } else if (steps == 17) {
            return [3, -1];
        } else if (steps == 18) {
            return [2, -1];
        } else if (steps == 19) {
            return [1, -2];
        } else if (steps == 20) {
            return [1, -3];
        } else if (steps == 21) {
            return [1, -4];
        } else if (steps == 22) {
            return [1, -5];
        } else if (steps == 23) {
            return [1, -6];
        } else if (steps == 24) {
            return [1, -7];
        } else if (steps == 25) {
            return [0, -7];
        } else if (steps == 26) {
            return [-1, -7];
        } else if (steps == 27) {
            return [-1, -6];
        } else if (steps == 28) {
            return [-1, -5];
        } else if (steps == 29) {
            return [-1, -4];
        } else if (steps == 30) {
            return [-1, -3];
        } else if (steps == 31) {
            return [-1, -2];
        } else if (steps == 32) {
            return [-2, -1];
        } else if (steps == 33) {
            return [-3, -1];
        } else if (steps == 34) {
            return [-4, -1];
        } else if (steps == 35) {
            return [-5, -1];
        } else if (steps == 36) {
            return [-6, -1];
        } else if (steps == 37) {
            return [-7, -1];
        } else if (steps == 38) {
            return [-7, 0];
        } else if (steps == 39) {
            return [-7, 1];
        } else if (steps == 40) {
            return [-6, 1];
        } else if (steps == 41) {
            return [-5, 1];
        } else if (steps == 42) {
            return [-4, 1];
        } else if (steps == 43) {
            return [-3, 1];
        } else if (steps == 44) {
            return [-2, 1];
        } else if (steps == 45) {
            return [-1, 2];
        } else if (steps == 46) {
            return [-1, 3];
        } else if (steps == 47) {
            return [-1, 4];
        } else if (steps == 48) {
            return [-1, 5];
        } else if (steps == 49) {
            return [-1, 6];
        } else if (steps == 50) {
            return [-1, 7];
        } else if (steps == 51) {
            return [0, 7];
        } else if (steps == 52) {
            return [0, 6];
        } else if (steps == 53) {
            return [0, 5];
        } else if (steps == 54) {
            return [0, 4];
        } else if (steps == 55) {
            return [0, 3];
        } else if (steps == 56) {
            return [0, 2];
        } else if (steps == 57) {
            return [0, 1];
        } else {
            return [0, 0];
        }
    } else {
        return [0, 0];
    }

}

module.exports = {
    mapper: mapper
}