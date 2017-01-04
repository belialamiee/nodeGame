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
//todo slow down restarts, give the players a moment to savour their glory, add in bonus for being last one alive.
//todo update to work in environments besides locally
var livePlayers = 0;
var players = [];
var shots = [];
var messages = [];
var speed = 2;

var standardHealth = 5;

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
		//todo make this a class and add in damage multiplier here. then we can add in buffs and character archetypes later on.
        user.x = Math.round(Math.random() * 460) + 20;
        user.y = Math.round(Math.random() * 460) + 20;
        user.health = 4;
        user.alive = true;
        user.direction = 'left';
        players.push(user);
        livePlayers++;
    }
}

function updatePlayerLocation(movements) {
    players.forEach(function (player) {
        if (player.id == movements.user.id) {
            if (movements.xVelocity < 0) {
                player.x -= speed;
            } else if (movements.xVelocity > 0) {
                player.x += speed;
            }
            if (movements.yVelocity < 0) {
                player.y -= speed;
            } else if (movements.yVelocity > 0) {
                player.y += speed;
            }
        }
    });
}

//update the location of all shots
function updateGame() {
    shots.forEach(function (shot, index, object) {
        if (shot.velocity == "left") {
            shot.x--;
        } else {
            shot.x++;
        }

        if (shot.x > 500 || shot.x < 0 || shot.y > 500 || shot.y < 0) {
            object.splice(index, 1);
        }
        players.forEach(function (player) {
            //need to fix this so it has 16px in any direction as a hit. this way it doesn't just take the middle as a hit
            if (shot.x > player.x
                && shot.x < player.x + 22
                && shot.y > player.y - 5
                && shot.y < player.y + 27
                && player.id != shot.user
                && player.alive
            ) {
                player.health--;
                object.splice(index, 1);
                if(player.health < 1){
                    player.alive = false;
                    livePlayers--;
                    updateScore(shot);
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
		//get the last living players name
		//create an object of the players name, the time remaining before refresh and the fact that the game is paused.
		io.emit('paused',pauseData);
		
		var pauseTime = setInterval(function(){ 
			pauseData.remainingTime--;
			console.log(pauseData.remainingTime);
				if(pauseData.remainingTime == 0){
					pauseData.remainingTime = 10;
					pauseData.paused = false;
					clearInterval(pauseTime);
					restartGame();
					gameLoop = setInterval(updateGame, 10);
				}
				io.emit('paused',pauseData);
		}, 1000);
    }
}

//start the game, make sure everyone is alive and place them in random positions
function restartGame() {
    players.forEach(function (player) {
        player.alive = true;
        player.x = Math.round(Math.random() * 480);
        player.y = Math.round(Math.random() * 480);
        player.health = 4;
    });
    livePlayers = players.length;

}

function updateScore(shot) {
    players.forEach(function (player) {
        if (shot.user == player.id) {
            player.score++;
        }
    });
}


//add  a bullet to the shots
function addToShots(shot) {
    shots.push(shot);
}

//handle incoming messages
io.on('connection', function (socket) {

    socket.on('msg', function (msg) {
        messages.push(msg);

    });

    socket.on('user', function (u) {
        updateUsers(u);
    });
    socket.on('disconnect', function (user) {
        console.log("user has disconnected");
    });

    socket.on('shot', function (shot) {
        addToShots(shot);
        io.emit('pew', null);

    });

    socket.on('move', function (e) {
        updatePlayerLocation(e);
        //update the users x and y coordinates in proportion to their x and y velocity
        // x -1 means head 2 steps left, 0 means no horizontal movement and 1 means 2 steps left
        // y -1 means head 2 steps up, 0 means no vertical movement and 1 means 2 steps down

    });
});

var gameLoop = setInterval(updateGame, 10);
