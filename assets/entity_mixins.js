Game.EntityMixin = {};

Game.EntityMixin.PlayerMessager = {
  META: {
    mixinName: 'PlayerMessager',
    mixinGroup: 'PlayerMessager',
    listeners: {
      'walkForbidden': function(evtData) {
        Game.message.sendMessage("You can\'t walk into the " + evtData.target.getName() + ", n00b.");
        //Game.renderMessage();
      },
      'dealtDamage': function(evtData) {
        Game.message.sendMessage("You hit the " + evtData.damagee.getName() + " for " + evtData.damageAmount);
      },
      'madeKill': function(evtData) {
        Game.message.sendMessage("You killed the " + evtData.entKilled.getName());
      },
      'killed': function(evtData) {
        Game.message.sendMessage("You were killed by the " + evtData.killedBy.getName());
        //Game.renderMessage();
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
      Game.Scheduler.add(this, true, this.getBaseActionDuration());
    },
    listeners: {
      'actionDone': function(evtData) {
        Game.Scheduler.setDuration(this.getCurrentActionDuration());
        this.setCurrentActionDuration(this.getBaseActionDuration());
        Game.TimeEngine.unlock();
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
    Game.refresh();
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
    var targetX = Math.min(Math.max(0, this.getX() + dx), map.getWidth());
    var targetY = Math.min(Math.max(0, this.getY() + dy), map.getHeight());

    // EDGE OF MAP
    if ((this.getX() === targetX) && (this.getY() === targetY)) {
      this.raiseEntityEvent('walkForbidden', {target: Game.Tile.boundaryTile});
      return false;
    }

    // INTERACT WITH ENTITY
    if ((map.getEntity(targetX, targetY)) && map.getEntity(targetX, targetY) != Game.UIMode.gamePlay.getAvatar()) {
      console.log("recipient: " + map.getEntity(targetX, targetY));
      this.raiseEntityEvent('bumpEntity', {actor: this, recipient:map.getEntity(targetX, targetY)});
      console.log(this);
      return true;
    }

    // TRAVEL
    var targetTile = map.getTile(targetX, targetY);
    if (targetTile.isWalkable()) {
      console.log(targetX);
      console.log(targetY);
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
      console.log(template.MaxHp);
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

//##############################################################################
// ENTITY ACTORS / AI

Game.EntityMixin.PeacefulWanderActor = {
  META: {
    mixinName: 'PeacefulWanderActor',
    mixinGroup: 'Actor',
    stateNamespace: '_PeacefulWanderActor_attr',
    stateModel: {
      baseActionDuration: 1000,
      currentActionDuration: 1000
    },
    init: function (template) {
      Game.Scheduler.add(this, true, this.getBaseActionDuration());
    }
  },
  getBaseActionDuration: function() {
    return this.attr._PeacefulWanderActor_attr.baseActionDuration;
  },
  setBaseActionDuration: function(n) {
    this.attr._PeacefulWanderActor_attr.baseActionDuration = n;
  },
  getCurrentActionDuration: function() {
    return this.attr._PeacefulWanderActor_attr.currentActionDuration;
  },
  setCurrentActionDuration: function() {
    this.attr._PeacefulWanderActor_attr.currentActionDuration = n;
  },
  getMoveCoord: function() {
    // TODO
  },
  act: function() {
    var moveTarget = this.getMoveCoord();
    if (actor.hasMixin('Walker')) { // NOTE: this pattern suggets that maybe tryWalk should be converted to an event
      this.tryWalk(this.getMap(), moveTarget.x, moveTarget.y);
    }
    Game.Scheduler.setDuration(this.getCurrentActionDuration());
    this.setCurrentActionDuration(this.getBaseActionDuration());
  }
};
