"use strict";

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

	return (isPlayerTurn && this.color === colors.GREEN) || 
		   (this.color === colors.BLUE) ||
		   (!isPlayerTurn && this.color === colors.RED)
};

Card.prototype.isGrey = function () {
	// console.log(this);
	return this.color === colors.GREY;
}

var categories = {
	WHEAT: 1,
	PIG: 2,
	CAFE: 3,
	BAKERY: 4,
	FACTORY: 5,
	GEAR: 6,
	TOWER: 7,
	// different symbol from other factories
	PRODUCE_FACTORY: 8,
	// grey victory cards
	VICTORY: 9
};

var colors = {
	GREEN: "green",
	BLUE: "blue",
	RED: "red",
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
	// CAFE: new Card("cafe", 2, 1, colors.RED, [3], categories.CAFE),
	CONVENIENCE_STORE: new Card("convenience store", 2, 3, colors.GREEN, [4], categories.BAKERY),
	FOREST: new Card("forest", 3, 1, colors.GREEN, [5], categories.GEAR),
	CHEESE_FACTORY: new Card("cheese factory", 5, 3, colors.GREEN, [7], categories.FACTORY),
	FURNITURE_FACTORY: new Card("furniture factory", 3, 3, colors.GREEN, [8], categories.FACTORY),
	MINE: new Card("mine", 6, 5, colors.BLUE, [9], categories.GEAR),
	// RESTAURANT: new Card("restaurant", 3, 2, colors.RED, [9, 10], categories.CAFE),
	APPLE_ORCHARD: new Card("apple orchard", 3, 3, colors.BLUE, [10], categories.WHEAT),
	PRODUCE_MARKET: new Card("produce market", 2, 2, colors.GREEN, [11, 12], categories.PRODUCE_FACTORY),

	TRAIN_STATION: new Card("train station", 4, 0, colors.GREY, [], categories.VICTORY),
	SHOPPING_MALL: new Card("shopping mall", 10, 0, colors.GREY, [], categories.VICTORY),
	AMUSEMENT_PARK: new Card("amusement park", 16, 0, colors.GREY, [], categories.VICTORY),
	RADIO_TOWER: new Card("radio tower", 22, 0, colors.GREY, [], categories.VICTORY)
};