var fs = require("fs");
var mc = require("./machi_koro_ctrl.js");

var minReset = 5000;

function readWeights() {
	return JSON.parse(fs.readFileSync("./weights.js"));
}

function saveWeights(weights) {
	fs.writeFileSync("./weights.js", JSON.stringify(weights, null, 4));
}

function getController (weights) {
	// command-line invocation of MachiKoro
	var scope = {};
	var ctrl = new mc.MachiKoroCtrl(scope);
	if (weights) {
		ctrl.weights = weights;
	}
	ctrl.initGame();
	return ctrl;
}

/**
 * Run the simulation, fill winners object
 * Modify oldWeights
 * @return Number of turns in the game
 */
function runSimul(winners, oldWeights) {
	var ctrl = getController(oldWeights);

	ctrl.playGame();
	var wp = ctrl.getCurrentPlayer();
	// console.log(oldWeights[wp.name]);
	wp.feedbackCardWeights();

	oldWeights[wp.name] = wp.cardWeights;
	// console.log(oldWeights[wp.name]);
	
	// console.log("*** WINNING WEIGHTS FOR " + wp.name + " ***");
	// console.log(wp.cardWeights);
	saveWeights(oldWeights);
	winners[wp.name]++;
	return ctrl.turn;
}

function initWinners() {
	var ctrl = getController();

	var winners = {};

	for (var p = 0; p < ctrl.players.length; p++) {
		var name = ctrl.players[p].name;
		winners[name] = 0;
	}
	return winners;
}

function getWorstPlayer(winners, numIterations) {
	var n, lowestPlayer;
	var lowestScore = numIterations;
	for (var playerName in winners) {
		n = winners[playerName];
		if (n < lowestScore) {
			lowestPlayer = playerName;
		}
	}
	return lowestPlayer;
}

function resetWorstPlayer(winners, numIterations) {
	var weights = readWeights();
	var ctrl = getController();

	var playerName = getWorstPlayer(winners, numIterations);
	weights[playerName] = {};
	saveWeights(weights);
}

/**
 * 
 * @param  {Object} winners       [description]
 * @param  {Number} avgTurns      [description]
 * @param  {Number} numIterations [description]
 */
function printResults(winners, avgTurns, numIterations) {
	console.log("Average number of turns per game: " + Math.round(avgTurns));
	console.log("Winning stats:");
	var names = Object.keys(winners);
	var sortedNames = names.sort(function (a, b) {
		return winners[b] - winners[a];
	});
	for (var i = 0; i < sortedNames.length; i++) {
		var n = winners[sortedNames[i]];
		console.log(sortedNames[i] + " : " + (n / numIterations * 100) + "%");
	}
}

function computeWeightDiff (o1, o2) {
	for (var playerName in o1) {
		var w1 = o1[playerName];
		var w2 = o2[playerName];
		for (var p = 0; p < 4; p++) {
			for (var c in w1[p]) {
				if (w1[p][c] != w2[p][c]) {
					console.log ("Entry for " + playerName + "," + p + "," + c + " was " + w1[p][c] + " but is now " + w2[p][c]);
				}
			}
		}
	}
}

function clone(obj) {
    var copy;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}

function main () {
	var iterations = 1;
	if (process.argv.length > 2) {
		iterations = process.argv[2];
	}
	var oldWeights = readWeights();
	var winners = initWinners();
	var counter = 0;
	console.log("Running simulation for " + iterations + " iterations");
	for (var i = 0; i < iterations; i++) {
		// var m = clone(oldWeights);
		counter += runSimul(winners, oldWeights);
		// computeWeightDiff(m, oldWeights);
	}
	printResults(winners, counter/iterations, iterations);

	if (iterations >= minReset) {
		resetWorstPlayer(winners, iterations);
	}
}

main();