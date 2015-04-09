	"use strict";

// actual program starts here
var fs = require("fs");
var mc = require("./machi_koro_ctrl.js");

var minReset = 5000;
var minProgressIterations = 100;
var maxProgressBars = 20;

function readWeights() {
	return JSON.parse(fs.readFileSync("./weights.js"));
}

function saveWeights(weights) {
	fs.writeFileSync("./weights.js", JSON.stringify(weights, null, 4));
}

function getController (weights, logLevel) {
	// command-line invocation of MachiKoro
	var scope = {};
	var ctrl = new mc.MachiKoroCtrl(scope);
	if (weights) {
		ctrl.weights = weights;
	}
	if (logLevel) {
		ctrl.setLogLevel(logLevel);
	}
	ctrl.initGame();
	return ctrl;
}

/**
 * Run the simulation, fill winners object
 * Modify oldWeights
 * @return Number of turns in the game
 */
function runSimul(winners, oldWeights, logLevel) {
	var ctrl = getController(oldWeights, logLevel);

	ctrl.playGame();
	var wp = ctrl.getCurrentPlayer();
	// console.log(oldWeights[wp.name]);
	wp.feedbackCardWeights(ctrl);

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
			lowestScore = n;
		}
	}
	return lowestPlayer;
}

function resetWorstPlayer(winners, numIterations) {
	var weights = readWeights();
	var playerName = getWorstPlayer(winners, numIterations);
	console.log("Resetting weights for " + playerName);
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

/**
 * Used for debugging
 */
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

function printProgress(iteration, maxIterations) {
	var getNumBars = function (i) {
		return Math.floor((i + 1) / maxIterations * maxProgressBars);
	};

	var numBars = getNumBars(iteration);
	var oldNumBars = getNumBars(iteration - 1);
	if (iteration > 0 && numBars === oldNumBars) {
		return;
	}

	if (iteration > 0) {
		process.stdout.clearLine();
		process.stdout.cursorTo(0);
	}

	var numSpaces = maxProgressBars - numBars;
	var bars = new Array(numBars + 1).join("=");
	var spaces = new Array(numSpaces + 1).join(" ");
	process.stdout.write("[" + bars + ">" + spaces + "]");
}

function main () {
	var iterations = 1;
	var logLevel = "defualt";
	if (process.argv.length > 2) {
		iterations = process.argv[2];
	}
	if (process.argv.length > 3) {
		switch (process.argv[3]) {
			case "-q":
				logLevel = "quiet";
				console.log("Running simulation silently...");
				break;
			case "-v":
				logLevel = "verbose";
				break;
			default:
				logLevel = "default";
				break;
		}
	}

	var oldWeights = readWeights();
	var winners = initWinners();
	var counter = 0;
	console.log("Running simulation for " + iterations + " iterations");
	for (var i = 0; i < iterations; i++) {
		counter += runSimul(winners, oldWeights, logLevel);
		if (iterations >= minProgressIterations && logLevel === "quiet") {
			printProgress(i, iterations);
		}
	}
	if (iterations >= minProgressIterations && logLevel === "quiet") {
		process.stdout.write("\n");
	}
	printResults(winners, counter/iterations, iterations);

	if (iterations >= minReset) {
		resetWorstPlayer(winners, iterations);
	}
}

main();