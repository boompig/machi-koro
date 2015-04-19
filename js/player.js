var require = require || null;
if (require) {
	var c = require("./cards.js");
	var cards = c.cards;
	var colors = c.colors;
	var categories = c.categories;
	var Card = c.Card;

	var globals = {};
	globals.cards = cards;
} else {
	var globals = {};
	globals.cards = cards;
}

function Player (name, weights) {
	"use strict";

	this.name = name;
	this.cards = {};
	this.money = 0;
	this.points = 0;
	this.isHuman = false;
	this.purpleCardCount = 0;

	// for AI?
	weights = weights || {};
	this.cardWeights = weights[name] || {};
	// console.log(this.cardWeights);

	if (Object.keys(this.cardWeights).length === 0) {
		this.initWeights();
	} else {
		this.fillWeights();
	}

	this.purchaseHistory = {};
}

Player.prototype.saveBuyCard = function (cardName) {
	"use strict";
	if (! this.purchaseHistory.hasOwnProperty(this.points)) {
		this.purchaseHistory[this.points] = {};
	}
	if (! this.purchaseHistory[this.points].hasOwnProperty(cardName)) {
		this.purchaseHistory[this.points][cardName] = 0;
	}
	this.purchaseHistory[this.points][cardName]++;
};

Player.prototype.initWeights = function () {
	"use strict";
	// 4 = maxPoints
	for (var p = 0; p <= 4; p++) {
		this.cardWeights[p] = {};
		for (var cardName in cards) {
			this.cardWeights[p][cardName] = 1;
		}
	}
};

Player.prototype.fillWeights = function () {
	"use strict";
	// 4 = maxPoints
	for (var p = 0; p <= 4; p++) {
		for (var cardName in cards) {
			if (! this.cardWeights[p].hasOwnProperty(cardName)) {
				// console.log("Reset " + p + "_" + cardName);
				this.cardWeights[p][cardName] = 1;
			}
		}
	}
};

/**
 * This function is called once the game is over.
 * Add 1 to all cards the player owns
 * TODO for now, this is regardless of qty
 */
Player.prototype.feedbackCardWeights = function (gameState) {
	"use strict";
	var cardName;

	for (var p in this.purchaseHistory) {
		for (cardName in this.purchaseHistory[p]) {
			this.cardWeights[p][cardName]++;
			gameState.writeLog(this, "+1 to " + cardName + " with " + p + " points - now at " + this.cardWeights[p][cardName], gameState.VERBOSE);
		}
	}
};

Player.prototype.canBuyCard = function (cardName) {
	"use strict";
	var card = cards[cardName];
	return card.cost <= this.money && ! (card.color === colors.GREY && this.hasCard(cardName)) && (card.color !== colors.PURPLE || this.purpleCardCount === 0);
};

/**
 * @return Array of affordable card names
 */
Player.prototype.getAffordableCards = function (gameState) {
	"use strict";
	gameState.writeLog(this, "Evaluating affordable cards", gameState.VERBOSE);
	var deck = gameState.deck;
	var card, cardName;
	var canAffordCards = [];
	for (cardName in globals.cards) {
		card = globals.cards[cardName];
		if (deck.hasOwnProperty(cardName) && deck[cardName] > 0 && this.canBuyCard(cardName)) {
			gameState.writeLog(this, "can afford " + cardName, gameState.VERBOSE);
			canAffordCards.push(cardName);
		}
	}
	return canAffordCards;
};

Player.prototype.turn = function (gameState) {
	"use strict";
	var canAffordCards, buyCardName;

	do {
		canAffordCards = this.getAffordableCards(gameState);
		buyCardName = this.pickBuyCard(canAffordCards);
		if (buyCardName !== null) {
			gameState.writeLog(this, "buying " + buyCardName);
			gameState.buyCard(buyCardName, this);
		}
	} while (buyCardName !== null && canAffordCards.length > 0);
};

Player.prototype.hasCard = function (cardName) {
	"use strict";
	return this.cards.hasOwnProperty(cardName);
};

/**
 * Pick the card to buy, out of the list of affordable cards.
 * Assume that canAffordCards.length > 0
 */
Player.prototype.pickBuyCard = function (canAffordCards) {
	"use strict";
	var cardName, score, maxScore = 0;
	var bestCard = null;

	if (canAffordCards.length === 0) {
		return null;
	}

	if (this.points === 4) {
		// no need to buy anything, already won
		return null;
	}

	for (var i = 0; i < canAffordCards.length; i++) {
		cardName = canAffordCards[i];
		score = this.cardWeights[this.points][cardName];
		if (score > maxScore) {
			maxScore = score;
			bestCard = cardName;
		}
	}
	return bestCard;
};

/**
 * Called when the player has a RADIO_TOWER, and can decide to re-roll
 * Return true to reroll, false otherwise
 */
Player.prototype.decideReroll = function (rollArray) {
	"use strict";
	//TODO random decision for now
	return Math.random() > 0.5;
};

Player.prototype.getStealPlayerTargetMoney = function (gameState, cardYield) {
	// TODO pick a random player for now
	var p, name;
	var cpName = gameState.getCurrentPlayer().name;
	do {
		p = Math.randChoice(gameState.players);
		name = p.name;
	} while (name !== cpName);
	return name;
};

Player.prototype.canRollTwoDice = function () {
	return this.hasCard("TRAIN_STATION");
};

/**
 * Return number of dice for this player to roll
 * TODO make a decision about whether to roll 2 dice or 1
 */
Player.prototype.getNumDice = function () {
	"use strict";
	if (this.hasCard("TRAIN_STATION")) {
		return 2;
	} else {
		return 1;
	}
};

var exports = exports || null;
if (exports) {
	exports.Player = Player;
}