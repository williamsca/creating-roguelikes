Game.Tile = function (properties) {
  properties = properties || {};
  Game.Symbol.call(this, properties);
  if (! ('attr' in this)) {this.attr = {}; }
  this.attr._name = properties.name || 'unknown';
  this.attr._walkable = properties.walkable || false;
  this.attr._diggable = properties.diggable || false;
};
Game.Tile.extend(Game.Symbol);

Game.Tile.prototype.isWalkable = function () {
  return this.attr._walkable;
};

Game.Tile.prototype.isDiggable = function () {
  return this.attr._diggable;
};

Game.Tile.prototype.getName = function() {
  return this.attr._name;
};

 //-----------------------------------------------------------------------------

 Game.Tile.nullTile = new Game.Tile({name: 'nullTile'});
 Game.Tile.floorTile = new Game.Tile({name: 'floor', chr: '.', walkable: true});
 Game.Tile.wallTile = new Game.Tile({name: 'wall', chr: '#'});
 // Added this so the message makes sense when the player reaches the end of the map
 Game.Tile.boundaryTile = new Game.Tile({name: 'edge of the map'});
