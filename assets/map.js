Game.map = function (tilesGrid) {
  this.attr = {
    _tiles: tilesGrid,
    _width: tilesGrid.length,
    _height: tilesGrid[0].length
  };
};

Game.map.prototype.getWidth = function () {
  return this.attr._width;
};

Game.map.prototype.getHeight = function () {
  return this.attr.height;
};

Game.map.prototype.getTile = function (x, y) {
  if ((x < 0) || (x >= this.attr._width) || (y < 0) || (y >= this.attr._height)) {
    return Game.Tile.nullTile;
  }
  return this.attr._tiles[x][y] || Game.Tile.nullTile;
};

Game.map.prototype.renderOn = function (display, camX, camY) {
  var dispW = display._options.width;
  var dispH = display._options.height;
  var xStart = camX-Math.round(dispW / 2);
  var yStart = camY-Math.round(dispH / 2);
  for (var x = 0; x < dispW; x++) {
     for (var y = 0; y < dispH; y++) {
       // Fetch the glyph for the tile and render it to the screen
       var tile = this.getTile(x + xStart, y + yStart)
       if (tile.getName() == 'nullTile') {
         tile = Game.Tile.wallTile;
       }
       tile.getSymbol().draw(display, x, y);
     }
   }
};
