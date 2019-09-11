const State = require("./state.js").State;
const game = require("./cmd_line_helper.js");
const fs = require("fs");

/************************************************************************************************************************************************
 * 							The true way of genetic algorithms
 *************************************************************************************************************************************************/

let Genetic = {};
Genetic._names = ["Daniel", "Sergei", "Ross", "Elia", "Alex", "Alice", "Alexey", "Richard", "Avraham"];

// iterations obviously dictates what the size of the next generation will be
Genetic.ITERATIONS_PER_GENERATION = 10;
Genetic.GAMES_PER_SESSION = 25;
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
};

/**
 * @param population	Mapping from AI names to algorithms
 * @return Mapping of AI names to
 */
Genetic.runGenetic = function (population, generation) {
	if (! population) {
		population = Genetic.createPool();
	}

	let nextGeneration = {}, nextGenNames = [];

	let t = [];

	for (let i = 0; i < Genetic.ITERATIONS_PER_GENERATION; i++) {
		let popForGame = Genetic.pickForGame(population);

		// so what happened?
		let winningAlgo = Genetic.playGame(popForGame);
		t.push(winningAlgo.turns);

		// have this algo reproduce
		let tmp = Genetic.copyAlgo(winningAlgo);
		let progeny = Genetic.mutateAlgo(tmp, nextGenNames);
		nextGeneration[ progeny.name ] = progeny.algo;
		nextGenNames.push(progeny.name);
	}

	t.sort(function(a, b) {
		return b - a;
	});

	Genetic.log("AVG_TURN", "Average turn duration for generation " + generation + " was " + Genetic._mean(t) + "; lowest was " + Genetic._min(t));
	return nextGeneration;
};

Genetic._min = function (arr) {
	return arr[arr.length - 1];
};

Genetic._mean = function (arr) {
	let s = 0;
	for (let i = 0; i < arr.length; i++) {
		s += arr[i];
	}

	return s / arr.length;
};

/**
 * Assume that algo has properties <algo> and <name>
 */
Genetic.copyAlgo = function (algo) {
	const copy = {};
	for (let state in algo.algo) {
		let actionCopy = algo.algo[state];
		copy[state] = actionCopy;
	}
	return {
		"algo": copy,
		"name": algo.name,
	};
};

Genetic._getChildName = function (parentName, algoNames) {
	let version, baseName;
	if (parentName.indexOf(" ") === -1) {
		baseName = parentName;
		version = 2;
	} else {
		version = Number(parentName.split(" ")[1]) + 1;
		baseName = parentName.split(" ")[0];
	}

	let name = baseName + " " + String(version);
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
	let scores = {};
	for (let playerName in players) {
		scores[playerName] = 0;
	}
	let t = 0, winningAlgoName;

	for (let i = 0; i < Genetic.GAMES_PER_SESSION; i++) {
		let gameController = game.getController(players, "silent");
		Genetic.log("GENETIC_PLAY_GAME", "Starting game");
		gameController.playGame();
		Genetic.log("GENETIC_PLAY_GAME", "Game over");
		winningAlgoName = gameController.getCurrentPlayer().name;
		scores[winningAlgoName]++;
		t += gameController.turn;
	}

	let playerOrder = Object.keys(players);
	playerOrder.sort(function (a, b) {
		return scores[b] - scores[a];
	});
	winningAlgoName = playerOrder[0];

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
	let names = Object.keys(population);
	let subPop = {}, name;
	while (Object.keys(subPop).length < 4) {
		let idx = Math.floor(Math.random() * names.length);
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
	let pop = {};
	for (let i = 0; i < Genetic._names.length; i++) {
		pop[Genetic._names[i]] = Genetic._genRandomAlgo();
	}
	return pop;
};

Genetic._genRandomAlgo = function () {
	return State.genRandomAlgo();
};

Genetic._writePool = function(population) {
	fs.writeFileSync("./pool.json", JSON.stringify(population, null, 4));
};

Genetic._readPool = function () {
	return JSON.parse(fs.readFileSync("./pool.json"));
};

Genetic.runManyGenetic = function (numGenerations) {

	for (let gen = 0; gen < numGenerations; gen++) {
		Genetic.log("generation", "Generation " + gen);
		let currentGen = Genetic._readPool();
		// let currentGen = null;
		let nextGen = Genetic.runGenetic(currentGen, gen);
		Genetic._writePool(nextGen);
	}
};

Genetic.runManyGenetic(100);



