var Center = function(pos) {
  this.id = -1;
  this.position = pos;
  // Set of adjacent polygons
  this.neighbors = [];
  // Set of bordering edges
  this.borders = [];
  // Set of polygon corners
  this.corners = [];

  this.border = false;
}

//------------------------------------------------------------------------------

var Edge = function() {
  this.id = -1;
  // Polygon, center objects connected by Delaunay edges
  this.d0 = null;
  this.d1 = null;
  // Corner objects connected by Voronoi edges
  this.v0 = null;
  this.v1 = null;

  this.midpoint = null;

  this.border = false;
}

//------------------------------------------------------------------------------

var Corner = function(pos) {
  this.id = -1;
  this.position = pos;
  // Set of polygons touching this edge
  this.touches = [];
  // Set of edges touching this corner
  this.protrudes = [];
  // Set of corners connected to this one
  this.adjacent = [];
}

//------------------------------------------------------------------------------

var Diagram = function(points, bbox, relaxations) {
  this.bbox = bbox;

  // Compute Voronoi from initial points
  var rhillVoronoi = new Voronoi();
  var voronoi = rhillVoronoi.compute(points, bbox);

  // Lloyds Relaxations
  while(relaxations--) {
    sites = this.relaxSites(voronoi);
    rhillVoronoi.recycle(voronoi);
    voronoi = rhillVoronoi.compute(sites, bbox);
  }

  this.convertDiagram(voronoi);
}

//------------------------------------------------------------------------------

Diagram.prototype.relaxSites = function(voronoi) {
  var cells = voronoi.cells;
  var iCell = cells.length;
  var cell;
  var site, sites = [];

  while(iCell--) {
    cell = cells[iCell];
    site = this.cellCentroid(cell);
    sites.push(new Vector(site.x, site.y));
  }
  return sites;
}

//------------------------------------------------------------------------------

Diagram.prototype.cellArea = function(cell) {
  var area = 0;
  var halfedges = cell.halfedges;
  var iHalfedge = halfedges.length;
  var halfedge, p1, p2;
  while (iHalfedge--) {
    halfedge = halfedges[iHalfedge];
    p1 = halfedge.getStartpoint();
    p2 = halfedge.getEndpoint();
    area += p1.x * p2.y;
    area -= p1.y * p2.x
  }
  area /= 2;
  return area;
}

//------------------------------------------------------------------------------

Diagram.prototype.cellCentroid = function(cell) {
  var x = 0, y = 0;
  var halfedges = cell.halfedges;
  var iHalfedge = halfedges.length;
  var halfedge;
  var v, p1, p2;

  while (iHalfedge--) {
    halfedge = halfedges[iHalfedge];

    p1 = halfedge.getStartpoint();
    p2 = halfedge.getEndpoint();

    v = p1.x*p2.y - p2.x*p1.y;

    x += (p1.x + p2.x) * v;
    y += (p1.y + p2.y) * v;
  }

  v = this.cellArea(cell) * 6;

  return { x : x/v, y : y/v };
}

//------------------------------------------------------------------------------

Diagram.prototype.convertDiagram = function(voronoi) {
  var centerLookup = {}
  var cornerLookup = {}
  this.centers = []
  this.corners = []
  this.edges = []

  var cornerId = 0;
  var edgeId = 0;

  // Copy over all the center nodes
  for (var i = 0; i < voronoi.cells.length; i++) {
    var site = voronoi.cells[i].site;
    var pos = new Vector(site.x, site.y);
    var center = new Center(pos);
    center.id = site.voronoiId;
    centerLookup[pos.asKey()] = center;
    this.centers.push(center);
  }

  // Create and copy over the edges and corners
  // This portion also creates the connections between all the nodes
  for (var i = 0; i < voronoi.edges.length; i++) {
    var edge = voronoi.edges[i];

    var newEdge = new Edge();
    newEdge.id = edgeId++;

    // Convert voronoi edge to a useable form
    // Corner positions
    var va = new Vector(Math.round(edge.va.x), Math.round(edge.va.y));
    var vb = new Vector(Math.round(edge.vb.x), Math.round(edge.vb.y));
    // Center positions
    var site1 = new Vector(edge.lSite.x, edge.lSite.y);
    var site2 = edge.rSite ? new Vector(edge.rSite.x, edge.rSite.y) : null;

    // Lookup the two center objects
    var center1 = centerLookup[site1.asKey()];
    var center2 = site2? centerLookup[site2.asKey()] : null;

    // Lookup the corner objects and if one isn't created
    // create one and add it to corners set
    var corner1;
    var corner2;

    var isBorder = function(point, bbox) {
      return point.x <= bbox.xl || point.x >= bbox.xr ||
             point.y <= bbox.yt || point.y >= bbox.yb;
    };

    if (!has(cornerLookup, va.asKey())) {
      corner1 = new Corner(va);
      corner1.id = cornerId++;
      corner1.border = isBorder(va, this.bbox);
      cornerLookup[va.asKey()] = corner1;
      this.corners.push(corner1);
    } else {
      corner1 = cornerLookup[va.asKey()];
    }
    if (!has(cornerLookup, vb.asKey())) {
      corner2 = new Corner(vb);
      corner2.id = cornerId++;
      corner2.border = isBorder(vb, this.bbox);
      cornerLookup[vb.asKey()] = corner2;
      this.corners.push(corner2);
    } else {
      corner2 = cornerLookup[vb.asKey()];
    }

    // Update the edge objects
    newEdge.d0 = center1;
    newEdge.d1 = center2
    newEdge.v0 = corner1;
    newEdge.v1 = corner2;
    newEdge.midpoint = Vector.midpoint(corner1.position, corner2.position);

    // Update the corner objects
    corner1.protrudes.push(newEdge);
    corner2.protrudes.push(newEdge);

    corner1.touches.pushNew(center1);
    if (center2) corner1.touches.pushNew(center2);
    corner2.touches.pushNew(center1);
    if (center2) corner2.touches.pushNew(center2);

    corner1.adjacent.push(corner2);
    corner2.adjacent.push(corner1);

    // Update the center objects
    center1.borders.push(newEdge);
    if (center2) center2.borders.push(newEdge);

    center1.corners.pushNew(corner1);
    center1.corners.pushNew(corner2);
    if (center2) center2.corners.pushNew(corner1);
    if (center2) center2.corners.pushNew(corner2);

    if (center2) {
      center1.neighbors.push(center2);
      center2.neighbors.push(center1);
    }

    // If either corner is a border, both centers are borders
    center1.border = center1.border || corner1.border || corner2.border
    if (center2) {
      center2.border = center2.border || corner1.border || corner2.border;
    }

    this.edges.push(newEdge);

    this.improveCorners();
    this.sortCorners();
  }
}

//------------------------------------------------------------------------------
// Helper function to create diagram
//
// Lloyd relaxation helped to create uniformity among polygon centers,
// This function creates uniformity among polygon corners by setting the corners
// to the average of their neighbors
// This breakes the voronoi diagram properties

Diagram.prototype.improveCorners = function() {

	var newCorners = [];

	// Calculate new corner positions
	for (var i = 0; i < this.corners.length; i++) {
		var corner = this.corners[i];

		if (corner.border) {
			newCorners[i] = corner.position;
		} else {
			var newPos = Vector.zero();

			for (var k = 0; k < corner.touches.length; k++) {
				var neighbor = corner.touches[k];
				newPos = newPos.add(neighbor.position);
			}

			newPos = newPos.divide(corner.touches.length);
			newCorners[i] = newPos;
		}
	}

	// Assign new corner positions
	for (var i = 0; i < this.corners.length; i++) {
		var corner = this.corners[i];
		corner.position = newCorners[i];
	}

	// Recompute edge midpoints
	for (var j = 0; j < this.edges.length; j++) {
		var edge = this.edges[j];

		if (edge.v0 && edge.v1) {
			edge.midpoint = Vector.midpoint(edge.v0.position, edge.v1.position);
		}
	}
}

//------------------------------------------------------------------------------
// Sorts the corners in clockwise order so that they can be printed properly
// using a standard polygon drawing method

Diagram.prototype.sortCorners = function() {
  for (var i = 0, l = this.centers.length; i < l; i++) {
    var center = this.centers[i];
    var comp = this.comparePolyPoints(center);
    center.corners.sort(comp);
  }
}

//------------------------------------------------------------------------------
// Comparison function for sorting polygon points in clockwise order
// assuming a convex polygon
// http://stackoverflow.com/questions/6989100/sort-points-in-clockwise-order
Diagram.prototype.comparePolyPoints = function(c) {
  var center = c.position;
  return function(p1, p2) {
    var a = p1.position, b = p2.position;

    if (a.x - center.x >= 0 && b.x - center.x < 0)
      return -1;
    if (a.x - center.x < 0 && b.x - center.x >= 0)
      return 1;
    if (a.x - center.x == 0 && b.x - center.x == 0) {
      if (a.y - center.y >= 0 || b.y - center.y >= 0) {
        if (a.y > b.y) {
          return -1;
        } else {
          return 1;
        }
      }
      if (b.y > a.y) {
        return -1;
      } else {
        return 1;
      }
    }

    // compute the cross product of vectors (center -> a) x (center -> b)
    var det = (a.x - center.x) * (b.y - center.y) - (b.x - center.x) * (a.y - center.y);
    if (det < 0)
        return -1;
    if (det > 0)
        return 1;

    // points a and b are on the same line from the center
    // check which point is closer to the center
    var d1 = (a.x - center.x) * (a.x - center.x) + (a.y - center.y) * (a.y - center.y);
    var d2 = (b.x - center.x) * (b.x - center.x) + (b.y - center.y) * (b.y - center.y);
  if (d1 > d2) {
    return -1;
  } else {
    return 1;
  }

  }
}
