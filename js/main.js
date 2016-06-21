data = {};

function main() {

  // Grab the div hook and insert a blank html canvas
  var div = document.getElementById('jsHook');
  var canvas = document.createElement('canvas');
  div.appendChild(canvas);

  var size = 500;
  canvas.height = 400;
  canvas.width = 800;
  data.height = canvas.height;
  data.width = canvas.width;

  data.numPoints = 1000;
  data.pointSeed = 0;
  data.mapSeed = 0;

  var backgroundColor = 'white';
  var screen = canvas.getContext('2d');
  data.screen = screen;

  // Clear the screen
  screen.fillStyle = backgroundColor;
  screen.fillRect(0, 0, canvas.width, canvas.height);

  generateRandom();
  drawMap();
}

function generateRandom() {

  var pSeed = Util.randInt(0, Number.MAX_SAFE_INTEGER);
  document.getElementById('pSeed').value = pSeed;

  var mSeed = Util.randInt(0, Number.MAX_SAFE_INTEGER);
  document.getElementById('mSeed').value = mSeed;
  
  createMap(pSeed, mSeed);
}

function generate() {

  var pSeed = parseInt(document.getElementById('pSeed').value) || 0;
  var mSeed = parseInt(document.getElementById('mSeed').value) || 0;

  createMap(pSeed, mSeed);  
}

function createMap(pSeed, mSeed) {
  data.map = new Map(data.width, data.height, data.numPoints, pSeed, mSeed);
  drawMap();
}

function drawMap() {
  data.map.drawColor(data.screen);
}

function drawPlates() {
  data.map.drawPlates(data.screen);
}

function drawPlateBoundaries() {
  data.map.drawPlateBoundaries(data.screen);
}

function drawGeoProvences() {
  data.map.drawGeoProvences(data.screen);
}

function drawDiagram() {
  data.map.drawDiagram(data.screen);
}

function drawPlateTypes() {
  data.map.drawPlateTypes(data.screen);
}
