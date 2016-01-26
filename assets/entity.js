Game.DATASTORE.ENTITY = {};

Game.Entity = function(template) {
  template = template || {};
  //console.log("creating entity using template");
  //console.dir(template);
  this._mixinSet = Game.EntityMixin;
  Game.SymbolActive.call(this, template);
  // if (!('attr' in this)) { this.attr = {}; }
  // this.attr._name = template.name || '';
  this.attr._x = template.x || 0;
  this.attr._y = template.y || 0;
  this.attr._generator_template_key = template.generator_template_key || '';
  this.attr._mapId = null;

  this.attr._id = template.presetId || Game.util.uniqueId();
  Game.DATASTORE.ENTITY[this.attr._id] = this;

};
Game.Entity.extend(Game.SymbolActive);


Game.Entity.prototype.destroy = function() {
  var prob = Math.floor(Math.random()*10);
  var item = null;
  if(prob >= 8){
    item = Game.ItemGenerator.create("apple");
  }else if(prob >= 6){
    item = Game.ItemGenerator.create("ammo");
  }

  if(item){
    this.getMap().addItem(item, this.getPos());
  }


  // remove from map
  this.getMap().extractEntity(this);
  // remove from DATASTORE
  Game.DATASTORE.ENTITY[this.getId()] = undefined;
  // remove from Scheduler
  Game.Scheduler.remove(this);
};

Game.Entity.prototype.getId = function(){
  return this.attr._id;
};

Game.Entity.prototype.getMap = function () {
  return Game.DATASTORE.MAP[this.attr._mapId];
};

Game.Entity.prototype.setMap = function(map) {
  this.attr._mapId = map.getId();
};

Game.Entity.prototype.getMapId = function() {
  return this.attr._mapId;
}



Game.Entity.prototype.setPos = function(x_or_xy, y) {
  if (typeof x_or_xy == 'object') {
    this.attr._x = x_or_xy.x;
    this.attr._y = x_or_xy.y;
  } else {
    this.attr._x = x_or_xy;
    this.attr._y = y;
  }
};

Game.Entity.prototype.draw = function (display, x, y, isMasked) {
    if (isMasked) {
    display.draw(x,y,"m");
    } else {
      if(this.getMap().getTile(this.getPos()).isWalkable()){
    display.draw(x,y,[".",this.getChar()]);//, this.attr._fg, this.attr._bg);
  }else{
    display.draw(x,y,["#",this.getChar()]);//, this.attr._fg, this.attr._bg);
    }
  }
};
Game.Entity.prototype.getPos = function () {
  return {x:this.attr._x, y:this.attr._y};
};

Game.Entity.prototype.getX = function() {
  return this.attr._x;
};

Game.Entity.prototype.getY = function() {
  return this.attr._y;
};

Game.Entity.prototype.setX = function(x) {
  this.attr._x = x;
};

Game.Entity.prototype.setY = function(y) {
  this.attr._y = y;
};
