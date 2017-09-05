data = {};

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
    'Temperature', 'Living Conditions', 'White'];
  data.render.map = data.render.mapTypes[0];

  data.render.draw3d = true;
  data.render.rivers = true;
  data.render.smooth = false;
  data.render.polygon = false;
  data.render.coast = false;
  data.render.windVectors = false;
  data.render.plateBoundaries = false;
  data.render.towns = false;

  // var renderer = new Render2D("canvas");

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

  rendFolder.add(data.render, 'map', data.render.mapTypes).name('Map Types').onChange(render);
  rendFolder.add(data.render, 'draw3d').name('Draw 3D').onChange(render);
  rendFolder.add(data.render, 'rivers').name('Rivers').onChange(render);
  rendFolder.add(data.render, 'smooth').name('Smooth').onChange(render);
  rendFolder.add(data.render, 'polygon').name('Polygon').onChange(render);
  rendFolder.add(data.render, 'coast').name('Coast').onChange(render);
  rendFolder.add(data.render, 'windVectors').name('Wind').onChange(render);
  // rendFolder.add(data.render, 'plateBoundaries').name('Plate Boundaries').onChange(render);
  // rendFolder.add(data.render, 'towns').name('Towns').onChange(render);
}

//------------------------------------------------------------------------------
// Generation Functions

function render() {
  Draw3D.render(data)
}

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

  mapParams = {
    "Height"     : data.height,
    "Width"      : data.width,
    "Points"     : data.numPoints,
    "Map Seed"   : data.mapSeed,
    "Point Seed" : data.pointSeed
  }

  // Create map
  data.map = new Map(mapParams);
  
  // Run map modules
  Culture.assignCulture(data.map);
}
