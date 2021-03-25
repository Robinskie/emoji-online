let primus;

const gameCanvas = document.querySelector('#gameCanvas');
const c = gameCanvas.getContext('2d');

const userField = document.querySelector('.user-field');
const usernameInput = document.querySelector('#usernameInput');
const emojiInput = document.querySelector('#emojiInput');
const btnEnter = document.querySelector('#btnEnter');

const resize = _ => {
    gameCanvas.width = window.innerWidth;
    gameCanvas.height = window.innerHeight;
}

resize();

const player = {
    id: 0,
    name: 'Robinskie',
    emoji: '🦝',
    x: gameCanvas.width / 2 ,
    y: gameCanvas.height / 2 ,
}

let players = []

keys = {
    up: false,
    right: false,
    down: false,
    left: false,
}

addEventListener('keydown', e => {
    switch(e.key) {
        case 'ArrowRight':
            keys.right = true;
            break;
        case 'ArrowLeft':
            keys.left = true;
            break;
        case 'ArrowUp':
            keys.up = true;
            break;
        case 'ArrowDown':
            keys.down = true;
            break;
    }
});

addEventListener('keyup', e => {
    switch(e.key) {
        case 'ArrowRight':
            keys.right = false;
            break;
        case 'ArrowLeft':
            keys.left = false;
            break;
        case 'ArrowUp':
            keys.up = false;
            break;
        case 'ArrowDown':
            keys.down = false;
            break;
    }
});

c.textAlign = "center"; 
c.textBaseline = "middle"; 

const init = () => {
    primus =  Primus.connect('', {
        reconnect: {
            max: Infinity // Number: The max delay before we try to reconnect.
          , min: 500 // Number: The minimum delay before we try reconnect.
          , retries: 10 // Number: How many times we should try to reconnect.
        }
      });
    
    primus.on('data', (data) => {
        // Receive initial id
        if(data.type == 'id') {
            player.id = data.id;
            loop();
        } 

        // Receive player data
        if(data.type == 'players') {
            players = data.players;
        }
    });
}

loop = _ => {
    const PLAYER_SPEED = 2;

    // UPDATE
    if(keys.right) player.x += PLAYER_SPEED;
    if(keys.left) player.x -= PLAYER_SPEED;
    if(keys.down) player.y += PLAYER_SPEED;
    if(keys.up) player.y -= PLAYER_SPEED;

    if(player.x < 0) player.x = 0;
    if(player.x > gameCanvas.width) player.x = gameCanvas.width;
    if(player.y < 0) player.y = 0;
    if(player.y > gameCanvas.height) player.y = gameCanvas.height;

    // SEND TO SERVER
    primus.write({type: 'player', player: player});

    // RENDER
    // Clear screen
    c.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

    // Draw self
    drawPlayer(player);

    // Draw other players
    players.forEach(otherPlayer => {
        if(otherPlayer.id != player.id)
            drawPlayer(otherPlayer);
    })

    window.requestAnimationFrame(loop);
}

const drawPlayer = player => {
    c.font = '18px sans-serif';
    c.fillText(player.name, player.x, player.y - 32);

    c.font = '32px sans-serif';
    c.fillText(player.emoji, player.x, player.y);
}

btnEnter.addEventListener('click', _ => {
    if(usernameInput.value != '') {
        player.name = usernameInput.value;
        player.emoji = emojiInput.value;

        userField.style.display = 'none';

        init();
    } else {
        usernameInput.style.backgroundColor = '#F8E2DD'
    }
})