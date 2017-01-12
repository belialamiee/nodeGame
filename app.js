var express = require('express');
var app = express();
//getting it work on openshift
//var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
//var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
//var server = app.listen(server_port, server_ip_address);

//local environment
var port = process.env.PORT || 8080;
var server = app.listen(port);
var _ = require('lodash');

var pauseData = {
    paused: true,
    winner: "Ben",
    remainingTime: 10
};

var io = require('socket.io').listen(server);
//set up the public folder to load audio, images and js scripts for the webpage.
app.use(express.static('public'));
//serve the web page.
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});


//todo gracefully handle disconnects, add colours/name tags,
//todo update to work in environments besides locally
var livePlayers = 0;
var players = [];
var shots = [];
var messages = [];
var speed = 2;

//archetypes
//standard shooter
var standardArchetype = {
    health: 4,
    damage: 1,
    fireRate: 2,
    shootRange: 1000,
    speed: 2
};

//high damage but short range
var shotgunArchetype = {
    health: 4,
    damage: 3,
    fireRate: 2,
    shootRange: 100,
    speed: 2
};

//machine gun fast shots but low damage per hit
var pewpewArchetype = {
    health: 4,
    damage: 0.5,
    fireRate: 4,
    shootRange: 1000,
    speed: 2
};

//close range, one hit kills but needs to be right on top of them
var swordArchetype = {
    health: 8,
    damage: 10,
    fireRate: 1.5,
    shootRange: 5,
    speed: 3
};

//given the id return the character archetype
function fetchArcheType(charClass) {
    //fetch the archetype given the id
    switch (charClass) {
        case 1:
            archetype = standardArchetype;
            break;
        case 2:
            archetype = shotgunArchetype;
            break;
        case 3:
            archetype = pewpewArchetype;
            break;
        case 4:
            archetype = swordArchetype;
            break;
        default:
            archetype = standardArchetype;
            break;
    }
    return archetype;
}

//change the player class. we kill the player so that they cannot cheat the system.
function changeClass(user) {
    players.forEach(function (player) {
        if (player.id == user.id) {
            player.alive = false;
            player.archetype = addArcheType(user.charClass);
            livePlayers--;

        }
    });
}

//update the location of all the users.
function updateUsers(user) {
    var notFound = true;
    players.forEach(function (player) {
        if (player.id == user.id) {
            player.username = user.username;
            player.direction = user.direction;
            notFound = false;
        }
    });

    if (notFound) {
        user.score = 0;
        //don't want the player spawning on the edges of the screens, or with more health etc then it should.
        user.x = Math.round(Math.random() * 660) + 120;
        user.y = Math.round(Math.random() * 460) + 120;
        console.log(user.charClass);
        user.alive = true;
        user.direction = 'left';
        user.archetype = fetchArcheType(user.charClass);
        user.health = user.archetype.health;
        user.lastFire = new Date().getTime();
        players.push(user);
        livePlayers++;
    }
}

function updatePlayerLocation(movements) {
    players.forEach(function (player) {
        if (player.id == movements.user.id) {
            if (movements.xVelocity < 0) {
                if (player.x > 100) {
                    player.x -= player.archetype.speed;
                }
            } else if (movements.xVelocity > 0) {
                if (player.x < 767) {
                    player.x += player.archetype.speed;
                }
            }
            if (movements.yVelocity < 0) {
                if (player.y > 0) {
                    player.y -= player.archetype.speed;
                }
            } else if (movements.yVelocity > 0) {
                if (player.y < 567) {
                    player.y += player.archetype.speed;
                }
            }
        }
    });
}

function getWinner() {
    var winner = "";
    players.forEach(function (player) {
        if (player.alive) {
            winner = player.username;
        }
    });
    return winner;
}

//update the location of all shots
function updateGame() {
    //todo implement the different stats for shots, for instance range and damage.
    shots.forEach(function (shot, index, object) {
        if (shot.velocity == "left") {
            shot.x--;
        } else {
            shot.x++;
        }
        shot.distanceTravelled++;
        if (shot.distanceTravelled > shot.user.archetype.shootRange) {
            object.splice(index, 1);
        }
        if (shot.x > 800 || shot.x < 0 || shot.y > 600 || shot.y < 0) {
            object.splice(index, 1);
        }
        players.forEach(function (player) {
            //need to fix this so it has 16px in any direction as a hit. this way it doesn't just take the middle as a hit
            if (shot.x > player.x
                && shot.x < player.x + 22
                && shot.y > player.y - 5
                && shot.y < player.y + 27
                && player.id != shot.user.id
                && player.alive
            ) {
                io.emit('splat', null);
                player.health = player.health - shot.user.archetype.damage;
                object.splice(index, 1);
                if (player.health < 1) {
                    player.health = 0;
                    player.alive = false;
                    livePlayers--;
                    updateScore(shot);
                    shots = [];
                    console.log(player.username + " was killed");
                }
            }
        });
        io.emit('players', players);
    });
    io.emit('shots', shots);
    io.emit('players', players);
    io.emit('msg', messages);
    //if only one player is left alive then restart the game. need to display a results screen for 1 min before restarting
    if (livePlayers <= 1 && players.length > 1) {
        clearInterval(gameLoop);
        pauseData.paused = true;
        pauseData.winner = getWinner();
        //get the last living players name
        //create an object of the players name, the time remaining before refresh and the fact that the game is paused.
        io.emit('paused', pauseData);
        var pauseTime = setInterval(function () {
            pauseData.remainingTime--;
            if (pauseData.remainingTime == 0) {
                pauseData.remainingTime = 10;
                pauseData.paused = false;
                clearInterval(pauseTime);
                restartGame();
                gameLoop = setInterval(updateGame, 10);
            }
            io.emit('paused', pauseData);
        }, 1000);
    }
}

//start the game, make sure everyone is alive and place them in random positions
function restartGame() {
    players.forEach(function (player) {
        player.alive = true;
        player.x = Math.round(Math.random() * 660) + 120;
        player.y = Math.round(Math.random() * 460) + 120;
        player.health = 4;
    });
    livePlayers = players.length;
}

function updateScore(shot) {
    players.forEach(function (player) {
        if (shot.user.id == player.id) {
            player.score++;
        }
    });
}

//add  a bullet to the shots
function addToShots(shot) {
    var cFire = new Date().getTime();
    if ((cFire - shot.user.lastFire) / 1000 > 1 / shot.user.archetype.fireRate) {
        shot.user.lastFire = cFire;
        var shotOffset = -5;
        if (shot.user.direction != "left") {
            shotOffset = 25
        }
        shot.x = shot.user.x + shotOffset;
        shot.y = shot.user.y + 12;
        shot.velocity = shot.user.direction;
        shot.distanceTravelled = 0;
        shots.push(shot);
        players.forEach(function (player) {
            if (player.id == shot.user.id) {
                player.lastFire = cFire;
            }
        });
    }


}

//handle incoming messages
io.on('connection', function (socket) {
    socket.on('msg', function (msg) {
        messages.push(msg);
    });

    socket.on('classChange', function (user) {
        changeClass(user);
    });

    socket.on('user', function (u) {
        updateUsers(u);
    });

    socket.on('disconnect', function (user) {
        console.log("user has disconnected " + user);
    });

    socket.on('shot', function (shot) {
        addToShots(shot);
        io.emit('pew', null);
    });

    socket.on('move', function (e) {
        updatePlayerLocation(e);
    });
});

var gameLoop = setInterval(updateGame, 10);
