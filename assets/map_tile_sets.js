Game.MapTileSets = {
  caves: {
    _width: 100,
    _height: 100,
    getMapTiles: function (small) {
        if(small){
       this._width = 50;
       this._height = 50;
   }
      var mapTiles = Game.util.init2DArray(this._width, this._height, Game.Tile.nullTile);
      var generator = new ROT.Map.Cellular(this._width, this._height);
      generator._options.connected = true;
      generator.randomize(0.5);

      //repeated cellular automata process
      var totalIterations = 3;
      for (var i = 0; i < totalIterations - 1; i++){
        generator.create();
      }

      // run again then update map
      generator.create(function(x,y,v) {
        if (v === 1) {
          mapTiles[x][y] = Game.Tile.wallTile;
        } else {
          mapTiles[x][y] = Game.Tile.floorTile;
        }
      });

      return mapTiles;
    }

},

    rogue: {
  _width: 100,
  _height: 100,
  getMapTiles: function (small) {
          if(small){
       this._width = 50;
       this._height = 50;
   }
    var mapTiles = Game.util.init2DArray(this._width, this._height, Game.Tile.nullTile);
    var generator = new ROT.Map.Rogue(this._width, this._height);
    // generator._options.connected = true;
    // generator.randomize(0.5);
    //
    // //repeated cellular automata process
    // var totalIterations = 3;
    // for (var i = 0; i < totalIterations - 1; i++){
    //   generator.create();
    // }

    // run again then update map
    generator.create(function(x,y,v) {
      if (v === 1) {
        mapTiles[x][y] = Game.Tile.wallTile;
      } else {
        mapTiles[x][y] = Game.Tile.floorTile;
      }
    });

    return mapTiles;
  }
},

    maze: {
  _width: 100,
  _height: 100,
  getMapTiles: function (small) {
          if(small){
       this._width = 50;
       this._height = 50;
   }
    var mapTiles = Game.util.init2DArray(this._width, this._height, Game.Tile.nullTile);
    var generator = new ROT.Map.DividedMaze(this._width, this._height);
    //generator._options.connected = true;
    // generator.randomize(0.5);
    //
    // //repeated cellular automata process
    // var totalIterations = 3;
    // for (var i = 0; i < totalIterations - 1; i++){
    //   generator.create();
    // }
    //
    // // run again then update map
    generator.create(function(x,y,v) {
      if (v === 1) {
        mapTiles[x][y] = Game.Tile.wallTile;
      } else {
        mapTiles[x][y] = Game.Tile.floorTile;
      }
    });

    return mapTiles;
  }
},

    digger: {
    _width: 100,
    _height: 100,
    getMapTiles: function (small) {
            if(small){
       this._width = 50;
       this._height = 50;
   }
      var mapTiles = Game.util.init2DArray(this._width, this._height, Game.Tile.nullTile);
      var generator = new ROT.Map.Digger(this._width, this._height);

      generator.create(function(x,y,v) {
        if (v === 1) {
          mapTiles[x][y] = Game.Tile.wallTile;
        } else {
          mapTiles[x][y] = Game.Tile.floorTile;
        }
      });

      return mapTiles;
    }
}
};
