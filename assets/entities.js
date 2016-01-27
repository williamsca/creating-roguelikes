Game.EntityGenerator = new Game.Generator('entities', Game.Entity);

Game.EntityGenerator.learn({
  name: 'avatar',
  description: 'Pro T. A. Gonist',
  chr: '@',
  fg: '#dda',
  maxHp: 50,
  maxAmmo: 100,
  sightRadius: 10,
  attackAvoid: 1,
  attackDamage: 2,
  inventoryCapacity: 35,
  maxFood: 400,
  mixins: ["PlayerActor", "PlayerMessager", "WalkerCorporeal", "Sight","MapMemory", "HitPoints", "AmmoPoints",
           "Chronicle", "BombAttacker", "MeleeAttacker", "objectiveHandler", "RangedAttacker", "MeleeDefender", "InventoryHolder", "FoodConsumer"]

});

Game.EntityGenerator.learn({
  name: 'moss',
  description: '',
  chr: 'M',
  fg: '#6b6',
  maxHp: 1,
  mixins: ["HitPoints"]
});

Game.EntityGenerator.learn({
  name: 'stairs',
  description: '',
  chr: 'S',
  fg: '#6b6',
  mixins: ["Stairs"]
});

Game.EntityGenerator.learn({
  name: 'newt',
  description: '',
  chr: 'n',
  fg: '#98',
  maxHp: 2,
  mixins: ["HitPoints", "WanderActor", "WalkerCorporeal"]
});

Game.EntityGenerator.learn({
  name: 'attack slug',
  description: '',
  chr: 's',
  fg: '#ff9',
  maxHp: 4,
  sightRadius: 4,
  attackPower: 1,
  wanderChaserActionDuration: 1200,
  attackActionDuration: 3000,
  mixins: ["HitPoints", "Sight", "WanderChaserActor", "WalkerCorporeal", "MeleeAttacker"]
});

Game.EntityGenerator.learn({
  name: 'boss',
  description: '',
  chr: 'B',
  fg: '#ff9',
  maxHp: 20,
  sightRadius: 4,
  attackPower: 3,
  wanderChaserActionDuration: 2000,
  attackActionDuration: 300,
  mixins: ["HitPoints", "Sight", "WanderChaserActor", "WalkerCorporeal", "MeleeAttacker"]
});

Game.EntityGenerator.learn({
  name: 'angry squirrel',
  description: '',
  chr: 'q',
  fg: '#aaa',
  maxHp: 3,
  attackPower: 1,
  attackAvoid: 2,
  damageMitigation: 1,
  mixins: ["HitPoints", "WanderChaserActor", "WalkerCorporeal", "MeleeAttacker", "MeleeDefender"]
});

Game.EntityGenerator.learn( {
  name: 'bomb',
  description: 'where\'d you find one of those?',
  chr: 'b',
  fg: '#aaa',
  mixins: ["Bomb"]
})
