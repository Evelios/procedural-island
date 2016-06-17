//------------------------------------------------------------------------------
//	Created By: Thaoms Waters
//	Date: 6/17/2016
//	Description: 2d Vector Library
//------------------------------------------------------------------------------
// All vector methods leave the origional vector function unchanged
// Although the vector is not immutible, the functions represent this pattern

var Vector = function(x, y) {
  this.x = x;
  this.y = y;

  // Hashable representation of the class
  this.asKey = function() {
    return [this.x, this.y]
  }
}

// Basic Math Functions

Vector.prototype.add = function(other) {
  return new Vector(this.x + other.x, this.y + other.y);
};

Vector.prototype.subtract = function(other) {
  return new Vector(this.x - other.x, this.y - other.y);
}

Vector.prototype.multiply = function(scalar) {
  return new Vector(this.x * scalar, this.y * scalar);
}

Vector.prototype.divide = function(scalar) {
  return new Vector(this.x / scalar, this.y / scalar);
}

// Advanced Vector Functions

Vector.prototype.dot = function(other) {
  return this.x * other.x + this.y * other.y;
}

Vector.prototype.magnitude = function() {
  return Math.sqrt(this.x * this.x + this.y * this.y);
}

Vector.prototype.normalize = function() {
  return this.divide(this.magnitude());
}

// Static Vector Functions

Vector.midpoint = function(a, b) {
  return new Vector((a.x + b.x) / 2, (a.y + b.y) / 2);
}

Vector.proj = function(a, b) {
  return b.multiply(a.dot(b) / Math.pow(b.magnitude(), 2) );
}

Vector.angle = function(a, b) {
  return acos(a.dot(b) / (a.magnitude() * b.magnitude()));
}

Vector.distance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return Math.sqrt(dx*dx + dy*dy);
}
