var State = require("./state.js").State;
var game = require("./cmd_line_helper.js");
var fs = require("fs");

/************************************************************************************************************************************************
 * 							The true way of genetic algorithms
 *************************************************************************************************************************************************/

var Genetic = {};
Genetic._names = ["Daniel", "Sergei", "Ross", "Elia", "Alex", "Alice", "Alexey", "Richard", "Avraham"]; 

// iterations obviously dictates what the size of the next generation will be
Genetic.ITERATIONS_PER_GENERATION = 10;
Genetic.GAMES_PER_SESSION = 10;
Genetic._logFlags = {
	"GENETIC_MUTATE": false,
	"AVG_TURN": true,
	"GENETIC_PLAY_GAME": false,
	"generation": false,
	"STATE_MUTATION": false

};

Genetic.log = function(flag, msg) {
	if (Genetic._logFlags[flag]) {
		console.log("[%s] %s", flag, msg);
	}
}

/**
 * @param population	Mapping from AI names to algorithms
 * @return Mapping of AI names to 
 */
Genetic.runGenetic = function (population) {
	if (! population) {
		population = Genetic.createPool();
	}

	var nextGeneration = {}, nextGenNames = [];

	var t = [];

	for (var i = 0; i < Genetic.ITERATIONS_PER_GENERATION; i++) {
		var popForGame = Genetic.pickForGame(population);

		// so what happened?
		var winningAlgo = Genetic.playGame(popForGame);
		t.push(winningAlgo.turns);

		// have this algo reproduce
		var tmp = Genetic.copyAlgo(winningAlgo);
		var progeny = Genetic.mutateAlgo(tmp, nextGenNames);
		nextGeneration[ progeny.name ] = progeny.algo;
		nextGenNames.push(progeny.name);
	}

	Genetic.log("AVG_TURN", "Average turn duration was " + Genetic._mean(t));
	return nextGeneration;
};

Genetic._mean = function (arr) {
	var s = 0;
	for (var i = 0; i < arr.length; i++) {
		s += arr[i];
	}

	return s / arr.length;
}

/**
 * Assume that algo has properties <algo> and <name>
 */
Genetic.copyAlgo = function (algo) {
	var copy =  {};
	for (var state in algo.algo) {
		var actionCopy = algo.algo[state];
		copy[state] = actionCopy;
	}
	return {
		"algo": copy,
		"name": algo.name,
	};
};

Genetic._getChildName = function (parentName, algoNames) {
	var version, baseName;
	if (parentName.indexOf(" ") === -1) {
		baseName = parentName;
		version = 2;
	} else {
		version = Number(parentName.split(" ")[1]) + 1;
		baseName = parentName.split(" ")[0];
	}

	var name = baseName + " " + String(version);
	while (algoNames.indexOf(name) !== -1) {
		version++;
		name = baseName + " " + String(version);
	}
	return name;
};

/**
 * Assume that algo has properties <algo> and <name>
 * @param algoNames		The names of the algorithms in the next generation
 */
Genetic.mutateAlgo = function (algo, algoNames) {
	Genetic.log("GENETIC MUTATE", "Starting mutation for " + algo.name);
	State.mutateAlgo(algo.algo);
	Genetic.log("GENETIC MUTATE", "Done mutation for " + algo.name);
	algo.name = Genetic._getChildName(algo.name, algoNames);
	return algo;
};

/**
 * @param players		Mapping from AI name to algo
 * @return  {name : <algoName>, algo: <algo>}
 */
Genetic.playGame = function (players) {
	var scores = {};
	for (var playerName in players) {
		scores[playerName] = 0;
	}
	var t = 0;

	for (var i = 0; i < Genetic.GAMES_PER_SESSION; i++) {
		var gameController = game.getController(players, "silent");
		Genetic.log("GENETIC_PLAY_GAME", "Starting game");
		gameController.playGame();
		Genetic.log("GENETIC_PLAY_GAME", "Game over");
		var winningAlgoName = gameController.getCurrentPlayer().name;
		scores[winningAlgoName]++;
		t += gameController.turn;
	}

	var playerOrder = Object.keys(players);
	playerOrder.sort(function (a, b) {
		return scores[b] - scores[a];
	});
	var winningAlgoName = playerOrder[0];

	return {
		"name": winningAlgoName,
		"algo": players[winningAlgoName],
		"turns": t / Genetic.GAMES_PER_SESSION
	};
};

/**
 * @param population mapping from AI names to algorithms
 * @return subset of population
 */
Genetic.pickForGame = function (population) {
	var names = Object.keys(population);
	var subPop = {}, name;
	while (Object.keys(subPop).length < 4) {
		var idx = Math.floor(Math.random() * names.length);
		name = names.splice(idx, 1)[0];
		subPop[name] = population[name];
	}
	return subPop;
};

/**
 * Create a pool for the genetic algorithm
 * @return Mapping from AI names to algos
 */
Genetic.createPool = function () {
	var pop = {}, algo;
	for (var i = 0; i < Genetic._names.length; i++) {
		pop[Genetic._names[i]] = Genetic._genRandomAlgo();
	}
	return pop;
};

Genetic._genRandomAlgo = function () {
	return State.genRandomAlgo();
};

Genetic._writePool = function(population) {
	fs.writeFileSync("./pool.js", JSON.stringify(population, null, 4));
};

Genetic._readPool = function () {
	return JSON.parse(fs.readFileSync("./pool.js"));
};

Genetic.runManyGenetic = function (numGenerations) {

	for (var i = 0; i < numGenerations; i++) {
		Genetic.log("generation", "Generation " + i);
		// var currentGen = Genetic._readPool();
		var currentGen = null;
		var nextGen = Genetic.runGenetic(currentGen);
		Genetic._writePool(nextGen);
	}
};

Genetic.runManyGenetic(100);



