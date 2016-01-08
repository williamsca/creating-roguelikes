window.onload = function() {
    console.log("starting Waffle of Twilight - window loaded");
    // Check if rot.js can work on this browser
    if (!ROT.isSupported()) {
        alert("The rot.js library isn't supported by your browser.");
    } else {
        // Initialize the game
        Game.init();

        // Add the containers to our HTML page
        document.getElementById('wsrl-avatar-display').appendChild(   Game.getDisplay('avatar').getContainer());
        document.getElementById('wsrl-main-display').appendChild(   Game.getDisplay('main').getContainer());
        document.getElementById('wsrl-message-display').appendChild(   Game.getDisplay('message').getContainer());

        var bindEventToScreen = function(eventType){
          window.addEventListener(eventType, function(evt){
            Game.eventHandler(eventType,evt);
          });
        };

        // Bind Keyboard input events
        bindEventToScreen('keypress');
        bindEventToScreen('keydown');

        Game.message.sendMessage("Welcome to  WAFFLE OF TWILIGHT");
        Game.switchUiMode(Game.UIMode.gameStart);
    }
};

var Game = {
  _PERSISTANCE_NAMESPACE: 'wsrlgame',

  _DISPLAY_SPACING: 1.1,
  DISPLAYS: {
    main: {
      w: 80,
      h: 24,
      o: null
    },
    avatar: {
      w: 20,
      h: 24,
      o: null
    },
    message: {
      w: 100,
      h: 6,
      o: null
    }
  },
  _game: null,
  _curUiMode: null,
  _randomSeed: 0,
  init: function () {
    this._game = this;

    this.setRandomSeed(5 + Math.floor(ROT.RNG.getUniform()*100000));

    for (var displayName in this.DISPLAYS) {
      if (this.DISPLAYS.hasOwnProperty(displayName)) {
        this.DISPLAYS[displayName].o = new ROT.Display({width:Game.DISPLAYS[displayName].w, height:Game.DISPLAYS[displayName].h});
      }
    }
  },

  getRandomSeed: function () {
    return this._randomSeed;
  },

  setRandomSeed: function(s) {
    this._randomSeed = s;
    console.log("using random seed " +this._randomSeed);
    ROT.RNG.setSeed(this._randomSeed);
  },

  getDisplay: function(displayName) {
    return this.DISPLAYS[displayName].o;
  },

  //getHeight

  refresh: function() {
    this.renderAll();
  },

  renderAll: function() {
    this.renderAvatarDisplay();
    this.renderMain();
    this.renderMessage();
  },

  renderAvatarDisplay: function() {
    this.DISPLAYS.avatar.o.clear();
    if (this._curUiMode === null) {
      return;
    }


    if (this._curUiMode !== null && this._curUiMode.hasOwnProperty('renderOnAvatar')){
      this._curUiMode.renderOnAvatar(this.DISPLAYS.avatar.o);
    } else{
      this.DISPLAYS.avatar.o.drawText(2,1,"avatar display");
    }
  },
  renderMain: function() {
    if (this._curUiMode !== null && this._curUiMode.hasOwnProperty('renderOnMain')){
      this._curUiMode.renderOnMain(this.DISPLAYS.main.o);
    } else{
      this.DISPLAYS.main.o.drawText(2,1,"main display");
    }
  },
  renderMessage: function() {
      Game.message.renderOn(this.DISPLAYS.message.o);
  },

  toJson: function() {
    var json = {"_randomSeed:":this._randomSeed};
    return json;
  },

  switchUiMode: function (newMode) {
    if (this._curUiMode !== null) {
      this._curUiMode.exit();
    }
    this._curUiMode = newMode;

    if (this._curUiMode !== null) {
      this._curUiMode.enter();
    }
    this.renderAll();
  },

  eventHandler: function(eventType, evt) {
    if (this._curUiMode !== null && this._curUiMode.hasOwnProperty('handleInput')){
      this._curUiMode.handleInput(eventType, evt);
    }
  }

};
