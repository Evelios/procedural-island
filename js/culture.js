// This file is a module to the map.js function

var Culture = {};

Culture.assignCulture = function(map) {
	Culture.assignCornerLivingConditions(map);
	map.assignPolygonAverage('livingCondition');
}

//------------------------------------------------------------------------------
// Favorable conditions are low elevation, moderate temperature and high moisture

Culture.assignCornerLivingConditions = function(map) {
	for (var i = 0; i < map.corners.length; i++) {
		var corner = map.corners[i];

		if (corner.water || corner.coast) {
			corner.livingCondition = 0;
			continue;
		}

		// All variables should be in the range from 0 - 1,
		// with 0 being not favorable and 1 being the most hospitable
		var m = corner.moisture;
		// var m = corner.moisture < 0.5 ? corner.moisture : 1 - corner.moisture;
		// m *= 2;

		var t = corner.temperature < 0.5 ? corner.temperature : 1 - corner.temperature;
		t *= 2;

		var e = 1 - corner.elevation;

		corner.livingCondition = m / 3 + t / 3 + e / 3;
	}
}
