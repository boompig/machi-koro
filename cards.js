"use strict";

/**
 * @param category: ['all', 'current', <name>]
 * @param amt: Amount to steal
 * @param card: name of card to steal, or null
 */
function Stolen (category, amt, card) {
	this.category = category;
	this.amt = amt;
	this.card = card;
}

/**
 * A card in the game of Machi Koro
 */
function Card (name, cost, card_yield, color, roll, category) {
	this.name = name;
	this.cost = cost;
	this.card_yield = card_yield;
	this.color = color;
	this.roll = roll;
	this.category = category;
}

/**
 * Evaluate whether this card has an effect given:
 * 1. dice roll
 * 2. whether it is the player's turn or not
 */
Card.prototype.hasEffect = function (diceRoll, isPlayerTurn) {
	if (! this.roll.contains(diceRoll)) {
		return false;
	}

	return (isPlayerTurn && (this.color === colors.GREEN || this.color === colors.PURPLE)) || 
		   (this.color === colors.BLUE) ||
		   (!isPlayerTurn && this.color === colors.RED);
};

Card.prototype.isGrey = function () {
	// console.log(this);
	return this.color === colors.GREY;
};

var categories = {
	WHEAT: "WHEAT",
	PIG: "PIG",
	CAFE: "CAFE",
	BAKERY: "BAKERY",
	FACTORY: "FACTORY",
	GEAR: "GEAR",
	TOWER: "TOWER",
	// different symbol from other factories
	PRODUCE_FACTORY: "PRODUCE_FACTORY"
};

var colors = {
	GREEN: "green",
	BLUE: "blue",
	RED: "red",
	PURPLE: "purple",
	GREY: "grey"
};

/**
 * These are the in-play game cards
 * TODO these do not include purple cards
 */
var cards = {
	WHEAT_FIELD: new Card("wheat field", 1, 1, colors.BLUE, [1], categories.WHEAT),
	LIVESTOCK_FARM: new Card("livestock farm", 1, 1, colors.BLUE, [2], categories.PIG),
	BAKERY: new Card("bakery", 1, 1, colors.GREEN, [2, 3], categories.BAKERY),
	CAFE: new Card("cafe", 2, 1, colors.RED, [3], categories.CAFE),
	CONVENIENCE_STORE: new Card("convenience store", 2, 3, colors.GREEN, [4], categories.BAKERY),
	FOREST: new Card("forest", 3, 1, colors.BLUE, [5], categories.GEAR),
	CHEESE_FACTORY: new Card("cheese factory", 5, 3, colors.GREEN, [7], categories.FACTORY),
	FURNITURE_FACTORY: new Card("furniture factory", 3, 3, colors.GREEN, [8], categories.FACTORY),
	MINE: new Card("mine", 6, 5, colors.BLUE, [9], categories.GEAR),
	RESTAURANT: new Card("restaurant", 3, 2, colors.RED, [9, 10], categories.CAFE),
	APPLE_ORCHARD: new Card("apple orchard", 3, 3, colors.BLUE, [10], categories.WHEAT),
	PRODUCE_MARKET: new Card("produce market", 2, 2, colors.GREEN, [11, 12], categories.PRODUCE_FACTORY),

	STADIUM: new Card("stadium", 6, 2, colors.PURPLE, [6], categories.TOWER),
	TV_STATION: new Card("TV station", 7, 5, colors.PURPLE, [6], categories.TOWER),
	// BUSINESS_COMPLEX: new Card("business complex", 8, 0, colors.PURPLE, [6], categories.TOWER),

	TRAIN_STATION: new Card("train station", 4, 0, colors.GREY, [], categories.TOWER),
	SHOPPING_MALL: new Card("shopping mall", 10, 0, colors.GREY, [], categories.TOWER),
	AMUSEMENT_PARK: new Card("amusement park", 16, 0, colors.GREY, [], categories.TOWER),
	RADIO_TOWER: new Card("radio tower", 22, 0, colors.GREY, [], categories.TOWER)
};

var exports = exports || null;
if (exports) {
	exports.cards = cards;
	exports.colors = colors;
	exports.categories = categories;
	exports.Card = Card;
	exports.Stolen = Stolen;
}