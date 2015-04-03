var fs = require("fs");
var mc = require("./machi_koro_ctrl.js");

var minReset = 200;

function readWeights() {
	return JSON.parse(fs.readFileSync("./weights.js"));
}

function saveWeights(weights) {
	fs.writeFileSync("./weights.js", JSON.stringify(weights, null, 4));
}

function getController () {
	// command-line invocation of MachiKoro
	var scope = {};
	var ctrl = new mc.MachiKoroCtrl(scope);
	ctrl.initGame();
	return ctrl;
}

/**
 * Run the simulation, fill winners object
 * @return Number of turns in the game
 */
function runSimul(winners) {
	var ctrl = getController();
	var oldWeights = readWeights();

	ctrl.weights = oldWeights;
	ctrl.initGame();
	ctrl.playGame();
	var wp = ctrl.getCurrentPlayer();
	wp.feedbackCardWeights();

	oldWeights[wp.name] = wp.cardWeights;
	
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
	var p = ctrl.getPlayerByName(playerName);
	var idx = ctrl.players.indexOf(p);
	weights[idx] = {};
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

function main () {
	var iterations = 1;
	if (process.argv.length > 2) {
		iterations = process.argv[2];
	}
	var winners = initWinners();
	var counter = 0;
	console.log("Running simulation for " + iterations + " iterations");
	for (var i = 0; i < iterations; i++) {
		counter += runSimul(winners);
	}
	printResults(winners, counter/iterations, iterations);

	if (iterations >= minReset) {
		resetWorstPlayer(winners, iterations);
	}
}

main();