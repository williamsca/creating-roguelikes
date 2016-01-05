console.log("hello console");

window.onload = function() {
    console.log("starting WSRL - window loaded");
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

    }
};

var Game = {
  DISPLAYS: {
    avatar: {
      w: 20,
      h: 24,
      o: null
    },
    message: {
      w: 80,
      h: 24,
      o: null
    },
    main: {
      w: 100,
      h: 6,
      o: null
    }
  },
  init: function () {
    console.log("WSRL LIVE Initialization");
    //this.DISPLAYS.main.o = new ROT.Display({width:Game.DISPLAYS.main.w, height:Game.DISPLAYS.main.h});
    for (var displayName in object) {
      if (this.Displays.hasOwnProperty(displayName)) {
        this.DISPLAYS.main.o = new ROT.Display({width:Game.DISPLAYS[displayName].w, height:Game.DISPLAYS[displayName].h});
      }
    }
    this.renderDisplayAll();
  },
  getDisplay: function(displayName) {
    return Game.DISPLAYS[displayName].o;
  },
  renderAvatar: function() {
      this.DISPLAYS.main.o.drawText(2 , 3,"avatar dispaly!!!");
  },
  renderMain: function() {
    for (var i = 0; i < 5; i++) {
      this.DISPLAYS.main.o.drawText(2 , 3 + i,"@!!!");
    }
  },
  renderMessage: function() {
      this.DISPLAYS.main.o.drawText(2 , 5,"message!!!");
  },

  renderDisplayAll: function() {
    this.renderDisplayAvatar();
    this.renderDisplayMain();
    this.renderDisplayMessage();
  },

};
