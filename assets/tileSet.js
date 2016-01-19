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
    "." : [136, 0],
    "%" : [340, 153],
    "~" : [493, 153],
    "&" : [510, 153],
    "m" : [119, 0],
    "b" : [68, 323]
  },
  width: 45,
  height: 22
};
