function Player (name) {
	"use strict";
	this.name = name;
	this.cards = {};
	this.money = 0;
	this.points = 0;
}

Player.prototype.canBuyCard = function (cardName) {
	"use strict";
	var card = cards[cardName];
	return card.cost <= this.money && ! (card.color === colors.GREY && this.hasCard(cardName));
}

Player.prototype.turn = function (gameState) {
	"use strict";
	// basically perform some sort of strategy...
	// for now, buy a random card that I can afford

	// all cards which I can afford and are still available
	var canAffordCards = [];

	var deck = gameState.deck;
	var card, cardName;

	for (cardName in cards) {
		card = cards[cardName];
		if (deck.hasOwnProperty(cardName) && deck[cardName] > 0 && this.canBuyCard(cardName)) {
			canAffordCards.push(cardName);
		}
	}

	if (canAffordCards.length > 0) {
		for (var i = 0; i < canAffordCards.length; i++) {
			writeLog(this, gameState, "can afford " + canAffordCards[i]);
		}

		var idx = randInt(0, canAffordCards.length);
		var buyCardName = canAffordCards[idx];
		var buyCard = cards[buyCardName];

		writeLog(this, gameState, "buying " + buyCardName);
		if (cards[buyCardName].color === colors.GREY) {
			this.points++;
		}
		gameState.buyCard(buyCardName, this);
	} else {
		writeLog(this, gameState, "cannot afford any cards");
	}
};

Player.prototype.hasCard = function (cardName) {
	"use strict";
	return this.cards.hasOwnProperty(cardName);
};

/**
 * Return number of dice for this player to roll
 */
Player.prototype.getNumDice = function () {
	"use strict";
	if (this.hasCard("train station")) {
		return 2;
	} else {
		return 1;
	}
};