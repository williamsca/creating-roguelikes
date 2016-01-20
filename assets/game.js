window.onload = function() {
    console.log("starting RGD - window loaded");
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

        Game.switchUiMode('gameStart');
    }
};

var Game = {
  _PERSISTANCE_NAMESPACE: 'wsrlgame',

  _DISPLAY_SPACING: 1.1,
  DISPLAYS: {
    main: {
      w: 80, //This isnt good, please fix this oh dear god
      h: 24, // False alarm, we're all good, move along people
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
  _uiModeNameStack: [],
  _randomSeed: 0,
  TRANSIENT_RNG: null,

  DATASTORE: {},

  Scheduler: null,
  TimeEngine: null,

  init: function () {
    this._game = this;

    this.TRANSIENT_RNG = ROT.RNG.clone();
    Game.setRandomSeed(5 + Math.floor(this.TRANSIENT_RNG.getUniform()*100000));

    // this.initializeTimingEngine();

    for (var displayName in this.DISPLAYS) {
      if (this.DISPLAYS.hasOwnProperty(displayName)) {
        this.DISPLAYS[displayName].o = new ROT.Display({width:Game.DISPLAYS[displayName].w, height:Game.DISPLAYS[displayName].h});
      }
    }
    this.renderAll();

    var game = this;
    var bindEventToUiMode = function(event) {
      window.addEventListener(event, function(e) {
        // When an event is received, send it to the
        // screen if there is one
        if (game.getCurUiMode() !== null) {
          game.getCurUiMode().handleInput(event, e);
        }
      });
    };
    // Bind keyboard input events
    bindEventToUiMode('keypress');
    bindEventToUiMode('keydown');
    // bindEventToScreen('keyup');

    this.DISPLAYS.mainOptions = JSON.parse(JSON.stringify(this.DISPLAYS.main.o.getOptions()));
  },

  initializeTimingEngine: function () {
    // NOTE: single, central timing system for now - might have to refactor this later to deal with mutliple map stuff
    Game.Scheduler = new ROT.Scheduler.Action();
    Game.TimeEngine = new ROT.Engine(Game.Scheduler);
  },

  getRandomSeed: function () {
    return this._randomSeed;
  },

  setRandomSeed: function(s) {
    this._randomSeed = s;
    console.log("using random seed " +this._randomSeed);
    this.DATASTORE[Game.UIMode.gamePersistence.RANDOM_SEED_KEY] = this._randomSeed;
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
    if (this.getCurUiMode() === null) {
      return;
    }


    if (this.getCurUiMode() !== null && this.getCurUiMode().hasOwnProperty('renderAvatarInfo')){
      this.getCurUiMode().renderAvatarInfo(this.DISPLAYS.avatar.o);
    } else{
      this.DISPLAYS.avatar.o.drawText(2,1,"avatar display");
    }
  },
  renderMain: function() {
    if (this.getCurUiMode() !== null && this.getCurUiMode().hasOwnProperty('renderOnMain')){
      this.getCurUiMode().renderOnMain(this.DISPLAYS.main.o);
    } else{
      this.DISPLAYS.main.o.drawText(2,1,"main display");
    }
  },
  renderMessage: function() {
      Game.message.renderOn(this.DISPLAYS.message.o);
  },
  hideDisplayMessage: function () {
      this.DISPLAYS.message.o.clear();
  },
  specialMessage: function(msg) {
      this.DISPLAYS.message.o.clear();
      this.DISPLAYS.message.o.drawText(1,1,'%c{#fff}%b{#000}'+msg,79);
  },

  getAvatar: function() {
    return Game.UIMode.gamePlay.getAvatar();
  },

  getCurUiMode: function () {
    var uiModeName = this._uiModeNameStack[0];
      if (uiModeName) {
        return Game.UIMode[uiModeName];
      }
      return null;
  },
  switchUiMode: function (newUiModeName) {
     if (newUiModeName.startsWith('LAYER_')) {
       console.log('cannot switchUiMode to layer '+newUiModeName);
       return;
     }
     var curMode = this.getCurUiMode();
     if(curMode !== null){
       curMode.exit();
     }
     this._uiModeNameStack[0] = newUiModeName;
     var newMode = Game.UIMode[newUiModeName];
     if (newMode){
       newMode.enter();
     }
     this.renderAll();
   },
   addUiMode: function (newUiModeLayerName) {
     if (! newUiModeLayerName.startsWith('LAYER_')) {
       console.log('addUiMode not possible for non-layer '+newUiModeLayerName);
       return;
     }
     this._uiModeNameStack.unshift(newUiModeLayerName);
     var newMode = Game.UIMode[newUiModeLayerName];
     if (newMode){
         newMode.enter();
     }
     //this.renderAll();
   },
   removeUiMode: function() {
    var curMode = this.getCurUiMode();
     if(curMode !== null){
         curMode.exit();
     }
     this._uiModeNameStack.shift();
     this.renderAll();
   },

   eventHandler: function(eventType, evt) {
     if (this.getCurUiMode() !== null && this.getCurUiMode().hasOwnProperty('handleInput')){
       this.getCurUiMode().handleInput(eventType, evt);
     }
   }
};
