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

	var Stolen = c.Stolen;
}

var states = {
	ROLL: "ROLL",
	BUY: "BUY",
	GG: "GAME_OVER"
};

var MachiKoroCtrl = function ($scope, $location, $anchorScroll, $timeout) {
	"use strict";


	this.STRICT = 10;
	this.DEBUG = 40;
	this.VERBOSE = 50;
	this.logLevel = this.DEBUG;

	this.playerNames = [
		"Daniel",
		"Sergei",
		"Alexey",
		"Ross"
	];

	this.humanPlayers = [];

	$scope.plusMoney = {};
	$scope.minusMoney = {};

	$scope.playerShown = null;
	$scope.animateDice = false;
	$scope.animateDiceInterval = 2500;

	$scope.scrollToCurrentPlayer = function (game) {
		var name = game.getCurrentPlayer().name;
		$location.hash(name);
		// console.log($location.hash());
		console.log("scrolling to " + name);
		$anchorScroll(name);
	};

	$scope.newGame = function (game) {
		if (game.state !== states.GG) {
			var yn = confirm("Are you sure you want to abandon this game?");
			if (yn) {
				var url = window.location.href.split("#")[0];
				window.location.href = url;
			}
		} else {
			var url = window.location.href.split("#")[0];
			window.location.href = url;
		}
	};

	/**
	 * Wrapper for AI turn on UI
	 */
	$scope.doTurn = function (game) {
		$scope.scrollToCurrentPlayer(game);
		game.doTurn();
		$scope.scrollToCurrentPlayer(game);
	};

	$scope.endHumanTurn = function (game) {
		game.evalStrat();
		$scope.scrollToCurrentPlayer(game);
	};

	/**
	 * Only call this on UI
	 */
	$scope.onLoad = function (game) {
		var s = window.location.search.split("?")[1];
		var name = s.split("=")[1];
		var idx = game.playerNames.indexOf(name)
		if (idx < 0) {
			console.log("Adding new player " + name);
			// displace one of the players at random
			idx = Math.randInt(0, this.playerNames.length);
			game.playerNames[idx] = name;
		} else {
			console.log("Replacing existing player " + name);
			game.humanPlayers.push(idx);
		}
		game.initGame();
	};

	/**
	 * For use in Angular visuals, not tied to gameplay
	 */
	$scope.getCardClass = function (cardName) {
		var card = cards[cardName];
		return {
			greyCard: card.color === colors.GREY,
			greenCard: card.color === colors.GREEN,
			blueCard: card.color === colors.BLUE,
			redCard: card.color === colors.RED,
			purpleCard: card.color === colors.PURPLE
		};
	};

	/**
	 * For use in Angular visuals, helper method
	 * Return name of card to display to user
	 */
	$scope.getCardName = function (cardName) {
		return cards[cardName].name;
	};

	/**
	 * For use in Angular visuals, helper method
	 */
	$scope.getCardCost = function (cardName) {
		return cards[cardName].cost;
	};

	$scope.getDeck = function (game) {
		var cardNames = Object.keys(game.deck);
		cardNames.sort(function (a, b) {
			return cards[a].cost - cards[b].cost;
		});
		return cardNames;
	};

	$scope.getDeckQty = function (game, cardName) {
		return game.deck[cardName];
	};

	/**
	 * For use in Angular visuals, helper method
	 * Return result as a comma-separated string
	 */
	$scope.getCardRolls = function (cardName) {
		return cards[cardName].roll.join(", ");
	};

	$scope.getPlayerCards = function (player) {
		return Object.keys(player.cards).map(function (cardName) {
			return cards[cardName];
		});
	};

	$scope.getSortedPlayerCards = function (player) {
		var cardNames = Object.keys(player.cards);
		cardNames.sort(function (a, b) {
			if (cards[a].color > cards[b].color) {
				return 1;
			} else {
				return -1;
			}
		});
		return cardNames;
	};

	$scope.getCardDescription = function (cardName) {
		return cards[cardName].description;
	};

	$scope.getCardQty = function (cardName, player) {
		return player.cards[cardName];
	};

	/**
	 * Ask the user whether they want a reroll.
	 * Called appropriately by other functions.
	 */
	$scope.decideHumanReroll = function (rollArray) {
		return !confirm("You rolled " + rollArray.join(", ") + ". Keep this roll?");
	};

	/**
	 * Ask the user how many dice they want to roll.
	 * Called appropriately by other functions.
	 */
	$scope.getHumanNumDice = function () {
		if ( confirm("Roll 2 dice? Cancel to roll 1.") ) {
			return 2;
		} else {
			return 1;
		}
	};

	$scope.getStealPlayerTargetMoney = function (gameState, numCoins) {
		var players = gameState.players;
		var name;
		do {
			name = prompt("Who do you want to steal " + numCoins + " coins from?");
		} while (this.getPlayerByName(name) !== null);
		return name;
	};

	/**
	 * TODO this is not working
	 */
	$scope.getStealPlayerTargetCard = function (gameState) {
		var players = gameState.players;
		var name;
		do {
			name = prompt("Who do you want to steal a card from?");
		} while (players.indexOf(name) < 0);
		return name;
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

	this.getHumanPlayers = function () {
		var arr = [];
		for (var i = 0; i < this.humanPlayers.length; i++) {
			arr.push(this.players[this.humanPlayers[i]]);
		}
		return arr;
	};

	this.isPlayerTurn = function (player) {
		var idx = this.players.indexOf(player);
		return idx === (this.turn % this.players.length);
	};

	this.getFactoryCategory = function (cardName) {
		switch(cardName) {
			case "CHEESE_FACTORY":
				return categories.PIG;
			case "FURNITURE_FACTORY":
				return categories.GEAR;
			case "PRODUCE_MARKET":
				return categories.WHEAT;
		}
	};

	/**
	 * Return amt generated by a factory with given name
	 */
	this.evalFactory = function (player, cardName, cardYield) {
		var targetCategory = this.getFactoryCategory(cardName);
		var numCard = player.cards[cardName];
		var count = 0;
		for (var cName in player.cards) {
			if (cards[cName].category === targetCategory) {
				count += player.cards[cName];
			}
		}
		var totalYield = numCard * count * cardYield;
		this.writeLog(player, numCard + " x " + cardName + " generated " + totalYield + " coins due to " + count + " " + targetCategory + " cards");
		return totalYield;
	};

	$scope.animateEarnMoney = function (player, amt) {
		$scope.plusMoney[player.name] = amt;
		$timeout(function () {
			$scope.plusMoney[player.name] = null;
		}, 3200);
	};

	this.earnMoney = function (player, amt) {
		if (this.hasHumanPlayers()) {
			$scope.animateEarnMoney(player, amt);
		}
		player.money += amt;
	};

	this.evalCard = function (cardName, player, cafeBakeryBonus, playerTurn, stolen) {
		var card = cards[cardName];
		var cardYield = card.card_yield;
		var numCard = player.cards[cardName];

		if (card.category === categories.CAFE || card.category === categories.BAKERY) {
			cardYield += cafeBakeryBonus;
			if (cafeBakeryBonus > 0) {
				this.writeLog(player, "Card " + cardName + " gets +" + cafeBakeryBonus + " bonus");
			}
		}

		switch(card.color) {
			case colors.GREEN:
				if (card.isFactory()) {
					var totalYield = this.evalFactory(player, cardName, cardYield);
					this.earnMoney(player, totalYield);
				} else {
					this.writeLog(player, "Got " + (cardYield * numCard) + " coins from " + numCard + " x " + cardName);
					this.earnMoney(player, cardYield * numCard);
				}
				break;
			case colors.BLUE:
				this.writeLog(player, "Got " + (cardYield * numCard) + " coins from " + numCard + " x " + cardName);
				this.earnMoney(player, cardYield * numCard);
				break;
			case colors.PURPLE:
				switch (cardName) {
					case "STADIUM":
						this.writeLog(player, "Stole " + (cardYield * numCard) + " coins from each player using " + numCard + " x " + cardName);
						var s = new Stolen("all", cardYield * numCard, null);
						stolen.push(s);
						break;
					case "TV_STATION":
						var targetPlayer;
						for (var t = 0; t < numCard; t++) {
							if (player.isHuman) {
								targetPlayer = $scope.getStealPlayerTargetMoney(this, cardYield);
							} else {
								targetPlayer = player.getStealPlayerTargetMoney(this, cardYield);
							}
							this.writeLog(player, "Stole " + cardYield + " coins from " + targetPlayer + " using " + cardName);
							var s = new Stolen(targetPlayer, cardYield, null);
							stolen.push(s);
						}
						break;
					// TODO - missing a purple here
				}
				break;
			case colors.RED:
				this.writeLog(player, "Stole " + (cardYield * numCard) + " coins from current player using " + numCard + " x " + cardName);
				var s = new Stolen("current", cardYield * numCard, null);
				stolen.push(s);
				break;
			case colors.GREY:
				// do nothing
				break;
		}
		return stolen;
	};

	this.getCardYield = function (player, cardName) {
		var card = cards[cardName];
		var numCard = player.cards[cardName];
		var cardYield = card.card_yield;
		var cafeBakeryBonus = 0;
		var y = null;

		if (player.hasCard("SHOPPING_MALL")) {
			cafeBakeryBonus = 1;
		}

		if (card.category === categories.CAFE || card.category === categories.BAKERY) {
			cardYield += cafeBakeryBonus;
		}

		switch(card.color) {
			case colors.GREEN:
				if (card.isFactory()) {
					var totalYield = this.evalFactory(player, cardName, cardYield);
					y = new Yield("your_turn", totalYield, "normal");
				} else {
					var totalYield = cardYield * numCard;
					y = new Yield("your_turn", totalYield, "normal");
				}
				break;
			case colors.BLUE:
				var totalYield = cardYield * numCard;
				y = new Yield("all_turns", totalYield, "normal");
				break;
			case colors.PURPLE:
				switch (cardName) {
					case "STADIUM":
						var totalYield = cardYield * numCard;
						y = new Yield("your_turn", totalYield, "steal_all");
						break;
					case "TV_STATION":
						var totalYield = cardYield * numCard;
						y = new Yield("your_turn", totalYield, "steal_one");
						break;
					// TODO - missing a purple here
				}
				break;
			case colors.RED:
				var totalYield = (cardYield * numCard);
				y = new Yield("others_turn", totalYield, "steal_current");
				break;
			case colors.GREY:
				// do nothing
				break;
		}
		return y;
	};

	/**
	 * Evaluate dice roll for green and blue cards, and return how much is stolen, if any, for red cards and purple cards
	 * @return stolen array, of Stolen obj
	 */
	this.evalDiceRoll = function (player, diceRoll) {
		var playerTurn = this.isPlayerTurn(player);
		var stolen = [];
		var cafeBakeryBonus = 0;
		if (player.hasCard("SHOPPING_MALL")) {
			cafeBakeryBonus = 1;
		}

		for (var cardName in player.cards) {
			if (player.cards.hasOwnProperty(cardName)) {
				var card = cards[cardName];

				if (card.hasEffect(diceRoll, playerTurn)) {
					this.evalCard(cardName, player, cafeBakeryBonus, playerTurn, stolen);
				}
			}
		}

		return stolen;
	};

	/**
	 * Roll a single die and return the result (1-6)
	 */
	this.rollDie = function () {
		return Math.ceil(Math.random() * 6);
	};

	/**
	 * Return an array of dice rolls. If n is not specified, query how many dice to roll.
	 * For human player, query with UI. For bot, ask the decision engine.
	 * 
	 * @param  {Number} n 	optional - number of dice to roll
	 * @return {Array}    	Array of dice roll results
	 */
	this.getDiceRoll = function (n) {
		var currentPlayer = this.getCurrentPlayer();
		var numDice;
		if (n) {
			numDice = n;
		} else if (currentPlayer.isHuman && currentPlayer.canRollTwoDice()) {
			numDice = $scope.getHumanNumDice();
		} else {
			numDice = currentPlayer.getNumDice();
		}
		var rollArray = [];
		for (var i = 0; i < numDice; i++) {
			rollArray.push(this.rollDie());
		}
		return rollArray;
	};

	$scope.animateDiceRoll = function () {
		$scope.animateDice = true;
		$timeout(function () {
			$scope.animateDice = false;
		}, $scope.animateDiceInterval);
	};

	/**
	 * Roll the dice.
	 * Called at the beginning of a player's turn.
	 * Evaluate card effects.
	 */
	this.rollDice = function (n) {
		if (this.hasHumanPlayers()) {
			$scope.animateDice = false;
		}

		var player = this.getCurrentPlayer();
		var rollArray = this.getDiceRoll(n);

		if (this.hasHumanPlayers()) {
			$scope.animateDiceRoll();
		}

		if (player.hasCard("RADIO_TOWER")) {
			if (player.isHuman) {
				if ($scope.decideHumanReroll(rollArray)) {
					rollArray = this.getDiceRoll(rollArray.length);
				}
			} else {
				if (player.decideReroll(rollArray)) {
					rollArray = this.getDiceRoll(rollArray.length);
				}
			}
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
			if (stolen[p.name] !== []) {
				isStolen = true;
			}
		}

		var cp = this.getCurrentPlayer();

		if (isStolen) {
			this.writeLog(cp, "Evaluating stolen array", this.DEBUG);
			var idx = (this.turn % this.players.length);

			for (var k = 0; k < this.players.length; k++) {
				var p = this.players[(idx + k) % this.players.length];
				var stolenArr = stolen[p.name];

				for (var j = 0; j < stolenArr.length; j++) {
					this.evalStolen(cp, p, stolenArr[j]);
				}
			}
		}

		this.state = states.BUY;
	};

	$scope.animateStealMoney = function (fromPlayer, toPlayer, amt) {
		$scope.minusMoney[fromPlayer.name] = amt;
		$scope.plusMoney[toPlayer.name] = amt;
		$timeout(function () {
			$scope.minusMoney[fromPlayer.name] = null;
			$scope.plusMoney[toPlayer.name] = null;
		}, 3200);
	}

	this.stealMoney = function (fromPlayer, toPlayer, amt) {
		var m = Math.min(amt, fromPlayer.money);
		this.writeLog(toPlayer, "Stole " + m + " coins from " + fromPlayer.name);
		fromPlayer.money -= m;
		toPlayer.money += m;

		if (this.hasHumanPlayers()) {
			$scope.animateStealMoney(fromPlayer, toPlayer, amt);
		}
	};

	this.evalStolen = function (currentPlayer, player, stolen) {
		switch (stolen.category) {
			case "all":
				for (var i = 0; i < this.players.length; i++) {
					var p = this.players[i];
					if (p !== player) {
						this.stealMoney(p, player, stolen.amt);
					}
				}
				break;
			case "current":
				var cp = this.getCurrentPlayer();
				this.stealMoney(cp, player, stolen.amt);
				break;
			default:
				var targetPlayer = this.getPlayerByName(stolen.category);
				if (targetPlayer !== null) {
					this.stealMoney(targetPlayer, player, stolen.amt);
				}
				break;
		}
	};

	/**
	 * Return player object if found, null otherwise
	 */
	this.getPlayerByName = function (name) {
		for (var i = 0; i < this.players.length; i++) {
			if (this.players[i].name === name) {
				return this.players[i];
			}
		}
		return null;
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
				var wp = this.players[i];
				this.writeLog(wp, wp.name + " has won the game!");
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
			if (this.state === states.GG) {
				var winningPlayer = this.getCurrentPlayer();
				this.writeLog(winningPlayer, winningPlayer.name + " won the game!");
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

	this.canBuyCard = function (cardName, player) {
		return player.canBuyCard(cardName) && this.deck[cardName] > 0 && this.state === states.BUY;
	};

	/**
	 * Buy the card, then deal it to the player
	 */
	this.buyCard = function (cardName, player) {
		if (! this.canBuyCard(cardName, player)) {
			return;
		}

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

		for (var i = 0; i < this.playerNames.length; i++) {
			var p = new Player(this.playerNames[i], this.weights);
			this.players.push(p);
		}

		for (var i = 0; i < this.humanPlayers.length; i++) {
			var idx = this.humanPlayers[i];
			this.players[idx].isHuman = true;
			console.log("Set " + this.players[idx].name + " to human");
		}

		for (var i = 0; i < this.players.length; i++) {
			this.dealCard("WHEAT_FIELD", this.players[i]);
			this.dealCard("BAKERY", this.players[i]);
		}
	};

	this.writeLog = function (player, msg, logLevel) {
		"use strict";
		if (! logLevel) {
			logLevel = this.STRICT;
		}
		if (this.logLevel >= logLevel) {
			if (this.bonusTurn) {
				console.log("[" + player.name + " on turn " + this.turn + " (bonus)] " + msg);
			} else {
				console.log("[" + player.name + " on turn " + this.turn + "] " + msg);
			}
		}
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
};

if (! exports) {
	exports = {};
}
exports.MachiKoroCtrl = MachiKoroCtrl;