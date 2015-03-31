Array.prototype.contains = function (item) {
	return this.indexOf(item) >= 0;
};

/**
 * Pick a random integer in the half-open interval [a, b)
 */
function randInt(a, b) {
	return Math.floor(Math.random() * (b - a)) + a;
}