// This file is a module to the map.js function
// The purpose of this module is to create biomes based off the
// Moisture, Temperature. and Elevation data

var Biomes = {};

//------------------------------------------------------------------------------
// Get the biome based on the elevation and temperature data in the polygon
// Biomes are based on a modified Whittaker diagram

Biomes.getBiome = function(center) {
    var moisture = center.moisture;
    var temp = center.temperature;

    if (center.ocean) {
        return 'ocean';
    } else if (center.water) {
        if (temp > 0.8) {
            return 'marsh';
        } else if (temp < 0.1) {
            return 'ice';
        } else {
            return 'water';
        }
    } else if (center.coast) {
        return 'beach';
    } else if (temp < 0.25) {
        if (moisture > 0.5) return 'snow';
        else if (moisture > 0.17) return 'tundra';
        else return 'bare';
    } else if (temp < 0.5) {
        if (moisture > 0.67) return 'taiga';
        else if (moisture > 0.33) return 'shrubland';
        else return 'temperate desert';
    } else if (temp < 0.75) {
        if (moisture > 0.83) return 'temperate rainforest';
        else if (moisture > 0.5) return 'temperate deciduous';
        else if (moisture > 0.17) return 'grassland';
        else return 'temperate desert';
    } else {
        if (moisture > 0.67) return 'tropical rainforest';
        else if (moisture > 0.33) return 'tropical seasonal forest';
        else if (moisture > 0.17) return 'grassland';
        else return 'subtropic desert';
    }
}

//------------------------------------------------------------------------------
// Assign corner biomes based off of the Whittaker diagram

Biomes.assignCornerBiomes = function(map) {
    for (var i = 0; i < map.corners.length; i++) {
        var corner = map.corners[i];

        corner.biome = Biomes.getBiome(corner);
    }
}

//------------------------------------------------------------------------------
// Assign center biomes based off of the Whittaker diagram

Biomes.assignCenterBiomes = function(map) {
    for (var i = 0; i < map.centers.length; i++) {
        var center = map.centers[i];

        center.biome = Biomes.getBiome(center);
    }
}