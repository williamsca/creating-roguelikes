Game.Symbol = function (template) {
  template = template || {};
  if (! ('attr' in this)) { this.attr = {}; }
  this.attr._char = template.chr || ' ';
  this.attr._fg = template.fg || Game.UIMode.DEFAULT_COLOR_FG;
  this.attr._bg = template.bg || Game.UIMode.DEFAULT_COLOR_BG;
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

Game.Symbol.prototype.getRepresentation = function() {
    return '%c{' + this.attr._fg + '}%b{' + this.attr._bg + '}' + this.attr._char;
};

Game.Symbol.prototype.draw = function (display, x, y, isMasked) {
    try{
    if (isMasked) {
    // TODO add transparent thing!! Make it a filter not a opaque block
      if (this.getName() == "wall"){
        display.draw(x,y,"$");
    }else if (this.getName() == 'floor'){
        display.draw(x,y,"*");
    }else {
        display.draw(x,y,"?");
    }

    } else {
    display.draw(x,y,[".",this.getChar()]);//, this.attr._fg, this.attr._bg);
  }
  }catch(e){
      display.draw(x,y,"?");
  }
};

Game.Symbol.NULL_SYMBOL = new Game.Symbol();
Game.Symbol.AVATAR = new Game.Symbol('@', '#dda');

Game.Symbol.ITEM_PILE = new Game.Symbol({chr:'P', fg: "#dcc"});
