data = {};

// Color Assignments
colors = {};

// Others
colors.black = '#000000';
colors.white = '#FFFFFF';
colors.gray = '#A0A0A0';
colors.lightGray = '#E0E0E0';
colors.magenta = '#FF00FF';
colors.bad = '#FF6666'
colors.good = '#33FF33'

// Genaric Biomes
colors.water = '#74BBFD';
colors.land = '#99CC99';
colors.mountain = '#CCFFFF';
colors.coast = '#EBE0C0';
colors.ocean = '#4864DB';

// Plate Boundaries
colors.convergent = '#FF0000';
colors.transform = '#00FF00';
colors.divergent = '#0000FF';

// Geo Provinces
colors.oceanCrust = '#99CCFF';
colors.craton = '#FF99FF';
colors.orogen = '#66FFB2';
colors.basin = '#9999FF';

// Temperatures
colors.hot = '#FF9933';
colors.cold = '#66B2FF';

// Biomes
// ocean already decalred
colors.marsh = '#37B596';
colors.ice = '#BDFFFF';
colors.beach = '#F8EFBD';
colors.snow = '#FFF3FC';
colors.tundra ='#B9D271';
colors.bare = '#B5AD8B';
colors.taiga = '#A8C95F';
colors.shrubland = '#A3CA7C';
colors['temperate desert'] = '#E8DF91';
colors['temperate rainforest'] = '#45B33B';
colors['temperate deciduous'] = '#7BC16E';
colors.grassland = '#ADD37D';
colors['tropical rainforest'] = '#23A336';
colors['tropical seasonal forest'] = '#57BB57';
colors['subtropic desert'] = '#F4EEA4';

//------------------------------------------------------------------------------
// Main Function Call

function main() {
  data.width = 800;
  data.height = 400;

  data.numPoints = 8000;

  data.maxSeed = 49682;
  data.pointSeed = 33113;
  data.mapSeed = 57173;
  data.currPSeed = data.pointSeed;
  data.currMSeed = data.pointMap;
  //randSeeds();

  // Rendering Properties
  data.render = {};
  data.render.mapTypes = ['Biome', 'Geological Provinces','Elevation', 'Moisture',
    'Temperature', 'Living Conditions'];
  data.render.map = data.render.mapTypes[0];

  data.render.draw3d = true;
  data.render.rivers = true;
  data.render.smooth = false;
  data.render.polygon = false;
  data.render.coast = false;
  data.render.windVectors = false;
  data.render.plateBoundaries = false;
  data.render.towns = false;

  Draw3D.setUp3d(data);

  setUpGUI();

  // Run the map generator
  generate();

}

//------------------------------------------------------------------------------
// Initilize the gui with all the tuneable parameters

function setUpGUI() {
  var gui = new dat.GUI();

  var functions = {
    'Generate Map': generate,
    'Generate Random': generateRandom,
  };

  gui.add(functions, 'Generate Map');
  gui.add(functions, 'Generate Random');

  var paramsFolder = gui.addFolder('Parameters');

  paramsFolder.add(data, 'pointSeed').name('Point Seed').listen();
  paramsFolder.add(data, 'mapSeed').name('Map Seed').listen();
  paramsFolder.add(data, 'numPoints').name('Number of Points');
  paramsFolder.add(data, 'width').name('Width');
  paramsFolder.add(data, 'height').name('Height');

  var rendFolder = gui.addFolder('Rendering');

  rendFolder.add(data.render, 'map', data.render.mapTypes).name('Map Types').onChange(Draw3D.render);
  rendFolder.add(data.render, 'draw3d').name('Draw 3D').onChange(Draw3D.render);
  rendFolder.add(data.render, 'rivers').name('Rivers').onChange(Draw3D.render);
  rendFolder.add(data.render, 'smooth').name('Smooth').onChange(Draw3D.render);
  rendFolder.add(data.render, 'polygon').name('Polygon').onChange(Draw3D.render);
  rendFolder.add(data.render, 'coast').name('Coast').onChange(Draw3D.render);
  rendFolder.add(data.render, 'windVectors').name('Wind').onChange(Draw3D.render);
  // rendFolder.add(data.render, 'plateBoundaries').name('Plate Boundaries').onChange(render);
  // rendFolder.add(data.render, 'towns').name('Towns').onChange(render);
}

//------------------------------------------------------------------------------
// Generation Functions

function randSeeds() {
  Math.seedrandom();
  data.pointSeed = Util.randInt(0, data.maxSeed);
  data.mapSeed = Util.randInt(0, data.maxSeed);
}

function generateRandom() {
  randSeeds();
  createMap();
  Draw3D.render(data);
}

function generate() {
  createMap();
  Draw3D.render(data);
}

function createMap() {
  data.currPSeed = data.pointSeed;
  data.currMSeed = data.mapSeed;
  // Create map
  data.map = new Map(data.width, data.height, data.numPoints,
    data.pointSeed, data.mapSeed);
  // Run map modules
  Culture.assignCulture(data.map);
}
