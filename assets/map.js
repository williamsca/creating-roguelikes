Game.DATASTORE.MAP = {};

Game.map = function (mapTileSetName, small, presetId) {
  //console.log("setting up new map using "+mapTileSetName+" tile set");

  this._tiles = Game.MapTileSets[mapTileSetName].getMapTiles(small);

  this.attr = {
    _id: presetId || Game.util.uniqueId(),
    _mapTileSetName: mapTileSetName,
    _small: small || false,
    _width: this._tiles.length,
    _height: this._tiles[0].length,
    _entitiesByLocation: {},
    _locationsByEntity: {},
    _itemsByLocation : {}
  };

  this._fov = null;
  this.setUpFov();

  Game.DATASTORE.MAP[this.attr._id] = this;
};

Game.map.prototype.setUpFov = function () {
  var map = this;
  this._fov = new ROT.FOV.RecursiveShadowcasting( function(x, y) {
    return !map.getTile(x,y).isOpaque();  }, {topology: 8});

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

Game.map.prototype.getFov = function () {
  return this._fov;
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

Game.map.prototype.clearAround = function (x_or_pos, y, beach){
  var useX = x_or_pos, useY = y;
  if( typeof x_or_pos == 'object'){
    useX = x_or_pos.x;
    useY = x_or_pos.y;
  }

  this.makeWalkable(useX-1, useY + 1, beach);
  this.makeWalkable(useX-1, useY, beach);
  this.makeWalkable(useX-1, useY - 1, beach);
  this.makeWalkable(useX, useY + 1, beach);
  this.makeWalkable(useX, useY - 1, beach);
  this.makeWalkable(useX+1, useY + 1, beach);
  this.makeWalkable(useX+1, useY, beach);
  this.makeWalkable(useX+1, useY - 1, beach);

}

Game.map.prototype.detonate = function(x_or_pos, y){
  var useX = x_or_pos, useY = y;
  if( typeof x_or_pos == 'object'){
    useX = x_or_pos.x;
    useY = x_or_pos.y;
  }
  if( Game.UIMode.gamePlay.attr._answers.graphics != "beach"){
  this.makeWalkable(useX, useY,false);
  this.clearAround(useX, useY, false);
  }else{
  this.makeWalkable(useX, useY,true);
  this.clearAround(useX, useY, true);
  }
}

Game.map.prototype.makeWalkable = function (x_or_pos, y, beach){
  var useX = x_or_pos, useY = y;
  if( typeof x_or_pos == 'object'){
    useX = x_or_pos.x;
    useY = x_or_pos.y;
  }
    newTile = (beach ? Game.Tile.wallTile : Game.Tile.floorTile)

    if ((useX < 0) || (useX >= this.attr._width) || (useY < 0) || (useY >= this.attr._height)) {
    return;
  }
  this._tiles[useX][useY] = newTile;
  Game.UIMode.gamePlay.attr._changedTiles.push({x:useX, y:useY, wall:beach});
};

Game.map.prototype.addEntity = function (ent, pos) {
  this.attr._entitiesByLocation[pos.x+","+pos.y] = ent.getId();
  this.attr._locationsByEntity[ent.getId()] = pos.x+","+pos.y;
  ent.setMap(this);
  ent.setPos(pos);
};

Game.map.prototype.addItem = function (itm, pos) {
    var loc = pos.x+","+pos.y;
    if (! this.attr._itemsByLocation[loc]) {
        this.attr._itemsByLocation[loc] = [];
    }
    this.attr._itemsByLocation[loc].push(itm.getId());
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

Game.map.prototype.getItems = function (x_or_pos, y){
    var useX = x_or_pos, useY=y;
    if(typeof x_or_pos == 'object') {
    useX = x_or_pos.x;
    useY = x_or_pos.y;
    }
    var itemIds = this.attr._itemsByLocation[useX+','+useY];
    if ( itemIds) { return itemIds.map(function(iid) { return Game.DATASTORE.ITEM[iid]; }); }
    return [];
};

Game.map.prototype.getEntitiesAround = function (x_or_pos, y){
  var useX = x_or_pos, useY = y;
  if (typeof x_or_pos == 'object'){
    useX = x_or_pos.x;
    useY = x_or_pos.y;
  }
  foundEnts = [];
  for (var i = (useX - 1); i <= (useX + 1); i++) {
    for (var j = (useY - 1); j <= (useY + 1); j++) {
      if( i != useX || j != useY){
        ent = this.getEntity(i, j);
        if(ent){
          foundEnts.push(ent);
        }
      }
    }
  }
  return foundEnts;
};

Game.map.prototype.getItemsAround = function (x_or_pos, y){
  var useX = x_or_pos, useY = y;
  if (typeof x_or_pos == 'object'){
    useX = x_or_pos.x;
    useY = x_or_pos.y;
  }
  foundItems = [];
  for (var i = (useX - 1); i <= (useX + 1); i++) {
    for (var j = (useY - 1); j <= (useY + 1); j++) {
        items = this.getItems(i, j);
        for (var k = 0; k < items.length; k++) {
            foundItems.push(items[k])
        }

    }
  }
  return foundItems;
};

Game.map.prototype.getEntitiesNearby = function (radius, x_or_pos, y){
  var useX = x_or_pos, useY = y;
  if (typeof x_or_pos == 'object'){
    useX = x_or_pos.x;
    useY = x_or_pos.y;
  }
  var entLocs = Object.keys(this.attr._entitiesByLocation);
  var foundEnts = [];
  if(entLocs.length < radius * radius * 4) {
    for (var i = 0; i < entLocs.length; i++){
      var el = entLocs[i].split(',');
      if((Math.abs(el[0]-useX) <= radius) && (Math.abs(el[1] - useY) <= radius)){
        foundEnts.push(Game.DATASTORE.ENTITY[this.attr._entitiesByLocation[entLocs[i]]]);
      }
    }
  } else {
    for ( var cx = radius*-1; cx <= radius; cx++) {
      for (var cy = radius*-1; cy <= radius; cy++) {
        var entId = this.getEntity(useX+cx, useY+cy);
        if (entId) {
          foundEnts.push(Game.DATASTORE.ENTITY[entId]);
        }
      }
    }
  }
  return foundEnts;
};


Game.map.prototype.extractEntity = function (ent) {
  this.attr._entitiesByLocation[ent.getX() + "," + ent.getY()] = undefined;
  this.attr._locationsByEntity[ent.getId()] = undefined;
  return ent;
};

Game.map.prototype.extractEntityAt = function (x_or_pos, y) {
  var ent = this.getEntity(x_or_pos, y);
  if (ent) {
    this.attr._entitiesByLocation[ent.getX() + ',' + ent.getY()] = undefined;
    this.attr._locationsByEntity[ent.getID()] = undefined;
  }
  return ent;
};

Game.map.prototype.extractItemAt = function (itm_or_idx, x_or_pos, y){
    var useX = x_or_pos, useY=y;
    if(typeof x_or_pos == 'object') {
    useX = x_or_pos.x;
    useY = x_or_pos.y;
    }
    var itemIds = this.attr._itemsByLocation[useX+','+useY];
    if (! itemIds) { return false; }

    var item = false, extractedId = '';
    if (Number.isInteger(itm_or_idx)) {
        extractedId = itemIds.splice(itm_idx, 1);
        item = Game.DATASTORE.ITEM[extractedId];
    } else {
        var idToFind = itm_or_idx.getId();
        for (var i = 0; i < itemIds.length; i++) {
            if( idToFind === itemIds[i]) {
                extractedId = itemIds.splice(i, 1);
                item = Game.DATASTORE.ITEM[extractedId];
                break;
            }
        }
    }
    return item;
};

Game.map.prototype.getRandomPosition = function(filter_func) {
  if (filter_func === undefined) {
    filter_func = function(tile/*, tX, tY*/) { return true; };
  }
  var tX, tY, t;
  do {
    tX = Game.util.randomInt(0, this.attr._width - 1);
    tY = Game.util.randomInt(0, this.attr._height - 1);
    t = this.getTile(tX, tY);
  } while (! filter_func(t/*, tX, tY*/));
    return {x:tX, y:tY};
};

// tile is walkable and unoccupied
Game.map.prototype.getWalkablePosition = function() {
  //return this.getRandomPosition(function(t){ return t.isWalkable(); });
  var map = this;
  return this.getRandomPosition(function(t, tX, tY) { return t.isWalkable() && !map.getEntity(tX, tY); });
};

Game.map.prototype.rememberCoords = function (toRemember) {

        for (var coord in toRemember) {
            if ( toRemember.hasOwnProperty(coord)){
                this.attr._rememberedCoords[coord] = true;
            }
        }
};

Game.map.prototype.renderOn = function (display, camX, camY, renderOptions) {
  var opt = renderOptions || {};

  var checkCellsVisible = opt.visibleCells !== undefined;
  var visibleCells = opt.visibleCells || {};
  var showVisibleEntities = (opt.showVisibleEntities !== undefined) ? opt.showVisibleEntities : true;
  var showVisibleItems = (opt.showVisibleItems !== undefined ) ? opt.showVisibleItems : true;
  var showVisibleTiles = (opt.showVisibleTiles !== undefined) ? opt.showVisibleTiles : true;

  var checkCellsMasked = opt.maskedCells !== undefined;
  var maskedCells = opt.maskedCells || {};
  var showMaskedEntities = (opt.showMaskedEntities !== undefined) ? opt.showMaskedEntities : false;
  var showMaskedItems = (opt.showMaskedItems !== undefined) ? opt.showMaskedItems : false;
  var showMaskedTiles = (opt.showMaskedTiles !== undefined) ? opt.showMaskedTiles : true;

  if( !(showVisibleEntities || showVisibleTiles || showMaskedEntities || showMaskedTiles)) {return; }

  var dims = Game.util.getDisplayDim(display);
  var xStart = camX - Math.round(dims.w/2);
  var yStart = camY - Math.round(dims.h/2);
  for (var x = 0; x < dims.w; x++){
      for( var y = 0; y < dims.h; y++) {
       // Fetch the glyph for the tile and render it to the screen
       var mapPos = {x:x+xStart,y:y+yStart};
       var mapCoord = mapPos.x+','+mapPos.y;

        if ( ! (( checkCellsVisible && visibleCells[mapCoord]) || (checkCellsMasked && maskedCells[mapCoord]))){
          display.draw(x,y,["?"]);
          continue;
        }

      var tile = this.getTile(mapPos);
      if (tile.getName() == 'nullTile') {
        tile = Game.Tile.wallTile;
      }

      if (showVisibleTiles && visibleCells[mapCoord]){
        tile.draw(display,x,y, false);
    }else if (showMaskedTiles && maskedCells[mapCoord] ){
        tile.draw(display,x,y,true);
      }

        var items = this.getItems(mapPos);
        if (items.length == 1) {
            if(showVisibleItems && visibleCells[mapCoord]) {
                items[0].draw(display,x,y);
            } else if (showMaskedItems && maskedCells[mapCoord]) {
                items[0].draw(display,x,y,true);
            }
        } else if (items.length > 1) {
            if (showVisibleItems && visibleCells[mapCoord]) {
                Game.Symbol.ITEM_PILE.draw(display,x,y);
            } else if (showMaskedItems && maskedCells[mapCoord]) {
                Game.Symbol.ITEM_PILE.draw(display, x, y, true);
            }
        }


       var ent = this.getEntity(mapPos);
       if(ent){
          if (showVisibleEntities && visibleCells[mapCoord]){
            ent.draw(display,x,y);
          }else if (showMaskedEntities && maskedCells[mapCoord]){
            ent.draw(display,x,y,true);
         }
       }
     }
   }
};

// Game.map.prototype.renderFovOn = function (display, camX, camY, radius){
//   var dims = Game.util.getDisplayDim(display);
//   var xStart = camX - Math.round(dims.w/2);
//   var yStart = camY - Math.round(dims.h/2);
//
//   // Track fov visibility
//   var inFov = {};
//   this._fov.compute(camX, camY, radius, function(x, y, radius, visibility) {
//     inFov[x + "," + y] = true;
//   });
//
//   for (var x = 0; x < dims.w; x++){
//     for (var y = 0; y < dims.h; y++){
//       var mapPos = {x: x+xStart, y: y+yStart};
//       if( inFov[mapPos.x+','+mapPos.y] ) {
//         var tile = this.getTile(mapPos);
//         if(tile.getName() == 'nullTile') {
//           tile = Game.Tile.wallTile;
//         }
//         tile.draw(display, x, y);
//         var ent = this.getEntity(mapPos);
//         if(ent) {
//           ent.draw(display,x,y);
//         }
//       }
//     }
//   }
//   return inFov;
// };

Game.map.prototype.toJSON = function () {
  var json = Game.UIMode.gamePersistence.BASE_toJSON.call(this);
  return json;
};

Game.map.prototype.fromJSON = function (json) {
  Game.UIMode.gamePersistence.BASE_fromJSON.call(this,json);
};
