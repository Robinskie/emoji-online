const Primus = require('primus');
let primus;
const players = [];
const coins = [];
const map = {
  width: 2560,
  height: 1920,
}

const go = server => {
    primus = Primus(server, {});

    // Populate coins
    for(let i = 0; i < 50; i++) {
      coins.push({x: Math.random() * map.width, y: Math.random() * map.height});
    }

    // Add player
    primus.on('connection', spark => {
      console.log('Player connected and adding at ID: ' + spark.id);
      spark.write({type: 'connect', id: spark.id, spark: spark});
      spark.write({type: 'coins', coins: coins});
      players.push({id: spark.id, spark: spark});

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

    setInterval(tick, 16);
}

const tick = _ => {
    primus.write({type: 'players', players: players});

    // Check collision between player and coin
    coins.forEach(coin => {
      players.forEach(player => {
        if(pointDistance(coin.x, coin.y, player.x, player.y) < player.size / 2) {
          coin.x = Math.random() * map.width;
          coin.y = Math.random() * map.height;

          primus.forEach(function (spark, id, connections) {
            if(spark.id == player.id) {
              spark.write({type: 'sizeUpdate', amount: 5});
            }
          });

          primus.write({type: 'coins', coins: coins});
        }
      });
    });
}

const playerExists = (id) => {
  return players.some((el) => {
    return el.id === id;
  }); 
}

const getSparkById = (sparkId) => {

}

const pointDistance = (x1, y1, x2, y2) => {
  let a = x1 - x2;
  let b = y1 - y2;
  
  return Math.sqrt( a*a + b*b );
}

module.exports.go = go;