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
    display.clear();
    display.drawText(4,4,"Welcome to Grow Away to the Dot 3 (GATTD 3)");
    display.drawText(4,6,"press any key to continue");
  }
};

//PERSISTENCE
Game.UIMode.gamePersistence = {
  enter: function() {
    console.log("Game.UIMode.gamePersistence enter");
    Game.refresh();
  },
  exit: function() {
    console.log("Game.UIMode.gamePersistence exit");
    Game.refresh();
  },
  handleInput: function (eventType, evt){
    console.log("Game.UIMode.gamePersistence handleInput");
    var inputChar = String.fromCharCode(evt.charCode);
    if (inputChar == 'S') {
      this.saveGame();
    } else if (inputChar == 'L') {
      this.loadGame();
    } else if (inputChar == 'N') {
      this.newGame();
    }
  },
  renderOnMain: function( display ){
    display.clear();
    display.drawText(1, 3, "Press S to save the game, L to load the saved game," +
      " or N to start a new one");
    //TODO check whether local storage has a game before offering restore
    //TODO check whther a game is in progress before offering restore
  },

  loadGame: function() {
    if(this.localStorageAvailable()){
    var json_state_data = window.localStorage.getItem(Game._PERSISTANCE_NAMESPACE);
    var state_data = JSON.parse(json_state_data);
    Game.setRandomSeed(state_data._randomSeed);
    Game.UIMode.gamePlay.setupPlay();
    console.log("post-restore: using random seed " + Game.getRandomSeed());
    Game.switchUiMode(Game.UIMode.gamePlay);
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
      Game.Message.send("Sorry, you ain't got no local storage brah");
      return false;
    }
  }
};

//PLAY
Game.UIMode.gamePlay = {
  attr: {
    _map: null
  },
  enter: function() {
    console.log("Game.UIMode.gamePlay enter");
    Game.message.clearMessages();
    Game.refresh();
  },
  exit: function() {
    console.log("Game.UIMode.gamePlay exit");
    Game.refresh();
  },
  handleInput: function (eventType, evt){
    console.log("Game.UIMode.gamePlay handleInput");
    console.log(eventType);
    console.dir(evt);
    var inputChar = String.fromCharCode(evt.charCode);
    Game.message.sendMessage("You pressed the '" + inputChar + "' key.");
    if (eventType == 'keypress' && evt.keyCode == 13) { // enter
      Game.switchUiMode(Game.UIMode.gameWin);
    } else if (eventType == 'keydown' && evt.keyCode == 27){ // esc
      Game.switchUiMode(Game.UIMode.gameLose);
    } else if (inputChar == "M") {
      Game.switchUiMode(Game.UIMode.gamePersistence);
    }
  },
  renderOnMain: function(display) {
    var fg = Game.UIMode.DEFAULT_COLOR_FG;
    var bg = Game.UIMode.DEFAULT_COLOR_BG;
    this.attr._map.renderOn(display);
    console.log("Game.UIMode.gamePlay renderOnMain");
    display.clear();
    display.drawText(4,4,"Press Enter to win, Esc to Lose. Yeah great game right?");
    //ADDED FG/BG randomly here
    display.drawText(4, 5, "Press M to open the menu.", fg, bg);
  },
  setupPlay: function () {
    console.log("NO IM HERE");
    var mapTiles = Game.util.init2DArray(80, 24, Game.Tile.nullTile);
    var generator = new ROT.Map.Cellular(80, 24);
    generator.randomize(0.5);

    // repeated cellular automata process
    var totalIterations = 3;
    for (var i = 0; i < totalIterations - 1; ++i) {
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
