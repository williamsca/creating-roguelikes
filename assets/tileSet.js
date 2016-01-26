Game.TILESETS = {}

Game.TILESETS.beach = document.createElement("img");
Game.TILESETS.beach.src = "assets/beachTileSet.png"

Game.TILESETS.cave = document.createElement("img");
Game.TILESETS.cave.src = "assets/caveTileSet.png"

Game.TILESETS.forest = document.createElement("img");
Game.TILESETS.forest.src = "assets/forestTileSet.png"

Game.TILESETS.doodle = document.createElement("img");
Game.TILESETS.doodle.src = "assets/doodleTileSet.png"


//Tile set options
Game.DISPLAYS.tsOptions = {
  layout: "tile",
  bg: "transparent",
  tileWidth: 32,
  tileHeight: 32,
  tileSet: Game.TILESETS.doodle,
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
    "B" : [136, 102],
    "?" : [0, 136]


  },
  width: 25,
  height: 11
};
