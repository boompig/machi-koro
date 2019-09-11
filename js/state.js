/* node-env node */

/**
 * The state is an object representing the state of the game, for the AI
 * The point of the state is to be:
 * 		- enumerable and countable by a computer, so we can figure out what state we're in
 * 		- represent sufficiently well what state we're in, to make a good decision
 *
 * For now, state will be # of points for you, as well as your money
 */
var State = {};

var cards = require("./cards.js").cards;
State._cardNames = Object.keys(cards);
State._cardNames.sort();

State.MAX_MONEY = 4 + 10 + 16 + 22;
State.MAX_POINTS = 4;
State.MAX_CARD_COUNT = 6;

State.enumerateStates = function () {
	var states = [];
	for (var p = 0; p <= State.MAX_POINTS; p++) {
		for (var m = 0; m <= State.MAX_MONEY; m++) {
			states.push(String(p) + ";" + String(m));
		}
	}
	return states;
};

State.getState = function (player) {
	if (player.money > State.MAX_MONEY) {
		return String(player.points) + ";" + String(State.MAX_MONEY);
	} else {
		return String(player.points) + ";" + String(player.money);
	}
};

State.buyRandomCard = function (money, action) {
	var c = Math.floor(Math.random() * State._cardNames.length);
	var cardName = State._cardNames[c];
	var cost = cards[cardName].cost;
	if (cost <= money) {
		action[c]++;
		money -= cost;
	}
	return money;
};

/**
 * Generate a random action for the given state
 */
State.randomAction = function (state) {
	// pick a random card that this dude can afford
	var money = State.getMoney(state);
	var canAffordCards = State._cardNames.filter(function (cardName) {
		return cards[cardName].cost <= money;
	});
	if (canAffordCards.length > 0) {
		// pick a random card
		var idx = Math.floor(Math.random() * canAffordCards.length);
		return canAffordCards[idx];
	} else {
		return null;
	}
};

State._probMutate = 0.05;

State.getMoney = function (state) {
	return Number(state.split(";")[1]);
};

/**
 * Warning: mutates this algo
 */
State.mutateAlgo = function (algo) {
	var action;
	for (var state in algo) {
		action = algo[state];
		if (Math.random() < State._probMutate) {
			algo[state] = State.randomAction(state);
		}
	}

	return algo;
};

State.genRandomAlgo = function () {
	var allStates = State.enumerateStates();
	var algo = {};

	for (var i = 0; i < allStates.length; i++) {
		var state = allStates[i];
		algo[state] = State.randomAction(state);
	}
	return algo;
};

exports.State = State;