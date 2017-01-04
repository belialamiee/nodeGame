//declarations for resources
var background = new Image();
background.src = "background.png";
var gamePaused = false;
var id = Math.random();
var userName = Math.random();
if ($.cookie('shooterId')) {
    id = $.cookie('shooterId');
}
var winner = "";
var restartingIn = 10;
$.cookie("shooterId", id, {expires: 1});
if ($.cookie('shooterName')) {
    userName = $.cookie('shooterName');
    $("#username").val(userName);

}

//todo move the player information into the canvas and we can add  a health bar to the name display.

var playerLeft = new Image();
playerLeft.src = "playerLeft.png";

var playerRight = new Image();
playerRight.src = "playerRight.png";

var shotImage = new Image();
shotImage.src = "pew.png";

var deadImage = new Image();
deadImage.src = "blood.png";

var pew = new Audio('pew.mp3');

var backgroundMusic = new Audio('yackety.mp3');

var image = playerLeft;

var fireRate = 2;
var lastFire = new Date();

var socket = io();

//empty array to hold all the users.
var players = [];

//our user with defaults.
var user = {
    id: id,
    x: 0,
    y: 0,
    username: userName,
    direction: "left",
    alive: true,
    health: 4
};

var activeShots = [];

var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");


$('.text').keyup(function (e) {
    if (e.keyCode == 13) {
        $(".text").blur();
    }
});

$("#username").on("blur", function (e) {
    if (e != "") {
        user.username = $("#username").val();
        socket.emit('user', user);
        $.cookie("shooterName", user.username, {expires: 1});
    }
});

//after typing
$("#chat").on("blur", function () {
    if ($("#chat").val() != "") {
        var msg = {
            msg: $("#chat").val(),
            user: user.username
        };
        socket.emit('msg', msg);
        $("#chat").val('');
    }
});

//draw canvas
function drawCanvas() {
    if (!gamePaused) {
        updateScores();
        ctx.clearRect(0, 0, 500, 500);
        ctx.drawImage(background, 0, 0, 500, 500);
        if (players) {
            players.forEach(function (player) {
                if (player.direction == "left") {
                    image = playerLeft;
                } else {
                    image = playerRight;
                }
                if (!player.alive) {
                    image = deadImage;
                }
                ctx.drawImage(image, player.x, player.y, 32, 32);
                ctx.beginPath();
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 4;
                ctx.moveTo(player.x, player.y + 32);
                ctx.lineTo(player.x + (player.health * 8), player.y + 32);
                ctx.stroke();
            });
        }
        if (activeShots) {
            activeShots.forEach(function (shot) {
                ctx.drawImage(shotImage, shot.x, shot.y, 8, 8);
            });
        }
    } else {
        //display endGame message.
        drawGameOverScreen();
    }
}

function drawGameOverScreen() {
    console.log('a');
    ctx.clearRect(0, 0, 500, 500);
    ctx.fillStyle = "#FFF";
    ctx.drawImage(background, 0, 0, 500, 500);
    ctx.fillRect(40, 120, 400, 250);
    ctx.fillStyle = "#000";
    ctx.font = "30px Arial";
    ctx.fillText("Game Over please wait ", 70, 180);
    ctx.fillText("for the game to resume", 70, 210);
    ctx.fillText("The winner was " + winner, 70, 240);
    ctx.fillText("Restarting in " + restartingIn + " seconds", 70, 270);
}

//update the scores
function updateScores() {
    var html = "";
    players.forEach(function (player) {
        html += "<p>" + player.username + ": " + player.score;
        if (player.alive == false) {
            html += " : DEAD";
        }
        html += "</p>"
    });
    $(".players").html(html);
}

var left = false;
var right = false;
var up = false;
var down = false;
var firing = false;

$(document).keyup(function (key) {
    if (key.which == 65) {
        left = false;
    }
    if (key.which == 68) {
        right = false;
    }
    if (key.which == 83) {
        up = false;
    }
    if (key.which == 87) {
        down = false;
    }
    if (event.which == 32) {
        firing = false;
    }

});

$(document).keydown(function (key) {
    if (key.which == 65) {
        left = true;
    }
    if (key.which == 68) {
        right = true;
    }
    if (key.which == 83) {
        up = true;
    }
    if (key.which == 87) {
        down = true;
    }
    if (event.which == 32) {
        firing = true;
    }

});

//handle key events
gameloop = setInterval(function () {
    if (!gamePaused && user.alive && (!$("#chat").is(":focus")) && (!$("#username").is(":focus"))) {
        //direction and movement
        var xVelocity = 0;
        var yVelocity = 0;

        if (left) {
            user.direction = "left";
            xVelocity = -1;
        }
        // right
        if (right) {
            user.direction = "right";
            xVelocity = 1;
        }
        //down
        if (down) {
            yVelocity = -1;
        }
        // up
        if (up) {
            yVelocity = 1;
        }
        var movement = {
            user: user,
            xVelocity: xVelocity,
            yVelocity: yVelocity
        };
        socket.emit('move', movement);
        if (firing) {
            var cFire = new Date();
            if ((cFire - lastFire) / 1000 > 1 / fireRate) {
                var shotOffset = 0;
                if (user.direction != "left") {
                    shotOffset = 25
                }
                var shot = {
                    user: user.id,
                    x: user.x + shotOffset,
                    y: (user.y + 12),
                    velocity: user.direction
                };
                socket.emit('shot', shot);
                lastFire = cFire;
            }
        }
    }
    socket.emit('user', user);
},25);

//handle incoming information
socket.on('players', function (users) {
    players = users;
    players.forEach(function (player) {
        if (player.id == user.id) {
            user = player;
            user.name = userName;
        }
    });

    drawCanvas();
});
socket.on('shots', function (shots) {
    activeShots = shots;
    drawCanvas();
});

socket.on('pew', function () {
    pew.currentTime = 0;
    pew.play();
});


socket.on('msg', function (message) {
    $("#messages").html('');
    for (var i = 0; i < message.length; i++) {
        $("#messages").append('<p>' + message[i].user + ": " + message[i].msg + '</p>');
    }
});


//pause the game when told. paused should be boolean
socket.on('paused', function (paused) {
    drawCanvas();
    console.log(paused);
    gamePaused = paused.paused == true;
    restartingIn = paused.remainingTime;
    if (paused.winner) {
        winner = paused.winner;

    }
});

socket.emit('user', user);

//todo get some decent music for this thing.
//  backgroundMusic.play();
