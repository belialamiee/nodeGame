//declarations for resources
var background = new Image();
background.src = "background.png";

var id = Math.random();
var userName = Math.random();
if ($.cookie('shooterId')) {
    id = $.cookie('shooterId');
}
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

var backgroundMusic = new Audio('yackety.mp3');

var image = playerLeft;

var fireRate = 2;
var lastFire = new Date();

var socket = io();

//empty array to hold all the users.
var players = [];

//our user.
var user = {
    id: id,
    username: userName,
    x: Math.round(Math.random() * 480),
    y: Math.round(Math.random() * 480),
    direction: "left",
    alive: true

}

var activeShots = [];

var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");

$('.text').bind("enterKey", function (e) {
    //do stuff here
});
$('.text').keyup(function (e) {
    if (e.keyCode == 13) {
        $(".text").blur();
    }
});

$("#username").on("blur", function () {
    if ($("#username").val() != "") {
        user.username = $("#username").val();
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

        });
    }
    if (activeShots) {

        activeShots.forEach(function (shot) {
            ctx.drawImage(shotImage, shot.x, shot.y, 8, 8);
        });
    }
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


//handle key events
$(document).keydown(function () {

    //disable movement when the user is dead or typing names or chats
    if (user.alive && (!$("#chat").is(":focus")) && (!$("#username").is(":focus"))) {
        // left, up, right, down
        //todo movement should be handled by the server, just send the velocity to the server.
        if (event.which == 37 || event.which == 38 || event.which == 39 || event.which == 40) {
            event.preventDefault();
        }
        // left
        if (event.which == 37 || event.which == 65) {
            user.direction = "left";
            user.x -= 2;
        }
        // right
        if (event.which == 39 || event.which == 68) {
            user.direction = "right";
            user.x += 2;
        }
        //down
        if (event.which == 38 || event.which == 87) {
            user.y -= 3;
        }
        // up
        if (event.which == 40 || event.which == 83) {
            user.y += 2;
        }

        if (event.which == 32) {
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
});

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
    console.log(message);
    for (var i = 0; i < message.length; i++) {
        console.log();
        $("#messages").append('<p>' + message[i].user + ": " + message[i].msg + '</p>');
    }


});


socket.emit('user', user);


//  backgroundMusic.play();
