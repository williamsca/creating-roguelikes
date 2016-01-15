Game.EntityMixin = {};

// WALKER
Game.EntityMixin.WalkerCorporeal = {
  META: {
    mixinName: 'WalkerCorporeal',
    mixinGroup: 'Walker'
  },
  tryWalk: function(map, dx, dy) {
    var targetX = Math.min(Math.max(0, this.getX() + dx), map.getWidth());
    var targetY = Math.min(Math.max(0, this.getY() + dy), map.getHeight());

    // INTERACT WITH ENTITY
    if ((map.getEntity(targetX, targetY)) && map.getEntity(targetX, targetY) != Game.UIMode.gamePlay.getAvatar()) {
      console.log(targetX);
      console.log(targetY);
      console.log("recipient: " + map.getEntity(targetX, targetY));
      this.raiseEntityEvent('bumpEntity', {actor: this, recipient:map.getEntity(targetX, targetY)});
      console.log(this);
      this.raiseEntityEvent('tookTurn');
      return true;
    }

    // TRAVEL
    try{
        if (map.getTile(targetX, targetY).isWalkable()) {
            newPos = {
                x: targetX,
                y: targetY
            };
            this.setPos(newPos);
            var myMap = this.getMap();
            if (myMap) {
                myMap.updateEntityLocation(this);
            }
            this.raiseEntityEvent('tookTurn');
            return true;
        }
    }catch(e){
        console.log("TRIED TO WALK ONTO EDGE");
        return false;
    }

    // YOU CAN'T WALK INTO A WALL
    return false;
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
      'tookTurn': function(evtData) {
        this.trackTurn();
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
  trackTurn: function() {
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
      this.attr._HitPoints_attr.maxHp = template.MaxHp || 1;
      // this.attr._HitPoints_attr.curHp = template.curHp || this.attr._HitPoints_attr.maxHp;
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
