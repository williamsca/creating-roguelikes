Game.DATASTORE.MAP = {};

Game.map = function (mapTileSetName) {
  //console.log("setting up new map using "+mapTileSetName+" tile set");

  this._tiles = Game.MapTileSets[mapTileSetName].getMapTiles();

  this.attr = {
    _id: Game.util.randomString(32),
    _mapTileSetName: mapTileSetName,
    _width: this._tiles.length,
    _height: this._tiles[0].length,
    _entitiesByLocation: {},
    _locationsByEntity: {}
  };

  Game.DATASTORE.MAP[this.attr._id] = this;
};

Game.map.prototype.getId = function () {
  return this.attr._id;
};

Game.map.prototype.getWidth = function () {
  return this.attr._width;
};

Game.map.prototype.getHeight = function () {
  return this.attr._height;
};

Game.map.prototype.getTile = function (x_or_pos, y) {
  var useX = x_or_pos, useY = y;
  if( typeof x_or_pos == 'object'){
    useX = x_or_pos.x;
    useY = x_or_pos.y;
  }

  if ((useX < 0) || (useX >= this.attr._width) || (useY < 0) || (useY >= this.attr._height)) {
    return Game.Tile.nullTile;
  }
  return this._tiles[useX][useY] || Game.Tile.nullTile;
};

Game.map.prototype.addEntity = function (ent, pos) {
  this.attr._entitiesByLocation[pos.x+","+pos.y] = ent.getId();
  this.attr._locationsByEntity[ent.getId()] = pos.x+","+pos.y;
  ent.setMap(this);
  ent.setPos(pos);
};

Game.map.prototype.updateEntityLocation = function (ent) {
  var origLoc = this.attr._locationsByEntity[ent.getId()];
  if(origLoc) {
    this.attr._entitiesByLocation[origLoc] = undefined;
  }
  var pos = ent.getPos();
  this.attr._entitiesByLocation[pos.x+","+pos.y] = ent.getId();
  this.attr._locationsByEntity[ent.getId()] = pos.x+","+pos.y;
};

Game.map.prototype.getEntity = function (x_or_pos,y) {
  var useX = x_or_pos, useY=y;
  if(typeof x_or_pos == 'object') {
    useX = x_or_pos.x;
    useY = x_or_pos.y;
  }
  var entId = this.attr._entitiesByLocation[useX+','+useY];
  if(entId) { return Game.DATASTORE.ENTITY[entId]; }
  return false;
};

Game.map.prototype.getRandomLocation = function(filter_func) {
  if (filter_func === undefined) {
    filter_func = function(tile) { return true; };
  }
  var tX, tY, t;
  do {
    tX = Game.util.randomInt(0, this.attr._width - 1);
    tY = Game.util.randomInt(0, this.attr._height - 1);
    t = this.getTile(tX, tY);
  } while (! filter_func(t));
  return {x:tX, y:tY};
};

Game.map.prototype.getRandomWalkableLocation = function() {
  return this.getRandomLocation(function(t) { return t.isWalkable(); });
};

Game.map.prototype.renderOn = function (display, camX, camY) {
  var dispW = display._options.width;
  var dispH = display._options.height;
  var xStart = camX-Math.round(dispW / 2);
  var yStart = camY-Math.round(dispH / 2);
  for (var x = 0; x < dispW; x++) {
     for (var y = 0; y < dispH; y++) {
       // Fetch the glyph for the tile and render it to the screen
       var mapPos = {x:x+xStart,y:y+yStart};
       var tile = this.getTile(mapPos);
       if (tile.getName() == 'nullTile') {
         tile = Game.Tile.wallTile;
       }
       tile.draw(display, x, y);
       var ent = this.getEntity(mapPos);
       if (ent){
         //ent.draw(display,x,y)
         display.draw(x,y, [".", ent.attr._char]);
       }
     }
   }

};

Game.map.prototype.toJSON = function () {
  var json = Game.UIMode.gamePersistence.BASE_toJSON.call(this);
  return json;
};

Game.map.prototype.fromJSON = function (json) {
  Game.UIMode.gamePersistence.BASE_fromJSON.call(this,json);
};
