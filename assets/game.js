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
        document.getElementById('wsrl-main-display').appendChild(   Game.getDisplay('main').getContainer());
    }
};

var Game = {
  DISPLAYS: {
    main: {
      w: 80,
      h: 24,
      o: null
    }
  },
  init: function () {
    console.log("WSRL LIVE Initialization");
  },
  getDisplay: function(displayName) {

  }
};
