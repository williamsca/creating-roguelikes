Game.ItemGenerator = new Game.Generator('items', Game.Item);

Game.ItemGenerator.learn({name: '_invetoryContainer', mixins: ["Container"]});

Game.ItemGenerator.learn({
    name: 'rock',
    description: '',
    chr:'R',
    fg:'#aaa'
});

Game.ItemGenerator.learn({
  name: 'apple',
  description: 'a nice juicy apple - yum!',
  chr: 'A',
  fg:'#f32',
  foodValue: 100,
  mixins: ['Food']
});
