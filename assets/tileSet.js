var tileSet = document.createElement("img");
tileSet.src = "assets/tileSheet.png"


Game.DISPLAYS.options = {
  layout: "tile",
  bg: "black",
  tileWidth: 16,
  tileHeight: 16,
  tileSet: tileSet,
  tileMap: {
    "@" : [374, 153],
    "#" : [0,0],
    "." : [136, 0],
    "%" : [340, 153]
  },
  width: 50,
  height: 22
};
