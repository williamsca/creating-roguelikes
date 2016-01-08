Game.UIMode = {};
Game.UIMode.DEFAULT_COLOR_FG = '#fff';
Game.UIMode.DEFAULT_COLOR_BG = '#000';
Game.UIMode.DEFAULT_COLOR_STR = '%c{' + Game.UIMode.DEFAULT_COLOR_FG +
                                '}%b{' + Game.UIMode.DEFAULT_COLOR_BG + '}';

//START
Game.UIMode.gameStart = {
  enter: function() {
    console.log("INITIALIZING GAME. PREPARE YO SELF.");
    Game.message.sendMessage("Welcome to the Space Jam");
    Game.refresh();
  },
  exit: function() {
    console.log("Game.UIMode.gameStart exit");
    Game.refresh();
  },
  handleInput: function (){
    console.log("Game.UIMode.gameStart handleInput");
    Game.switchUiMode(Game.UIMode.gamePersistence);
  },
  renderOnMain: function(display){
    console.log("Game.UIMode.gameStart renderOnMain");
    var fg = Game.UIMode.DEFAULT_COLOR_FG;
    var bg = Game.UIMode.DEFAULT_COLOR_BG;
    display.clear();
    display.drawText(4,4,"Welcome to Grow Away to the Dot 3 (GATTD 3)", fg, bg);
    display.drawText(4,6,"press any key to continue", fg, bg);
  }
};

//PERSISTENCE
Game.UIMode.gamePersistence = {
  enter: function() {
    Game.refresh();
  },
  exit: function() {
    Game.refresh();
  },
  handleInput: function (eventType, evt) {
    var inputChar = String.fromCharCode(evt.charCode);
    if (inputChar == 'S') {
      this.saveGame();
    } else if (inputChar == 'L') {
      this.loadGame();
    } else if (inputChar == 'N') {
      this.newGame();
    }
  },
  renderOnMain: function( display ) {
    display.clear();
    var fg = Game.UIMode.DEFAULT_COLOR_FG;
    var bg = Game.UIMode.DEFAULT_COLOR_BG;
    display.drawText(1, 3, "Press S to save the game, L to load the saved game," +
      " or N to start a new one");
    //TODO check whether local storage has a game before offering restore
    //TODO check whther a game is in progress before offering restore
  },

  loadGame: function() {
    if(this.localStorageAvailable()) {
      try {
        var json_state_data = window.localStorage.getItem(Game._PERSISTANCE_NAMESPACE);
        var state_data = JSON.parse(json_state_data);
        Game.setRandomSeed(state_data._randomSeed);
        Game.UIMode.gamePlay.setupPlay();
        console.log("post-restore: using random seed " + Game.getRandomSeed());
        Game.switchUiMode(Game.UIMode.gamePlay);
      } catch(e) {
        Game.message.sendMessage("There is no game to load.")
      }
    }
  },

  saveGame: function(json_state_data) {
    if(this.localStorageAvailable()){
      window.localStorage.setItem(Game._PERSISTANCE_NAMESPACE, JSON.stringify(Game));
      Game.switchUiMode(Game.UIMode.gamePlay);
    }
  },

  newGame: function() {
    Game.setRandomSeed(5 + Math.floor(ROT.RNG.getUniform() * 100000));
    Game.UIMode.gamePlay.setupPlay();
    Game.switchUiMode(Game.UIMode.gamePlay);
  },
  localStorageAvailable: function () {
    try {
      var x = '__storage_test__';
      window.localStorage.setItem(x,x);
      window.localStorage.removeItem(x);
      return true;
    }
    catch(e){
      Game.message.sendMessage("Sorry, you ain't got no local storage brah");
      return false;
    }
  }
};

//PLAY
Game.UIMode.gamePlay = {
  attr: {
    _map: null,
    _mapWidth: 300,
    _mapHeight: 200,
    _cameraX: 100,
    _cameraY: 100,
    _avatarX: 100,
    _avatarY: 100
  },
  JSON_KEY: 'uiMode_gamePlay',
  enter: function() {
    console.log("Game.UIMode.gamePlay enter");
    Game.message.clearMessages();
    Game.refresh();
  },
  exit: function() {
    console.log("Game.UIMode.gamePlay exit");
    Game.refresh();
  },
  handleInput: function (inputType, inputData){
    console.log("Game.UIMode.gamePlay handleInput");
    console.log(inputType);

    var inputChar = String.fromCharCode(inputData.charCode);
    Game.message.sendMessage("You pressed the '" + inputChar + "' key.");
    Game.renderMessage();
    if (inputType == 'keypress') {
      if (inputData.keyIdentifier == 'Enter') {
        Game.switchUiMode(Game.UIMode.gameWin);
        return;
      } else if (inputChar == '1') {
        this.moveAvatar(-1, 1);
      } else if (inputChar == '2') {
        this.moveAvatar(0, 1);
      } else if (inputChar == '3') {
        this.moveAvatar(1, 1);
      } else if (inputChar == '4') {
        this.moveAvatar(-1, 0);
      } else if (inputChar == '5') {
        // do nothing
      } else if (inputChar == '6') {
        this.moveAvatar(1, 0);
      } else if (inputChar == '7') {
        this.moveAvatar(-1, -1);
      } else if (inputChar == '8') {
        this.moveAvatar(0, -1);
      } else if (inputChar == '9') {
        this.moveAvatar(1, -1);
      }
      Game.refresh();
    } else if (inputType == 'keydown') {
      if (inputData.keyCode == 27) { // Esc
        Game.switchUiMode(Game.UIMode.gameLose);
      } else if (inputData.keyCode == 187) { // '='
        Game.switchUiMode(Game.UIMode.gamePersistence);
      }
    }
  },
  renderOnMain: function(display) {
    var fg = Game.UIMode.DEFAULT_COLOR_FG;
    var bg = Game.UIMode.DEFAULT_COLOR_BG;
    display.clear();
    this.attr._map.renderOn(display, this.attr._cameraX, this.attr._cameraY);
    console.log("Game.UIMode.gamePlay renderOnMain");
    //display.drawText(4,4,"Press Enter to win, Esc to Lose. Yeah great game right?");
    //display.drawText(4, 5, "Press M to open the menu.", fg, bg);
    this.renderAvatar(display);
  },
  renderAvatar: function(display) {
    Game.Symbol.AVATAR.draw(display, this.attr._avatarX-this.attr._cameraX+display._options.width/2,
                                     this.attr._avatarY-this.attr._cameraY+display._options.height/2);
  },
  renderAvatarInfo: function (display) {
    var fg = Game.UIMode.DEFAULT_COLOR_FG;
    var bg = Game.UIMode.DEFAULT_COLOR_BG;
    display.drawText(1, 2, "avatar x: " + this.attr._avatarX, fg, bg);
    display.drawText(1, 3, "avatar y: " + this.attr._avatarY, fg, bg);
  },
  moveAvatar: function(dx, dy) {
    this.attr._avatarX = Math.min(Math.max(0, this.attr._avatarX + dx), this.attr._mapWidth);
    this.attr._avatarY = Math.min(Math.max(0, this.attr._avatarY + dy), this.attr._mapHeight);
    this.setCameraToAvatar();
  },
  moveCamera: function(dx, dy) {
    this.setCamera(this.attr._cameraX + dx, this.attr._cameraY + dy);
  },
  setCamera: function(sx, sy) {
    this.attr._cameraX = Math.min(Math.max(0,sx),this.attr._mapWidth);
    this.attr._cameraY = Math.min(Math.max(0,sy),this.attr._mapHeight);
  },
  setCameraToAvatar: function () {
    this.setCamera(this.attr._avatarX, this.attr._avatarY);
  },
  setupPlay: function (restorationData) {
    var mapTiles = Game.util.init2DArray(this.attr._mapWidth, this.attr._mapHeight, Game.Tile.nullTile);
    var generator = new ROT.Map.Cellular(this.attr._mapWidth, this.attr._mapHeight);
    generator.randomize(0.5);

    // repeated cellular automata process
    var totalIterations = 3;
    for (var i = 0; i < totalIterations - 1; i++) {
      generator.create();
    }
    // run again then update map
    generator.create(function(x, y, v) {
      if (v === 1) {
        mapTiles[x][y] = Game.Tile.floorTile;
      } else {
        mapTiles[x][y] = Game.Tile.wallTile;
      }
    });
    // create map from the tiles
    this.attr._map = new Game.map(mapTiles);

    // restore anything else if the data is available (not sure what this is doing)
    if (restorationData !== undefined && restorationData.hasOwnProperty(Game.UIMode.gamePlay.JSON_KEY)) {
      this.fromJSON(restorationData[Game.UIMode.gamePlay.JSON_KEY]);
    }
  },
  toJSON: function() {
    var json = {};
    for (var at in this.attr) {
      if (this.attr.hasOwnProperty(at) && at != '_map') {
        json[at] = this.attr[at];
      }
    }
    return json;
  },
  fromJSON: function (json) {
    for (var at in this.attr) {
      if (this.attr.hasOwnProperty(at) && at != '_map') {
        this.attr[at] = json[at];
      }
    }
  }
};

//LOSE
Game.UIMode.gameLose = {
  enter: function() {
    console.log("Game.UIMode.gameLose enter");
  },
  exit: function() {
    console.log("Game.UIMode.gameLose exit");
  },
  handleInput: function (){
    console.log("Game.UIMode.gameLose handleInput");
  },
  renderOnMain: function(display){
    console.log("Game.UIMode.gameLose renderOnMain");
    display.clear();
    display.drawText(4,4,"You lost son");
  }
};

//WIN
Game.UIMode.gameWin = {
  enter: function() {
    console.log("Game.UIMode.gameWin enter");
  },
  exit: function() {
    console.log("Game.UIMode.gameWin exit");
  },
  handleInput: function (){
    console.log("Game.UIMode.gameWin handleInput");
  },
  renderOnMain: function(display){
    console.log("Game.UIMode.gameWin renderOnMain");
    display.clear();
    display.drawText(4,4,"CONGRATS, YOU PRESSED A BUTTONTTT!!!");
  }
};
