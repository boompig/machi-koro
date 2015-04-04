function getPlayerName () {
	var params = window.location.search.split("?")[1];
	if (! params) {
		return null;
	}
	var name = params.split("=")[1];
	return name;
}

var pageName = "visuals.html";

if (getPlayerName() === null && window.location.href.indexOf(pageName) > 0) {
	var url = window.location.href.replace(pageName, "")
	window.location.href = url;
}

var app = angular.module("MachiKoroSimul", [])
				.controller("MachiKoroCtrl", MachiKoroCtrl);