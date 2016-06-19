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

  generate();
  drawMap();
}

function generate() {

  data.map = new Map(data.width, data.height, data.numPoints);
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

function drawDiagram() {
  data.map.drawDiagram(data.screen);
}
