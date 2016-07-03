/*
poisson-disk-sample

https://github.com/jeffrey-hearn/poisson-disk-sample

MIT License
*/

function PoissonDiskSampler( width, height, minDistance, sampleFrequency ){
	this.width = width;
	this.height = height;
	this.minDistance = minDistance;
	this.sampleFrequency = sampleFrequency;
	this.reset();
}

PoissonDiskSampler.prototype.reset = function(){
	this.grid = new Grid( this.width, this.height, this.minDistance );
	this.outputList = new Array();
	this.processingQueue = new RandomQueue();
}

PoissonDiskSampler.prototype.sampleUntilSolution = function(){
	while( this.sample() ){};
	return this.outputList;
}

PoissonDiskSampler.prototype.sample = function(){

	// If this is the first sample
	if ( 0 == this.outputList.length){
		// Generate first point
		this.queueToAll( this.grid.randomPoint() );
		return true;
	}

	var processPoint = this.processingQueue.pop();

	// Processing queue is empty, return failure
	if ( processPoint == null )
		return false;

	// Generate sample points around the processing point
	// And check if they have any neighbors on the grid
	// If not, add them to the queues
	for ( var i = 0; i < this.sampleFrequency; i++ ){
		samplePoint = this.grid.randomPointAround( processPoint );
		if ( ! this.grid.inNeighborhood( samplePoint ) ){
			// No on in neighborhood, welcome to the club
			this.queueToAll( samplePoint );
		}
	}
	// Sample successful since the processing queue isn't empty
	return true;
}

PoissonDiskSampler.prototype.queueToAll = function ( point ){
	var valid = this.grid.addPointToGrid( point, this.grid.pixelsToGridCoords( point ) );
	if ( ! valid )
		return;
	this.processingQueue.push( point );
	this.outputList.push( point );
}



function Grid( width, height, minDistance ){
	this.width = width;
	this.height = height;
	this.minDistance = minDistance;
	this.cellSize = this.minDistance / Math.SQRT2;
	//console.log( this.cellSize );
	this.pointSize = 2;

	this.cellsWide = Math.ceil( this.width / this.cellSize );
	this.cellsHigh = Math.ceil( this.height / this.cellSize );

	// Initialize grid
	this.grid = [];
	for ( var x = 0; x < this.cellsWide; x++ ){
		this.grid[x] = [];
		for ( var y = 0; y < this.cellsHigh; y++ ){
			this.grid[x][y] = null;
		}
	}
}

Grid.prototype.pixelsToGridCoords = function( point ){
	var gridX = Math.floor( point.x / this.cellSize );
	var gridY = Math.floor( point.y / this.cellSize );
	return { x: gridX, y: gridY };
}

Grid.prototype.addPointToGrid = function( pointCoords, gridCoords ){
	// Check that the coordinate makes sense
	if ( gridCoords.x < 0 || gridCoords.x > this.grid.length - 1 )
		return false;
	if ( gridCoords.y < 0 || gridCoords.y > this.grid[gridCoords.x].length - 1 )
		return false;
	this.grid[ gridCoords.x ][ gridCoords.y ] = pointCoords;
	//console.log( "Adding ("+pointCoords.x+","+pointCoords.y+" to grid ["+gridCoords.x+","+gridCoords.y+"]" );
	return true;
}

Grid.prototype.randomPoint = function(){
	return { x: getRandomArbitrary(0,this.width), y: getRandomArbitrary(0,this.height) };
}

Grid.prototype.randomPointAround = function( point ){
	var r1 = Math.random();
	var r2 = Math.random();
	// get a random radius between the min distance and 2 X mindist
	var radius = this.minDistance * (r1 + 1);
	// get random angle around the circle
	var angle = 2 * Math.PI * r2;
	// get x and y coords based on angle and radius
	var x = point.x + radius * Math.cos( angle );
	var y = point.y + radius * Math.sin( angle );
	return { x: x, y: y };
}

Grid.prototype.inNeighborhood = function( point ){
	var gridPoint = this.pixelsToGridCoords( point );

	var cellsAroundPoint = this.cellsAroundPoint( point );

	for ( var i = 0; i < cellsAroundPoint.length; i++ ){
		if ( cellsAroundPoint[i] != null ){
			if ( this.calcDistance( cellsAroundPoint[i], point ) < this.minDistance ){
				return true;
			}
		}
	}
	return false;
}

Grid.prototype.cellsAroundPoint = function( point ){
	var gridCoords = this.pixelsToGridCoords( point );
	var neighbors = new Array();

	for ( var x = -2; x < 3; x++ ){
		var targetX = gridCoords.x + x;
		// make sure lowerbound and upperbound make sense
		if ( targetX < 0 )
			targetX = 0;
		if ( targetX > this.grid.length - 1 )
			targetX = this.grid.length - 1;

		for ( var y = -2; y < 3; y++ ){
			var targetY = gridCoords.y + y;
			// make sure lowerbound and upperbound make sense
			if ( targetY < 0 )
				targetY = 0;
			if ( targetY > this.grid[ targetX ].length - 1 )
				targetY = this.grid[ targetX ].length - 1;
			neighbors.push( this.grid[ targetX ][ targetY ] )
		}
	}
	return neighbors;
}

Grid.prototype.calcDistance = function( pointInCell, point ){
	return Math.sqrt( (point.x - pointInCell.x)*(point.x - pointInCell.x)
	                + (point.y - pointInCell.y)*(point.y - pointInCell.y) );
}


function RandomQueue( a ){
	this.queue = a || new Array();
}

RandomQueue.prototype.push = function( element ){
	this.queue.push( element );
}

RandomQueue.prototype.pop = function(){

	randomIndex = getRandomInt( 0, this.queue.length );
	while( this.queue[randomIndex] === undefined ){

		// Check if the queue is empty
		var empty = true;
		for ( var i = 0; i < this.queue.length; i++ ){
			if ( this.queue[i] !== undefined )
				empty = false;
		}
		if ( empty )
			return null;

		randomIndex = getRandomInt( 0, this.queue.length );
	}

	element = this.queue[ randomIndex ];
	this.queue.remove( randomIndex );
	return element;
}

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
	var rest = this.slice((to || from) + 1 || this.length);
	this.length = from < 0 ? this.length + from : from;
	return this.push.apply(this, rest);
};

// MDN Random Number Functions
// https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Math/random
function getRandomArbitrary(min, max) {
	return Math.random() * (max - min) + min;
}

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
