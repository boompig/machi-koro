if (require) {
	require("./utils.js");

	// then command-line invocation
	var p = require("./player.js");
	var Player = p.Player;

	var c = require("./cards.js");
	var cards = c.cards;
	var colors = c.colors;
	var categories = c.categories;
	var Card = c.Card;
}

var states = {
	ROLL: "ROLL",
	BUY: "BUY",
	NEXT: "NEXT",
	GG: "GAME_OVER"
};

var MachiKoroCtrl = function ($scope) {
	"use strict";

	/**
	 * For use in Angular visuals, not tied to gameplay
	 */
	$scope.getCardClass = function (cardName) {
		var card = cards[cardName];
		return {
			greyCard: card.color === colors.GREY,
			greenCard: card.color === colors.GREEN,
			blueCard: card.color === colors.BLUE,
			redCard: card.color === colors.RED
		}
	};

	/**
	 * For use in Angular visuals, helper method
	 */
	$scope.getCardCost = function (cardName) {
		return cards[cardName].cost;
	};

	/**
	 * For use in Angular visuals, helper method
	 * Return result as a comma-separated string
	 */
	$scope.getCardRolls = function (cardName) {
		return cards[cardName].roll.join(", ");
	};

	// used for AI
	this.weights = {};

	this.players = [
		
	];


	this.deck = {};
	this.turn = 0;
	this.lastRoll = null;
	// keep track of extra turn for AMUSEMENT_PARK
	this.bonusTurn = false;

	/**
	 * See states obj
	 */
	this.state = states.ROLL;

	this.isPlayerTurn = function (player) {
		var idx = this.players.indexOf(player);
		return idx === (this.turn % this.players.length);
	};

	/**
	 * Evaluate dice roll for green and blue cards, and return how much is stolen, if any, for red cards
	 */
	this.evalDiceRoll = function (player, diceRoll) {
		var playerTurn = this.isPlayerTurn(player);
		var stolen = 0;
		var cafe_bakery_bonus = 0;
		if (player.hasCard("SHOPPING_MALL")) {
			cafe_bakery_bonus = 1
		}

		for (var cardName in player.cards) {
			if (player.cards.hasOwnProperty(cardName)) {
				var card = cards[cardName];
				var cardYield = card.card_yield;

				if (card.category === categories.CAFE || card.category === categories.BAKERY) {
					cardYield += cafe_bakery_bonus;
					if (cafe_bakery_bonus > 0 && card.hasEffect(diceRoll, playerTurn)) {
						this.writeLog(player, "Card " + cardName + " gets +" + cafe_bakery_bonus + " bonus");
					}
				}

				if (card.hasEffect(diceRoll, playerTurn)) {
					//TODO
					if (card.category === categories.FACTORY || card.category === categories.PRODUCE_FACTORY) {
						var targetCat;
						switch(cardName) {
							case "CHEESE_FACTORY":
								targetCat = categories.PIG;
								break;
							case "FURNITURE_FACTORY":
								targetCat = categories.GEAR;
								break;
							case "PRODUCE_MARKET":
								targetCat = categories.WHEAT;
								break;
						}

						// count the number of things of this category
						var count = 0;
						var numCard = player.cards[cardName];
						for (var c in player.cards) {
							if (cards[c].category === targetCat) {
								count += player.cards[c];
							}
						}

						this.writeLog(player, numCard + " x " + cardName + " generated " + numCard * count * cardYield + " coins due to " + count + " " + targetCat + " cards");
						player.money += (numCard * count * cardYield);
					} else if (card.color === colors.RED) {
						stolen += cardYield;
					} else {
						player.money += cardYield;
					}
				}
			}
		}

		return stolen;
	};

	this.rollDie = function () {
		return Math.ceil(Math.random() * 6);
	};

	this.getDiceRoll = function () {
		var currentPlayer = this.getCurrentPlayer();
		var numDice = currentPlayer.getNumDice();
		var rollArray = [];
		for (var i = 0; i < numDice; i++) {
			rollArray.push(this.rollDie());
		}
		return rollArray;
	};

	this.rollDice = function () {
		var player = this.getCurrentPlayer();
		var rollArray = this.getDiceRoll();
		if (player.hasCard("RADIO_TOWER") && player.decideReroll(rollArray)) {
			rollArray = this.getDiceRoll();
		}
		var diceRoll = rollArray.reduce(function(a, b) { return a + b; });

		this.writeLog(player, "rolled " + rollArray.join(", "));
		this.lastRoll = rollArray;
		var stolen = {};
		var isStolen = false;
		var p;

		for (var i = 0; i < this.players.length; i++) {
			p = this.players[i];
			stolen[p.name] = this.evalDiceRoll(this.players[i], diceRoll);
			if (stolen[p.name] > 0) {
				isStolen = true;
			}
		}

		if (isStolen) {
			// console.log("stolen:");
			// console.log(stolen);
			var idx = (this.turn % this.players.length);
			var cp = this.getCurrentPlayer();
			if (cp.money > 0) {
				for (var k = 1; k < this.players.length - 1; k++) {
					var p = this.players[(idx + k) % this.players.length];
					if (stolen[p.name] === 0) continue;
					var m = Math.min(stolen[p.name], cp.money);
					this.writeLog(cp, p.name + " stole " + m + " from " + cp.name);
					p.money += m;
					cp.money -= m;
					if (cp.money === 0) {
						break;
					}
				}
			} else {
				this.writeLog(cp, "stealing failed because " + cp.name + " is broke");
			}
		}

		this.state = states.BUY;
	};

	/**
	 * @return current player based on turn
	 */
	this.getCurrentPlayer = function () {
		return this.players[this.turn % this.players.length];
	};

	/**
	 * Function called after a roll, in the following ways:
	 * 		if AI, right after the roll
	 * 		if human, after finishing buying cards
	 * 	This function will evaluate end-of-turn conditions
	 */
	this.evalStrat = function () {
		var player = this.getCurrentPlayer();
		if (! player.isHuman) {
			// do AI for non-human players
			player.turn(this);
		}

		// check for victory, abort if found
		for (var i = 0; i < this.players.length; i++) {
			if (this.players[i].points === 4) {
				this.state = states.GG;
				return;
			}
		}

		// check for doubles and AMUSEMENT_PARK
		if (player.hasCard("AMUSEMENT_PARK") && !this.bonusTurn && this.rolledDoublesLast()) {
			this.state = states.ROLL;
			this.bonusTurn = true;
		} else {
			this.bonusTurn = false;
			this.turn++;
			this.state = states.ROLL;
		}
	};

	this.rolledDoublesLast = function () {
		return this.lastRoll !== null && this.lastRoll.length === 2 && this.lastRoll[0] === this.lastRoll[1];
	};

	this.dealCard = function (cardName, player) {
		var card = cards[cardName];
		this.deck[cardName]--;
		if (! player.cards.hasOwnProperty(cardName)) {
			player.cards[cardName] = 0;
		}
		player.cards[cardName]++;
	};

	this.doTurn = function () {
		if (this.state === states.ROLL) {
			this.rollDice();
			this.evalStrat();
			if (this.state === states.NEXT) {
				this.nextTurn();
			} else {
				var winningPlayer = this.getCurrentPlayer();
				this.writeLog(winningPlayer, winningPlayer.name + " won the game!");

				// winningPlayer.feedbackCardWeights();
				// console.log("stratGroup = " + winningPlayer.stratGroup);
				// console.log(winningPlayer.cardWeights);
			}
		}
	};

	this.skipBotTurns = function () {
		while (! this.getCurrentPlayer().isHuman && this.state === states.ROLL) {
			this.doTurn();
		}
	};

	this.playGame = function () {
		while (this.state === states.ROLL) {
			this.doTurn();
		}
	};

	/**
	 * Buy the card, then deal it to the player
	 */
	this.buyCard = function (cardName, player) {
		var card = cards[cardName];
		if (card.color === colors.GREY) {
			player.points++;
		}
		player.money -= card.cost;
		this.dealCard(cardName, player);
	};

	this.initGame = function () {
		this.lastRoll = null;
		this.state = states.ROLL;

		// create the deck
		this.deck = {};
		for (var cardName in cards) {
			if (cards.hasOwnProperty(cardName)) {
				this.deck[cardName] = 6;
			}
		}

		this.turn = 0;

		this.players = [
			new Player("Sergei", "1", this.weights),
			new Player("Alexey", "2", this.weights),
			new Player("Ross", "4", this.weights),
			new Player("Daniel", "3", this.weights)
		];

		for (var i = 0; i < this.players.length; i++) {
			this.dealCard("WHEAT_FIELD", this.players[i]);
			this.dealCard("BAKERY", this.players[i]);
		}
	};

	this.writeLog = function (player, msg) {
		"use strict";
		console.log("[" + player.name + " on turn " + this.turn + "] " + msg);
	};

	/**
	 * @return true iff the game has at least 1 human player
	 */
	this.hasHumanPlayers = function () {
		for (var i = 0; i < this.players.length; i++) {
			if (this.players[i].isHuman) {
				return true;
			}
		}
		return false;
	};

	this.initGame();
};

if (! exports) {
	exports = {};
}
exports.MachiKoroCtrl = MachiKoroCtrl;