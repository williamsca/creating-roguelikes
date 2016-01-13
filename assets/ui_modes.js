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
    //Game.refresh();
  },
  exit: function() {
    console.log("Game.UIMode.gameStart exit");
    //Game.refresh();
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
    display.drawText(4,4,"Welcome to Colin & Diego's really great game.", fg, bg);
    display.drawText(4,6,"Press any key to continue", fg, bg);
  }
};

//PERSISTENCE
Game.UIMode.gamePersistence = {
  RANDOM_SEED_KEY: 'gameRandomSeed',
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
        // console.log('state data: ');
        // console.dir(state_data);

        // game level stuff
        Game.setRandomSeed(state_data[this.RANDOM_SEED_KEY]);

        // map
        for( var mapId in state_data.MAP) {

          if (state_data.MAP.hasOwnProperty(mapId)){
            var mapAttr = JSON.parse(state_data.MAP[mapId]);
            console.log("restoring map "+mapId+" with attributes:");
            console.dir(mapAttr);
            Game.DATASTORE.MAP[mapId] = new Game.map(mapAttr._mapTileSetName);
            Game.DATASTORE.MAP[mapId].fromJSON(state_data.MAP[mapId]);
          }
        }

        // entities
        for (var entityId in state_data.ENTITY) {
          if(state_data.ENTITY.hasOwnProperty(entityId)) {
            var entAttr = JSON.parse(state_data.ENTITY[entityId]);
            Game.DATASTORE.ENTITY[entityId] = Game.EntityGenerator.create(entAttr._generator_template_key);
            Game.DATASTORE.ENTITY[entityId].fromJSON(state_data.ENTITY[entityId]);
          }
        }

        // game play
        Game.UIMode.gamePlay.attr = state_data.GAME_PLAY;
        Game.switchUiMode(Game.UIMode.gamePlay);
        Game.message.sendMessage("Your game has been loaded.");
      } catch(e) {
        Game.message.sendMessage("There is no game to load.");
      }
    }
  },

  saveGame: function() {
    if(this.localStorageAvailable()){
      Game.DATASTORE.GAME_PLAY = Game.UIMode.gamePlay.attr;
      window.localStorage.setItem(Game._PERSISTANCE_NAMESPACE, JSON.stringify(Game.DATASTORE));
      Game.switchUiMode(Game.UIMode.gameStart);
      Game.message.sendMessage("Your game has been saved.");
    }
  },

  newGame: function() {
    Game.setRandomSeed(5 + Math.floor(Game.TRANSIENT_RNG.getUniform() * 100000));
    Game.UIMode.gamePlay.setupNewGame();
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
  },

  BASE_toJSON: function(state_hash_name){
    var state = this.attr;
    if (state_hash_name){
      state = this[state_hash_name];
    }
    var json = JSON.stringify(state);
    return json;
  },

  BASE_fromJSON: function(json, state_hash_name) {
    var using_state_hash = 'attr';
    if (state_hash_name) {
      using_state_hash = state_hash_name;
    }
    this[using_state_hash] = JSON.parse(json);
  }
};

//PLAY
Game.UIMode.gamePlay = {
  attr: {
    _mapId: '',
    _cameraX: 100,
    _cameraY: 100,
    _avatarId: ''
  },
  JSON_KEY: 'uiMode_gamePlay',
  enter: function() {
    console.log("Game.UIMode.gamePlay enter");
    Game.message.clearMessages();
    if(this.attr._avatarId) {
      this.setCameraToAvatar();
    }
    Game.refresh();
  },
  exit: function() {
    console.log("Game.UIMode.gamePlay exit");
    Game.refresh();
  },
  getMap: function() {
    return Game.DATASTORE.MAP[this.attr._mapId];
  },
  setMap: function (m) {
    this.attr._mapId = m.getId();
  },
  getAvatar: function() {
    return Game.DATASTORE.ENTITY[this.attr._avatarId];
  },
  setAvatar: function(a) {
    this.attr._avatarId = a.getId();
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
    this.getMap().renderOn(display, this.attr._cameraX, this.attr._cameraY);
    console.log("Game.UIMode.gamePlay renderOnMain");
    //this.renderAvatar(display);
  },
  // renderAvatar: function(display) {
  //   console.log("Avatar Rendered")
  //   this.attr._avatar.draw(display, this.attr._avatar.getX()-this.attr._cameraX+display._options.width / 2,
  //                                    this.attr._avatar.getY()-this.attr._cameraY+display._options.height / 2);
  // },
  renderAvatarInfo: function (display) {
    var fg = Game.UIMode.DEFAULT_COLOR_FG;
    var bg = Game.UIMode.DEFAULT_COLOR_BG;
    display.drawText(1, 2, "avatar x: " + this.getAvatar().getX(), fg, bg);
    display.drawText(1, 3, "avatar y: " + this.getAvatar().getY(), fg, bg);
    display.drawText(1, 4, "Turns so far: " + this.getAvatar().getTurns());
  },
  moveAvatar: function(dx, dy){
    if (this.getAvatar().tryWalk(this.getMap(),dx,dy)){
      this.setCameraToAvatar();
    }
  },
  moveCamera: function(dx, dy) {
    this.setCamera(this.attr._cameraX + dx, this.attr._cameraY + dy);
  },
  setCamera: function(sx, sy) {
    this.attr._cameraX = Math.min(Math.max(0,sx),this.getMap().getWidth());
    this.attr._cameraY = Math.min(Math.max(0,sy),this.getMap().getHeight());
    Game.refresh();
  },
  setCameraToAvatar: function () {
    test = this.getAvatar();
    console.log(this.attr._avatarId);
    console.dir(test);
    this.setCamera(this.getAvatar().getX(), this.getAvatar().getY());
  },
  setupNewGame: function () {
    this.setMap(new Game.map('caves1'));
    this.setAvatar(Game.EntityGenerator.create('avatar'));

    Game.DISPLAYS.main.o.setOptions(Game.DISPLAYS.options);

    this.getMap().addEntity(this.getAvatar(),this.getMap().getRandomWalkableLocation());
    this.setCameraToAvatar();

    for (var ecount = 0; ecount < 80; ecount++) {
      this.getMap().addEntity(Game.EntityGenerator.create('moss'),this.getMap().getRandomWalkableLocation());
    }

  },
  toJSON: function() {
  return Game.UIMode.gamePersistence.BASE_toJSON.call(this);
  },
  fromJSON: function (json) {
  return Game.UIMode.gamePersistence.BASE_fromJSON.call(this,json);
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
    display.drawText(4,4,"CONGRATS, YOU PRESSED A BUTTON!!!");
  }
};
