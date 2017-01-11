//declarations for resources
var background = new Image();
background.src = "background.png";
var gamePaused = false;
var id = Math.random();
//empty array to hold all the users.
var players = [];
var changingClass = false;

var userName = "Player";
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

var playerLeft = new Image();
playerLeft.src = "playerLeft.png";

var playerRight = new Image();
playerRight.src = "playerRight.png";

var shotImage = new Image();
shotImage.src = "pew.png";

var deadImage = new Image();
deadImage.src = "blood.png";

var pew = new Audio('pew.mp3');
var splat = new Audio('splat.wav');

var backgroundMusic = new Audio('yackety.mp3');

var image = playerLeft;
var socket = io();

//our user with defaults.
var user = {
    id: id,
    x: 0,
    y: 0,
    username: userName,
    direction: "left",
    alive: true,
    health: 4,
    charClass: 2,
    lastShot: new Date()
};

var activeShots = [];
var c = document.getElementById("myCanvas");

c.addEventListener('click',function(e){
    if(e.offsetX < 90 && e.offsetX > 5 && e.offsetY > 10 && e.offsetY < 30 ){
        //handle change class
    }

});
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
    if (!gamePaused && !changingClass) {
        ctx.clearRect(0, 0, 800, 600);
        updateScores();
        drawSideBar();
        ctx.drawImage(background, 100, 0, 800, 600);
        drawPlayers();
        drawSideBar();
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


function drawPlayers() {
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
            //draw the rest of the game screen
            ctx.drawImage(image, player.x, player.y, 32, 32);
            ctx.beginPath();
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 4;
            ctx.moveTo(player.x, player.y + 32);
            ctx.lineTo(player.x + (player.health * 8), player.y + 32);
            ctx.stroke();
        });
    }
}

//handles changing the class
function drawChangeClass() {
    ctx.clearRect(0, 0, 800, 600);
    //split into 4 sections
    ctx.strokeRect(0,0,400,300);
    ctx.strokeRect(0,0,400,300);
    ctx.strokeRect(401,301,800,600);
    ctx.strokeRect(401,301,800,600);
}

//draw the scores onto the screen itself.
function drawSideBar() {
    //draw the change class button
    ctx.fillStyle = "#FFF";
    ctx.fillRect(5, 10, 90, 30);
    ctx.fillStyle = "#000";
    ctx.lineWidth = 1;
    ctx.strokeRect(5, 10, 90, 30);
    ctx.font = "12px Arial";
    ctx.fillText('Change Class', 10, 30);
}

function drawGameOverScreen() {
    ctx.clearRect(0, 0, 800, 600);
    ctx.fillStyle = "#FFF";
    ctx.drawImage(background, 0, 0, 800, 600);
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
        key.preventDefault();
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
        if (right) {
            user.direction = "right";
            xVelocity = 1;
        }
        if (down) {
            yVelocity = -1;
        }
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
            var shot = {user: user};
            socket.emit('shot', shot);
        }
    }
    socket.emit('user', user);
}, 25);

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

socket.on('splat', function () {
    splat.currentTime = 0;
    splat.play();
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
    gamePaused = paused.paused == true;
    restartingIn = paused.remainingTime;
    if (paused.winner) {
        winner = paused.winner;

    }
});

socket.emit('user', user);

//todo get some decent music for this thing.
//  backgroundMusic.play();
