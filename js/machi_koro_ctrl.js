// eslint-disable-next-line
/* global window, confirm, prompt */

if (typeof require === "function") {
	// eslint-disable-next-line
	require("./utils.js");

	// then command-line invocation
	// eslint-disable-next-line
	var p = require("./player.js");
	var Player = p.Player;

	// eslint-disable-next-line
	var c = require("./cards.js");
	var cards = c.cards;
	var colors = c.colors;
	var categories = c.categories;

	var Stolen = c.Stolen;
	var Yield = c.Yield;
}

const states = {
	ROLL: "ROLL",
	BUY: "BUY",
	GG: "GAME_OVER"
};

const MachiKoroCtrl = function ($scope, $location, $anchorScroll, $timeout) {
	"use strict";


	this.SILENT = 10;
	this.DEFAULT = 30;
	this.DEBUG = 40;
	this.VERBOSE = 50;
	this.logLevel = this.DEBUG;

	this.playerNames = [
		"Daniel",
		"Sergei",
		"Alexey",
		"Ross",
	];

	this.humanPlayers = [];

	$scope.plusMoney = {};
	$scope.minusMoney = {};

	$scope.playerShown = null;
	$scope.animateDice = false;
	$scope.animateDiceInterval = 2000;

	this.setLogLevel = function (logLevel) {
		switch (logLevel) {
			case "quiet":
			case "silent":
				this.logLevel = this.SILENT;
				break;
			case "default":
				this.logLevel = this.DEFAULT;
				break;
			case "verbose":
				this.logLevel = this.VERBOSE;
				break;
		}
	};

	$scope.scrollToCurrentPlayer = function (game) {
		let name = game.getCurrentPlayer().name;
		$location.hash(name);
		// console.log($location.hash());
		console.log("scrolling to " + name);
		$anchorScroll(name);
	};

	$scope.newGame = function (game) {
		if (game.state !== states.GG) {
			const yn = confirm("Are you sure you want to abandon this game?");
			if (yn) {
				const url = window.location.href.split("#")[0];
				window.location.href = url;
			}
		} else {
			const url = window.location.href.split("#")[0];
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
		let url = new URL(window.location.href);
		let name = url.searchParams.get("name");
		if(name) {
			// prettify the name of the player
			name = name[0].toUpperCase() + name.substr(1).toLowerCase();
			let idx = game.playerNames.indexOf(name);
			if (idx < 0) {
				console.log("Adding new player " + name);
				// displace one of the players at random
				idx = Math.randInt(0, game.playerNames.length);
				game.playerNames[idx] = name;
				game.humanPlayers.push(idx);
			} else {
				console.log("Replacing existing player " + name);
				game.humanPlayers.push(idx);
			}
		} else {
			console.warn("Name must be set to play.");
		}
		game.initGame();
	};

	/**
	 * For use in Angular visuals, not tied to gameplay
	 */
	$scope.getCardClass = function (cardName) {
		let card = cards[cardName];
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
		let cardNames = Object.keys(game.deck);
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
		let cardNames = Object.keys(player.cards);
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
		let name;
		do {
			name = prompt("Who do you want to steal " + numCoins + " coins from?");
		} while (this.getPlayerByName(name) !== null);
		return name;
	};

	/**
	 * TODO this is not working
	 */
	$scope.getStealPlayerTargetCard = function (gameState) {
		let players = gameState.players;
		let name;
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
		let arr = [];
		for (let i = 0; i < this.humanPlayers.length; i++) {
			arr.push(this.players[this.humanPlayers[i]]);
		}
		return arr;
	};

	this.isPlayerTurn = function (player) {
		let idx = this.players.indexOf(player);
		return idx === (this.turn % this.players.length);
	};

	this.getFactoryCategory = function (cardName) {
		switch (cardName) {
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
		const targetCategory = this.getFactoryCategory(cardName);
		const numCard = player.cards[cardName];
		let count = 0;
		for (let cName in player.cards) {
			if (cards[cName].category === targetCategory) {
				count += player.cards[cName];
			}
		}
		const totalYield = numCard * count * cardYield;
		// this.writeLog(player, numCard + " x " + cardName + " generated " + totalYield + " coins due to " + count + " " + targetCategory + " cards");
		return totalYield;
	};

	$scope.animateEarnMoney = function (player, amt) {
		$scope.plusMoney[player.name] = amt;
		$timeout(function () {
			$scope.plusMoney[player.name] = null;
		}, 3200);
	};

	this.earnMoney = function (player, amt) {
		player.money += amt;
	};

	/**
	 * @param {String} cardName 		Name of the card to evaluate
	 * @param {Player} player 			Player who owns the card
	 * @param {Number} cafeBakeryBonus	Bonus (if any) to bakeries/cafes owned by this player
	 * @param {Boolean} playerTurn		True iff it's this player's turn
	 * @param {Array}	stolen 			Array of Stolen objects
	 *
	 * @return Total amount earned via this card, if any
	 */
	this.evalCard = function (cardName, player, cafeBakeryBonus, playerTurn, stolen) {
		let card = cards[cardName];
		let cardYield = card.card_yield;
		let numCard = player.cards[cardName];
		let totalYield = 0;

		if (card.category === categories.CAFE || card.category === categories.BAKERY) {
			cardYield += cafeBakeryBonus;
			if (cafeBakeryBonus > 0) {
				this.writeLog(player, "Card " + cardName + " gets +" + cafeBakeryBonus + " bonus");
			}
		}

		switch (card.color) {
			case colors.GREEN: {
				if (card.isFactory()) {
					totalYield = this.evalFactory(player, cardName, cardYield);
					this.earnMoney(player, totalYield);
				} else {
					totalYield = cardYield * numCard;
					this.writeLog(player, "Got " + totalYield + " coins from " + numCard + " x " + cardName);
					this.earnMoney(player, totalYield);
				}
				break;
			}
			case colors.BLUE: {
				totalYield = (cardYield * numCard);
				this.writeLog(player, "Got " + totalYield + " coins from " + numCard + " x " + cardName);
				this.earnMoney(player, totalYield);
				break;
			}
			case colors.PURPLE: {
				switch (cardName) {
					case "STADIUM": {
						this.writeLog(player, "Stole " + (cardYield * numCard) + " coins from each player using " + numCard + " x " + cardName);
						const s = new Stolen("all", cardYield * numCard, null);
						stolen.push(s);
						break;
					}
					case "TV_STATION": {
						let targetPlayer;
						for (let t = 0; t < numCard; t++) {
							if (player.isHuman) {
								targetPlayer = $scope.getStealPlayerTargetMoney(this, cardYield);
							} else {
								targetPlayer = player.getStealPlayerTargetMoney(this, cardYield);
							}
							this.writeLog(player, "Stole " + cardYield + " coins from " + targetPlayer + " using " + cardName);
							const s = new Stolen(targetPlayer, cardYield, null);
							stolen.push(s);
						}
						break;
						// TODO - missing a purple here
					}
				}
				break;
			}
			case colors.RED: {
				this.writeLog(player, "Stole " + (cardYield * numCard) + " coins from current player using " + numCard + " x " + cardName);
				let s = new Stolen("current", cardYield * numCard, null);
				stolen.push(s);
				break;
			}
			case colors.GREY: {
				// do nothing
				break;
			}
		}
		return totalYield;
	};

	this.getTwoDiceLikelihood = function (card) {
		let l = 0;
		for (let i = 0; i < card.roll.length; i++) {
			let d = card.roll[i];
			// distance from 7
			let dist = Math.abs(7 - d);
			// distance from 7 is distance from 6/36
			let pts = 6 - dist;
			l += (1.0 / 36.0) * pts;
		}
		return l;
	};

	this.getOneDiceLikelihood = function (card) {
		let l = 0;
		for (let i = 0; i < card.roll.length; i++) {
			if (card.roll[i] <= 6) {
				l += (1.0 / 6.0);
			}
		}
		return l;
	};

	/**
	 * Returns object { 1: <number to 2 decimals>, 2: <number to 2 decimals> }
	 */
	this.getPlayerExpectedValueYourTurn = function (player) {
		let v = { 1: 0, 2: 0 }, e;
		for (let cardName in player.cards) {
			if (player.cards[cardName] > 0) {
				e = this.getCardExpectedValueYourTurn(player, cardName);
				v[1] += e[1];
				v[2] += e[2];
			}
		}
		return v;
	};

	/**
	 * Returns object { 1: <number to 2 decimals>, 2: <number to 2 decimals> }
	 */
	this.getPlayerExpectedValueAllTurns = function (player) {
		let v = { 1: 0, 2: 0 }, e;
		for (let cardName in player.cards) {
			if (player.cards[cardName] > 0) {
				e = this.getCardExpectedValueAllTurns(player, cardName);
				v[1] += e[1];
				v[2] += e[2];
			}
		}
		return v;
	};

	/**
	 * Returns object { 1: <number to 2 decimals>, 2: <number to 2 decimals> }
	 */
	this.getCardExpectedValueYourTurn = function (player, cardName) {
		let cYield = this.getCardYield(player, cardName);
		let card = cards[cardName];
		if (cYield === null || cYield.condition === "others_turn" || cYield.amt === 0) {
			return { 1 : 0, 2 : 0 };
		}

		let likelihoodOne = this.getOneDiceLikelihood(card);
		let expOne = likelihoodOne * cYield.amt;

		let likelihoodTwo = this.getTwoDiceLikelihood(card);
		let expTwo = likelihoodTwo * cYield.amt;

		return {
			1: Math.round(expOne * 100) / 100,
			2: Math.round(expTwo * 100) / 100
		};
	};

	/**
	 * this returns likelihood on another person's turn
	 * Returns object { 1: <number to 2 decimals>, 2: <number to 2 decimals> }
	 */
	this.getCardExpectedValueAllTurns = function (player, cardName) {
		let cYield = this.getCardYield(player, cardName);
		let card = cards[cardName];
		if (cYield === null || cYield.condition === "your_turn" || cYield.amt === 0) {
			return { 1 : 0, 2 : 0 };
		}
		// one dice context - the likelihood is the # of elements in roll
		let likelihoodOne = this.getOneDiceLikelihood(card);
		let expOne = likelihoodOne * cYield.amt;

		let likelihoodTwo = this.getTwoDiceLikelihood(card);
		let expTwo = likelihoodTwo * cYield.amt;

		return {
			1: Math.round(expOne * 100) / 100,
			2: Math.round(expTwo * 100) / 100
		};
	};

	/**
	 * Returns null for grey cards, Yield object for all other cards
	 */
	this.getCardYield = function (player, cardName) {
		let card = cards[cardName];
		let numCard = player.cards[cardName];
		let cardYield = card.card_yield;
		let cafeBakeryBonus = 0;
		let y = null;
		let totalYield;

		if (player.hasCard("SHOPPING_MALL")) {
			cafeBakeryBonus = 1;
		}

		if (card.category === categories.CAFE || card.category === categories.BAKERY) {
			cardYield += cafeBakeryBonus;
		}

		switch(card.color) {
			case colors.GREEN:
				if (card.isFactory()) {
					let totalYield = this.evalFactory(player, cardName, cardYield);
					y = new Yield("your_turn", totalYield, "normal");
				} else {
					let totalYield = cardYield * numCard;
					y = new Yield("your_turn", totalYield, "normal");
				}
				break;
			case colors.BLUE:
				totalYield = cardYield * numCard;
				y = new Yield("all_turns", totalYield, "normal");
				break;
			case colors.PURPLE:
				switch (cardName) {
					case "STADIUM":
						totalYield = cardYield * numCard;
						y = new Yield("your_turn", totalYield, "steal_all");
						break;
					case "TV_STATION":
						totalYield = cardYield * numCard;
						y = new Yield("your_turn", totalYield, "steal_one");
						break;
					// TODO - missing a purple here
				}
				break;
			case colors.RED:
				totalYield = (cardYield * numCard);
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
		let playerTurn = this.isPlayerTurn(player);
		let stolen = [];
		let cafeBakeryBonus = 0;
		if (player.hasCard("SHOPPING_MALL")) {
			cafeBakeryBonus = 1;
		}
		let total = 0;

		for (let cardName in player.cards) {
			if (player.cards[cardName]) {
				let card = cards[cardName];

				if (card.hasEffect(diceRoll, playerTurn)) {
					total += this.evalCard(cardName, player, cafeBakeryBonus, playerTurn, stolen);
				}
			}
		}

		if (this.hasHumanPlayers() && total > 0) {
			$scope.animateEarnMoney(player, total);
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
		let currentPlayer = this.getCurrentPlayer();
		let numDice;
		if (n) {
			numDice = n;
		} else if (currentPlayer.isHuman && currentPlayer.canRollTwoDice()) {
			numDice = $scope.getHumanNumDice();
		} else {
			numDice = currentPlayer.getNumDice();
		}
		let rollArray = [];
		for (let i = 0; i < numDice; i++) {
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

		let player = this.getCurrentPlayer();
		let rollArray = this.getDiceRoll(n);

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
		let diceRoll = rollArray.reduce(function(a, b) { return a + b; });

		this.writeLog(player, "rolled " + rollArray.join(", "));
		this.lastRoll = rollArray;
		let stolen = {};
		let isStolen = false;
		let p;

		for (let i = 0; i < this.players.length; i++) {
			p = this.players[i];
			stolen[p.name] = this.evalDiceRoll(this.players[i], diceRoll);
			if (stolen[p.name] !== []) {
				isStolen = true;
			}
		}

		let cp = this.getCurrentPlayer();

		if (isStolen) {
			this.writeLog(cp, "Evaluating stolen array", this.DEBUG);
			let idx = (this.turn % this.players.length);

			for (let k = 0; k < this.players.length; k++) {
				let p = this.players[(idx + k) % this.players.length];
				let stolenArr = stolen[p.name];

				for (let j = 0; j < stolenArr.length; j++) {
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
	};

	this.stealMoney = function (fromPlayer, toPlayer, amt) {
		let m = Math.min(amt, fromPlayer.money);
		this.writeLog(toPlayer, "Stole " + m + " coins from " + fromPlayer.name);
		fromPlayer.money -= m;
		toPlayer.money += m;

		if (this.hasHumanPlayers()) {
			$scope.animateStealMoney(fromPlayer, toPlayer, amt);
		}
	};

	this.evalStolen = function (currentPlayer, player, stolen) {
		switch (stolen.category) {
			case "all": {
				for (let i = 0; i < this.players.length; i++) {
					let p = this.players[i];
					if (p !== player) {
						this.stealMoney(p, player, stolen.amt);
					}
				}
				break;
			}
			case "current": {
				let cp = this.getCurrentPlayer();
				this.stealMoney(cp, player, stolen.amt);
				break;
			}
			default: {
				let targetPlayer = this.getPlayerByName(stolen.category);
				if (targetPlayer !== null) {
					this.stealMoney(targetPlayer, player, stolen.amt);
				}
				break;
			}
		}
	};

	/**
	 * Return player object if found, null otherwise
	 */
	this.getPlayerByName = function (name) {
		for (let i = 0; i < this.players.length; i++) {
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
		let player = this.getCurrentPlayer();
		if (! player.isHuman) {
			// do AI for non-human players
			player.turn(this);
		}

		// check for victory, abort if found
		for (let i = 0; i < this.players.length; i++) {
			// I'm doing >=, because I've had weird bugs in the past where victory condition doesn't register
			if (this.players[i].points >= 4) {
				this.state = states.GG;
				let wp = this.players[i];
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

	/**
	 * Deal the player the given card.
	 * Remove 1 of the card from the deck.
	 */
	this.dealCard = function (cardName, player) {
		this.deck[cardName]--;
		if (! player.cards[cardName]) {
			player.cards[cardName] = 0;
		}
		player.cards[cardName]++;
	};

	/**
	 * Transfer the card from the deck to the player, *without* removing it from the deck.
	 */
	this.giveCard = function (cardName, player) {
		if (! player.cards[cardName]) {
			player.cards[cardName] = 0;
		}
		player.cards[cardName]++;
	};

	this.doTurn = function () {
		if (this.state === states.GG)
			return;

		if (this.state === states.ROLL) {
			this.rollDice();
			this.evalStrat();
			if (this.state === states.GG) {
				let winningPlayer = this.getCurrentPlayer();
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
	 * @return True iff card was bought
	 */
	this.buyCard = function (cardName, player) {
		if (! this.canBuyCard(cardName, player)) {
			return false;
		}

		let card = cards[cardName];

		player.money -= card.cost;
		this.dealCard(cardName, player);
		player.saveBuyCard(cardName);

		// evaluate points after saving card
		if (card.color === colors.GREY) {
			player.points++;
		} else if (card.color === colors.PURPLE) {
			player.purpleCardCount++;
		}
		return true;
	};

	this.initGame = function () {
		this.lastRoll = null;
		this.state = states.ROLL;

		// create the deck
		this.deck = {};
		for (let cardName in cards) {
			if (cards[cardName]) {
				if (cards[cardName].color === colors.GREY) {
					// supply is functionally infinite
					this.deck[cardName] = 1000;
				} else {
					this.deck[cardName] = 6;
				}
			}
		}

		this.turn = 0;

		for (let i = 0; i < this.playerNames.length; i++) {
			let p = new Player(this.playerNames[i], this.weights);
			this.players.push(p);
		}

		for (let i = 0; i < this.humanPlayers.length; i++) {
			let idx = this.humanPlayers[i];
			this.players[idx].isHuman = true;
			console.log("Set " + this.players[idx].name + " to human");
		}

		// shuffle players to get randomized start order
		Math.shuffle(this.players);

		for (let i = 0; i < this.players.length; i++) {
			this.giveCard("WHEAT_FIELD", this.players[i]);
			this.giveCard("BAKERY", this.players[i]);
		}
	};

	this.writeLog = function (player, msg, logLevel) {
		if (! logLevel) {
			logLevel = this.DEFAULT;
		}
		if (this.logLevel >= logLevel) {
			if (this.bonusTurn) {
				console.log("[" + player.name + " on turn " + this.turn + " (bonus)] " + msg);
			} else {
				console.log("[" + player.name + " on turn " + this.turn + " with " + player.points + " points and " + player.money + " coins] " + msg);
			}
		}
	};

	/**
	 * @return true iff the game has at least 1 human player
	 */
	this.hasHumanPlayers = function () {
		for (let i = 0; i < this.players.length; i++) {
			if (this.players[i].isHuman) {
				return true;
			}
		}
		return false;
	};
};

if (typeof(exports) === "undefined" || exports === null) {
	var exports = {};
}
exports.MachiKoroCtrl = MachiKoroCtrl;
