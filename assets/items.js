Game.ItemGenerator = new Game.Generator('items', Game.Item);

Game.ItemGenerator.learn({name: '_invetoryContainer', mixins: ["Container"]});

Game.ItemGenerator.learn({
    name: 'rock',
    chr:'R',
    fg:'#aaa'
});
