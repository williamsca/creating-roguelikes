Game.UIMode = {};
Game.UIMode.DEFAULT_COLOR_FG = '#fff';
Game.UIMode.DEFAULT_COLOR_BG = '#000';
Game.UIMode.DEFAULT_COLOR_STR = '%c{' + Game.UIMode.DEFAULT_COLOR_FG +
'}%b{' + Game.UIMode.DEFAULT_COLOR_BG + '}';



//#####################################################################
//#####################################################################

//START
Game.UIMode.gameStart = {
    enter: function() {
        console.log("INITIALIZING GAME. PREPARE YO SELF.");
        Game.message.clearMessages();
    },
    exit: function() {
        console.log("Game.UIMode.gameStart exit");
        Game.message.clearMessages();
    },
    handleInput: function (inputType, inputData){
        console.log("Game.UIMode.gameStart handleInput");
        if (inputData.charCode !== 0) { // ignore the modding keys - control, shift, etc.
            Game.switchUiMode('gamePersistence');
        }
    },
    renderOnMain: function(display){
        console.log("Game.UIMode.gameStart renderOnMain");
        var fg = Game.UIMode.DEFAULT_COLOR_FG;
        var bg = Game.UIMode.DEFAULT_COLOR_BG;
        display.clear();
        display.drawText(4,4,Game.UIMode.DEFAULT_COLOR_STR+"Welcome to " + Game.util.getRandomTitle() + "!", fg, bg);
        Game.message.sendMessage("Press any key to continue.");
    }
};



//#####################################################################
//#####################################################################

//PERSISTENCE
Game.UIMode.gamePersistence = {
    RANDOM_SEED_KEY: 'gameRandomSeed',
    enter: function() {
        this._storedKeyBinding = Game.KeyBinding.getKeyBinding();
        Game.KeyBinding.setKeyBinding('persist');
        Game.refresh();
    },
    exit: function() {
        Game.KeyBinding.setKeyBinding(this._storedKeyBinding);
        //Game.KeyBinding.informPlayer(); //Not sure where to put this.
    },
    handleInput: function (inputType, inputData) {
        // console.log(inputType);
        // console.dir(inputData);
        var actionBinding = Game.KeyBinding.getInputBinding(inputType,inputData);
        // console.log('action binding is');
        // console.dir(actionBinding);
        // console.log('----------');
        console.dir(actionBinding);
        if (! actionBinding) {
            return false;
        }


        if (actionBinding.actionKey == 'PERSISTENCE_SAVE') {
            console.log("S");
            this.saveGame();
        } else if (actionBinding.actionKey == 'PERSISTENCE_LOAD') {
            console.log("L");

            this.loadGame();
        } else if (actionBinding.actionKey == 'PERSISTENCE_NEW') {
            console.log("N");

            this.newGame();
        } else if (actionBinding.actionKey == 'CANCEL') {
            if (Object.keys(Game.DATASTORE.MAP).length < 1){
                this.newGame();
            }else{
                Game.switchUiMode('gamePlay');
            }
        } else if (actionBinding.actionKey == 'HELP') {
            Game.UIMode.LAYER_textReading.setText(Game.KeyBinding.getBindingHelpText());
            Game.addUiMode('LAYER_textReading');
        }

        return false;

    },
    renderOnMain: function( display ) {
        display.clear();
        display.drawText(3, 3, Game.UIMode.DEFAULT_COLOR_STR+"Press 'N' to start a new game.", 70);
        display.drawText(3, 5, Game.UIMode.DEFAULT_COLOR_STR+"Press 'L' to load the saved game, or 'S' to save the game");
        //TODO check whether local storage has a game before offering restore
        //TODO check whther a game is in progress before offering restore
    },

    loadGame: function() {
        if(this.localStorageAvailable()) {
            // try {
            var json_state_data = window.localStorage.getItem(Game._PERSISTANCE_NAMESPACE);
            var state_data = JSON.parse(json_state_data);
            this._resetGameDataStructures();

            // game level stuff
            Game.setRandomSeed(state_data[this.RANDOM_SEED_KEY]);

            // map
            for( var mapId in state_data.MAP) {
                if (state_data.MAP.hasOwnProperty(mapId)){
                    var mapAttr = JSON.parse(state_data.MAP[mapId]);
                    console.log("restoring map "+mapId+" with attributes:");
                    console.dir(mapAttr);
                    Game.DATASTORE.MAP[mapId] = new Game.map(mapAttr._mapTileSetName, mapId);
                    Game.DATASTORE.MAP[mapId].fromJSON(state_data.MAP[mapId]);
                }
            }

            ROT.RNG.getUniform(); //cycle the RNG to get new data for entity generation

            // entities
            for (var entityId in state_data.ENTITY) {
                if(state_data.ENTITY.hasOwnProperty(entityId)) {
                    var entAttr = JSON.parse(state_data.ENTITY[entityId]);
                    var newE = Game.EntityGenerator.create(entAttr._generator_template_key, entAttr._id);
                    Game.DATASTORE.ENTITY[entityId] = newE;
                    Game.DATASTORE.ENTITY[entityId].fromJSON(state_data.ENTITY[entityId]);
                }
            }

            // items
            for (var itemId in state_data.ITEM){
                if (state_data.ITEM.hasOwnProperty(itemId)) {
                    var itemAttr = JSON.parse(state_data.ITEM[itemId]);
                    var newI = Game.ItemGenerator.create(itemAttr._generator_template_key, itemAttr._id);
                    Game.DATASTORE.ITEM[itemId] = newI;
                    Game.DATASTORE.ITEM[itemId].fromJson(state_data.ITEM[itemId]);
                }
            }

            // game play
            Game.UIMode.gamePlay.attr = state_data.GAME_PLAY;
            Game.message.attr = state_data.MESSAGES;
            this._storedKeyBinding = state_data.KEY_BINDING_SET;

            // schedule
            Game.initializeTimingEngine();
            for (var schedItemId in state_data.SCHEDULE) {
                if (state_data.SCHEDULE.hasOwnProperty(schedItemId)) {
                    if (Game.DATASTORE.ENTITY.hasOwnProperty(schedItemId)) {
                        Game.Scheduler.add(Game.DATASTORE.ENTITY[schedItemId], true, state_data.SCHEDULE[schedItemId]);
                    }
                }
            }
            Game.Scheduler._queue._time = state_data.SCHEDULE_TIME;

            Game.switchUiMode('gamePlay');
            Game.message.sendMessage("Your game has been loaded.");
            Game.KeyBinding.informPlayer();
            /* } catch(e) {
            Game.message.sendMessage("There is no game to load.");
        } */
    }
},

saveGame: function() {
    if(this.localStorageAvailable()){
        Game.DATASTORE.GAME_PLAY = Game.UIMode.gamePlay.attr;
        Game.DATASTORE.MESSAGES = Game.message.attr;

        Game.DATASTORE.KEY_BINDING_SET = this._storedKeyBinding;

        Game.DATASTORE.SCHEDULE = {};
        Game.DATASTORE.SCHEDULE[Game.Scheduler._current.getId()] = 1;
        for (var i = 0; i < Game.Scheduler._queue._eventTimes.length; i++) {
            Game.DATASTORE.SCHEDULE[Game.Scheduler._queue._events[i].getId()] = Game.Scheduler._queue._eventTimes[i] + 1;
        }
        Game.DATASTORE.SCHEDULE_TIME = Game.Scheduler._queue.getTime() - 1;


        window.localStorage.setItem(Game._PERSISTANCE_NAMESPACE, JSON.stringify(Game.DATASTORE));
        Game.switchUiMode('gameStart');
        Game.message.sendMessage("Your game has been saved.");
    }
},

newGame: function() {
    this._resetGameDataStructures();
    Game.setRandomSeed(5 + Math.floor(Game.TRANSIENT_RNG.getUniform() * 100000));
    Game.switchUiMode('gameQuestions');
},
_resetGameDataStructures: function() {
    Game.DATASTORE = {};
    Game.DATASTORE.MAP = {};
    Game.DATASTORE.ENTITY = {};
    Game.DATASTORE.ITEM = {};
    Game.initializeTimingEngine();
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
    return JSON.stringify(state);
},

BASE_fromJSON: function(json, state_hash_name) {
    var using_state_hash = 'attr';
    if (state_hash_name) {
        using_state_hash = state_hash_name;
    }
    this[using_state_hash] = JSON.parse(json);
}
};

//#############################--WIN--##################################
//#####################################################################

Game.UIMode.gameWin = {
  enter: function () {
    console.log('game winning');
    Game.TimeEngine.lock();
    Game.renderDisplayAvatar();
    Game.renderDisplayMain();
  },
  exit: function () {
  },
  render: function (display) {
    display.drawText(1,1,Game.UIMode.DEFAULT_COLOR_STR+"You WON!!!!");
  },
  handleInput: function (inputType,inputData) {
    // console.log('gameStart inputType:');
    // console.dir(inputType);
    // console.log('gameStart inputData:');
    // console.dir(inputData);
    Game.Message.clear();
  }
};

//#############################--LOSE--#########################################
//#############################################################################

Game.UIMode.gameLose = {
  enter: function () {
    console.log('game losing');
    Game.TimeEngine.lock();
    Game.renderAvatarDisplay();
    Game.renderMain();
  },
  exit: function () {
  },
  render: function (display) {
    display.drawText(1,1,Game.UIMode.DEFAULT_COLOR_STR+"You lost :(");
  },
  handleInput: function (inputType,inputData) {
    // console.log('gameStart inputType:');
    // console.dir(inputType);
    // console.log('gameStart inputData:');
    // console.dir(inputData);
  }
};

//#############################################################################
//#############################################################################


//QUESTIONS
Game.UIMode.gameQuestions = {
    attr: {
        questionNum: 0,
        questions: [
            {
              q: "Which map do you want?",
              a1: "caves", a2: "maze", a3: "digger", a4: "rogue"
            },
            {
              q: "A mad philosopher has kidnapped five subjects and lashed them onto a railroad track" +
                 "The train is rapidly approaching, but there is no way it can be stopped in time." +
                 "From your vantage point on a cliff, you notice an enormous man, so fat that pushing him" +
                 "into the path of the train would surely stop it. What do you do?",
              a1: "Nothing.", a2: "Push the fat man.", a3: "Jump in front of the train.",
              a4: "Run towards the victims to get a better view."
            },
            {
              q: "Which of the following do you fear the most?",
              a1: "Confined spaces.", a2: "Darkness.", a3: "Betrayal.", a4: "Fear is for the weak."
            },
            {
              q: "You're in an art gallery. You see four paintings. Which you you look at first?",
              a1: "'The Fall of Rapunzel' by Julio Ferres", a2: "'Thirst for More' by Deirdre Dessy",
              a3: "'Lover's Quarrel' by Lucifer Dracanus",  a4: "'Simplicity' by Him"
            },
            {
              q: "When life gives you lemons. . . ",
              a1: "Make lemonade.", a2: "Bake lemon bars.", a3: "Squirt them into the eyes of your enemies.",
              a4: "Design a combustible lemon."
            },
            {
              q: "You wake up in a field surrounded by red roses. Strangely, the roses to the West are wilted and dying, but the rest are fine." +
                 "You can see a solitary tree on the horizon to the North. What is your first move?",
              a1: "Investigate the wilted flowers.", a2: "Pick a fresh rose for your beloved.",
              a3: "Go climb the tree to get a better view.", a4: "I didn't read the question."
            }
        ],
        answers: {}
    },
    enter: function() {
      Game.message.ageMessages();
      Game.message.sendMessage("Press the number next to your answer,\n" +
                               "or press '0' for a random selection.");
      // Game.message.ageMessages();
    },
    exit: function() {

    },
    // DIEGO: I did this without the new keybinding stuff, so it will need updated
    handleInput: function (inputType, inputData){
      if (inputType == 'keypress') { var inputChar = String.fromCharCode(inputData.charCode); }
      var selectedAns = null;
      // It would be cool to have clever responses depending on what answer gets chosen
      switch (inputChar) {
        case undefined:
          break;
        case "1" :
          Game.message.sendMessage("ANSWER 1 SELECTED");
          selectedAns = this.getQuestion().a1;
          break;
        case "2" :
          Game.message.sendMessage("ANSWER 2 SELECTED");
          selectedAns = this.getQuestion().a2;
          break;
        case "3" :
          Game.message.sendMessage("ANSWER 3 SELECTED");
          selectedAns = this.getQuestion().a3;
          break;
        case "4" :
          Game.message.sendMessage("ANSWER 4 SELECTED");
          selectedAns = this.getQuestion().a4;
          break;
        case "N" : // To deal with leftover 'N' keypress
          break;
        case "0" : // Will need to randomly generate answers at some point
          this.attr.answers.mapType = "caves";
          Game.UIMode.gamePlay.setupNewGame(this.attr.answers);
          Game.switchUiMode('gamePlay');
          return;
        default :
          console.log(inputChar);
          Game.message.sendMessage("Please select a valid answer.");
          return;
      }

      Game.message.ageMessages();

        if (selectedAns) {
            this.processAnswer(selectedAns);
        }
    },
    processAnswer: function (ans) {
        switch(this.attr.questionNum){
          case 0:
            this.attr.answers.mapType = ans;
            break;
          case 1:
            // TODO
            break;
          case 2:
            // TODO
            break;
          case 3:
            // TODO
            break;
          case 4:
            // TODO
            break;
          case 5:
            // TODO
            Game.UIMode.gamePlay.setupNewGame(this.attr.answers);
            Game.switchUiMode('gamePlay');
            break;
          default:
          console.log("Invalid question number, should not be possible");
          return;
        }
        this.attr.questionNum++;
        Game.refresh();
    },
    getQuestion: function () {
        return this.attr.questions[this.attr.questionNum];
    },
    renderAvatarInfo: function(display) {
        display.drawText(1,1,"INSERT LONG BACKSTORY TO WHY QUESTIONS ARE BEING ASKED [HERE]");
    },

    renderOnMain: function(display){
        var fg = Game.UIMode.DEFAULT_COLOR_FG;
        var bg = Game.UIMode.DEFAULT_COLOR_BG;
        display.clear();
        var question = this.getQuestion();

        display.drawText(4,4,question.q, fg, bg);
        display.drawText(4,6,"1 - " + question.a1 + "\n2 - " + question.a2, fg, bg);
        display.drawText(4,8,"3 - " + question.a3 + "\n4 - " + question.a4, fg, bg);

    }
};

//#####################################################################
//#####################################################################

//PLAY
Game.UIMode.gamePlay = {
    attr: {
        _mapId: '',
        _avatarId: '',
        _cameraX: 100,
        _cameraY: 100,
        _answers: {
            mapType : null
        }
    },
    JSON_KEY: 'uiMode_gamePlay',
    enter: function() {
        // Graphics
        Game.DISPLAYS.main.o.clear();
        Game.DISPLAYS.main.o.setOptions(Game.DISPLAYS.tsOptions);

        console.log("Game.UIMode.gamePlay enter");
        Game.message.clearMessages();
        if(this.attr._avatarId) {
            this.setCameraToAvatar();
        }
        Game.TimeEngine.unlock();
        //Game.KeyBinding.informPlayer();
        Game.refresh();
    },
    exit: function() {
        Game.DISPLAYS.main.o.clear();
        Game.DISPLAYS.main.o.setOptions(Game.DISPLAYS.mainOptions);

        console.log("Game.UIMode.gamePlay exit");
        Game.refresh();
        Game.TimeEngine.lock();
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

        var actionBinding = Game.KeyBinding.getInputBinding(inputType,inputData);
        // console.log('action binding is');
        // console.dir(actionBinding);
        // console.log('----------');
        if ((! actionBinding) || (actionBinding.actionKey == 'CANCEL')) {
            return false;
        }
        var tookTurn = false;
        console.log("tookTurn: " + tookTurn);

        if        (actionBinding.actionKey == 'MOVE_UL') {
            tookTurn = this.moveAvatar(-1 ,-1);
        } else if (actionBinding.actionKey == 'MOVE_U') {
            tookTurn = this.moveAvatar(0  ,-1);
        } else if (actionBinding.actionKey == 'MOVE_UR') {
            tookTurn = this.moveAvatar(1  ,-1);
        } else if (actionBinding.actionKey == 'MOVE_L') {
            tookTurn = this.moveAvatar(-1  ,0);
        } else if (actionBinding.actionKey == 'MOVE_WAIT') {
            tookTurn = true;
        } else if (actionBinding.actionKey == 'MOVE_R') {
            tookTurn = this.moveAvatar(1  , 0);
        } else if (actionBinding.actionKey == 'MOVE_DL') {
            tookTurn = this.moveAvatar(-1  , 1);
        } else if (actionBinding.actionKey == 'MOVE_D') {
            tookTurn = this.moveAvatar(0  , 1);
        } else if (actionBinding.actionKey == 'MOVE_DR') {
            tookTurn = this.moveAvatar(1  , 1);


        } else if (actionBinding.actionKey == 'INVENTORY') {
            Game.addUiMode('LAYER_inventoryListing');
        }else if (actionBinding.actionKey == 'PICKUP') {
            var pickupRes = this.getAvatar().pickupItems(Game.util.objectArrayToIdArray(this.getAvatar().getMap().getItems(this.getAvatar().getPos())));
            tookTurn =  pickupRes.numItemsPickedUp > 0;
        } else if (actionBinding.actionKey == 'DROP') {
            var dropRes = this.getAvatar().dropItems(this.getAvatar().getInventoryItemIds());
            tookTurn =  dropRes.numItemsDropped > 0;


        }else if (actionBinding.actionKey == 'CHANGE_BINDINGS'){
            Game.KeyBinding.swapToNextKeyBinding();
        } else if (actionBinding.actionKey == 'PERSISTENCE') {
            Game.switchUiMode('gamePersistence');
        } else if (actionBinding.actionKey == 'HELP'){
            Game.UIMode.LAYER_textReading.setText(Game.KeyBinding.getBindingHelpText());
            Game.addUiMode('LAYER_textReading');
        }
        console.log(tookTurn);
        if (tookTurn) {
            this.getAvatar().raiseSymbolActiveEvent('actionDone');
            Game.message.ageMessages();
            return true;
        }
        return false;
    },
    renderOnMain: function(display) {
        //Game.DISPLAYS.main.o.setOptions(Game.DISPLAYS.tsOptions);

        var seenCells = this.getAvatar().getVisibleCells();
        this.getMap().renderOn(display,this.attr._cameraX, this.attr._cameraY, {
          visibleCells:seenCells,
          maskedCells:this.getAvatar().getRememberedCoordsForMap()
        });

        this.getAvatar().rememberCoords(seenCells);

        console.log("Game.UIMode.gamePlay renderOnMain");
        //this.renderAvatar(display);

    },

    renderAvatarInfo: function (display) {
        var fg = Game.UIMode.DEFAULT_COLOR_FG;
        var bg = Game.UIMode.DEFAULT_COLOR_BG;
        display.drawText(1, 2, Game.UIMode.DEFAULT_COLOR_STR+"Avatar x: " + this.getAvatar().getX(), fg, bg);
        display.drawText(1, 3, Game.UIMode.DEFAULT_COLOR_STR+"Avatar y: " + this.getAvatar().getY(), fg, bg);
        display.drawText(1, 4, Game.UIMode.DEFAULT_COLOR_STR+"Turns so far: " + this.getAvatar().getTurns());
        display.drawText(1, 5, Game.UIMode.DEFAULT_COLOR_STR+"HP: " + this.getAvatar().getCurHp() + "/" + this.getAvatar().getMaxHp());

    },

    moveAvatar: function(pdx, pdy){
      var moveResp = this.getAvatar().raiseSymbolActiveEvent('adjacentMove', {dx:pdx, dy:pdy});
      //console.log("madeAdjacentMove[0]:" + moveResp.madeAdjacentMove[0]);
      if (moveResp.madeAdjacentMove && moveResp.madeAdjacentMove[0]) {
        this.setCameraToAvatar();
        return true;
      }
      return false;
      /*
        if (this.getAvatar().tryWalk(this.getMap(),dx,dy)){
            this.setCameraToAvatar();
            return true;
        }
        return false;
        */
    },
    moveCamera: function(dx, dy) {
        this.setCamera(this.attr._cameraX + dx, this.attr._cameraY + dy);
    },
    setCamera: function(sx, sy) {
        this.attr._cameraX = Math.min(Math.max(0,sx),this.getMap().getWidth());
        this.attr._cameraY = Math.min(Math.max(0,sy),this.getMap().getHeight());
        //Only the main display should change -> no need to refresh all
        //Game.renderMain();
    },
    setCameraToAvatar: function () {
        test = this.getAvatar();
        console.log(this.attr._avatarId);
        console.dir(test);
        this.setCamera(this.getAvatar().getX(), this.getAvatar().getY());
    },
    setupNewGame: function (answers) {
        this.attr._answers = answers;
        mapType = this.getMapType();
        console.log(mapType);


        this.setMap(new Game.map(mapType));
        this.setAvatar(Game.EntityGenerator.create('avatar'));

        this.getMap().addEntity(this.getAvatar(),this.getMap().getWalkablePosition());
        this.setCameraToAvatar();

        var itemPos = '';
        for (var ecount = 0; ecount < 80; ecount++) {
            // this.getMap().addEntity(Game.EntityGenerator.create('moss'), this.getMap().getWalkablePosition());
            // //this.getMap().addEntity(Game.EntityGenerator.create('newt'), this.getMap().getWalkablePosition());
            // this.getMap().addEntity(Game.EntityGenerator.create('angry squirrel'), this.getMap().getWalkablePosition());
            // this.getMap().addEntity(Game.EntityGenerator.create('attack slug'), this.getMap().getWalkablePosition());

            itemPos = this.getMap().getWalkablePosition();
            this.getMap().addItem(Game.ItemGenerator.create('rock'), itemPos);
            this.getMap().addItem(Game.ItemGenerator.create('rock'), itemPos);

        }
        this.getMap().addItem(Game.ItemGenerator.create('rock'), itemPos);

        for (var a = 0; a < 30; a++) {
            Game.getAvatar().addInventoryItems([Game.ItemGenerator.create('rock')]);
        }

    },

    getMapType: function () {
        console.log("huh?");
        return this.attr._answers.mapType;

        //   switch(Math.floor(Math.random()*3)){
        //       case 0:
        //         return "caves";
        //         break;
        //       case 1:
        //         return "maze";
        //         break;
        //       case 2:
        //         return "digger";
        //         break;
        //       case 3:
        //         return "rogue";
        //         break;
        //   }

    },
    toJSON: function() {
        return Game.UIMode.gamePersistence.BASE_toJSON.call(this);
    },
    fromJSON: function (json) {
        return Game.UIMode.gamePersistence.BASE_fromJSON.call(this,json);
    }
};

//#############################################################################
//#############################################################################
//LOSE
Game.UIMode.LAYER_textReading = {
    _storedKeyBinding: '',
    _text: 'default',
    _renderY: 0,
    _renderScrollLimit: 0,
    enter: function() {
        this._renderY = 0;
        Game.DISPLAYS.main.o.setOptions(Game.DISPLAYS.mainOptions);
        this._storedKeyBinding = Game.KeyBinding.setKeyBinding();
        Game.KeyBinding.setKeyBinding('LAYER_textReading');
        Game.refresh();
        Game.specialMessage("[Esc] to exit, [ and ] for scrolling");
    },
    exit: function() {
        //Game.DISPLAYS.main.o.setOptions(Game.DISPLAYS.tsOptions);
        Game.KeyBinding.setKeyBinding(this._storedKeyBinding);
        setTimeout(function(){
        Game.refresh();
     }, 1);
    },
    renderOnMain: function(display){
        display.clear();
        var dims = Game.util.getDisplayDim(display);
        var linesTaken = display.drawText(1,this._renderY,Game.UIMode.DEFAULT_COLOR_STR+this._text, dims.w-2);
        this._renderScrollLimit = dims.h - linesTaken;
        if(this._renderScrollLimit > 0){ this._renderScrollLimit=0;}
    },
    handleInput: function (inputType,inputData) {
   // console.log(inputType);
   // console.dir(inputData);
   var actionBinding = Game.KeyBinding.getInputBinding(inputType,inputData);
   // console.log('action binding is');
   // console.dir(actionBinding);
   // console.log('----------');
   if (! actionBinding) {
     return false;
   }
   if(actionBinding.actionKey == 'CANCEL'){
       Game.removeUiMode();
   }

   else if (actionBinding.actionKey == 'DATA_NAV_UP') {
       this._renderY++;
       if (this._renderY > 0) { this._renderY = 0; }
       Game.renderMain();
       return true;
     } else if (actionBinding.actionKey == 'DATA_NAV_DOWN') {
       this._renderY--;
       if (this._renderY < this._renderScrollLimit) { this._renderY = this._renderScrollLimit; }
       Game.renderMain();
       return true;
     }
   return false;
 },
 getText: function () {
   return this._text;
 },
 setText: function (t) {
   this._text = t;
 }
};

//####################################################//
//####################################################

Game.UIMode.LAYER_itemListing = function(template) {
  template = template ? template : {};

  this._caption = template.caption || 'Items';
  this._processingFunction = template.processingFunction;
  this._filterListedItemsOnFunction = template.filterListedItemsOn || function(x) {
      return x;
  };
  this._canSelectItem = template.canSelect || false;
  this._canSelectMultipleItems = template.canSelectMultipleItems || false;
  this._hasNoItemOption = template.hasNoItemOption || false;
  this._origItemIdList= template.itemIdList ? JSON.parse(JSON.stringify(template.itemIdList)) : [];
  this._itemIdList = [];
  this._runFilterOnItemIdList();
  this._keyBindingName= template.keyBindingName || 'LAYER_itemListing';

  this._selectedItemIdxs= [];
  this._displayItemsStartIndex = 0;
  this._displayItems = [];
  this._displayMaxNum = Game.getDisplayHeight('main')-3;
};

Game.UIMode.LAYER_itemListing.prototype._runFilterOnItemIdList = function () {
  this._itemIdList = [];
  for (var i = 0; i < this._origItemIdList.length; i++) {
    if (this._filterListedItemsOnFunction(this._origItemIdList[i])) {
      this._itemIdList.push(this._origItemIdList[i]);
    }
  }
};

Game.UIMode.LAYER_itemListing.prototype.enter = function () {
    Game.DISPLAYS.main.o.setOptions(Game.DISPLAYS.mainOptions);

  this._storedKeyBinding = Game.KeyBinding.getKeyBinding();
  Game.KeyBinding.setKeyBinding(this._keyBindingName);
  if ('doSetup' in this) {
    this.doSetup();
  }
  Game.refresh();
  //Game.specialMessage("[Esc] to exit, [ and ] for scrolling");
};
Game.UIMode.LAYER_itemListing.prototype.exit = function () {
    //Game.DISPLAYS.main.o.setOptions(Game.DISPLAYS.tsOptions);

  Game.KeyBinding.setKeyBinding(this._storedKeyBinding);
  setTimeout(function(){
     Game.refresh();
  }, 1);
};
Game.UIMode.LAYER_itemListing.prototype.setup = function(setupParams) {
  setupParams = setupParams ? setupParams : {};

  if (setupParams.hasOwnProperty('caption')) {
    this._caption = setupParams.caption;
  }
  if (setupParams.hasOwnProperty('processingFunction')) {
    this._processingFunction = setupParams.processingFunction;
  }
  if (setupParams.hasOwnProperty('filterListedItemsOn')) {
    this._filterListedItemsOnFunction = setupParams.filterListedItemsOn;
    this._runFilterOnItemIdList();
  }
  if (setupParams.hasOwnProperty('canSelect')) {
    this._canSelectItem = setupParams.canSelect;
  }
  if (setupParams.hasOwnProperty('canSelectMultipleItems')) {
    this._canSelectMultipleItems = setupParams.canSelectMultipleItems;
  }
  if (setupParams.hasOwnProperty('hasNoItemOption')) {
    this._hasNoItemOption = setupParams.hasNoItemOption;
  }
  if (setupParams.hasOwnProperty('itemIdList')) {
    this._origItemIdList= JSON.parse(JSON.stringify(setupParams.itemIdList));
    this._runFilterOnItemIdList();
  }
  if (setupParams.hasOwnProperty('keyBindingName')) {
    this._keyBindingName= setupParams.keyBindingName;
  }

  this._selectedItemIdxs= [];
  this._displayItemsStartIndex = 0;
  this._displayItems = [];
  this.determineDisplayItems();
};

Game.UIMode.LAYER_itemListing.prototype.getItemList = function () {
  return this._itemIdList;
};
Game.UIMode.LAYER_itemListing.prototype.setItemList = function (itemList) {
  this._itemIdList = itemList;
};
Game.UIMode.LAYER_itemListing.prototype.getKeyBindingName = function () {
  return this._keyBindingName;
};
Game.UIMode.LAYER_itemListing.prototype.setKeyBindingName = function (keyBindingName) {
  this._keyBindingName = keyBindingName;
};

Game.UIMode.LAYER_itemListing.prototype.determineDisplayItems = function() {
    this._displayItems = this._itemIdList.slice(this._displayItemsStartIndex,this._displayItemsStartIndex+this._displayMaxNum).map(function(itemId) { return Game.DATASTORE.ITEM[itemId]; });
};
Game.UIMode.LAYER_itemListing.prototype.handlePageUp = function() {
    this._displayItemsStartIndex -= this._displayMaxNum;
    if (this._displayItemsStartIndex < 0) {
        this._displayItemsStartIndex = 0;
    }
    this.determineDisplayItems();
    Game.refresh();
};
Game.UIMode.LAYER_itemListing.prototype.handlePageDown = function() {
    var numUnseenItems = this._itemIdList.length - (this._displayItemsStartIndex + this._displayItems.length);
    this._displayItemsStartIndex += this._displayMaxNum;
    if (this._displayItemsStartIndex > this._itemIdList.length) {
        this._displayItemsStartIndex -= this._displayMaxNum;
    }
    this.determineDisplayItems();
    Game.refresh();
};

Game.UIMode.LAYER_itemListing.prototype.renderOnMain = function (display) {
    display.clear();
  var selectionLetters = 'abcdefghijklmnopqrstuvwxyz';

  // Render the caption in the top row
  var captionText = 'Items';
  if (typeof this._caption == 'function') {
    captionText = this._caption();
  } else {
    captionText = this._caption;
  }
  display.drawText(0, 0, Game.UIMode.DEFAULT_COLOR_STR + captionText);

  var row = 0;
  if (this._hasNoItemOption) {
    display.drawText(0, 1, Game.UIMode.DEFAULT_COLOR_STR + '0 - no item');
    row++;
  }
  if (this._displayItemsStartIndex > 0) {
    display.drawText(0, 1 + row, '%c{black}%b{yellow}[ for more');
    row++;
  }
  for (var i = 0; i < this._displayItems.length; i++) {
    var trueItemIndex = this._displayItemsStartIndex + i;
    if (this._displayItems[i]) {
      var selectionLetter = selectionLetters.substring(i, i + 1);

      // If we have selected an item, show a +, else show a space between the selectionLetter and the item's name.
      var selectionState = (this._canSelectItem && this._canSelectMultipleItems && this._selectedIndices[trueItemIndex]) ? '+' : ' ';

      var item_symbol = this._displayItems[i].getRepresentation()+Game.UIMode.DEFAULT_COLOR_STR;
      display.drawText(0, 1 + row, Game.UIMode.DEFAULT_COLOR_STR + selectionLetter + ' ' + selectionState + ' ' + item_symbol + ' ' +this._displayItems[i].getName());
      row++;
    }
  }
  if ((this._displayItemsStartIndex + this._displayItems.length) < this._itemIdList.length) {
    display.drawText(0, 1 + row, '%c{black}%b{yellow}] for more');
    row++;
  }
};


Game.UIMode.LAYER_itemListing.prototype.executeProcessingFunction = function() {
  // Gather the selected item ids
  var selectedItemIds = [];
  for (var selectionIndex in this._selectedIndices) {
    if (this._selectedIndices.hasOwnProperty(selectionIndex)) {
      selectedItemIds.push(this._itemIdList[selectionIndex]);
    }
  }
  Game.removeUiMode();
  // Call the processing function and end the player's turn if it returns true.
  if (this._processingFunction(selectedItemIds)) {
    Game.getAvatar().raiseSymbolActiveEvent('actionDone');
  }
};

Game.UIMode.LAYER_itemListing.prototype.handleInput = function (inputType,inputData) {
  // console.log(inputType);
  // console.dir(inputData);
  var actionBinding = Game.KeyBinding.getInputBinding(inputType,inputData);
  // console.log('action binding is');
  // console.dir(actionBinding);
  // console.log('----------');
  if (! actionBinding) {
    return false;
  }

  if (actionBinding.actionKey == 'CANCEL') {
    Game.removeUiMode();

  } else if (actionBinding.actionKey == 'PROCESS_SELECTIONS') {
    this.executeProcessingFunction();

  } else if (this._canSelectItem && this._hasNoItemOption && (actionBinding.actionKey == 'SELECT_NOTHING')) {
    this._selectedIndices = {};

  } else if ((inputType === 'keydown') && this._canSelectItem && inputData.keyCode >= ROT.VK_A && inputData.keyCode <= ROT.VK_Z) {
    // handle pressing a selection letter

    // Check if it maps to a valid item by subtracting 'a' from the character
    // to know what letter of the alphabet we used.
    var index = inputData.keyCode - ROT.VK_A;
    var trueItemIndex = this._displayIndexLower + index;
    if (this._itemIdList[trueItemIndex]) {
      // If multiple selection is allowed, toggle the selection status, else select the item and exit the screen
      if (this._canSelectMultipleItems) {
          if (this._selectedIndices[trueItemIndex]) {
            delete this._selectedIndices[trueItemIndex];
          } else {
            this._selectedIndices[trueItemIndex] = true;
          }
          Game.refresh();
      } else {
        this._selectedIndices[trueItemIndex] = true;
        this.executeProcessingFunction();
      }
    }
  } else if (actionBinding.actionKey == 'DATA_NAV_UP') {
    this.handlePageUp();

  } else if (actionBinding.actionKey == 'DATA_NAV_DOWN') {
    this.handlePageDown();

  } else if (actionBinding.actionKey == 'HELP') {
    var helpText = '';
    if (this._canSelectItem || this._canSelectMultipleItems) {
      helpText += "a-z   select the indicated item\n";
      var processBinding = Game.KeyBinding.getBindingForAction('PROCESS_SELECTIONS');
      if (processBinding) {
        helpText += processBinding.label+'   '+processBinding.long+"\n";
      }
    }
    helpText += Game.KeyBinding.getBindingHelpText();
    Game.UIMode.LAYER_textReading.setText(helpText);
    Game.addUiMode('LAYER_textReading');
  }

  return false;
};

//-------------------

Game.UIMode.LAYER_inventoryListing = new Game.UIMode.LAYER_itemListing({
    caption: 'Inventory',
    canSelect: false,
    keyBindingName: 'LAYER_inventoryListing'
});
Game.UIMode.LAYER_inventoryListing.doSetup = function () {
  this.setup({itemIdList: Game.getAvatar().getInventoryItemIds()});
};
