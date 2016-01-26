var tileSet = document.createElement("img");
tileSet.src = "assets/beachTileSet.png"

//Tile set options
Game.DISPLAYS.tsOptions = {
  layout: "tile",
  bg: "transparent",
  tileWidth: 32,
  tileHeight: 32,
  tileSet: tileSet,
  tileMap: {
    "@" : [0, 68],
    "#" : [0,0],
    "$" : [0,34],
    "%" : [34,0],
    "&" : [34,34],
    "." : [68,0],
    "*" : [68, 34],
    "P" : [34, 68],
    "A" : [68,68],
    "m" : [102, 68],
    "a" : [102,34],
    "b" : [102, 0],
    "R" : [136, 0],
    "K" : [136, 34],
    "S" : [136, 68],
    "M" : [0, 102],
    "s" : [34, 102],
    "n" : [68, 102],
    "q" : [102, 102],
    "B" : [136, 102]


  },
  width: 22,
  height: 11
};
