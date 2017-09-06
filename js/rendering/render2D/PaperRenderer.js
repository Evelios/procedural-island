//------------------------------------------------------------------------------
// 
//        DDDD     RRRR      AAA     W         W       222222    DDDD
//        D  DD    R   R    A   A    W         W      22    22   D   DD
//        D   DD   RRRR     AAAAA     WW  W  WW           22     D    DD
//        D  DD    R  RR   AA   AA     W WWW W          22       D   DD
//        DDDD     R   R   A     A     WW   WW         2222222   DDDDD
//
//------------------------------------------------------------------------------

Render2D = function(divID) {

    var canvas = document.getElementById(divID)
    paper.setup(canvas);
}

Render2D.prototype.render = function(map) {
	this.renderPolygons(map);
}

Render2D.prototype.renderPolygons = function(map) {
	for (var i = 0; i < map.centers.length; i++) {
    	var center = map.centers[i];
    	var color = Render2D.biomeColoring(center);

    	var polyPath = new paper.Path(center.corners.getProp("position"))
    	polyPath.closed = true;
    	polyPath.strokeColor = color;
    	polyPath.strokeWidth = 1;
    	polyPath.fillColor = color;
    }

    paper.view.draw();
}

Render2D.biomeColoring = function(center) {
	return DefaultColors[center.biome];
}
