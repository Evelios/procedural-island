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

  setUp();

  generateRandom();
}

function setUp() {
  var form = document.getElementById('form');
  var elements = form.elements;

  for ( var i = 0; i < form.elements.length; i++ ) {
    var e = elements[i];
    if (e.name != 'pointSeed' || e.name != 'mapSeed') {
      elements[i].onchange = function() {
        update();
      }
    }
  }
}

function update() {
  readForm();
  render();
}

function readForm() {
  var form = document.getElementById('form');
  var elements = form.elements;

  for ( var i = 0; i < form.elements.length; i++ ) {
    var e = form.elements[i];
    var value = e.type == 'checkbox' ? e.checked : e.value;
    var name = e.name;

    if (e.type == 'radio') {
      if (e.checked) {
        data[name] = value;
      }
    } else {
      data[name] = value;
    }

  }
}

// Generation Functions

function generateRandom() {

  var pointSeed = Util.randInt(0, Number.MAX_SAFE_INTEGER);
  document.getElementById('pointSeed').value = pointSeed;

  var mapSeed = Util.randInt(0, Number.MAX_SAFE_INTEGER);
  document.getElementById('mapSeed').value = mapSeed;

  createMap(pointSeed, mapSeed);
}

function generate() {

  var pointSeed = parseInt(document.getElementById('pointSeed').value) || 0;
  var mapSeed = parseInt(document.getElementById('mapSeed').value) || 0;

  createMap(pointSeed, mapSeed);
}

function createMap(pointSeed, mapSeed) {
  data.map = new Map(data.width, data.height, data.numPoints, pointSeed, mapSeed);
  update();
}

// Render Functions

function render() {

  if (data.drawMap == 'biome') {
    drawMap();
  } else if (data.drawMap == 'groProvinces') {
    drawMap();
    drawGeoProvinces();
  } else if (data.drawMap == 'elevation') {
    drawElevation();
  } else {
    print('something went wrong');
  }

  if (data.diagram) {
    drawDiagram();
  }
  if (data.plates) {
    drawPlates();
  }
  if (data.boundaries) {
    drawPlateBoundaries();
  }
  if (data.plateTypes) {
    drawPlateTypes();
  }
}

// Drawing Functions

function drawMap() {
  data.map.drawColor(data.screen);
}

function drawGeoProvinces() {
  data.map.drawGeoProvinces(data.screen);
}

function drawElevation() {
  data.map.drawElevation(data.screen);
}

function drawPlates() {
  data.map.drawPlates(data.screen);
}

function drawPlateBoundaries() {
  data.map.drawPlateBoundaries(data.screen);
}


function drawDiagram() {
  data.map.drawDiagram(data.screen);
}

function drawPlateTypes() {
  data.map.drawPlateTypes(data.screen);
}
