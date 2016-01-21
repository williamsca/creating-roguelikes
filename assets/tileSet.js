var tileSet = document.createElement("img");
tileSet.src = "assets/tileSheet.png"

//Tile set options
Game.DISPLAYS.tsOptions = {
  layout: "tile",
  bg: "transparent",
  tileWidth: 16,
  tileHeight: 16,
  tileSet: tileSet,
  tileMap: {
    "@" : [374, 153],
    "#" : [0,0],
    "$" : [51,374],
    "." : [136, 0],
    "*" : [51, 323],
    "%" : [340, 153],
    "~" : [493, 153],
    "&" : [510, 153],
    "m" : [119, 0],
    "b" : [68, 323],
    "?" : [85, 0],
    "R" : [357, 153],
    "P" : [357, 136]
  },
  width: 45,
  height: 22
};
