const Primus = require('primus');
let primus;
const players = [];

const go = server => {
    primus = Primus(server, {});

    // Add player
    primus.on('connection', spark => {
      console.log('Player connected and adding at ID: ' + spark.id);
      spark.write({type: 'id', id: spark.id});
      players.push({id: spark.id});

      // Update player
      spark.on('data', data => {
        if(data.type == 'player') {
          players[players.findIndex(player => { return player.id === spark.id; })] = data.player;
        }
      });
    });

    // Remove player
    primus.on('disconnection', spark => {
      console.log('Player disconnected and disconnecting at ID: ' + spark.id);
      players.splice(players.findIndex(player => {
        return player.id === spark.id;
      }), 1);
    });

    setInterval(tick, 33);
}

const tick = _ => {
    primus.write({type: 'players', players: players});
}

var arr = [{ id: 1, username: 'fred' }, 
  { id: 2, username: 'bill'}, 
  { id: 3, username: 'ted' }];

const playerExists = (id) => {
  return players.some((el) => {
    return el.id === id;
  }); 
}

module.exports.go = go;