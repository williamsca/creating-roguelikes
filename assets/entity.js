Game.DATASTORE.ENTITY = {};

Game.Entity = function(template) {
  template = template || {};
  this._mixinSet = Game.EntityMixin;
  Game.SymbolActive.call(this, template);

  this.attr._x = template.x || 0;
  this.attr._y = template.y || 0;
  this.attr._generator_template_key = template.generator_template_key || '';
  this.attr._mapId = null;

  //this.attr._id = Game.util.randomString(32);
  Game.DATASTORE.ENTITY[this.attr._id] = this;

};
Game.Entity.extend(Game.SymbolActive);

Game.Entity.prototype.destroy = function() {
  // remove from map
  this.getMap().extractEntity(this);
  // remove from DATASTORE
  Game.DATASTORE.ENTITY[this.getId()] = undefined;
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

// Game.Entity.prototype.getName = function() {
//   return this.attr._name;
// };
//
// Game.Entity.prototype.setName = function(name) {
//   this.attr._name = name;
// };

Game.Entity.prototype.setPos = function(pos) {
  this.setX(pos.x);
  this.setY(pos.y);
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

Game.Entity.prototype.getPos = function () {
  return {x:this.attr._x, y:this.attr._y};
};


// JSON HANDLING
// Game.Entity.prototype.toJSON = function () {
//   var json = Game.UIMode.gamePersistence.BASE_toJSON.call(this);
//   return json;
// };
// Game.Entity.prototype.fromJSON = function (json) {
//   Game.UIMode.gamePersistence.BASE_fromJSON.call(this,json);
// };
