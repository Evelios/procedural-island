//------------------------------------------------------------------------------
// This file is a module to the map.js function
// The purpose of this module is to generate weather patterns which help to
// determine the heat and moisture patterns

var Weather = {};

//------------------------------------------------------------------------------
// This is a helper function which is used to get the wind vector at a 
// particular location. Collectively this can be put together to generate a 
// vector field. The goal is to simulate on a large scale the hadley cells
// which produce the large scale wind patterns as well as simulating some
// small scale weather patterns to create more interest on the map
//
// params:
//  map (Map) the map object to create the vector field on
//  point (Vector) the location at which to get the wind vector
//
// returns:
//  (Vector) The wind speed at that point with a magnitude in the range 0-1


Weather.getWindVector = function(map, point) {

    // The large scale weather pattern
    // There are 6 hadley cells in an ideal weather pattern
    var x = Math.sin(-6*Math.PI * Math.abs(point.y / map.height));
    var y = Math.sin(-6*Math.PI * point.y / map.height);

    // Local variations in weather pattern
    x += 0;
    y += 0;

    // Ensure that local variations don't exceed the boundaries
    x = Util.clamp(x, -1, 1);
    y = Util.clamp(y, -1, 1);

    // Make sure that the vector is normalized in the range 0-1
    return new Vector(x, y).divide(Math.SQRT2);
}

//------------------------------------------------------------------------------
// Uses getWindVector helper function to assign the wind speed to all the ocrner
// tiles to the corner.wind property

Weather.assignCornerWindSpeed = function(map) {
    for (i = 0; i < map.corners.length; i++) {
        var corner = map.corners[i];

        corner.wind = Weather.getWindVector(map, corner.position);
    }
}