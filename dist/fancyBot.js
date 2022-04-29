"use strict";
class Bot {
    constructor() {
        this.myRPSDW = [0, 0, 0, 0, 0];
        this.theirRPSDW = [0, 0, 0, 0, 0];
        this.score = [0, 0];
        this.moves = 0;
        this.scoreToAdd = 1;
        this.waterLosses = 0;
    }
    makeMove(gamestate) {
        this.moves += 1;
        this.updateScoreCounter(gamestate);
        this.updateMoveCounts(gamestate);
        if (this.otherPlayerIsBasic(this.theirRPSDW)) {
            return this.validReturn(this.beatBasicPlayer());
        }
        else if (this.score[1] > 900) {
            return this.validReturn(this.goHardOrGoHome(gamestate));
        }
        else if (this.theirRPSDW[3] >= 100) {
            return this.validReturn(this.theyveUsedAllTheirDynamite(gamestate));
        }
        else {
            return this.validReturn(this.beatOpponentsFaveMove(this.theirRPSDW));
        }
    }
    //STRATEGIES
    validReturn(move) {
        switch (move) {
            case "W":
                if (this.theirRPSDW[3] >= 100) {
                    return this.randomMove(["R", "P", "S", "D"]);
                }
                return move;
                break;
            case "D":
                if (this.myRPSDW[3] >= 100) {
                    return this.randomMove(["R", "P", "S"]);
                }
                return move;
                break;
            default:
                if (typeof move !== "undefined") {
                    return move;
                }
                return this.randomMove(["R", "P", "S"]);
                break;
        }
    }
    beatOpponentsFaveMove(array) {
        let bestMove = this.beatAMove(this.favouriteMove(array));
        if (typeof bestMove !== "undefined") {
            return bestMove;
        }
        else {
            return this.randomMove(["R", "P", "S"]);
        }
    }
    letsBeRandom(gamestate) {
        return this.randomMove(["R", "P", "S", "D", "W"]);
    }
    theyveUsedAllTheirDynamite(gamestate) {
        //Do this better
        let opponentRecentBehaviour = this.getOpponentsLastXMoves(gamestate, 100);
        if (this.waterBombAffinity(opponentRecentBehaviour) > 0.8) {
            return this.randomMove(["R", "P", "S"]);
        }
        else if (this.waterBombAffinity(opponentRecentBehaviour) > 0.5) {
            return this.randomMove(["R", "R", "P", "P", "S", "S", "D"]);
        }
        else if (this.waterLosses < 15) {
            return "D";
        }
        else if (this.waterBombAffinity(opponentRecentBehaviour) > 0.37) {
            return this.randomMove(["R", "R", "R", "P", "P", "P", "S", "S", "S", "D", "D"]);
        }
        else if (this.waterBombAffinity(opponentRecentBehaviour) > 0.05) {
            return this.randomMove(["R", "P", "S", "D", "D"]);
        }
        else if (this.waterBombAffinity(opponentRecentBehaviour) > -1) {
            return "D";
        }
        else {
            return this.randomMove(["R", "P", "S", "D"]);
        }
    }
    goHardOrGoHome(gamestate) {
        let opponentRecentBehaviour = this.getOpponentsLastXMoves(gamestate, 50);
        let pointsTillLoss = 1000 - this.score[0];
        let theirDynamites = this.remainingDynamites(this.theirRPSDW);
        if (theirDynamites === 0 && this.remainingDynamites(this.myRPSDW) > 0) {
            return this.theyveUsedAllTheirDynamite(gamestate);
        }
        else if (theirDynamites === 0) {
            return this.beatOpponentsFaveMove(opponentRecentBehaviour);
        }
        else if (pointsTillLoss - theirDynamites < 30 && opponentRecentBehaviour[3] > 20) {
            return this.randomMove(["R", "P", "S", "W", "W", "W", "D"]);
        }
        else {
            return this.randomMove(["R", "P", "S"]);
        }
    }
    //END OF STRATEGIES
    //BEAT BASIC PLAYER
    beatBasicPlayer() {
        let indexOfBasicPlayersMoveOfChoice = this.otherPlayersBasicMove(this.theirRPSDW);
        return this.beatAMove(indexOfBasicPlayersMoveOfChoice);
    }
    otherPlayerIsBasic(array) {
        let nonZeroArray = array.filter(move => move !== 0);
        return nonZeroArray.length === 1;
    }
    otherPlayersBasicMove(array) {
        return array.findIndex(val => val > 0);
    }
    beatAMove(index) {
        switch (index) {
            case 0:
                return "P"; //Player is rock so play paper
                break;
            case 1:
                return "S"; //Player is paper so play scissors
                break;
            case 2:
                return "R"; //Player is scissors so play rock
            case 3:
                if (this.theirRPSDW[3] < 100) {
                    return "W"; //Player is dynamite so play waterbomb
                }
                else {
                    return this.randomMove(["R", "P", "S"]); //If they've run out of dynamite play something else
                }
                break;
            default:
                return this.randomMove(["R", "P", "S"]);
                break;
        }
    }
    //Opponent's strategy
    waterBombAffinity(array) {
        let rpsNumbers = array[0] + array[1] + array[2];
        if (rpsNumbers > 0) {
            return array[4] / (array[0] + array[1] + array[2]);
        }
        else {
            return -1;
        }
    }
    favouriteMove(array) {
        const max = Math.max(...array);
        return array.indexOf(max);
    }
    //Other functions
    remainingDynamites(array) {
        return 100 - array[3];
    }
    updateMoveCounts(gamestate) {
        let rounds = gamestate.rounds;
        if (rounds.length > 0) {
            let lastRound = rounds[rounds.length - 1];
            this.addMoveToArray(this.myRPSDW, lastRound.p1);
            this.addMoveToArray(this.theirRPSDW, lastRound.p2);
        }
        else {
            this.myRPSDW = [0, 0, 0, 0, 0];
            this.theirRPSDW = [0, 0, 0, 0, 0];
        }
    }
    getOpponentsLastXMoves(gamestate, x) {
        let rounds = gamestate.rounds;
        rounds = rounds.slice(Math.max(rounds.length - x, 1));
        let output = [0, 0, 0, 0, 0];
        if (rounds.length > 0) {
            for (let round in rounds) {
                this.addMoveToArray(output, round.p2);
            }
        }
        return output;
    }
    updateScoreCounter(gamestate) {
        let rounds = gamestate.rounds;
        if (rounds.length > 0) {
            let lastRound = rounds[rounds.length - 1];
            let lastRoundWinner = this.winner(lastRound.p1, lastRound.p2);
            switch (lastRoundWinner) {
                case 0:
                    this.scoreToAdd += 1;
                    break;
                case 1:
                    this.score[0] += this.scoreToAdd;
                    this.scoreToAdd = 1;
                    break;
                case 2:
                    this.score[1] += this.scoreToAdd;
                    this.scoreToAdd = 1;
                    break;
                default:
                    break;
            }
        }
        else {
            this.score = [0, 0];
        }
    }
    winner(move1, move2) {
        const standardMoves = ["R", "P", "S"];
        if (move1 === move2) {
            return 0;
        }
        else if (move1 === "D" && standardMoves.includes(move2)) {
            return 1;
        }
        else if (move1 === "D" && move2 === "W") {
            this.waterLosses += 1;
            return 2;
        }
        else if (move2 === "D" && standardMoves.includes(move1)) {
            return 2;
        }
        else if (move1 === "W" && move2 === "D") {
            return 1;
        }
        else if (move1 === "W" && standardMoves.includes(move2)) {
            return 2;
        }
        else if (move2 === "W" && standardMoves.includes(move1)) {
            return 1;
        }
        else if (move1 === "R" && move2 === "S") {
            return 1;
        }
        else if (move1 === "R" && move2 === "P") {
            return 2;
        }
        else if (move1 === "P" && move2 === "S") {
            return 2;
        }
        else if (move1 === "P" && move2 === "R") {
            return 1;
        }
        else if (move1 === "S" && move2 === "R") {
            return 2;
        }
        else if (move1 === "S" && move2 === "P") {
            return 1;
        }
    }
    randomMove(array) {
        if (array.includes("D") && this.myRPSDW[3] >= 100) {
            array = array.filter((elem) => elem !== "D");
        }
        const selector = Math.floor(Math.random() * array.length);
        return array[selector];
    }
    addMoveToArray(array, move) {
        switch (move) {
            case "R":
                array[0] += 1;
                break;
            case "P":
                array[1] += 1;
                break;
            case "S":
                array[2] += 1;
                break;
            case "D":
                array[3] += 1;
                break;
            case "W":
                array[4] += 1;
                break;
        }
    }
}
module.exports = new Bot();
//# sourceMappingURL=fancyBot.js.map