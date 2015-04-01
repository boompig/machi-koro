Array.prototype.contains = function (item) {
	return this.indexOf(item) >= 0;
};

/**
 * Pick a random integer in the half-open interval [a, b)
 */
Math.randInt = function (a, b) {
	return Math.floor(Math.random() * (b - a)) + a;
};

Math.randChoice = function (arr) {
	return arr[Math.floor(Math.random() * arr.length)];
};