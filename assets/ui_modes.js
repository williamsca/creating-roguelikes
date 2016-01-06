Game.UIMode = {};

//START
Game.UIMode.gameStart = {
  enter: function() {
    console.log("Game.UIMode.gameStart enter");
  },
  exit: function() {
    console.log("Game.UIMode.gameStart exit");
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
  },
  exit: function() {
    console.log("Game.UIMode.gamePersistence exit");
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
  renderOnMain: function(display){
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
  enter: function() {
    console.log("Game.UIMode.gamePlay enter");
  },
  exit: function() {
    console.log("Game.UIMode.gamePlay exit");
  },
  handleInput: function (eventType, evt){
    console.log("Game.UIMode.gamePlay handleInput");
    console.log(eventType);
    console.dir(evt);
    var inputChar = String.fromCharCode(evt.charCode);
    if (eventType == 'keypress' && evt.keyCode == 13) { // enter
      Game.switchUiMode(Game.UIMode.gameWin);
    } else if (eventType == 'keydown' && evt.keyCode == 27){ // esc
      Game.switchUiMode(Game.UIMode.gameLose);
    } else if (inputChar == "M") {
      Game.switchUiMode(Game.UIMode.gamePersistence);
    }
  },
  renderOnMain: function(display){
    console.log("Game.UIMode.gamePlay renderOnMain");
    display.clear();
    display.drawText(4,4,"Press Enter to win, Esc to Lose. Yeah great game right?");
    display.drawText(4, 5, "Press M to open the menu.");
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
