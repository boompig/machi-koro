	"use strict";

// actual program starts here
var fs = require("fs");
var mc = require("./machi_koro_ctrl.js");

var State = require("./state.js").State;

var minProgressIterations = 100;
var maxProgressBars = 20;
var minRemove = 10;

/**
 * Read weights from file system
 */
function readWeights() {
	return JSON.parse(fs.readFileSync("./weights.js"));
}

/**
 * Save weights to file system
 */
function saveWeights(weights) {
	fs.writeFileSync("./weights.js", JSON.stringify(weights, null, 4));
}

function copyWeights (weights) {
	var copy = {};
	for (var p in weights) {
		copy[p] = {};
		for (var cardName in weights[p]) {
			copy[p][cardName] = weights[p][cardName];
		}
	}
	return copy;
}

function pickPlayers (weights) {
	// pick any 4 players from the assortment of players
	var names = Object.keys(weights);
	var players = [];
	while (players.length < 4) {
		var idx = Math.floor(Math.random() * names.length);
		var name = names.splice(idx, 1);
		players.push(name);
	}
	return players;
}

/**
 * The question is, what does it mean to mutate an item?
 *
 * I will have these types of mutations
 * 		- deletion
 * 		- creation
 * 		- alteration
 *
 * Deletion:
 * 		- the probability that some trait gets reset to 0
 *
 * Creation:
 * 		- the probability that some 0-trait gets set to blanket 500
 *
 * Mutation:
 * 		- the probability that a non-zero trait is changed, but in a minor way (say +/- 100 from origin value)
 *
 * Return the new weights
 */
function mutateWeights (weights) {
	var prMutate = 0.1;
	var prCreate = 0.05;
	var prDelete = 0.01;

	var p, cardName, count;
	var weightsCopy = copyWeights(weights);
	var mFactor;

	var mutateAdd = 100;
	var creationAdd = 500;

	for (p in weights) {
		for (cardName in weights[p]) {
			count = weights[p][count];
			if (Math.random() < prMutate) {
				mFactor = Math.round((Math.random() * mutateAdd * 2) - mutateAdd);
				weightsCopy[p][cardName] = Math.max(0, weights[p][cardName] + mFactor);
				// console.log("Mutated %s @ %d from %d to %d", cardName, p, weights[p][cardName], weightsCopy[p][cardName]);
			} else if (count === 0 && Math.random() < prCreate) {
				weightsCopy[p][cardName] = creationAdd;
				// console.log("Mutated %s @ %d from %d to %d", cardName, p, weights[p][cardName], weightsCopy[p][cardName]);
			} else if (count > 0 && Math.random() < prDelete) {
				weightsCopy[p][cardName] = 0;
				// console.log("Mutated %s @ %d from %d to %d", cardName, p, weights[p][cardName], weightsCopy[p][cardName]);
			}
		}
	}

	return weightsCopy;
}



/**
 * Initialize the controller with the given weights
 *
 * @param {Array} players - Array of player names to use
 */
function getController (weights, logLevel, players) {
	// command-line invocation of MachiKoro
	var scope = {};
	var ctrl = new mc.MachiKoroCtrl(scope);
	if (weights) {
		ctrl.weights = weights;
	}
	if (logLevel) {
		ctrl.setLogLevel(logLevel);
	}

	if (players) {
		ctrl.playerNames = players;
	}

	ctrl.initGame();
	return ctrl;
}

/**
 * Run the simulation, fill winners object
 * Modify oldWeights
 * @return Number of turns in the game
 */
function runSimul(winners, oldWeights, logLevel, players) {
	var ctrl = getController(oldWeights, logLevel, players);

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

function initWinners(players) {
	var ctrl = getController(null, null, players);

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

/**
 * Print progress bar.
 */
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

function getNumMutations (winners) {
	var total = 0;
	var players = Object.keys(winners);
	players.sort(function (a, b) {
		return winners[b] - winners[a];
	});

	for (var i = 0; i < players.length; i++) {
		total += winners[players[i]];
	}

	var winningPlayer = players[0];
	var perWin = winners[winningPlayer] / total * 100;
	return 1 + Math.floor((perWin - 25) / 5.0);
}

function getChildName (absoluteWinner, weights) {
	var newName, lastPart;
	if (absoluteWinner.indexOf(" ") === -1) {
		newName = absoluteWinner + " 2";
	} else {
		var lastPart = Number(absoluteWinner.split(" ")[1]);
		lastPart++;
		newName = absoluteWinner.split(" ")[0] + " " + String(lastPart);
	}

	while (weights.hasOwnProperty(newName)) {
		lastPart = Number(newName.split(" ")[1]);
		lastPart++;
		newName = absoluteWinner.split(" ")[0] + " " + String(lastPart);
	}
	return newName;
}

function doMutations (winners, weights) {
	// only absolute winner gets to mutate
	var names = Object.keys(winners);
	// sort names in descending order
	names.sort(function (a, b) {
		return winners[b] - winners[a];
	});
	var absoluteWinner = names[0];
	var winnerWeights = weights[absoluteWinner];
	var numChildren = getNumMutations(winners);
	console.log("Mutating weights for AI '%s'; generated %d children", absoluteWinner, numChildren);

	for (var i = 0; i < numChildren; i++) {
		var newWeights = mutateWeights(winnerWeights);
		var newName = getChildName(absoluteWinner, weights);
		
		console.log("Saving weights for new AI '%s'", newName);
		weights[newName] = newWeights;
		saveWeights(weights);
	}
}

function oldMain () {
	var iterations = 1;
	var logLevel = "default";
	if (process.argv.length > 2) {
		iterations = Number(process.argv[2]);
	}
	if (process.argv.length > 3) {
		switch (process.argv[3]) {
			case "-q":
				logLevel = "quiet";
				console.log("Running simulation silently...");
				break;
			case "-qq":
				logLevel = "silent";
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
	var counter = 0;

	var players = pickPlayers(oldWeights);
	console.log("Using these players: %s", players.join(", "));
	var winners = initWinners(players);

	console.log("Running simulation for %d iterations", iterations);
	for (var i = 0; i < iterations; i++) {	
		oldWeights = readWeights();
		counter += runSimul(winners, oldWeights, logLevel, players);
		if (iterations >= minProgressIterations && logLevel === "quiet") {
			printProgress(i, iterations);
		}
	}
	if (iterations >= minProgressIterations && logLevel === "quiet") {
		process.stdout.write("\n");
	}
	console.log("Saving computed weights");
	printResults(winners, counter/iterations, iterations);

	return winners;
}

function main () {
	var numMutations = 1;
	var iterations = 1;
	if (process.argv.length > 2) {
		iterations = Number(process.argv[2]);
	}
	if (process.argv.length > 4) {
		numMutations = Number(process.argv[4]);
	}

	for (var i = 0; i < numMutations; i++) {
		// run the simulation
		var winners = oldMain();

		var players = Object.keys(winners);
		// sort descending by number of wins
		players.sort(function (a, b) {
			return winners[b] - winners[a];
		});


		var oldWeights = readWeights();

		// mutate best players
		doMutations(winners, oldWeights);
		
		if (iterations >= minRemove) {
			// remove worst player
			var worstPlayer = players[players.length - 1];
			console.log("Removing AI '%s' from population", worstPlayer);
			// remove this player
			delete oldWeights[worstPlayer];
		}

		saveWeights(oldWeights);
	}
}

main();
