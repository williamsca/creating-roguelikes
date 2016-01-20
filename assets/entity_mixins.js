Game.EntityMixin = {};

Game.EntityMixin.PlayerMessager = {
  META: {
    mixinName: 'PlayerMessager',
    mixinGroup: 'PlayerMessager',
    listeners: {
      'walkForbidden': function(evtData) {
        Game.message.sendMessage("You can\'t walk into the " + evtData.target.getName() + ", n00b.");
      },
      'dealtDamage': function(evtData) {
        Game.message.sendMessage("You hit the " + evtData.damagee.getName() + " for " + evtData.damageAmount);
      },
      'madeKill': function(evtData) {
        Game.message.sendMessage("You killed the " + evtData.entKilled.getName());
      },
      'damagedBy' : function (evtData){
        Game.message.sendMessage('the '+evtData.damager.getName()+' hit you for '+evtData.damageAmount);
        Game.message.ageMessages();
      },
      'killed': function(evtData) {
        Game.message.sendMessage("You were killed by the " + evtData.killedBy.getName());
      }
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
        this.setCurrentActionDuration(this.getBaseActionDuration() + Game.util.randomInt(-5, 5));
        setTimeout(function() {Game.TimeEngine.unlock();}, 1); // a tiny delay
        // console.log('end player acting');
      },
    'killed': function(evtData) {
      Game.TimeEngine.lock();
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
    // console.log('begin player acting');
    //Game.refresh();
    Game.renderMain();
    Game.renderAvatarDisplay();
    Game.TimeEngine.lock();
    this.isActing(false);
  }
};

// WALKER
Game.EntityMixin.WalkerCorporeal = {
  META: {
    mixinName: 'WalkerCorporeal',
    mixinGroup: 'Walker'
  },
  tryWalk: function(map, dx, dy) {
    var targetX = Math.min(Math.max(0, this.getX() + dx), map.getWidth() - 1);
    var targetY = Math.min(Math.max(0, this.getY() + dy), map.getHeight() - 1);
    // console.log('tryWalk deltas: ' + dx + ' , ', + dy + ' ' + this.getName());
    // console.log('tryWalk initial pos: '+this.getX()+','+this.getY()+' '+this.getName());
    // console.log('tryWalk: '+targetX+','+targetY+' '+this.getName());

    // EDGE OF MAP
    if ((this.getX() === targetX) && (this.getY() === targetY)) {
      this.raiseEntityEvent('walkForbidden', {target: Game.Tile.wallTile});
      return false;
    }

    // INTERACT WITH ENTITY
    if ((map.getEntity(targetX, targetY)) /*&& map.getEntity(targetX, targetY) != Game.UIMode.gamePlay.getAvatar()*/) {
      console.log(this.getName() + " bumped " + map.getEntity(targetX, targetY));
      this.raiseEntityEvent('bumpEntity', {actor: this, recipient:map.getEntity(targetX, targetY)});
      return true;
    }

    // TRAVEL
    var targetTile = map.getTile(targetX, targetY);
    if (targetTile.isWalkable()) {
    //   console.log(targetX);
    //   console.log(targetY);
      newPos = { x: targetX, y: targetY };
      this.setPos(newPos);
      if (this.getMap()) {
        this.getMap().updateEntityLocation(this);
      }
      return true;
    } else {
      this.raiseEntityEvent('walkForbidden', {target:targetTile});
      return false;
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
      deathMessage: ''
    },
    listeners: {
      'actionDone': function(evtData) {
        this.trackTurnCount();
      },
      'madeKill': function(evtData) {
        console.log("chronicle kill");
        this.addKill(evtData.entKilled);
      },
      'killed': function(evtData) {
        this.attr._Chronicle_attr.deathMessage = 'killed by ' + evtData.killedBy.getName();
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
  clearKills: function() {
    this.attr._Chronicle_attr.killLog = {};
  },
  addKill: function(entKilled) {
    var entName = entKilled.getName();
    console.log('chonicle kill of ' + entName);
    if (this.attr._Chronicle_attr[entName]) {
      this.attr._Chronicle_attr.killLog[entName]++;
    } else {
      this.attr._Chronicle_attr.killLog[entName] = 1;
    }
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
        console.log("HitPoints attacked");

        this.takeHits(evtData.attackPower);
        this.raiseEntityEvent('damagedBy',
          {damager: evtData.attack, damageAmount: evtData.attackPower});
        evtData.attacker.raiseEntityEvent('dealtDamage',
          {damagee: this, damageAmount: evtData.attackPower});

        // DEATH
        if (this.getCurHp() <= 0) {
          this.raiseEntityEvent('killed',
            {entKilled: this, killedBy: evtData.attacker});
          evtData.attacker.raiseEntityEvent('madeKill',
            {entKilled: this, killedBy: evtData.attacker});
        }
      },
      'killed': function(evtData) {
        console.log('HitPoints killed');
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

// MELEE COMBAT
Game.EntityMixin.MeleeAttacker = {
  META: {
    mixinName: 'MeleeAttacker',
    mixinGroup: 'Attacker',
    stateNamespace: '_MeleeAttacker_attr',
    stateModel: {
      attackPower: 1
    },
    init: function (template) {
      this.attr._MeleeAttacker_attr.attackPower = template.attackPower || 1;
    },
    listeners: {
      'bumpEntity': function(evtData) {
        console.log('MeleeAttacker bumpEntity');
        evtData.recipient.raiseEntityEvent('attacked', {attacker: evtData.actor, attackPower: this.getAttackPower()});
      }
    }
  },
  getAttackPower: function() {
    return this.attr._MeleeAttacker_attr.attackPower;
  }
};


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
    var mapKey = mapId || this.getMapId();
    if (! this.attr._MapMemory_attr.mapsHash[mapKey] ) {
      this.attr._MapMemory_attr.mapsHash[mapKey] = {};
    }
    for (var coord in coordSet) {
      if ( coordSet.hasOwnProperty(coord) && (coord != 'byDistance')) {
        this.attr._MapMemory_attr.mapsHash[mapKey][coord] = true;
      }
    }
  },

  getRememberedCoordsForMap: function(mapId) {
    var mapKey=mapId || this.getMapId();
    return this.attr._MapMemory_attr.mapsHash[mapKey] || {};
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
    // console.log('wander for ' + this.getName());
    Game.TimeEngine.lock();
    var moveDeltas = this.getMoveDeltas();
    if (this.hasMixin('Walker')) { // NOTE: this pattern suggets that maybe tryWalk should be converted to an event
    //   console.log('trying to walk to ' + moveDeltas.x + ' , ' + moveDeltas.y);

      this.tryWalk(this.getMap(), moveDeltas.x, moveDeltas.y);
    }
    Game.Scheduler.setDuration(this.getCurrentActionDuration());
    this.setCurrentActionDuration(this.getBaseActionDuration() + Game.util.randomInt(-1, 10));
    this.raiseEntityEvent('actionDone');
    // console.log("end wander acting");
    Game.TimeEngine.unlock();
  }
};
