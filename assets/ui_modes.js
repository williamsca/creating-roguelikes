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
        // console.log("INITIALIZING GAME. PREPARE YO SELF.");
        Game.message.clearMessages();
    },
    exit: function() {
        // console.log("Game.UIMode.gameStart exit");
        Game.message.clearMessages();
    },
    handleInput: function (inputType, inputData){
        // console.log("Game.UIMode.gameStart handleInput");
        if (inputData.charCode !== 0) { // ignore the modding keys - control, shift, etc.
            Game.switchUiMode('gamePersistence');
        }
    },
    renderOnMain: function(display){
        // console.log("Game.UIMode.gameStart renderOnMain");
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
        // console.dir(actionBinding);
        if (! actionBinding) {
            return false;
        }


        if (actionBinding.actionKey == 'PERSISTENCE_SAVE') {
            this.saveGame();
        } else if (actionBinding.actionKey == 'PERSISTENCE_LOAD') {
            this.loadGame();
        } else if (actionBinding.actionKey == 'PERSISTENCE_NEW') {
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

                    Game.DATASTORE.MAP[mapId] = new Game.map(mapAttr._mapTileSetName, mapAttr._small, mapId);
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
                    Game.DATASTORE.ITEM[itemId].fromJSON(state_data.ITEM[itemId]);
                }
            }

            // game play
            Game.UIMode.gamePlay.attr = state_data.GAME_PLAY;
            Game.message.attr = state_data.MESSAGES;
            this._storedKeyBinding = state_data.KEY_BINDING_SET;

            // Changed tiles
            for (var i = 0; i < Game.UIMode.gamePlay.attr._changedTiles.length; i++) {
                pos = Game.UIMode.gamePlay.attr._changedTiles[i];
                if (pos.wall){
                Game.UIMode.gamePlay.getMap()._tiles[pos.x][pos.y] = Game.Tile.wallTile;
                }else{
                Game.UIMode.gamePlay.getMap()._tiles[pos.x][pos.y] = Game.Tile.floorTile;
                }
            }

            Game.DISPLAYS.tsOptions.tileSet = Game.TILESETS[Game.UIMode.gamePlay.attr._answers.graphics];

            if(Game.UIMode.gamePlay.attr._answers.graphics == "beach"){
                Game.Tile.wallTile.attr._transparent = true;
                Game.Tile.wallTile.attr._opaque = false;
                Game.Tile.wallTile2.attr._transparent = true;
                Game.Tile.wallTile2.attr._opaque = false;
                Game.Tile.wallTile3.attr._transparent = true;
                Game.Tile.wallTile3.attr._opaque = false;
                Game.Tile.wallTile4.attr._transparent = true;
                Game.Tile.wallTile4.attr._opaque = false;
            }

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
    Game.renderAll();
  },
  exit: function () {
  },
  renderOnMain: function (display) {
      display.clear();
    display.drawText(1,1,Game.UIMode.DEFAULT_COLOR_STR+"You WON!!!!");
  },
  handleInput: function (inputType,inputData) {
    // console.log('gameStart inputType:');
    // console.dir(inputType);
    // console.log('gameStart inputData:');
    // console.dir(inputData);
    Game.message.clearMessages();
  }
};

//#############################--LOSE--#########################################
//#############################################################################

Game.UIMode.gameLose = {
  enter: function () {
    console.log('game losing');
    Game.TimeEngine.lock();
    Game.renderAll();
  },
  exit: function () {
  },
  renderOnMain: function (display) {
    display.clear();
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


//Questions
Game.UIMode.gameQuestions = {
    attr: {
        questionNum: 0,
        questions: [
            {
              q: "A mad philosopher has kidnapped five subjects and lashed them onto a \nrailroad track. " +
                 "The train is rapidly approaching, but there is no way \nit can be stopped in time. " +
                 "From your vantage point on a cliff, you notice \nan enormous man, so fat that pushing him " +
                 "into the path of the train \nwould surely stop it. What do you do?",
              a1: "Nothing.", a2: "Push the fat man.", a3: "Jump in front of the train.",
              a4: "Run towards the victims to get a better view."
            },
            {
              q: "Which of the following do you fear the most?",
              a1: "Confined spaces.", a2: "Darkness.", a3: "The past.", a4: "Fear is for the weak."
            },
            {
              q: "You're in an art gallery. You see four paintings. \nWhich you you look at first?",
              a1: "'The Fall of Rapunzel' by Julio Ferres", a2: "'Thirst for More' by Deirdre Dessy",
              a3: "'Lover's Quarrel' by Lucifer Dracanus",  a4: "'Simplicity' by Him"
            },
            {
              q: "When life gives you lemons. . . ",
              a1: "Make lemonade.", a2: "Bake lemon bars.", a3: "Squirt them into the eyes of your enemies.",
              a4: "Design a combustible lemon."
            },
            {
              q: "You wake up in a field surrounded by red roses. \nStrangely, the roses to the West are wilted and dying, \nbut the rest are fine. " +
                 "You can see a solitary tree on \nthe horizon to the North. What is your first move?",
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
    },
    exit: function() {

    },
    // DIEGO: I did this without the new keybinding stuff, so it will need updated..nah
    handleInput: function (inputType, inputData){
      if (inputType == 'keypress') { var inputChar = String.fromCharCode(inputData.charCode); }
      var selectedAns = null;
      // It would be cool to have clever responses depending on what answer gets chosen
      switch (inputChar) {
        case undefined:
          break;
        case "1" :
          Game.message.sendMessage("ANSWER 1 SELECTED");
          selectedAns = 1;
          break;
        case "2" :
          Game.message.sendMessage("ANSWER 2 SELECTED");
          selectedAns = 2;
          break;
        case "3" :
          Game.message.sendMessage("ANSWER 3 SELECTED");
          selectedAns = 3;
          break;
        case "4" :
          Game.message.sendMessage("ANSWER 4 SELECTED");
          selectedAns = 4;
          break;
        case "N" : // To deal with leftover 'N' keypress
          break;
        case "0" :
          for (var i = 0; i < this.attr.questions.length; i++) {
              selectedAns = Math.floor(Math.random()*4 + 1)
              this.processAnswer(selectedAns);
          }
          selectedAns = 0;
          break;
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
          //OBJECTIVE CHOICE
            switch(ans){
                case 1:
                    this.attr.answers.objective = "escape";
                    break;
                case 2:
                    this.attr.answers.objective = "killAll";
                    break;
                case 3:
                    this.attr.answers.objective = "boss";
                    break;
                case 4:
                    this.attr.answers.objective = "findKey";
                    break;
            }
            break;
          case 1:
          // MISC
                switch(ans){
                case 1:
                    this.attr.answers.misc = "smallMap";
                    break;
                case 2:
                    this.attr.answers.misc = "smallVision";
                    break;
                case 3:
                    this.attr.answers.misc = "noMapMemory";
                    break;
                case 4:
                    this.attr.answers.misc = "evilMonsters";
                    break;
            }
            break;
          case 2:
          // GRAPHICS
                switch(ans){
                case 1:
                    this.attr.answers.graphics = "forest";
                    break;
                case 2:
                    this.attr.answers.graphics = "beach";
                    break;
                case 3:
                    this.attr.answers.graphics = "cave";
                    break;
                case 4:
                    this.attr.answers.graphics = "doodle";
                    break;

            }
            break;
          case 3:
          // MAPTYPE
                switch(ans){
                case 1:
                    this.attr.answers.mapType = "digger";
                    break;
                case 2:
                    this.attr.answers.mapType = "maze";
                    break;
                case 3:
                    this.attr.answers.mapType = "caves";
                    break;
                case 4:
                    this.attr.answers.mapType = "rogue";
                    break;
            }
            break;
          case 4:
          // EQUIPMENT
                switch(ans){
                case 1:
                    this.attr.answers.equ = "range";
                    break;
                case 2:
                    this.attr.answers.equ = "trap";
                    break;
                case 3:
                    this.attr.answers.equ = "broad";
                    break;
                case 4:
                    this.attr.answers.equ = "rapier";
                    break;
            }
            Game.UIMode.gamePlay.setupNewGame(this.attr.answers);
            Game.switchUiMode('backStory');
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
      if (this.attr.questionNum == 0) {
        display.drawText(1,1,"You wake up in an unfamiliar room. A kindly man, who appears to be some kind of doctor, leans over and asks a series of questions.");
      }
    },

    renderOnMain: function(display){
        var fg = Game.UIMode.DEFAULT_COLOR_FG;
        var bg = Game.UIMode.DEFAULT_COLOR_BG;
        display.clear();
        var question = this.getQuestion();

        display.drawText(4,2,question.q, fg, bg);
        display.drawText(4,8,"1 - " + question.a1 + "\n2 - " + question.a2, fg, bg);
        display.drawText(4,10,"3 - " + question.a3 + "\n4 - " + question.a4, fg, bg);
    },
};

//#####################################################################
//#####################################################################

//Backstory


Game.UIMode.backStory = {
    JSON_KEY : 'uiMode_backStory',
    attr: {
        backStory: ""
    },
    enter: function () {
        this.attr.backStory = this.makeBackStory();
    },
    exit: function () {

    },
    renderOnMain : function (display){
        display.clear();
        display.drawText(2,2, this.attr.backStory);
    },
    renderAvatarInfo: function (display){
        display.clear();
        display.drawText(1,1, "Press any Key to Continue\n\n Press b to return to this screen");
    },
    handleInput: function (){
        Game.switchUiMode("gamePlay");
    },
    makeBackStory: function(){
        var backStory = "";
        switch(Game.UIMode.gamePlay.attr._answers.graphics){
            case "cave":
            switch(Game.UIMode.gamePlay.attr._answers.objective){
                case "findKey":
                backStory += "You are Frogimus Rex, indomitable hopper. An overwrought princess, upset you weren’t a prince, has thrown you in her underground dungeon filled with slime monsters. To escape, you must find the key to the exit.";
                break;

                case "boss":
                backStory += "You are Fred the Philanthropist. Your altruism has drawn the favor of the Slime Queen, but her husband is furious at this. He hopes to trap you in his dungeon. Kill the King Slime, and escape the dungeon to your love!";
                break;

                case "killAll":
                backStory += "You are Gerald Stonesmith, a proud working frogman. Slimes have overrun the mithril mining operation in the nearby mountain. To free the frog miners and maintain the production quota, defeat all the intruders.";
                break;

                case "escape":
                backStory += "You are Bobby Froglegs, a young teen-tadpole. You’ve fallen down a snake hole and landed in a cavern filled with slimes. Find the exit and hop back to the surface.";
                break;
                backStory += "\n";

                backStory += "\nKeep your stomach from rumbling by eating pieces of bread that you can find around the cave. Do this by pressing E"
            }
            break;

            case "beach":
            switch(Game.UIMode.gamePlay.attr._answers.objective){
                case "findKey":
                backStory += "You are Bob the cactus. A huge wave has just struck your home, separating you and your child. You wake up, water in your ears, on a cold beach, surrounded by hostile creatures. Find your child, and return home!";
                break;

                case "killAll":
                backStory += "You are Carl the cactus. You have just realized that competition for the precious sunlight is growing fierce on your beach. Determined not to be left in the shadows, you decide to crush the competition with your spiky fury. Kill all hostile beach goers, and return home to enjoy the spoils of destruction!";
                break;

                case "boss":
                backStory += " You are Frank the cactus. A few days ago, and evil gardener descended on your peaceful beach with an army of evil monsters. Restore order by defeating the gardener, leaving his army of monsters leaderless and inept.";
                break;

                case "escape":
                backStory += "You are Stuart the cactus. Coming home one day from your favorite cactus bar, you black out. Hours, (or days?) later, you wake up on an unfamiliar beach with a massive hangover. It seems to be inhabited by hostile teetotalers. Find your way home, and finally get some peace and quiet!";
                break;
            }
            backStory += "\n";

            backStory += "\nSustain yourself on the beach by drinking little drops of sunshine, which are occasionally left by defeated enemies. Press E to do this";
            backStory += "\nYou can swim, but cacti do not thrive in wet environments. Be careful.";
            break;

            case "forest":
            switch(Game.UIMode.gamePlay.attr._answers.objective){
                case "findKey":
                backStory += "You are Cynthia, an intrepid adventurer. After hearing rumors of an abandoned treasure chest in the forest, you have decided to search for it. Most accounts report that the chest is locked, and you will probably need a key. Retrieve the treasure, Cynthia!";
                break;

                case "boss":
                backStory += " You are Shelby, a dauntless heroine. A weeping spirit has taken your favorite jewelry box and hidden it in the forest. No one touches your favorite jewelry box but you! Seek out the spirit and show it who’s boss! Then go and reclaim what is yours.";
                break;

                case "killAll":
                backStory += "You are Talia, a vengeful survivor. Your family has been murdered by monsters from the neighboring woods, who also stole your family heirloom. While you are unsure which monster is responsible, you feel that they all must pay for the crime. Slay all the monsters and recover the heirloom!";
                break;

                case "escape":
                backStory += "You are Clarisse, a mighty baker. On your way back from Grandma\’s house, you realize you dropped your chest of fresh apple pies. When you returned to search for it, the previously empty woods were chock-full of monsters! Find your apple pies, and avoid death.";
                break;
            }
            backStory += "\n";

            backStory += "\nNourish yourself in the forest by eating apples, which will be dropped by your foes. Press E to do this";
            break;

            case "doodle":
            switch(Game.UIMode.gamePlay.attr._answers.objective){
                case "findKey":
                backStory += "You are Frank Duddles, keeper of the piece (of paper). You wake up one morning at the sound of the all-powerful pencil crashing somewhere into your paper town. Usings the pencil’s powers for evil, illustrators have created untold numbers of doodle and scribble monsters. Find the pencil before it’s used for further evil and cast it into the void.";
                break;

                case "killAll":
                backStory += "You are Benjamin Incera, a man without a plan! Badly drawn scribbles and doodles have erupted into existence. Erase them before they erase you! Then flee before more appear.";
                break;

                case "boss":
                backStory += "You are Ted Krosby, doodle extrodinair. Mathematical tremors shake the crumped surface of your world. An anomaly has descended, one that inspires fear and hatred from all numberphiles. Show this mathematical ignoramus the errors of its calculating ways, and escape the world before it collapses in upon itself.";
                break;

                case "escape":
                backStory += "You are Bill. Just Bill. Tales have reached your ears of a rip in the fabric of reality. Around the drawing board, you’re famed as an adventurer who will go anywhere. Find the hole, and jump in!";
                break;
            }
            backStory += "\n";

            backStory += "\nEat Food, kindly labeled 'FOOD', to nourish yourself. Do this by pressing E"
            break;
        }
        backStory += "\n";

        switch(Game.UIMode.gamePlay.attr._answers.equ){
            case "range":
            backStory += "\nYour weapon of choice is a yew bow. Wielding it has required many moons of training. You can attack by pressing ‘f’ and a direction to fire. Don’t fire indiscriminately, since your ammo is limited.";
            break;
            case "broad":
            backStory += "\nYour weapon of choice is the broad sword. It will strike enemies on either side of the one in front of you. Constant use will dull your blade; be sure to find stones to sharpen it anew.";
            break;
            case "rapier":
            backStory += "\nYour weapon of choice is the rapier. It will strike one enemy behind the one in front of you. Constant use will dull your blade; be sure to find stones to sharpen it anew.";
            break;
            case "trap":
            backStory += "\nYou are a fiend for explosives. Instead of a traditional weapon, you place bombs which destroy all its surroundings. Make sure to pick up more bombs that monsters drop.";
            break;
        }
        backStory += "\nReload your weapon uses by pressing R and selecting your ammo (Arrows, Bombs, Stones)";

        backStory += "\n";


        switch(Game.UIMode.gamePlay.attr._answers.misc){
            case "evilMonsters":
            backStory += "\nEverything in this place seems to be out to get you.";
            break;
            case "noMapMemory":
            backStory += "\nYou are very forgetful. In fact, you can’t remember where you just were.";
            break;
            case "smallVision":
            backStory += "\nYou dropped your glasses on the way here. But you can still see (a little).";
            break;
            case "smallMap":
            backStory += "\nYou feel as if the question gods have granted you a smaller task than usual...";
            break;
        }
            backStory += "\n\nYou can pick up objects by press g, you can open your inventory by pressing i, and you can open the save/load/new game menu by pressing =\n";
        backStory += "You can press ? to look at the controls at anytime.\n\nSo be off! Your Adventure Begins!"


        return backStory;

    }
}
//#####################################################################
//#####################################################################

//PLAY
Game.UIMode.gamePlay = {
    attr: {
        _mapId: '',
        _avatarId: '',
        _cameraX: 100,
        _cameraY: 100,
        _objective: false,
        _bossKey: null,
        _changedTiles : [],
        _totalMonsters: null,
        _answers: {
            mapType : null
        }

    },
    JSON_KEY: 'uiMode_gamePlay',
    enter: function() {
        // Graphics
        Game.DISPLAYS.main.o.clear();
        Game.DISPLAYS.main.o.setOptions(Game.DISPLAYS.tsOptions);

        // console.log("Game.UIMode.gamePlay enter");
        Game.message.clearMessages();
        if(this.attr._avatarId) {
            this.setCameraToAvatar();
        }
        Game.TimeEngine.unlock();
        //Game.KeyBinding.informPlayer();
        //this.getAvatar().eatFood();
        answers = this.attr._answers;
        Game.message.clearMessages();
        Game.message.sendMessage(answers.mapType + ", " + answers.objective + ", " + answers.misc);
        Game.message.sendMessage(answers.graphics + ", " + answers.equ);
        Game.renderMessage();
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
    checkObjective: function(){
    switch(this.attr._answers.objective){
        case "escape":
        this.attr._objective = true;
        break;
        case "killAll":
        this.attr._objective = (this.countEntities() <= 2); //the avatar and the exit
        break;
        case "findKey":
        break;
        case "boss":
        this.attr._objective = !(Game.DATASTORE.ENTITY[this.attr.bossKey]);
        break;
        default:
        this.attr._objective = true;
        break;
    }
    return this.attr.objective;
    },
    countEntities: function(){
        var count = 0;
        for (var ent in Game.DATASTORE.ENTITY) {
          Game.util.cdebug(ent);
          if(Game.DATASTORE.ENTITY[ent] != undefined){
            count++;
          }
        }

        return count;
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
            Game.message.sendMessage("You waited a turn.")
        } else if (actionBinding.actionKey == 'MOVE_R') {
            tookTurn = this.moveAvatar(1  , 0);
        } else if (actionBinding.actionKey == 'MOVE_DL') {
            tookTurn = this.moveAvatar(-1  , 1);
        } else if (actionBinding.actionKey == 'MOVE_D') {
            tookTurn = this.moveAvatar(0  , 1);
        } else if (actionBinding.actionKey == 'MOVE_DR') {
            tookTurn = this.moveAvatar(1  , 1);

        } else if (actionBinding.actionKey == 'FIRE') {
          if (Game.UIMode.gamePlay.attr._answers.equ == "range") {
            Game.addUiMode('LAYER_fireProjectile');
          } else if (Game.UIMode.gamePlay.attr._answers.equ == "trap") {
            Game.addUiMode('LAYER_useBombs');
          }

        } else if (actionBinding.actionKey == 'INVENTORY') {
            Game.addUiMode('LAYER_inventoryListing');
        } else if (actionBinding.actionKey == 'PICKUP') {
          var pickUpList = Game.util.objectArrayToIdArray(this.getAvatar().getMap().getItems(this.getAvatar().getPos()));
          if (pickUpList.length <= 1) {
            var pickupRes = this.getAvatar().pickupItems(pickUpList);
            tookTurn = pickupRes.numItemsPickedUp > 0;
          } else {
            // var pickupRes = this.getAvatar().pickupItems(Game.util.objectArrayToIdArray(this.getAvatar().getMap().getItems(this.getAvatar().getPos())));
            // tookTurn = pickupRes.numItemsPickedUp > 0;
            Game.addUiMode('LAYER_inventoryPickup');
          }
        } else if (actionBinding.actionKey == 'DROP') {
            //var dropRes = this.getAvatar().dropItems(this.getAvatar().getInventoryItemIds());
            //tookTurn =  dropRes.numItemsDropped > 0;
            Game.addUiMode('LAYER_inventoryDrop');
        } else if (actionBinding.actionKey == 'EAT') {
          Game.addUiMode('LAYER_inventoryEat');
        } else if (actionBinding.actionKey == 'RELOAD') {
          console.log("reloading");
            Game.addUiMode('LAYER_inventoryReload');
        } else if (actionBinding.actionKey == 'EXAMINE') {
            Game.addUiMode('Layer_inventoryExamine');
        } else if (actionBinding.actionKey == 'CHANGE_BINDINGS') {
            Game.KeyBinding.swapToNextKeyBinding();
        } else if (actionBinding.actionKey == 'PERSISTENCE') {
            Game.switchUiMode('gamePersistence');
        } else if (actionBinding.actionKey == 'HELP') {
            Game.UIMode.LAYER_textReading.setText(Game.KeyBinding.getBindingHelpText());
            Game.addUiMode('LAYER_textReading');
        } else if (actionBinding.actionKey == 'BACKSTORY'){
            Game.switchUiMode('backStory');
        }

        if (tookTurn) {
            this.getAvatar().raiseSymbolActiveEvent('actionDone');
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

        // console.log("Game.UIMode.gamePlay renderOnMain");
        //this.renderAvatar(display);

    },

    renderAvatarInfo: function (display) {
        var fg = Game.UIMode.DEFAULT_COLOR_FG;
        var bg = Game.UIMode.DEFAULT_COLOR_BG;
        //display.drawText(1, 1, Game.UIMode.DEFAULT_COLOR_STR + "AVATAR STATUS", fg, bg);
        //display.drawText(1, 2, Game.UIMode.DEFAULT_COLOR_STR+"Avatar x: " + this.getAvatar().getX(), fg, bg);
        //display.drawText(1, 3, Game.UIMode.DEFAULT_COLOR_STR+"Avatar y: " + this.getAvatar().getY(), fg, bg);
        // feels like this should be encapsulated somewhere else, but I don't really know where - perhaps in the PlayerActor mixin?
        var av = this.getAvatar();
        var y = 1;
        y += display.drawText(1,y,Game.UIMode.DEFAULT_COLOR_STR+"LIFE: "+av.getCurHp()+"/"+av.getMaxHp());
        y += display.drawText(1, y, Game.UIMode.DEFAULT_COLOR_STR + av.getHungerStateDescr());
        y++;

        var objective = "";
        var curObjective = Game.UIMode.gamePlay.attr._answers.objective;
        Game.UIMode.gamePlay.checkObjective();
        if (Game.UIMode.gamePlay.attr._objective){
            curObjective = "escape";
        }
        switch(curObjective){
            case "killAll":
            objective = "Kill all the enemies!";
            break;
            case "boss":
            switch(Game.UIMode.gamePlay.attr._answers.graphics){
                case "beach":
                objective = "Kill the Evil Garderner!";
                break;
                case "forest":
                objective = "Kill the Evil Ghost!";
                break;
                case "doodle":
                objective = "Kill the Incorrect Math!";
                break;
                case "cave":
                objective = "Kill the King Slime!";
                break;
            }

            break;
            case "findKey":
                switch(Game.UIMode.gamePlay.attr._answers.graphics){
                case "beach":
                objective = "Find your cactus child!";
                break;
                case "forest":
                objective = "Find the key!";
                break;
                case "doodle":
                objective = "Find the pencil!";
                break;
                case "cave":
                objective = "Find the key!";
                break;
            }
            break;
            case "escape":
            switch(Game.UIMode.gamePlay.attr._answers.graphics){
                case "beach":
                objective = "Get back to your Home!";
                break;
                case "forest":
                objective = "Find and open the chest!";
                break;
                case "doodle":
                objective = "Escape through the hole in the paper!";
                break;
                case "cave":
                objective = "Find the exit and Escape!";
                break;
            }
            break;
        }
        // feels like this should be encapsulated somewhere else, but I don't really know where - perhaps in the PlayerActor mixin?
        y += display.drawText(1,y,Game.UIMode.DEFAULT_COLOR_STR+"OBJECTIVE");
        y += display.drawText(1,y,Game.UIMode.DEFAULT_COLOR_STR+objective);
        y++
        y += display.drawText(1,y,Game.UIMode.DEFAULT_COLOR_STR+"ATTACK");
        y += display.drawText(1,y,Game.UIMode.DEFAULT_COLOR_STR+"Accuracy:  "+av.getAttackHit());
        y += display.drawText(1,y,Game.UIMode.DEFAULT_COLOR_STR+"Power:     "+av.getAttackDamage());
        y += display.drawText(1,y,Game.UIMode.DEFAULT_COLOR_STR+"Weapon Uses: "+av.getCurAmmo() + "/" + av.getMaxAmmo());
        y++;
        y += display.drawText(1,y,Game.UIMode.DEFAULT_COLOR_STR+"DEFENSE");
        y += display.drawText(1,y,Game.UIMode.DEFAULT_COLOR_STR+"Dodging:   "+av.getAttackAvoid());
        y += display.drawText(1,y,Game.UIMode.DEFAULT_COLOR_STR+"Toughness: "+av.getDamageMitigation());
        y++;
        y += display.drawText(1,y,Game.UIMode.DEFAULT_COLOR_STR+"MOVES: "+av.getTurns());
        y += display.drawText(1,y,Game.UIMode.DEFAULT_COLOR_STR+"KILLS: "+av.getTotalKills() + "/" + this.attr._totalMonsters);
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
        this.setCamera(this.getAvatar().getX(), this.getAvatar().getY());
    },
    setupNewGame: function (answers) {
        this.attr._answers = answers;
        mapType = this.getMapType();
        console.log(mapType);

        Game.DISPLAYS.tsOptions.tileSet = Game.TILESETS[answers.graphics];



        var small = (this.attr._answers.misc == "smallMap");
        this.setMap(new Game.map(mapType, small));
        this.setAvatar(Game.EntityGenerator.create('avatar'));
        if(this.attr._answers.misc == "smallVision"){
            this.getAvatar().attr._Sight_attr.sightRadius = 5;
        }else if(this.attr._answers.misc == "evilMonsters"){
            this.makeEvilMonsters();
        }

        this.getMap().addEntity(this.getAvatar(),this.getMap().getWalkablePosition());
        this.setCameraToAvatar();
        this.updateNames();

        var itemPos = '';
        for (var ecount = 0; ecount < 5; ecount++) {
            this.getMap().addEntity(Game.EntityGenerator.create('moss'), this.getMap().getWalkablePosition());
            this.getMap().addEntity(Game.EntityGenerator.create('newt'), this.getMap().getWalkablePosition());
            this.getMap().addEntity(Game.EntityGenerator.create('angry squirrel'), this.getMap().getWalkablePosition());
            this.getMap().addEntity(Game.EntityGenerator.create('attack slug'), this.getMap().getWalkablePosition());
            this.attr._totalMonsters += 4;
            //itemPos = this.getMap().getWalkablePosition();
            //this.getMap().addItem(Game.ItemGenerator.create('rock'), itemPos);
            //this.getMap().addItem(Game.ItemGenerator.create('rock'), itemPos);

            //itemPos = this.getMap().getWalkablePosition();
            //this.getMap().addItem(Game.ItemGenerator.create('apple'),itemPos);

        }
        if(this.attr._answers.objective == "findKey"){
        this.getMap().addItem(Game.ItemGenerator.create('key'), this.getMap().getWalkablePosition());
      }else if (this.attr._answers.objective == "boss"){
        boss = Game.EntityGenerator.create('boss');
        this.attr.bossKey = boss.getId();
        this.getMap().addEntity(boss, this.getMap().getWalkablePosition());
      }
        if(this.attr._answers.graphics == "beach"){
        Game.Tile.wallTile.attr._transparent = true;
        Game.Tile.wallTile.attr._opaque = false;
        Game.Tile.wallTile2.attr._transparent = true;
        Game.Tile.wallTile2.attr._opaque = false;
        Game.Tile.wallTile3.attr._transparent = true;
        Game.Tile.wallTile3.attr._opaque = false;
        Game.Tile.wallTile4.attr._transparent = true;
        Game.Tile.wallTile4.attr._opaque = false;
        }

        var stairPos = this.getMap().getWalkablePosition();
        this.getMap().addEntity(Game.EntityGenerator.create('stairs'), stairPos);
        this.getMap().clearAround(stairPos, false);


    },
    makeEvilMonsters: function (){
        Game.EntityGenerator._templates["moss"].mixins.push("WalkerCorporeal");
        Game.EntityGenerator._templates["moss"].mixins.push("Sight");
        Game.EntityGenerator._templates["moss"].mixins.push("MeleeAttacker");
        Game.EntityGenerator._templates["moss"].mixins.push("WanderChaserActor");

        Game.EntityGenerator._templates["newt"].mixins[1] = "WanderChaserActor"
        Game.EntityGenerator._templates["newt"].mixins.push("Sight");
        Game.EntityGenerator._templates["newt"].mixins.push("MeleeAttacker");

    },
    updateNames: function(){
        if(this.attr._answers.equ == "rapier" || this.attr._answers.equ == "broad"){
          Game.ItemGenerator._templates["ammo"].name = "stone";
          Game.ItemGenerator._templates["ammo"].chr = "R";
        }else if (this.attr._answers.equ == "trap"){
          Game.ItemGenerator._templates["ammo"].name = "extra bomb";
          Game.ItemGenerator._templates["ammo"].chr = "b";
        }
        switch(this.attr._answers.graphics){
            case "beach":
                Game.EntityGenerator._templates["moss"].name = "vines";
                Game.EntityGenerator._templates["angry squirrel"].name = "posion flower";
                Game.EntityGenerator._templates["attack slug"].name = "snake";
                Game.EntityGenerator._templates["newt"].name = "lizard";
                Game.EntityGenerator._templates["stairs"].name = "your home";
                Game.EntityGenerator._templates["boss"].name = "evil gardener";

                Game.ItemGenerator._templates["apple"].name = "sunshine";
                Game.ItemGenerator._templates["key"].name = "baby cactus";
                Game.ItemGenerator._templates["rock"].name = "rock";
                return;

            case "forest":
                Game.EntityGenerator._templates["moss"].name = "bush";
                Game.EntityGenerator._templates["angry squirrel"].name = "angry tree";
                Game.EntityGenerator._templates["attack slug"].name = "snake";
                Game.EntityGenerator._templates["newt"].name = "dancing dog";
                Game.EntityGenerator._templates["stairs"].name = "the chest";
                Game.EntityGenerator._templates["boss"].name = "evil ghost";

                Game.ItemGenerator._templates["apple"].name = "apple";
                Game.ItemGenerator._templates["key"].name = "key";
                Game.ItemGenerator._templates["rock"].name = "rock";
                return;

            case "cave":
                Game.EntityGenerator._templates["moss"].name = "spikes";
                Game.EntityGenerator._templates["angry squirrel"].name = "yellow slime";
                Game.EntityGenerator._templates["attack slug"].name = "green slime";
                Game.EntityGenerator._templates["newt"].name = "red slime";
                Game.EntityGenerator._templates["stairs"].name = "the exit";
                Game.EntityGenerator._templates["boss"].name = "king slime";

                Game.ItemGenerator._templates["apple"].name = "bread";
                Game.ItemGenerator._templates["key"].name = "key";
                Game.ItemGenerator._templates["rock"].name = "rock";
                return;

            case "doodle":
                Game.EntityGenerator._templates["moss"].name = "scribble";
                Game.EntityGenerator._templates["angry squirrel"].name = "tongue face";
                Game.EntityGenerator._templates["attack slug"].name = "doodle";
                Game.EntityGenerator._templates["newt"].name = "angry face";
                Game.EntityGenerator._templates["stairs"].name = "hole in the paper";
                Game.EntityGenerator._templates["boss"].name = "incorrect math";


                Game.ItemGenerator._templates["apple"].name = "food";
                Game.ItemGenerator._templates["key"].name = "pencil";
                Game.ItemGenerator._templates["rock"].name = "rock";
                return;

            default:
                return;
        }
    },

    getMapType: function () {
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

// I'M FIRIN' MAH LAZER
Game.UIMode.LAYER_fireProjectile = {
    enter: function() {
      Game.message.sendMessage("Choose a direction to fire or press 'esc' to put away your bow.");
      // Game.refresh();
    },
    exit: function() {
      //console.log("aging messages");
      //Game.message.ageMessages();
      Game.refresh();
    },

    handleInput: function (inputType, inputData) {
      var actionBinding = Game.KeyBinding.getInputBinding(inputType,inputData);
      if (!actionBinding) { // gate here to catch weird 'f' keypress
        Game.message.ageMessages();
        console.log("aging messages");
        Game.message.sendMessage("You ready your bow.");
        return false;
      }
      if ((actionBinding.actionKey == 'CANCEL')) {
        Game.removeUiMode();
        return false;
      }

      var shootResp = false;
      if      (actionBinding.actionKey == 'MOVE_UL') {
      shootResp = Game.UIMode.gamePlay.getAvatar().raiseSymbolActiveEvent('fireProjectile', {xDir:-1, yDir:-1});
    } else if (actionBinding.actionKey == 'MOVE_U') {
      shootResp = Game.UIMode.gamePlay.getAvatar().raiseSymbolActiveEvent('fireProjectile', {xDir:0, yDir:-1});
    } else if (actionBinding.actionKey == 'MOVE_UR') {
      shootResp = Game.UIMode.gamePlay.getAvatar().raiseSymbolActiveEvent('fireProjectile', {xDir:1, yDir:-1});
    } else if (actionBinding.actionKey == 'MOVE_L') {
      shootResp = Game.UIMode.gamePlay.getAvatar().raiseSymbolActiveEvent('fireProjectile', {xDir:-1, yDir:0});
    } else if (actionBinding.actionKey == 'MOVE_WAIT') {
      // something special?
    } else if (actionBinding.actionKey == 'MOVE_R') {
      shootResp = Game.UIMode.gamePlay.getAvatar().raiseSymbolActiveEvent('fireProjectile', {xDir:1, yDir:0});
    } else if (actionBinding.actionKey == 'MOVE_DL') {
      shootResp = Game.UIMode.gamePlay.getAvatar().raiseSymbolActiveEvent('fireProjectile', {xDir:-1, yDir:1});
    } else if (actionBinding.actionKey == 'MOVE_D') {
      shootResp = Game.UIMode.gamePlay.getAvatar().raiseSymbolActiveEvent('fireProjectile', {xDir:0, yDir:1});
    } else if (actionBinding.actionKey == 'MOVE_DR') {
      shootResp = Game.UIMode.gamePlay.getAvatar().raiseSymbolActiveEvent('fireProjectile', {xDir:1, yDir:1});
    }

    if (shootResp.enemyHit && shootResp.enemyHit[0]) {
      Game.getAvatar().raiseSymbolActiveEvent('actionDone');
      Game.removeUiMode(); //sure we want this?
      console.log("enemy hit?");
      return true;
    }
    Game.message.sendMessage("There is nothing to shoot at.");
    Game.removeUiMode();
    return false;
    }
};

// HOW I CAME TO LOVE THE BOMB
Game.UIMode.LAYER_useBombs = {
    enter: function() {
      Game.message.sendMessage("Choose a direction to place a bomb, press any key to detonate a bomb, or press 'esc' to exit.");
      // Game.refresh();
    },
    exit: function() {
      //console.log("aging messages");
      //Game.message.ageMessages();
      Game.refresh();
    },

    handleInput: function (inputType, inputData) {
      var actionBinding = Game.KeyBinding.getInputBinding(inputType,inputData);
      if (!actionBinding) { // gate here to catch weird 'f' keypress
        Game.message.ageMessages();
        console.log("aging messages");
        Game.message.sendMessage("You ready the fuse.");
        return false;
      }
      if ((actionBinding.actionKey == 'CANCEL')) {
        Game.removeUiMode();
        return false;
      }

      // no bomb is currently placed on map
      if (! Game.getAvatar().getBombPlaced()) {
        var bombResp = false;
        if      (actionBinding.actionKey == 'MOVE_UL') {
          bombResp = Game.UIMode.gamePlay.getAvatar().raiseSymbolActiveEvent('placeBomb', {xLoc:-1, yLoc:-1});
        } else if (actionBinding.actionKey == 'MOVE_U') {
          bombResp = Game.UIMode.gamePlay.getAvatar().raiseSymbolActiveEvent('placeBomb', {xLoc:0, yLoc:-1});
        } else if (actionBinding.actionKey == 'MOVE_UR') {
          bombResp = Game.UIMode.gamePlay.getAvatar().raiseSymbolActiveEvent('placeBomb', {xLoc:1, yLoc:-1});
        } else if (actionBinding.actionKey == 'MOVE_L') {
          bombResp = Game.UIMode.gamePlay.getAvatar().raiseSymbolActiveEvent('placeBomb', {xLoc:-1, yLoc:0});
        } else if (actionBinding.actionKey == 'MOVE_WAIT') {
          // something special?
        } else if (actionBinding.actionKey == 'MOVE_R') {
          bombResp = Game.UIMode.gamePlay.getAvatar().raiseSymbolActiveEvent('placeBomb', {xLoc:1, yLoc:0});
        } else if (actionBinding.actionKey == 'MOVE_DL') {
          bombResp = Game.UIMode.gamePlay.getAvatar().raiseSymbolActiveEvent('placeBomb', {xLoc:-1, yLoc:1});
        } else if (actionBinding.actionKey == 'MOVE_D') {
          bombResp = Game.UIMode.gamePlay.getAvatar().raiseSymbolActiveEvent('placeBomb', {xLoc:0, yLoc:1});
        } else if (actionBinding.actionKey == 'MOVE_DR') {
          bombResp = Game.UIMode.gamePlay.getAvatar().raiseSymbolActiveEvent('placeBomb', {xLoc:1, yLoc:1});
        }

        if (bombResp.bombPlaced && bombResp.bombPlaced[0]) {
          Game.getAvatar().raiseSymbolActiveEvent('actionDone');
          Game.message.sendMessage("You placed a bomb.");
          Game.removeUiMode(); //sure we want this?
          return true;
        }

        Game.message.sendMessage("A bomb could not be placed there.");
        Game.removeUiMode();
        return false;
      } else {
        Game.message.sendMessage("You detonate the bomb.");
        Game.UIMode.gamePlay.getAvatar().raiseSymbolActiveEvent('triggerBomb');
        Game.getAvatar().raiseSymbolActiveEvent('actionDone');
        Game.removeUiMode(); //sure we want this?
      }
    }
};

//#############################################################################
//#############################################################################
//Text Reading
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
        Game.DISPLAYS.main.o.clear();
        Game.DISPLAYS.main.o.setOptions(Game.DISPLAYS.tsOptions);

        Game.KeyBinding.setKeyBinding(this._storedKeyBinding);
        setTimeout(function() {
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
  this._filterListedItemsOnFunction = template.filterListedItemsOn || function(itemId) {
      return itemId;
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
  this._numItemsShown = 0;
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
  this._storedKeyBinding = Game.KeyBinding.getKeyBinding();
  Game.KeyBinding.setKeyBinding(this._keyBindingName);
  if ('doSetup' in this) {
    this.doSetup();
  }
  Game.refresh();
  Game.specialMessage("[Esc] to exit, [ and ] for scrolling");
};
Game.UIMode.LAYER_itemListing.prototype.exit = function () {
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
  this._numItemsShown = 0;
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

Game.UIMode.LAYER_itemListing.prototype.getCaptionText = function() {

  // Render the caption in the top row
  var captionText = 'Items';
  if (typeof this._caption == 'function') {
    captionText = this._caption();
  } else {
    captionText = this._caption;
  }
  return captionText;
};

Game.UIMode.LAYER_itemListing.prototype.renderAvatarInfo = function (display) {
  var selectionLetters = 'abcdefghijklmnopqrstuvwxyz';

  // Render the caption in the top row
  display.drawText(0, 0, Game.UIMode.DEFAULT_COLOR_STR + this.getCaptionText());

  if (this._displayItems.length < 1) {
     display.drawText(0, 2, Game.UIMode.DEFAULT_COLOR_STR + this.getCaptionText().toLowerCase() + " is empty");
     return;
  }

  var row = 0;
  if (this._hasNoItemOption) {
    display.drawText(0, 1, Game.UIMode.DEFAULT_COLOR_STR + '0 - no item');
    row++;
  }
  if (this._displayItemsStartIndex > 0) {
    display.drawText(0, 1 + row, '%c{black}%b{yellow}[ for more');
    row++;
  }
  this._numItemsShown = 0;
  for (var i = 0; i < this._displayItems.length; i++) {
    var trueItemIndex = this._displayItemsStartIndex + i;
    if (this._displayItems[i]) {
      var selectionLetter = selectionLetters.substring(i, i + 1);

      // If we have selected an item, show a +, else show a space between the selectionLetter and the item's name.
      var selectionState = (this._canSelectItem && this._canSelectMultipleItems && this._selectedItemIdxs[trueItemIndex]) ? '+' : ' ';

      var item_symbol = this._displayItems[i].getRepresentation()+Game.UIMode.DEFAULT_COLOR_STR;
      display.drawText(0, 1 + row, Game.UIMode.DEFAULT_COLOR_STR + selectionLetter + ' ' + selectionState + ' ' + item_symbol + ' ' +this._displayItems[i].getName());
      row++;
      this._numItemsShown++;
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
  for (var selectionIndex in this._selectedItemIdxs) {
    if (this._selectedItemIdxs.hasOwnProperty(selectionIndex)) {
      selectedItemIds.push(this._itemIdList[selectionIndex]);
    }
  }
  Game.removeUiModeAllLayers();
  // Call the processing function and end the player's turn if it returns true.
  if (this._processingFunction(selectedItemIds)) {
    Game.getAvatar().raiseSymbolActiveEvent('actionDone');
    setTimeout(function() {
      Game.message.ageMessages();
    }, 1);
  }
};

Game.UIMode.LAYER_itemListing.prototype.handleInput = function (inputType,inputData) {
  var actionBinding = Game.KeyBinding.getInputBinding(inputType,inputData);
  if (! actionBinding) {
    if ((inputType === 'keydown') && this._canSelectItem && inputData.keyCode >= ROT.VK_A && inputData.keyCode <= ROT.VK_Z) {
      // Check if it maps to a valid item by subtracting 'a' from the character
      // to know what letter of the alphabet we used.
      var index = inputData.keyCode - ROT.VK_A;
      if (index > this._numItemsShown) {
        return false;
      }
      var trueItemIndex = this._displayItemsStartIndex + index;
      if (this._itemIdList[trueItemIndex]) {
        // If multiple selection is allowed, toggle the selection status, else select the item and process it
        if (this._canSelectMultipleItems) {
          if (this._selectedItemIdxs[trueItemIndex]) {
            delete this._selectedItemIdxs[trueItemIndex];
          } else {
            this._selectedItemIdxs[trueItemIndex] = true;
          }
          Game.refresh();
        } else {
          this._selectedItemIdxs[trueItemIndex] = true;
          this.executeProcessingFunction();
        }
      } else {
        return false;
      }
    }
  }

  if (actionBinding.actionKey == 'CANCEL') {
    Game.removeUiMode();

  } else if (actionBinding.actionKey == 'PROCESS_SELECTIONS') {
    this.executeProcessingFunction();

  } else if (this._canSelectItem && this._hasNoItemOption && (actionBinding.actionKey == 'SELECT_NOTHING')) {
    this._selectedItemIdxs = {};
  } else if (actionBinding.actionKey == 'DATA_NAV_UP') {
    this.handlePageUp();

  } else if (actionBinding.actionKey == 'DATA_NAV_DOWN') {
    this.handlePageDown();

  } else if (actionBinding.actionKey == 'HELP') {
    var helpText = this.getCaptionText() + "\n";
    if (this._canSelectItem || this._canSelectMultipleItems) {
      var lastSelectionLetter = (String.fromCharCode(ROT.VK_A + this._numItemsShown - 1)).toLowerCase();
      helpText += "a-"+lastSelectionLetter+"   select the indicated item\n";
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
  console.log("inventory");
};

Game.UIMode.LAYER_inventoryListing.handleInput = function (inputType,inputData) {
  var actionBinding = Game.KeyBinding.getInputBinding(inputType,inputData);

  if (actionBinding) {
    if (actionBinding.actionKey == 'EXAMINE') {
      Game.addUiMode('LAYER_inventoryExamine');
      return false;
    }
    if (actionBinding.actionKey == 'DROP') {
      Game.addUiMode('LAYER_inventoryDrop');
      return false;
    }
    if (actionBinding.actionKey == 'EAT') {
      Game.addUiMode('LAYER_inventoryEat');
      return false;
    }
  }
  return Game.UIMode.LAYER_itemListing.prototype.handleInput.call(this,inputType,inputData);
};

//-----------------

Game.UIMode.LAYER_inventoryDrop = new Game.UIMode.LAYER_itemListing({
  caption: 'Drop',
  canSelect: true,
  canSelectMultipleItems: true,
  keyBindingName: 'LAYER_inventoryDrop',
  processingFunction: function (selectedItemIds) {
    if (selectedItemIds.length < 1) {
       return false;
    }
    var dropResult = Game.getAvatar().dropItems(selectedItemIds);
    return dropResult.numItemsDropped > 0;
  }
});
Game.UIMode.LAYER_inventoryDrop.doSetup = function () {
  this.setup({itemIdList: Game.getAvatar().getInventoryItemIds()});
};

Game.UIMode.LAYER_inventoryPickup = new Game.UIMode.LAYER_itemListing({
  caption: 'Pick up',
  canSelect: true,
  canSelectMultipleItems: true,
  keyBindingName: 'LAYER_inventoryPickup',
  processingFunction: function (selectedItemIds) {
    var pickupResult = Game.getAvatar().pickupItems(selectedItemIds);
    return pickupResult.numItemsPickedUp > 0;
  }
});
Game.UIMode.LAYER_inventoryPickup.doSetup = function () {
  this.setup({itemIdList: Game.util.objectArrayToIdArray(Game.getAvatar().getMap().getItems(Game.getAvatar().getPos()))});
};

//-------------------

Game.UIMode.LAYER_inventoryExamine = new Game.UIMode.LAYER_itemListing({
  caption: 'Examine',
  canSelect: true,
  keyBindingName: 'LAYER_inventoryExamine',
  processingFunction: function (selectedItemIds) {
    console.log('LAYER_inventoryExamine processing on '+selectedItemIds[0]);
    if (selectedItemIds[0]) {
      var d = Game.DATASTORE.ITEM[selectedItemIds[0]].getDetailedDescription();
      console.log('sending special message of '+d);
      setTimeout(function() {
        Game.specialMessage(d);
      }, 2);
    }
    return false;
  }
});
Game.UIMode.LAYER_inventoryExamine.doSetup = function () {
  this.setup({itemIdList: Game.getAvatar().getInventoryItemIds()});
};

//-------------------

Game.UIMode.LAYER_inventoryEat = new Game.UIMode.LAYER_itemListing({
  caption: 'Eat',
  canSelect: true,
  keyBindingName: 'LAYER_inventoryEat',
  filterListedItemsOn: function(itemId) {
    return  Game.DATASTORE.ITEM[itemId].hasMixin('Food');
  },
  processingFunction: function (selectedItemIds) {
    if (selectedItemIds[0]) {
      console.dir(selectedItemIds[0]);
      var foodItem = Game.getAvatar().extractInventoryItems([selectedItemIds[0]])[0];
      Game.util.cdebug(foodItem);
      Game.getAvatar().eatFood(foodItem.getFoodValue());
      return true;
    }
    return false;
  }
});
Game.UIMode.LAYER_inventoryEat.doSetup = function () {
  this.setup({itemIdList: Game.getAvatar().getInventoryItemIds()});
};

//-------------------

Game.UIMode.LAYER_inventoryReload = new Game.UIMode.LAYER_itemListing({
  caption: 'Reload',
  canSelect: true,
  keyBindingName: 'LAYER_inventoryReload',
  filterListedItemsOn: function(itemId) {
    return  Game.DATASTORE.ITEM[itemId].hasMixin('Ammo');
  },
  processingFunction: function (selectedItemIds) {
    if (selectedItemIds[0]) {
      console.dir(selectedItemIds[0]);
      var ammoItem = Game.getAvatar().extractInventoryItems([selectedItemIds[0]])[0];
      Game.getAvatar().raiseSymbolActiveEvent("reloaded", {ammoValue: ammoItem.getAmmoValue() });
      return true;
    }
    return false;
  }
});
Game.UIMode.LAYER_inventoryReload.doSetup = function () {
  this.setup({itemIdList: Game.getAvatar().getInventoryItemIds()});
};
