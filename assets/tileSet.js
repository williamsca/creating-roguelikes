var tileSet = document.createElement("img");
tileSet.src = "assets/tileSheet.png" // Insert Source here


Game.DISPLAYS.options = {
  layout: "tile",
  bg: "transparent",
  tileWidth: 16,
  tileHeight: 16,
  tileSet: tileSet,
  tileMap: {
    "@":[240,85],
    "#":[80,32],
    ".":[80,0]
  },
  width: Game.DISPLAYS.main.w,
  height: Game.DISPLAYS.main.h

}
