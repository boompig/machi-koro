"use strict";

/**
 * @param target: One of 'your_turn', 'all_turns', 'others_turn'
 * @param amt: Amt that the card yields
 * @param yieldType: 'normal' or 'stolen'
 */
function Yield (condition, amt, yieldType) {
	this.condition = condition;
	this.amt = amt;
	this.yieldType = yieldType;
}

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
function Card (name, cost, card_yield, color, roll, category, description) {
	this.name = name;
	this.cost = cost;
	this.card_yield = card_yield;
	this.color = color;
	this.roll = roll;
	this.category = category;
	this.description = description;
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

Card.prototype.isFactory = function () {
	return this.category === categories.FACTORY || this.category === categories.PRODUCE_FACTORY;
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
	WHEAT_FIELD: new Card("Wheat Field", 1, 1, colors.BLUE, [1], categories.WHEAT, "Receive 1 coin from the bank regardless of whose turn it is."),
	LIVESTOCK_FARM: new Card("Livestock Farm", 1, 1, colors.BLUE, [2], categories.PIG, "Receive 1 coin from the bank regardless of whose turn it is."),
	BAKERY: new Card("Bakery", 1, 1, colors.GREEN, [2, 3], categories.BAKERY, "Receive 1 coin from the bank if it’s your turn."),
	CAFE: new Card("Cafe", 2, 1, colors.RED, [3], categories.CAFE, "Receive 1 coin from any player who rolls this number."),
	CONVENIENCE_STORE: new Card("Convenience Store", 2, 3, colors.GREEN, [4], categories.BAKERY, "Receive 3 coins from the bank if it’s your turn."),
	FOREST: new Card("Forest", 3, 1, colors.BLUE, [5], categories.GEAR),
	CHEESE_FACTORY: new Card("Cheese Factory", 5, 3, colors.GREEN, [7], categories.FACTORY),
	FURNITURE_FACTORY: new Card("Furniture Factory", 3, 3, colors.GREEN, [8], categories.FACTORY),
	MINE: new Card("Mine", 6, 5, colors.BLUE, [9], categories.GEAR),
	RESTAURANT: new Card("Restaurant", 3, 2, colors.RED, [9, 10], categories.CAFE),
	APPLE_ORCHARD: new Card("Apple Orchard", 3, 3, colors.BLUE, [10], categories.WHEAT),
	PRODUCE_MARKET: new Card("Produce Market", 2, 2, colors.GREEN, [11, 12], categories.PRODUCE_FACTORY),

	STADIUM: new Card("Stadium", 6, 2, colors.PURPLE, [6], categories.TOWER),
	TV_STATION: new Card("TV Station", 7, 5, colors.PURPLE, [6], categories.TOWER),
	// BUSINESS_COMPLEX: new Card("business complex", 8, 0, colors.PURPLE, [6], categories.TOWER),

	TRAIN_STATION: new Card("Train Station", 4, 0, colors.GREY, [], categories.TOWER),
	SHOPPING_MALL: new Card("Shopping Mall", 10, 0, colors.GREY, [], categories.TOWER),
	AMUSEMENT_PARK: new Card("Amusement Park", 16, 0, colors.GREY, [], categories.TOWER),
	RADIO_TOWER: new Card("Radio Tower", 22, 0, colors.GREY, [], categories.TOWER)
};

var exports = exports || null;
if (exports) {
	exports.cards = cards;
	exports.colors = colors;
	exports.categories = categories;
	exports.Card = Card;
	exports.Stolen = Stolen;
}