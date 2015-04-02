var require = require || null;
if (require) {
	var c = require("./cards.js");
	var cards = c.cards;
	var colors = c.colors;
	var categories = c.categories;
	var Card = c.Card;

	var globals = {};
	globals.cards = cards;
}

function Player (name, stratGroup, weights) {
	"use strict";
	this.name = name;
	this.cards = {};
	this.money = 0;
	this.points = 0;
	this.isHuman = false;

	this.stratGroup = stratGroup || null;

	// for AI?
	weights = weights || {};
	this.cardWeights = weights[stratGroup] || {};

	if (Object.keys(this.cardWeights).length === 0) {
		for (var cardName in cards) {
			this.cardWeights[cardName] = 1;
		}
	} else {
		for (var cardName in cards) {
			if (! this.cardWeights.hasOwnProperty(cardName)) {
				this.cardWeights[cardName] = 0;
			}
		}
	}
}

/**
 * This function is called once the game is over.
 * Add 1 to all cards the player owns
 * TODO for now, this is regardless of qty
 */
Player.prototype.feedbackCardWeights = function () {
	"use strict";
	var cardName;
	for (cardName in cards) {
		if (! this.cards.hasOwnProperty(cardName)) {
			// decay, but never decay to 0
			if (this.cardWeights[cardName] > 1) {
				this.cardWeights[cardName]--;
			}
		}
	}

	for (cardName in this.cards) {
		if ((cardName === "WHEAT_FIELD" || cardName === "BAKERY") && this.cards[cardName] === 1) {
			// decay, but never decay to 0
			if (this.cardWeights[cardName] > 1) {
				this.cardWeights[cardName]--;
			}
		} else {
			this.cardWeights[cardName]++;
		}
	}
};

Player.prototype.canBuyCard = function (cardName) {
	"use strict";
	var card = cards[cardName];
	return card.cost <= this.money && ! (card.color === colors.GREY && this.hasCard(cardName));
};

/**
 * @return Array of affordable card names
 */
Player.prototype.getAffordableCards = function (gameState) {
	"use strict";
	gameState.writeLog(this, "Evaluating affordable cards");
	var deck = gameState.deck;
	var card, cardName;
	var canAffordCards = [];
	for (cardName in globals.cards) {
		card = globals.cards[cardName];
		if (deck.hasOwnProperty(cardName) && deck[cardName] > 0 && this.canBuyCard(cardName)) {
			gameState.writeLog(this, "can afford " + cardName);
			canAffordCards.push(cardName);
		}
	}
	return canAffordCards;
};

Player.prototype.turn = function (gameState) {
	"use strict";
	
	var canAffordCards = this.getAffordableCards(gameState);

	if (canAffordCards.length > 0) {
		var buyCardName = this.pickBuyCard(canAffordCards);
		var buyCard = cards[buyCardName];

		if (buyCardName !== null) {
			gameState.writeLog(this, "buying " + buyCardName + " -> name " + buyCard.name);
			gameState.buyCard(buyCardName, this);
		}
	} else {
		gameState.writeLog(this, "cannot afford any cards");
	}
};

Player.prototype.hasCard = function (cardName) {
	"use strict";
	return this.cards.hasOwnProperty(cardName);
};

Player.prototype.pickBuyCard = function (canAffordCards) {
	"use strict";
	var cardName;
	var a = [];
	for (var i = 0; i < canAffordCards.length; i++) {
		cardName = canAffordCards[i];

		// add 1 card for each additional weight
		for (var j = 0; j < this.cardWeights[cardName]; j++) {
			a.push(cardName);
		}
	}
	if (a.length > 0) {
		return Math.randChoice(a);	
	} else {
		// this shouldn't really happen
		return null;
	}
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