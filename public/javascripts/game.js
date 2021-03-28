let primus;

let GAME_STARTED = false;

const gameCanvas = document.querySelector('#gameCanvas');
const c = gameCanvas.getContext('2d');

const userField = document.querySelector('.user-field');
const usernameInput = document.querySelector('#usernameInput');
const emojiInput = document.querySelector('#emojiInput');
const btnEnter = document.querySelector('#btnEnter');

const resize = _ => {
    gameCanvas.width = window.innerWidth;
    gameCanvas.height = window.innerHeight;
    view.width = window.innerWidth;
    view.height = window.innerHeight;
}

const map = {
    width: 2560,
    height: 1920,
}

const player = {
    id: 0,
    spark: {},
    name: '',
    emoji: '',
    x: 0,
    y: 0,
    size: 32,
}

view = {
    width: 0,
    height: 0,
    x: player.x,
    y: player.y,
}

resize();

let players = [];
let coins = [];

keys = {
    up: false,
    right: false,
    down: false,
    left: false,
}

mouse = {
    pressed: false,
    x: 0,
    y: 0,
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

gameCanvas.addEventListener('mousedown', e => {
    mouse.pressed = true;
});

gameCanvas.addEventListener('mousemove', e => {
    mouse.x = e.x;
    mouse.y = e.y;
});

gameCanvas.addEventListener('mouseup', e => {
    mouse.pressed = false;
});

c.textAlign = "center"; 
c.textBaseline = "middle"; 

const init = () => {
    // Set pos
    player.x = map.width / 2;
    player.y = map.height / 2;

    // Connect to server
    primus =  Primus.connect('', {
        reconnect: {
            max: Infinity // Number: The max delay before we try to reconnect.
          , min: 500 // Number: The minimum delay before we try reconnect.
          , retries: 10 // Number: How many times we should try to reconnect.
        }
      });
    
    primus.on('data', (data) => {
        // Receive initial id
        if(data.type == 'connect') {
            player.id = data.id;
            player.spark = data.spark;

            if(!GAME_STARTED) {
                GAME_STARTED = true;
                setInterval(loop, 16);
            }         
        } 

        // Receive player data
        if(data.type == 'players') {
            players = data.players;
        }

        // Receive coin data
        if(data.type == 'coins') {
            coins = data.coins;
        }

        // Receive size update
        if(data.type == 'sizeUpdate') {
            player.size += data.amount;
        }
    });
}

loop = _ => {
    const PLAYER_SPEED = 4;
    let MOVING = false;

    // UPDATE
    // Keyboard
    if(keys.left || keys.right || keys.up || keys.down) MOVING = true;
    if(keys.right) player.x += PLAYER_SPEED;
    if(keys.left) player.x -= PLAYER_SPEED;
    if(keys.down) player.y += PLAYER_SPEED;
    if(keys.up) player.y -= PLAYER_SPEED;

    // Mouse
    /*
    if(!MOVING && mouse.pressed) {
        player.x += Math.sign(mouse.x - view.x / 2 - player.x) * PLAYER_SPEED;
        player.y += Math.sign(mouse.y - view.y / 2 - player.y) * PLAYER_SPEED;
    }
    */

    // Borders
    if(player.x < 0) player.x = 0;
    if(player.x > map.width) player.x = map.width;
    if(player.y < 0) player.y = 0;
    if(player.y > map.height) player.y = map.height;

    // SEND TO SERVER
    primus.write({type: 'player', player: player});

    // CLEAR SCREEN
    c.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

    // UPDATE VIEW
    view.x = player.x;
    view.y = player.y;
    c.save();
    c.translate(-view.x + view.width / 2, -view.y + view.height / 2);
    // Update background
    gameCanvas.style.backgroundPosition = `${-view.x}px ${-view.y}px`;
    
    // RENDER
    // Draw borders
    c.strokeRect(0, 0, map.width, map.height);

    // Draw coins
    coins.forEach(coin => {
        drawCoin(coin);
    })

    // Draw self
    drawPlayer(player);

    // Draw other players
    players.forEach(otherPlayer => {
        if(otherPlayer.id != player.id)
            drawPlayer(otherPlayer);
    })

    // RESTORE VIEW
    c.restore();
}

// Draw functions
const drawPlayer = player => {
    // Name
    c.font = `18px sans-serif`;
    c.fillText(player.name, player.x, player.y - player.size * 0.75 - 8);

    // Emoji
    c.font = `${player.size}px sans-serif`;
    c.fillText(player.emoji, player.x, player.y);
}

const drawCoin = coin => {
    c.font = `24px sans-serif`;
    c.fillText('💲', coin.x, coin.y);
}

const drawLine = (x1, y1, x2, y2) => {
    c.moveTo(x1, y1);
    c.beginpath();
    c.lineTo(x2, y2);
    c.stroke();
}

btnEnter.addEventListener('click', _ => {
    if(usernameInput.value != '') {
        player.name = usernameInput.value;
        player.emoji = emojiInput.value;

        userField.style.display = 'none';

        if(!GAME_STARTED)
            init();
    } else {
        usernameInput.style.backgroundColor = '#F8E2DD'
    }
})