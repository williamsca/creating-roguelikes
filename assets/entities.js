Game.EntityGenerator = new Game.Generator('entities', Game.Entity);

Game.EntityGenerator.learn({
  name: 'avatar',
  chr: '@',
  fg: '#dda',
  maxHp: 10,
  sightRadius: 5,
  attackAvoid: 1,
  attackDamage: 2,
  mixins: ["PlayerActor", "PlayerMessager", "WalkerCorporeal", "Sight","MapMemory", "HitPoints",
           "Chronicle", "MeleeAttacker", "MeleeDefender"]
});

Game.EntityGenerator.learn({
  name: 'moss',
  chr: '%',
  fg: '#6b6',
  maxHp: 1,
  mixins: ["HitPoints"]
});

Game.EntityGenerator.learn({
  name: 'newt',
  chr: '~',
  fg: '#98',
  maxHp: 2,
  mixins: ["HitPoints", "WanderActor", "WalkerCorporeal"]
});

Game.EntityGenerator.learn({
  name: 'attack slug',
  chr: '~',
  fg: '#ff9',
  maxHp: 4,
  sightRadius: 4,
  attackPower: 1,
  wanderChaserActionDuration: 1200,
  attackActionDuration: 300,
  mixins: ["HitPoints", "Sight", "WanderChaserActor", "WalkerCorporeal", "MeleeAttacker"]
});

Game.EntityGenerator.learn({
name: 'angry squirrel',
chr: '&',
fg: '#aaa',
maxHp: 3,
attackPower: 2,
attackAvoid: 2,
damageMitigation: 1,
mixins: ["HitPoints", "WanderActor", "WalkerCorporeal", "MeleeAttacker", "MeleeDefender"]
});
