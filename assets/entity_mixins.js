Game.EntityMixin = {};

Game.EntityMixin.objectiveHandler = {
    META: {
    mixinName: 'PlayerMessager',
    mixinGroup: 'PlayerMessager',
    listeners: {
        'keyMoved' : function(evtData) {
            Game.UIMode.gamePlay.attr._objective = evtData;
        }
    }
  }
};

Game.EntityMixin.Stairs = {
    META: {
        mixinName: 'Stairs',
        mixinGroup: 'Objective'
    }
};

Game.EntityMixin.PlayerMessager = {
  META: {
    mixinName: 'PlayerMessager',
    mixinGroup: 'PlayerMessager',
    listeners: {
      // NOT BEING USED
      'walkAllowed': function(evtData) {
        // Game.message.ageMessages();
      },
      'walkForbidden': function(evtData) {
        Game.message.sendMessage("You can\'t walk into the " + evtData.target.getName());
      },
      'dealtDamage': function(evtData) {
        Game.message.sendMessage("You hit the " + evtData.damagee.getName() + " for " + evtData.damageAmount);
      },
      'attackAvoided': function(evtData) {
        Game.message.sendMessage('you avoided the '+evtData.attacker.getName());
      },
      'attackMissed': function(evtData) {
        Game.message.sendMessage('you missed the '+evtData.recipient.getName());
      },
      'madeKill': function(evtData) {
        Game.message.sendMessage("You killed the " + evtData.entKilled.getName());
      },
      'damagedBy' : function (evtData){
        Game.message.sendMessage('the '+evtData.damager.getName()+' hit you for '+evtData.damageAmount);
      },
      'killed': function(evtData) {
        if (typeof evtData.killedBy == 'string') {
          Game.message.sendMessage('you were killed by '+evtData.killedBy);
        } else {
          Game.message.sendMessage('you were killed by the '+evtData.killedBy.getName());
        }
      },
      'noItemsToPickup': function(evtData) {
        Game.message.sendMessage('there is nothing to pickup');
        Game.renderMessage();
      },
      'inventoryFull': function(evtData) {
        Game.message.sendMessage('your inventory is full');
        Game.renderMessage();
      },
      'inventoryEmpty': function(evtData) {
          Game.message.sendMessage('you are not carrying anything');
          Game.renderMessage();
      },
      'noItemsPickedUp': function(evtData) {
        Game.message.sendMessage('you could not pick up any items');
        Game.renderMessage();
      },
      'someItemsPickedUp': function(evtData) {
        Game.message.sendMessage('you picked up '+evtData.numItemsPickedUp+' of the items, leaving '+evtData.numItemsNotPickedUp+' of them');
        Game.renderMessage();
      },
      'allItemsPickedUp': function(evtData) {
        if (evtData.numItemsPickedUp > 2) {
          Game.message.sendMessage('you picked up all ' + evtData.numItemsPickedUp + ' items');
        } else if (evtData.numItemsPickedUp == 2) {
          Game.message.sendMessage('you picked up both items');
        } else {
          Game.message.sendMessage('you picked up the ' + evtData.lastItemPickedUpName);
        }
    },
    'itemsDropped' : function(evtData) {
      if (evtData.numItemsDropped > 1) {
        Game.message.sendMessage('you dropped ' + evtData.numItemsDropped + ' items');
      } else {
        Game.message.sendMessage('you dropped the ' + evtData.lastItemDroppedName);
      }
    },

    }
  }
};

Game.EntityMixin.PlayerActor = {
  META: {
    mixinName: 'PlayerActor',
    mixinGroup: 'Actor',
    stateNamespace: '_PlayerActor_attr',
    stateModel: {
      baseActionDuration: 1000,
      actingState: false,
      currentActionDuration: 1000
    },
    init: function (template) {
      Game.Scheduler.add(this, true, 1);
    },
    listeners: {
      'actionDone': function(evtData) {
        Game.Scheduler.setDuration(this.getCurrentActionDuration());
        this.raiseSymbolActiveEvent('getHungrier',{duration:this.getCurrentActionDuration()});
        this.setCurrentActionDuration(this.getBaseActionDuration() + Game.util.randomInt(-5, 5));
        setTimeout(function() {Game.TimeEngine.unlock();}, 1); // a tiny delay
        // console.log('end player acting');
        Game.message.ageMessages();
      },
      'killed': function(evtData) {
        //Game.TimeEngine.lock();
        Game.DeadAvatar = this;
        Game.switchUiMode("gameLose");
      }
    }
  },
  getBaseActionDuration: function() {
    return this.attr._PlayerActor_attr.baseActionDuration;
  },
  setBaseActionDuration: function (n) {
    this.attr._PlayerActor_attr.baseActionDuration = n;
  },
  getCurrentActionDuration: function() {
    return this.attr._PlayerActor_attr.currentActionDuration;
  },
  setCurrentActionDuration: function (n) {
    this.attr._PlayerActor_attr.currentActionDuration = n;
  },
  isActing: function (state) {
    if (state !== undefined) {
      this.attr._PlayerActor_attr.actingState = state;
    }
    return this.attr._PlayerActor_attr.actingState;
  },
  act: function() {
    if (this.isActing()) { return; } // a gate to deal with JS timing issues
    this.isActing(true);
    console.log('begin player acting');
    //Game.refresh();
    Game.renderMain();
    Game.renderAvatarDisplay();
    Game.TimeEngine.lock();
    this.isActing(false);
  }
};

Game.EntityMixin.FoodConsumer = {
  META: {
    mixinName: 'FoodConsumer',
    mixinGroup: 'FoodConsumer',
    stateNamespace: '_FoodConsumer_attr',
    stateModel:  {
      currentFood: 2000,
      maxFood: 2000,
      foodConsumedPer1000Ticks: 1
    },
    init: function (template) {
      this.attr._FoodConsumer_attr.maxFood = template.maxFood || 2000;
      this.attr._FoodConsumer_attr.currentFood = template.currentFood || (this.attr._FoodConsumer_attr.maxFood*0.9);
      this.attr._FoodConsumer_attr.foodConsumedPer1000Ticks = template.foodConsumedPer1000Ticks || 1;
    },
    listeners: {
      'getHungrier': function(evtData) {
        this.getHungrierBy(this.attr._FoodConsumer_attr.foodConsumedPer1000Ticks * evtData.duration/1000);
      }
    }
  },
  getMaxFood: function () {
    return this.attr._FoodConsumer_attr.maxFood;
  },
  setMaxFood: function (n) {
    this.attr._FoodConsumer_attr.maxFood = n;
  },
  getCurFood: function () {
    return this.attr._FoodConsumer_attr.currentFood;
  },
  setCurFood: function (n) {
    this.attr._FoodConsumer_attr.currentFood = n;
  },
  getFoodConsumedPer1000: function () {
    return this.attr._FoodConsumer_attr.foodConsumedPer1000Ticks;
  },
  setFoodConsumedPer1000: function (n) {
    this.attr._FoodConsumer_attr.foodConsumedPer1000Ticks = n;
  },
  eatFood: function (foodAmt) {
    this.attr._FoodConsumer_attr.currentFood += foodAmt;
    if (this.attr._FoodConsumer_attr.currentFood > this.attr._FoodConsumer_attr.maxFood) {this.attr._FoodConsumer_attr.currentFood = this.attr._FoodConsumer_attr.maxFood;}
  },
  getHungrierBy: function (foodAmt) {
    this.attr._FoodConsumer_attr.currentFood -= foodAmt;
    if (this.attr._FoodConsumer_attr.currentFood < 0) {
      this.raiseSymbolActiveEvent('killed',{killedBy: 'starvation'});
    }
  },
  getHungerStateDescr: function () {
    var frac = this.attr._FoodConsumer_attr.currentFood/this.attr._FoodConsumer_attr.maxFood;
    if (frac < 0.1) { return '%c{#ff2}%b{#f00}*STARVING*'; }
    if (frac < 0.25) { return '%c{#f00}%b{#dd0}starving'; }
    if (frac < 0.45) { return '%c{#fb0}%b{#540}hungry'; }
    if (frac < 0.65) { return '%c{#dd0}%b{#000}peckish'; }
    if (frac < 0.95) { return '%c{#090}%b{#000}full'; }
    return '%c{#090}%b{#350}*stuffed*';
  }
};


// WALKER
Game.EntityMixin.WalkerCorporeal = {
  META: {
    mixinName: 'WalkerCorporeal',
    mixinGroup: 'Walker',
    listeners: {
      'adjacentMove': function(evtData) {
        var map = this.getMap();
        var dx = evtData.dx, dy = evtData.dy;
        var targetX = this.getX() + dx;
        var targetY = this.getY() + dy;

        // EDGE OF MAP
        if ((targetX < 0) || (targetX >= map.getWidth()) || (targetY < 0) || (targetY >= map.getHeight())) {
          this.raiseSymbolActiveEvent('walkForbidden', {target: Game.Tile.wallTile});
          return {madeAdjacentMove: false};
        }

        // OTHER ENTITY
        if (map.getEntity(targetX, targetY)) { // can't walk into spaces occupied by other entities
          if (map.getEntity(targetX, targetY).hasMixin('Stairs')) {
            Game.UIMode.gamePlay.checkObjective();
            if (Game.UIMode.gamePlay.attr._objective && this.hasMixin('PlayerActor')) {
              Game.switchUiMode('gameWin');
            } else {
              this.raiseSymbolActiveEvent('walkForbidden', {target:map.getEntity(targetX,targetY)});
              return {madeAdjacentMove: false};
            }
          } else { // a monster or the avatar
            if (map.getEntity(targetX, targetY).hasMixin('PlayerActor')) { // avatar is the recipient
              var weapon = '';
            } else if (this.hasMixin('PlayerActor')) { // avatar is the actor
              var weapon = Game.UIMode.gameQuestions.attr.answers.equ;
            } else { // the avatar is not involved, suggesting that monsters are attacking each other. Do we want this?
              return {madeAdjacentMove: false};
            }

            if (weapon == 'range') {
              Game.message.sendMessage("You weakly punch the monster, dealing no damage. Try pressing 'f' to use your bow instead.");
            } else if (weapon == 'trap') {
              Game.message.sendMessage("You weakly punch the monster, dealing no damage. Try pressing 'f' to use your bombs instead.");
            } else { // a melee weapon
              this.raiseSymbolActiveEvent('bumpEntity', {actor:this, recipient:map.getEntity(targetX, targetY)}); // always execute the basic attack
              if (weapon == 'broad') {
                if (Math.abs(dx) == Math.abs(dy)) { // diagonal attack
                  if (map.getEntity(this.getX(), this.getY() + dy)) {
                    //CONSIDER MOVING THE MESSAGES TO bumpEntity
                    //Game.message.sendMessage("The sweep of your broadsword catches a monster on your flank.");
                    this.raiseSymbolActiveEvent('bumpEntity', {actor:this, recipient:map.getEntity(this.getX(), this.getY() + dy), weapon: weapon});
                  }
                  if (map.getEntity(this.getX() + dx, this.getY())) {
                    //Game.message.sendMessage("The sweep of your broadsword catches a monster on your flank.");
                    this.raiseSymbolActiveEvent('bumpEntity', {actor:this, recipient:map.getEntity(this.getX() + dx, this.getY()), weapon: weapon});
                  }
                } else if (dy == 0) { // horizontal attack
                  if (map.getEntity(targetX, targetY + 1)) {
                    //Game.message.sendMessage("The sweep of your broadsword catches a monster on your flank.");
                    this.raiseSymbolActiveEvent('bumpEntity', {actor:this, recipient:map.getEntity(targetX, targetY + 1), weapon: weapon});
                  }
                  if (map.getEntity(targetX, targetY - 1)) {
                    //Game.message.sendMessage("The sweep of your broadsword catches a monster on your flank.");
                    this.raiseSymbolActiveEvent('bumpEntity', {actor:this, recipient:map.getEntity(targetX, targetY - 1), weapon: weapon});
                  }
                } else { // vertical attack
                  console.log('vertical');
                  if (map.getEntity(targetX - 1, targetY)) {
                    //Game.message.sendMessage("The sweep of your broadsword catches a monster on your flank.");
                    this.raiseSymbolActiveEvent('bumpEntity', {actor:this, recipient:map.getEntity(targetX - 1, targetY), weapon: weapon});
                  }
                  if (map.getEntity(targetX + 1, targetY)) {
                    //Game.message.sendMessage("The sweep of your broadsword catches a monster on your flank.");
                    this.raiseSymbolActiveEvent('bumpEntity', {actor:this, recipient:map.getEntity(targetX + 1, targetY), weapon: weapon});
                  }
                }
              }
              if (weapon == 'rapier') {
                if (map.getEntity(targetX + dx, targetY + dy)) {
                  Game.message.sendMessage("Your rapier passes through the monster and strikes the one behind it as well.")
                  this.raiseSymbolActiveEvent('bumpEntity', {actor:this, recipient:map.getEntity(targetX + dx, targetY + dy)});
                }
              }
            }
          }
          return {madeAdjacentMove: true};
        }

        // TILE
        var targetTile = map.getTile(targetX, targetY);
        if (targetTile.isWalkable()) {
          this.setPos(targetX, targetY);
          this.raiseSymbolActiveEvent('walkAllowed', {target:targetTile});
          if (map) {
            map.updateEntityLocation(this);
          }
          return {madeAdjacentMove: true};
        } else if (Game.UIMode.gamePlay.attr._answers.graphics == "beach" && this == Game.UIMode.gamePlay.getAvatar()){
          this.setPos(targetX, targetY);
          this.raiseSymbolActiveEvent('walkAllowed', {target:targetTile});
          Game.message.sendMessage("You swim out into the water but start drowning!")
          Game.UIMode.gamePlay.getAvatar().attr._HitPoints_attr.curHp -= 2;
          if (map) {
            map.updateEntityLocation(this);
          }
          return {madeAdjacentMove: true};
        } else {
          this.raiseSymbolActiveEvent('walkForbidden', {target:targetTile});
          return {madeAdjacentMove: false};
        }
      }
    }
  }
};

// CHRONICLE
Game.EntityMixin.Chronicle = {
  META: {
    mixinName: 'Chronicle',
    mixinGroup: 'Chronicle',
    stateNamespace: '_Chronicle_attr',
    stateModel: {
      turnCounter: 0,
      killLog: {},
      deathMessage: '',
      killCount: 0
    },
    listeners: {
      'actionDone': function(evtData) {
        this.trackTurnCount();
      },
      'madeKill': function(evtData) {
        // console.log("chronicle kill");
        this.addKill(evtData.entKilled);
      },
      'killed': function(evtData) {
        if (typeof evtData.killedBy == 'string') {
          this.attr._Chronicle_attr.deathMessage = 'killed by '+evtData.killedBy;
        } else {
          this.attr._Chronicle_attr.deathMessage = 'killed by '+evtData.killedBy.getName();
        }
      }
    }
  },
  trackTurnCount: function() {
    this.attr._Chronicle_attr.turnCounter++;
  },
  getTurns: function() {
    return this.attr._Chronicle_attr.turnCounter;
  },
  setTurns: function(n) {
    this.attr._Chronicle_attr.turnCounter = n;
  },
  getKills: function() {
    return this.attr._Chronicle_attr.killLog;
  },
  getKillsOf: function (entityName) {
    return this.attr._Chronicle_attr.killLog[entityName] || 0;
  },
  getTotalKills: function() {
    return this.attr._Chronicle_attr.killCount;
  },
  clearKills: function() {
    this.attr._Chronicle_attr.killLog = {};
  },
  addKill: function(entKilled) {
    var entName = entKilled.getName();
    // console.log('chonicle kill of ' + entName);
    if (this.attr._Chronicle_attr[entName]) {
      this.attr._Chronicle_attr.killLog[entName]++;
    } else {
      this.attr._Chronicle_attr.killLog[entName] = 1;
    }
    this.attr._Chronicle_attr.killCount++;
  }
};

// AMMO POINTS
Game.EntityMixin.AmmoPoints = {
  META: {
    mixinName: 'AmmoPoints',
    mixinGroup: 'ammo',
    stateNamespace: '_AmmoPoints_attr',
    stateModel: {
      maxAmmo: 1,
      curAmmo: 1
    },
    init:function(template) {
      // console.log(template.MaxHp);
      this.attr._AmmoPoints_attr.maxAmmo = template.maxAmmo || 1;
      this.attr._AmmoPoints_attr.curAmmo = template.curAmmo || this.attr._AmmoPoints_attr.maxAmmo;
    },
    listeners: {
      'usedAmmo': function(evtData) {
        this.attr._AmmoPoints_attr.curAmmo -= 1;
      },
      'reloaded': function(evtData) {
        this.attr._AmmoPoints_attr.curAmmo = min(this.curAmmo + evtData.ammoValue, this.maxAmmo)
      }
    }
  },
    getCurAmmo: function(){
      return this.attr._AmmoPoints_attr.curAmmo;
    },
    getMaxAmmo: function(){
      return this.attr._AmmoPoints_attr.maxAmmo;
    }
  };

// HIT POINTS
Game.EntityMixin.HitPoints = {
  META: {
    mixinName: 'HitPoints',
    mixinGroup: 'HitPoints',
    stateNamespace: '_HitPoints_attr',
    stateModel: {
      maxHp: 1,
      curHp: 1
    },
    init:function(template) {
      // console.log(template.MaxHp);
      this.attr._HitPoints_attr.maxHp = template.maxHp || 1;
      this.attr._HitPoints_attr.curHp = template.curHp || this.attr._HitPoints_attr.maxHp;
    },
    listeners: {
      'attacked': function(evtData) {
        this.takeHits(evtData.attackDamage);
        this.raiseSymbolActiveEvent('damagedBy',
          {damager: evtData.attacker, damageAmount: evtData.attackDamage});
        evtData.attacker.raiseSymbolActiveEvent('dealtDamage',
          {damagee: this, damageAmount: evtData.attackDamage});

        // DEATH
        if (this.getCurHp() <= 0) {
          this.raiseSymbolActiveEvent('killed',
            {entKilled: this, killedBy: evtData.attacker});
          evtData.attacker.raiseSymbolActiveEvent('madeKill',
            {entKilled: this, killedBy: evtData.attacker});
        }
      },
      'killed': function(evtData) {
        // console.log('HitPoints killed');
        this.destroy();
      }
    }
  },
  getMaxHp: function () {
    return this.attr._HitPoints_attr.maxHp;
  },
  setMaxHp: function (n) {
    this.attr._HitPoints_attr.maxHp = n;
  },
  getCurHp: function () {
    return this.attr._HitPoints_attr.curHp;
  },
  setCurHp: function (n) {
    this.attr._HitPoints_attr.curHp = n;
  },
  takeHits: function (amt) {
    this.attr._HitPoints_attr.curHp -= amt;
  },
  recoverHits: function (amt) {
    this.attr._HitPoints_attr.curHp = Math.min(this.attr._HitPoints_attr.curHp + amt, this.attr._HitPoints_attr.maxHp);
  }
};

//-----------------------COMBAT---------------------------------------

// MELEE COMBAT
Game.EntityMixin.MeleeAttacker = {
  META: {
    mixinName: 'MeleeAttacker',
    mixinGroup: 'Attacker',
    stateNamespace: '_MeleeAttacker_attr',
    stateModel: {
      attackHit: 1,
      attackDamage: 1,
      rangedHit: 1,
      broadHit: 1,
      rapierHit: 2,
      attackActionDuration: 1000
    },
    init: function (template) {
      this.attr._MeleeAttacker_attr.attackDamage = template.attackDamage || 1;
      this.attr._MeleeAttacker_attr.attackActionDuration = template.attackActionDuration || 1000;
    },
    listeners: {
      'bumpEntity': function(evtData) {
        console.log(evtData.actor.getName() + " bumped " + evtData.recipient.getName());
        if (evtData.weapon == 'broad') { Game.message.sendMessage("The sweep of your broadsword catches an enemy on your flank."); }
        var hitValResp = this.raiseSymbolActiveEvent('calcAttackHit');
        var avoidValResp = evtData.recipient.raiseSymbolActiveEvent('calcAttackAvoid');
        var hitVal = Game.util.compactNumberArray_add(hitValResp.attackHit);
        var avoidVal = Game.util.compactNumberArray_add(avoidValResp.attackAvoid);
        if (ROT.RNG.getUniform()*(hitVal+avoidVal) > avoidVal) {
          // insert logic here to determine what type of damage is being dealt, i.e.,
          if (evtData.ranged) {

          } else if (evtData.broad) {

          }
          var hitDamageResp = this.raiseSymbolActiveEvent('calcAttackDamage');
          var damageMitigateResp = evtData.recipient.raiseSymbolActiveEvent('calcDamageMitigation');
          evtData.recipient.raiseSymbolActiveEvent('attacked',{attacker:evtData.actor,attackDamage:Game.util.compactNumberArray_add(hitDamageResp.attackDamage) - Game.util.compactNumberArray_add(damageMitigateResp.damageMitigation)});
        } else {
          evtData.recipient.raiseSymbolActiveEvent('attackAvoided',{attacker:evtData.actor,recipient:evtData.recipient});
          evtData.actor.raiseSymbolActiveEvent('attackMissed',{attacker:evtData.actor,recipient:evtData.recipient});
        }
        this.setCurrentActionDuration(this.attr._MeleeAttacker_attr.attackActionDuration);
      },
      'calcAttackHit': function(evtData) {
        return {attackHit:this.getAttackHit()};
      },
      'calcAttackDamage': function(evtData) {
        // console.log('MeleeAttacker bumpEntity');
        return {attackDamage:this.getAttackDamage()};
      }
    }
  },
  getAttackHit: function() {
    return this.attr._MeleeAttacker_attr.attackHit;
  },
  getAttackDamage: function() {
    return this.attr._MeleeAttacker_attr.attackDamage;
  }
};

Game.EntityMixin.MeleeDefender = {
  META: {
    mixinName: 'MeleeDefender',
    mixinGroup: 'Defender',
    stateNamespace: '_MeleeDefender_attr',
    stateModel:  {
      attackAvoid: 0,
      damageMitigation: 0
    },
    init: function (template) {
      this.attr._MeleeDefender_attr.attackAvoid = template.attackAvoid || 0;
      this.attr._MeleeDefender_attr.damageMitigation = template.damageMitigation || 0;
    },
    listeners: {
      'calcAttackAvoid': function(evtData) {
        return {attackAvoid:this.getAttackAvoid()};
      },
      'calcDamageMitigation': function(evtData) {
        // console.log('MeleeAttacker bumpEntity');
        return {damageMitigation:this.getDamageMitigation()};
      }
    }
  },
  getAttackAvoid: function () {
    return this.attr._MeleeDefender_attr.attackAvoid;
  },
  getDamageMitigation: function () {
    return this.attr._MeleeDefender_attr.damageMitigation;
  }
};

Game.EntityMixin.RangedAttacker = {
  META: {
    mixinName: 'RangedAttacker',
    mixinGroup: 'Attacker',
    stateNamespace: '_RangedAttacker_attr',
    stateModel: {
      // attackHit: 1,
      // attackDamage: 1,
      // attackActionDuration: 1000,
      attackRange: 5
    },
    init: function (template) {
      //this.attr._RangedAttacker_attr.attackHit = template.attackHit || 1;
      //this.attr._RangedAttacker_attr.attackActionDuration = template.attackActionDuration || 1000;
      this.attr._RangedAttacker_attr.attackRange = template.attackRange || 5;
    },
    listeners: {
      // Presently can fire through walls...
      'fireProjectile': function(evtData) {
        // check for entities within attackRange of the avatar
        var map = this.getMap();
        for (var i = 1; i <= this.getAttackRange(); ++i) {
          var x = this.getX() + evtData.xDir * i;
          var y = this.getY() + evtData.yDir * i;
          if (map.getEntity(x, y)) {
            var entityPresent = map.getEntity(x, y);
            break;
          }
        }

        if (entityPresent) {
          this.raiseSymbolActiveEvent('bumpEntity', {actor:this, recipient:entityPresent, ranged: true});
          return {enemyHit: true};
        }
        return {enemyHit: false};
      }
    }
  },
  getAttackRange: function () {
    return this.attr._RangedAttacker_attr.attackRange;
  }
};

Game.EntityMixin.TrapAttacker = {
  META: {
    mixinName: 'TrapAttacker',
    mixinGroup: 'Attacker',
    stateNamespace: '_TrapAttacker_attr',
    stateModel: {
      trapDuration: 2
    }
  },
  init: function() {
    this.attr._TrapAttacker_attr.trapDuration = template.trapDuration || 2;
  },
  listeners: {

  }
}

//Sight
Game.EntityMixin.Sight = {
  META: {
    mixinName: 'Sight',
    mixinGroup: 'Sense',
    stateNamespace: '_Sight_attr',
    stateModel: {
      sightRadius: 3
    },
    init: function (template){
      this.attr._Sight_attr.sightRadius = template.sightRadius || 3;
    },
    listeners: {
      'senseForEntity': function(evtData) {
        return {entitySensed: this.canSeeEntity(evtData.senseForEntity)};
      }
    }

  },
  getSightRadius: function (){
    return this.attr._Sight_attr.sightRadius;
  },
  setSightRadius: function (n){
    this._attr._Sight_attr.sightRadius = n;
  },

  canSeeEntity: function (entity) {
    if (!entity || this.getMapId() !== entity.getMapId()) {
      return false;
    }
    return this.canSeeCoord(entity.getX(), entity.getY());
  },

  canSeeCoord: function(x_or_pos, y) {
    var otherX = x_or_pos, otherY=y;
    if (typeof x_or_pos == 'object'){
      otherX = x_or_pos.x;
      otherY = x_or_pos.y;
    }

    if (Math.max(Math.abs(otherX - this.getX()),Math.abs(otherY - this.getY())) > this.attr._Sight_attr.sightRadius){
      return false;
    }

    var inFov = this.getVisibleCells();
    return inFov[otherX+','+otherY] || false;
  },

  getVisibleCells: function () {
    var visibleCells = {'byDistance': {}};
    for (var i=0; i<=this.getSightRadius(); i++) {
      visibleCells.byDistance[i] = {};
    }
    this.getMap().getFov().compute(
      this.getX(), this.getY(),
      this.getSightRadius(),
      function(x,y,radius,visibility) {
        visibleCells[x+','+y] = true;
        visibleCells.byDistance[radius][x+","+y] = true;
      }
    );
    return visibleCells;
  },
  canSeeCoord_delta: function(dx, dy){
    return this.canSeeCoord(this.getX()+dx,this.getY()+dy);
  }
};

Game.EntityMixin.MapMemory = {
  META: {
    mixinName: 'MapMemory',
    mixinGroup: 'MapMemory',
    stateNamespace: '_MapMemory_attr',
    stateModel: {
      mapsHash: {}
    },
    init: function (template){
      this.attr._MapMemory_attr.mapsHash = template.mapsHash || {};
    }
  },

  rememberCoords: function(coordSet, mapId) {
    if(Game.UIMode.gamePlay.attr._answers.misc != "noMapMemory"){
    var mapKey = mapId || this.getMapId();
    if (! this.attr._MapMemory_attr.mapsHash[mapKey] ) {
      this.attr._MapMemory_attr.mapsHash[mapKey] = {};
    }
    for (var coord in coordSet) {
      if ( coordSet.hasOwnProperty(coord) && (coord != 'byDistance')) {
        this.attr._MapMemory_attr.mapsHash[mapKey][coord] = true;
      }
  }
    }
  },

  getRememberedCoordsForMap: function(mapId) {
    var mapKey=mapId || this.getMapId();
    return this.attr._MapMemory_attr.mapsHash[mapKey] || {};
  }

};



Game.EntityMixin.InventoryHolder = {
  META: {
    mixinName: 'InventoryHolder',
    mixinGroup: 'InventoryHolder',
    stateNamespace: '_InventoryHolder_attr',
    stateModel:  {
      containerId: '',
      inventoryCapacity: 5
    },
    init: function (template) {
        this.attr._InventoryHolder_attr.inventoryCapacity = template.inventoryCapacity || 5;
        if (template.containerId) {
            this.attr._InventoryHolder_attr.containerId = template.containerId;
        } else {
            var container = Game.ItemGenerator.create('_inventoryContainer');
            container.setCapacity(this.attr._InventoryHolder_attr.inventoryCapacity);
            this.attr._InventoryHolder_attr.containerId = container.getId();
        }
    },
    listeners: {
      'pickupItems': function(evtData) {
        return {addedAnyItems: this.pickupItems(evtData.itemSet)};
      },
      'dropItems': function(evtData) {
        return {droppedItems: this.dropItems(evtData.itemSet)};
      }
    }
  },
  _getContainer : function () {
    return Game.DATASTORE.ITEM[this.attr._InventoryHolder_attr.containerId];
  },

  hasInventorySpace: function () {
    // NOTE: early dev stuff here! simple placeholder functionality....
    return this._getContainer().hasSpace();
  },
  addInventoryItems: function (items_or_ids) {
    return this._getContainer().addItems(items_or_ids);
  },
  getInventoryItemIds: function () {
    return this._getContainer().getItemIds();
  },
  extractInventoryItems: function (ids_or_idxs) {
    return this._getContainer().extractItems(ids_or_idxs);
  },
  pickupItems: function (ids_or_idxs) {
    var itemsToAdd = [];
    var fromPile = this.getMap().getItems(this.getPos());
    var pickupResult = {
        numItemsPickedUp:0,
        numItemsNotPickedUp:ids_or_idxs.length
    };

    if (fromPile.length < 1){
        this.raiseSymbolActiveEvent('noItemsToPickup');
        return pickupResult;
    }
    if( ! this._getContainer().hasSpace()) {
        this.raiseSymbolActiveEvent('inventoryFull');
        this.raiseSymbolActiveEvent('noItemsPickedUp');
        return pickupResult;
    }

    for (var i = 0; i < fromPile.length; i++) {
      if ((ids_or_idxs.indexOf(i) > -1) || (ids_or_idxs.indexOf(fromPile[i].getId()) > -1)) {
        if( fromPile[i].hasMixin('Key')){
            this.raiseSymbolActiveEvent('keyMoved', true);
        }
          itemsToAdd.push(fromPile[i]);
      }
    }
    var addResult = this._getContainer().addItems(itemsToAdd);
    pickupResult.numItemsPickedUp = addResult.numItemsAdded;
    pickupResult.numItemsNotPickedUp = addResult.numItemsNotAdded;
    var lastItemFromMap = '';
    for (var j = 0; j < pickupResult.numItemsPickedUp; j++) {
      lastItemFromMap = this.getMap().extractItemAt(itemsToAdd[j],this.getPos());
    }

    pickupResult.lastItemPickedUpName = lastItemFromMap.getName();
    if (pickupResult.numItemsNotPickedUp > 0){
        this.raiseSymbolActiveEvent('someItemsPickedUp', pickupResult);
    }else {
        this.raiseSymbolActiveEvent('allItemsPickedUp', pickupResult);
    }

    return pickupResult;
  },
  dropItems: function (ids_or_idxs) {
    var itemsToDrop = this._getContainer().extractItems(ids_or_idxs);
    var dropResult = {numItemsDropped:0};
    if (itemsToDrop.length < 1 ) {
        this.raiseSymbolActiveEvent('inventoryEmpty');
        return dropResult;
    }
    var lastItemDropped = '';
    for (var i = 0; i < itemsToDrop.length; i++) {
      if (itemsToDrop[i]) {
        if(itemsToDrop[i].hasMixin('Key')){
            this.raiseSymbolActiveEvent('keyMoved', false);
        }
        lastItemDropped = itemsToDrop[i];
        this.getMap().addItem(itemsToDrop[i],this.getPos());
        dropResult.numItemsDropped++;
      }
    }
    dropResult.lastItemDroppedName = lastItemDropped.getName();
    this.raiseSymbolActiveEvent('itemsDropped', dropResult);
    return dropResult;
  }
};



//##############################################################################
// ENTITY ACTORS / AI

Game.EntityMixin.WanderActor = {
  META: {
    mixinName: 'WanderActor',
    mixinGroup: 'Actor',
    stateNamespace: '_WanderActor_attr',
    stateModel: {
      baseActionDuration: 1000,
      currentActionDuration: 1000
    },
    init: function (template) {
      Game.Scheduler.add(this, true, Game.util.randomInt(2, this.getBaseActionDuration()));
      this.attr._WanderActor_attr.baseActionDuration = template.wanderActionDuration || 1000;
      this.attr._WanderActor_attr.currentActionDuration = this.attr._WanderActor_attr.baseActionDuration;
    }
  },
  getBaseActionDuration: function() {
    return this.attr._WanderActor_attr.baseActionDuration;
  },
  setBaseActionDuration: function(n) {
    this.attr._WanderActor_attr.baseActionDuration = n;
  },
  getCurrentActionDuration: function() {
    return this.attr._WanderActor_attr.currentActionDuration;
  },
  setCurrentActionDuration: function(n) {
    this.attr._WanderActor_attr.currentActionDuration = n;
  },
  getMoveDeltas: function() {
    // if (this.getX() - Game.UIModes.getAvatar.getX())
    return Game.util.positionsAdjacentTo({x:0, y:0}).random();
  },
  act: function() {
    console.log('wander for ' + this.getName());
    Game.TimeEngine.lock();
    var moveDeltas = this.getMoveDeltas();
    this.raiseSymbolActiveEvent('adjacentMove', {dx:moveDeltas.x, dy:moveDeltas.y});
    /*if (this.hasMixin('Walker')) { // NOTE: this pattern suggets that maybe tryWalk should be converted to an event
    //   console.log('trying to walk to ' + moveDeltas.x + ' , ' + moveDeltas.y);

      this.tryWalk(this.getMap(), moveDeltas.x, moveDeltas.y);
    }*/
    Game.Scheduler.setDuration(this.getCurrentActionDuration());
    this.setCurrentActionDuration(this.getBaseActionDuration() + Game.util.randomInt(-1, 10));
    this.raiseSymbolActiveEvent('actionDone');
    // console.log("end wander acting");
    Game.TimeEngine.unlock();
  }
};

Game.EntityMixin.WanderChaserActor = {
  META: {
    mixinName: 'WanderChaserActor',
    mixinGroup: 'Actor',
    stateNamespace: '_WanderChaserActor_attr',
    stateModel:  {
      baseActionDuration: 1000,
      currentActionDuration: 1000
    },
    init: function (template) {
      Game.Scheduler.add(this,true, Game.util.randomInt(2,this.getBaseActionDuration()));
      this.attr._WanderChaserActor_attr.baseActionDuration = template.wanderChaserActionDuration || 1000;
      this.attr._WanderChaserActor_attr.currentActionDuration = this.attr._WanderChaserActor_attr.baseActionDuration;
    }
  },
  getBaseActionDuration: function () {
    return this.attr._WanderChaserActor_attr.baseActionDuration;
  },
  setBaseActionDuration: function (n) {
    this.attr._WanderChaserActor_attr.baseActionDuration = n;
  },
  getCurrentActionDuration: function () {
    return this.attr._WanderChaserActor_attr.currentActionDuration;
  },
  setCurrentActionDuration: function (n) {
    this.attr._WanderChaserActor_attr.currentActionDuration = n;
  },
  getMoveDeltas: function () {
    var avatar = Game.getAvatar();
    var senseResp = this.raiseSymbolActiveEvent('senseForEntity',{senseForEntity:avatar});
    if (Game.util.compactBooleanArray_or(senseResp.entitySensed)) {

      // build a path instance for the avatar
      var source = this;
      var map = this.getMap();
      var path = new ROT.Path.AStar(avatar.getX(), avatar.getY(), function(x, y) {
          // If an entity is present at the tile, can't move there.
          var entity = map.getEntity(x, y);
          if (entity && entity !== avatar && entity !== source) {
              return false;
          }
          return map.getTile(x, y).isWalkable();
      }, {topology: 8});

      // compute the path from here to there
      var count = 0;
      var moveDeltas = {x:0,y:0};
      path.compute(this.getX(), this.getY(), function(x, y) {
          if (count == 1) {
              moveDeltas.x = x - source.getX();
              moveDeltas.y = y - source.getY();
          }
          count++;
      });

      return moveDeltas;
    }
    return Game.util.positionsAdjacentTo({x:0,y:0}).random();
  },
  act: function () {
    Game.TimeEngine.lock();
    console.log("begin wander chaser acting");
    // console.log('wander for '+this.getName());
    var moveDeltas = this.getMoveDeltas();
    this.raiseSymbolActiveEvent('adjacentMove',{dx:moveDeltas.x,dy:moveDeltas.y});
    console.log("wander chaser action duration: "+this.getCurrentActionDuration());
    Game.Scheduler.setDuration(this.getCurrentActionDuration());
    this.setCurrentActionDuration(this.getBaseActionDuration()+Game.util.randomInt(-10,10));
    this.raiseSymbolActiveEvent('actionDone');
    // console.log("end wander acting");
    Game.TimeEngine.unlock();
  }
};
