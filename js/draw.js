var Draw = {}

Draw.setStroke = function(screen, color) {
	if (color) {
		screen.strokeStyle = color;
	}
}

Draw.setFill = function(screen, color) {
	if (color) {
		screen.fillStyle = color;
	}
}

// http://stackoverflow.com/questions/7812514/drawing-a-dot-on-html5-canvas
Draw.point = function(screen, position, color) {
	// Draws a point on the screen

	Draw.setStroke(screen, color);
	screen.lineWidth = 1.0;
	screen.strokeRect(position.x, position.y, 1, 1);
}

// http://www.html5canvastutorials.com/tutorials/html5-canvas-line-width/
Draw.line = function(screen, p1, p2, color, width) {
	// Draw a line from p1 to p2

	width = width || 1;

	Draw.setStroke(screen, color);

	screen.beginPath();
	screen.moveTo(p1.x, p1.y);
	screen.lineTo(p2.x, p2.y);

	if (width) {
		screen.lineWidth = width;
	}

	screen.stroke();
}

Draw.rect = function(screen, position, size, color, filled) {
	// Draw a rectangle on the screen

	Draw.setStroke(screen, color);
	Draw.setFill(screen, color);

	screen.rect(position.x, position.y, size.x, size.y);

	if (filled) {
		screen.fill();
	} else {
		screen.stroke();
	}
}

// http://stackoverflow.com/questions/4839993/how-to-draw-polygons-on-an-html5-canvas
Draw.polygon = function(screen, points, color, filled) {
	// Draws a polygon from a set of points

	Draw.setStroke(screen, color);
	Draw.setFill(screen, color);

	screen.beginPath();
	screen.moveTo(points[points.length-1].x, points[points.length-1].y);
	for (var i = 0; i < points.length; i++) {
		screen.lineTo(points[i].x, points[i].y);
	}

	if (filled) {
		screen.fill();
	}
	// This causes overlaps, but fixes the problem of having gaps between polygons
	screen.stroke();
}
