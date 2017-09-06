//------------------------------------------------------------------------------
//        Map Colorings
//------------------------------------------------------------------------------

MapColoring = {};

//------------------------------------------------------------------------------
// Helper function for map coloring
// Returns a function for that terrain rendering function that colors a map from
// low color to high color based on a property that should be a
// range from 0 to 1
//
// params:
//    low (String): Hex color for the low color range
//    high (String): Hex color for the high color range
//    prop (String): Property to base the coloring range on
//
// returns: (function) the coloring function to be sent to the terrain rendering

MapColoring.rampColoring = function(low, high, prop) {
  function colorFn(center) {
    return Util.strToHex(Util.lerpColor(low, high, center[prop]))
  };
  return colorFn
}

//------------------------------------------------------------------------------
// Polygon Colorings

MapColoring.biomeColoring = function(center) {
  return Util.strToHex(DefaultColors[center.biome])
}

MapColoring.geoProvinceColoring = function(center) {
  return Util.strToHex(DefaultColors[center.geoProvince]);
}

MapColoring.elevationColoring = MapColoring.rampColoring(DefaultColors.black, DefaultColors.white, 'elevation');

MapColoring.moistureColoring = MapColoring.rampColoring(DefaultColors.coast, DefaultColors.land, 'moisture');

MapColoring.temperatureColoring = MapColoring.rampColoring(DefaultColors.cold, DefaultColors.hot, 'temperature');

MapColoring.livingConditionsColoring = MapColoring.rampColoring(DefaultColors.bad, DefaultColors.good, 'livingCondition');

MapColoring.white = function(center) {
  return 0xFFFFFF;
}

