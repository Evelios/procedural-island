PixiRenderer = function(divID) {

    this.renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.view);
    // document.getElementById(divID).appendChild(this.renderer.view);

    this.renderer.view.style.position = "absolute";
    this.renderer.view.style.display = "block";
    // this.renderer.autoResize = true;
    this.renderer.backgroundColor = Util.strToHex(DefaultColors.ocean);

    this.stage = new PIXI.Container();

    this.renderer.render(this.stage);
    

}

PixiRenderer.prototype.render = function(map, params) {

    var colorFn;

    // Render a particular map type
    if (params.map == 'Biome') {
        colorFn = MapColoring.biomeColoring;
    } else if (params.map == 'Geological Provinces') {
        colorFn = MapColoring.geoProvinceColoring;
    } else if (params.map == 'Elevation') {
        colorFn = MapColoring.elevationColoring;
    } else if (params.map == 'Moisture') {
        colorFn = MapColoring.moistureColoring;
    } else if (params.map == 'Temperature') {
        colorFn = MapColoring.temperatureColoring;
    } else if (params.map == 'Living Conditions') {
        colorFn = MapColoring.livingConditionsColoring;
    } else if (params.map == 'White') {
        colorFn = MapColoring.white;
    } else {
        print(data.render.map + ' is not found.');
    }


    this.renderPolygons(map, colorFn);

    this.renderer.render(this.stage);
}

PixiRenderer.prototype.renderPolygons = function(map, colorFn) {
    for (var i = 0; i < map.centers.length; i++) {
        var center = map.centers[i];
        var color = colorFn(center);

        var polyPath = [];
        for (var k = 0; k < center.corners.length; k++) {
            var cornerPos = center.corners[k].position;
            polyPath.push(new PIXI.Point(cornerPos.x, cornerPos.y));
        }

        var polygon = new PIXI.Graphics();
        polygon.beginFill(color);
        polygon.drawPolygon(polyPath);
        polygon.endFill();

        this.stage.addChild(polygon);
    }
}

//------------------------------------------------------------------------------
// Map Colorings

PixiRenderer.biomeColoring = function(center) {
    return DefaultColors[center.biome];
}