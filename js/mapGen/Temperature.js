//------------------------------------------------------------------------------
// This file is a module to the map.js function
// The purpose of this module is to create a temperature map to overlay

var Temperature = {};

//------------------------------------------------------------------------------
// Helper function to assign the temperature given a location. The function
// is a cosine function from top to bottom for cold-hot-cold distribution.
// The width and starting location of the function is random, and it is further
// purturbed by another noise function to add more variety in the temperature.
//
// params:
//      point(Vector): The position to sample the temperature function at
//
// returns (Number): The temperature at that point in the range from 0 - 1

Temperature.getTemperature = function(map, point) {

    function turbulance(x, y, size) {
        var initialSize = size;
        var value = 0;
        while (size >= 1) {
            value += noise.perlin2(x / size, y / size) * size;
            size /= 2;
        }
        return value / initialSize;
    }

    var x = point.x / map.width;
    var y = point.y / map.height;

    var xPeriod = map.temp.xPeriod;
    var yPeriod = 1;
    var turbPower = 1;
    var turbSize = 16;
    var scaleFactor = 50;

    var xy = xPeriod * x + yPeriod * y;

    noise.seed(map.temp.t1Seed);
    var turb = turbPower * turbulance(x * scaleFactor, y * scaleFactor, turbSize);

    var transform = map.temp.transform;
    var translation = map.temp.translation;

    // var intensity = (-Math.cos(xy * (2 * Math.PI + transform) + translation + turb) + 1) / 2;
    var intensity = 1 - Math.abs(Math.cos(xy * (Math.PI + transform) + translation + turb));

    noise.seed(map.temp.seed);
    var variability = turbPower * turbulance(x * scaleFactor, y * scaleFactor, turbSize);
    variability = (variability + 1) / 2;

    var result = intensity;

    return result;
}

//------------------------------------------------------------------------------
// Initilize the parameters for the temperature function and then assign all
// the corner temperatures basd on that function.

Temperature.assignCornerTemperatures = function(map) {

    // Initilize parameters for the temperature function
    map.temp = {}

    map.temp.seed = Util.rand();

    map.temp.xPeriod = Util.randRange(-0.2, 0.2);

    map.temp.transform = Util.randRange(-Math.PI, 0);
    var halfTransf = map.temp.transform / 2;
    // Center the transform and move across the possible period of the function
    // The outputs are skewed towards the center of the range
    map.temp.translation = -halfTransf +
        Math.pow(Util.randRange(-Math.cbrt(halfTransf), Math.cbrt(halfTransf)), 3);

    // Get individual polygon temperatures

    for (var i = 0; i < map.corners.length; i++) {
        var corner = map.corners[i];

        var temp = Temperature.getTemperature(map, corner.position);
        corner.temperature = temp * (0.5 + (1 - corner.elevation) / 2);
    }
}