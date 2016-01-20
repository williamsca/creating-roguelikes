Game.Symbol = function (properties) {
  properties = properties || {};
  if (! ('attr' in this)) { this.attr = {}; }
  this.attr._char = properties.chr || ' ';
  this.attr._fg = properties.fg || Game.UIMode.DEFAULT_COLOR_FG;
  this.attr._bg = properties.bg || Game.UIMode.DEFAULT_COLOR_BG;
};

Game.Symbol.prototype.getChar = function () {
  return this.attr._char;
};

Game.Symbol.prototype.getFg = function () {
  return this.attr._fg;
};

Game.Symbol.prototype.getBg = function () {
   return this.attr._bg;
};

Game.Symbol.prototype.draw = function (display, x, y, isMasked) {
    if (isMasked) {
    // TODO add transparent thing!! Make it a filter not a opaque block
      if (this.getName() == "wall"){
        display.draw(x,y,"$");
      }else{
        display.draw(x,y,"*");
      }
    } else {
    display.draw(x,y,this.getChar());//, this.attr._fg, this.attr._bg);
  }
};

Game.Symbol.NULL_SYMBOL = new Game.Symbol();
Game.Symbol.AVATAR = new Game.Symbol('@', '#dda');
