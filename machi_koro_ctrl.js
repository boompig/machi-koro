function writeLog(player, gameState, msg) {
	console.log("[" + player.name + " on turn " + gameState.turn + "] " + msg);
}

var states = {
	ROLL: "ROLL",
	BUY: "BUY",
	NEXT: "NEXT",
	GG: "GAME_OVER"
}

var app = angular.module("MachiKoroSimul", []);
app.controller("MachiKoroCtrl", function ($scope) {
	"use strict";

	$scope.getCardClass = function (cardName) {
		var card = cards[cardName];
		return {
			greyCard: card.color === colors.GREY,
			greenCard: card.color === colors.GREEN,
			blueCard: card.color === colors.BLUE
		}
	};

	this.players = [
		new Player("Sergei"),
		new Player("Alexey"),
		new Player("Ross"),
		new Player("Daniel")
	];

	this.deck = {};
	this.turn = 0;
	this.lastRoll = null;

	/**
	 * See states obj
	 */
	this.state = states.ROLL;

	this.isPlayerTurn = function (player) {
		var idx = this.players.indexOf(player);
		return idx === (this.turn % this.players.length);
	};

	this.evalDiceRoll = function (player, diceRoll) {
		var playerTurn = this.isPlayerTurn(player);

		for (var cardName in player.cards) {
			if (player.cards.hasOwnProperty(cardName)) {
				var card = cards[cardName];

				if (card.hasEffect(diceRoll, playerTurn)) {
					//TODO for now just add yield to player's money, which doesn't quite work
					player.money += card.card_yield;
				}
			}
		}
	};

	this.rollDie = function () {
		return Math.ceil(Math.random() * 6);
	}

	this.rollDice = function () {
		var player = this.getCurrentPlayer();
		var diceRoll;
		if (player.getNumDice() === 1) {
			diceRoll = this.rollDie();
		} else {
			diceRoll = this.rollDie() + this.rollDie();
		}

		writeLog(player, this, "rolled " + diceRoll);
		this.lastRoll = diceRoll;

		for (var i = 0; i < this.players.length; i++) {
			this.evalDiceRoll(this.players[i], diceRoll);
		}

		this.state = states.BUY;
	};

	/**
	 * Return current player based on turn
	 */
	this.getCurrentPlayer = function () {
		return this.players[this.turn % this.players.length];
	};

	this.evalStrat = function () {
		var player = this.getCurrentPlayer();
		player.turn(this);

		for (var i = 0; i < this.players.length; i++) {
			if (this.players[i].points === 4) {
				this.state = states.GG;
				return;
			}
		}
		this.state = states.NEXT;
	};

	this.nextTurn = function () {
		this.turn++;
		this.state = states.ROLL;
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
			}
		}
	};

	/**
	 * Buy the card, then deal it to the player
	 */
	this.buyCard = function (cardName, player) {
		var card = cards[cardName];
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

		for (var i = 0; i < this.players.length; i++) {
			console.log(this.players[i]);
			this.players[i].money = 0;
			this.players[i].points = 0;
			this.players[i].cards = {};
			// console.log(this.players[i].cards);

			this.dealCard("WHEAT_FIELD", this.players[i]);
			this.dealCard("BAKERY", this.players[i]);
			// console.log(this.players[i].cards);
		}
	};

	this.initGame();
});