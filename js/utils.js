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

/**
 * Take from here: http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
 */
Math.shuffle = function (array) {
	var currentIndex = array.length, temporaryValue, randomIndex ;

	// While there remain elements to shuffle...
	while (0 !== currentIndex) {

		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

	return array;
};