Game.MapTileSets = {

    randomizeMapTiles: function (mapTiles){
        for (var i = 0; i < mapTiles.length; i++) {
            for (var j = 0; j < mapTiles[0].length; j++) {
                prob = Math.floor(Math.random()*50);
                if(mapTiles[i][j] == Game.Tile.wallTile){
                    if(prob == 7){
                        mapTiles[i][j] = Game.Tile.wallTile2;
                    }else if(prob == 8){
                        mapTiles[i][j] = Game.Tile.wallTile3;
                    }if(prob == 9){
                        mapTiles[i][j] = Game.Tile.wallTile4;
                    }
                }else if (mapTiles[i][j] == Game.Tile.floorTile){
                    if(prob >= 47){
                        mapTiles[i][j] = Game.Tile.floorTile2;
                    }
                }
            }
        }
        return mapTiles;
    },
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


     mapTiles = Game.MapTileSets.randomizeMapTiles(mapTiles);

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

    mapTiles = Game.MapTileSets.randomizeMapTiles(mapTiles);

    return mapTiles;
  }
},

    maze: {
  _width: 50,
  _height: 50,
  getMapTiles: function (small) {
          if(small){
       this._width = 20;
       this._height = 20;
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

    mapTiles = Game.MapTileSets.randomizeMapTiles(mapTiles);


    return mapTiles;
  }
},

    digger: {
    _width: 60,
    _height: 60,
    getMapTiles: function (small) {
            if(small){
       this._width = 30;
       this._height = 30;
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


    mapTiles = Game.MapTileSets.randomizeMapTiles(mapTiles);

      return mapTiles;
    }
}
};
