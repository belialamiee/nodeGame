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
var lastFire = new Date();

//our user with defaults.
var user = {
    id: id,
    x: 0,
    y: 0,
    username: userName,
    direction: "left",
    alive: true,
    health: 4,
    charClass: Math.floor(Math.random() * 4) + 1,
    lastFire: new Date()
};

var activeShots = [];
var c = document.getElementById("myCanvas");

c.addEventListener('click',function(e){
    if(e.offsetX < 90 && e.offsetX > 5 && e.offsetY > 10 && e.offsetY < 30 ){
        //handle change class
		changingClass = true;
		//add in event handler for the sections of the screen
    }

});
var ctx = c.getContext("2d");

//enter works on chat and username updates
$('.text').keyup(function (e) {
    if (e.keyCode == 13) {
        $(".text").blur();
    }
});

//after changing username
$("#username").on("blur", function (e) {
    if (e != "") {
        user.username = $("#username").val();
        socket.emit('user', user);
        $.cookie("shooterName", user.username, {expires: 1});
    }
});

//after typing in chat
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
	ctx.font = "12px Arial";
	ctx.lineWidth = 1;
	drawSideBar();    if (!gamePaused && !changingClass) {
        ctx.clearRect(100, 0, 800, 600);   
        ctx.drawImage(background, 100, 0, 800, 600);
        drawPlayers();
        drawSideBar();
        if (activeShots) {
            activeShots.forEach(function (shot) {
                ctx.drawImage(shotImage, shot.x, shot.y, 8, 8);
            });
        }
		}else if (changingClass){
		
		drawChangeClass();
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

			var percentageHealthRemaining = player.archetype.health / player.health * 100;
			
            ctx.lineTo(player.x + (player.health * 8), player.y + 32);
            ctx.stroke();
        });
    }
}

//handles changing the class
function drawChangeClass() {
    ctx.clearRect(100, 0, 800, 600);
    //split into 4 sections
	//soldier
    ctx.strokeRect(100,0,351,300);
	ctx.fillText("Soldier",110, 20)	
	ctx.fillText("Health: 4", 110, 40);
	ctx.fillText("Damage: 1", 110, 60);
	ctx.fillText("Range: 1000", 110, 80);
	ctx.fillText("FireRate: 2", 110, 100);
	
	//shotgun
	ctx.strokeRect(100,301,0,600);
	ctx.fillText("Shot Gunner",110, 320)
	ctx.fillText("Health: 4", 110, 340);
	ctx.fillText("Damage: 3", 110, 360);
	ctx.fillText("Range: 100", 110, 380);
	ctx.fillText("FireRate: 4", 110, 400);

    
	//pewpew
	ctx.strokeRect(451,0,800,0);
	ctx.fillText("Machine Gunner",460, 20)
	ctx.fillText("Health: 4", 460, 40);
	ctx.fillText("Damage: 0.5", 460, 60);
	ctx.fillText("Range: 1000", 460, 80);
	ctx.fillText("FireRate: 1", 460, 100);

    
	//sword
	ctx.strokeRect(451,301,800,600);
	ctx.fillText("Swordsman",460, 320)
	ctx.fillText("Health: 8", 460, 340);
	ctx.fillText("Damage: 10", 460, 360);
	ctx.fillText("Range: 20", 460, 380);
	ctx.fillText("FireRate: 2", 460, 400);

}

//draw the scores onto the screen itself.
function drawSideBar() {
	//draw the change class button
	ctx.clearRect(0,0,100,600);
	updateScores();
	ctx.lineWidth = 1;
    ctx.fillStyle = "#FFF";
    ctx.fillRect(5, 10, 90, 30);
    ctx.fillStyle = "#000";
    ctx.strokeRect(5, 10, 90, 30);
    ctx.fillText('Change Class', 10, 30);
}

function drawGameOverScreen() {
    ctx.clearRect(100, 0, 800, 600);
    ctx.fillStyle = "#FFF";
    ctx.drawImage(background, 100, 0, 800, 600);
    ctx.fillRect(240, 120, 400, 250);
    ctx.fillStyle = "#000";
    ctx.font = "30px Arial";
    ctx.fillText("Game Over please wait ", 270, 180);
    ctx.fillText("for the game to resume", 270, 210);
    ctx.fillText("The winner was " + winner, 270, 240);
    ctx.fillText("Restarting in " + restartingIn + " seconds", 270, 270);
}

//update the scores
function updateScores() {
    var x = 5;
    var y = 60;
	
    players.forEach(function (player) {
		ctx.clearRect(0, 0, 100, 0);
		ctx.lineWidth = 1;
        ctx.fillText(player.username,x,y);
        y = y + 20;
		console.log(player);
        ctx.fillText(player.score,x,y);
        ctx.beginPath();
        ctx.strokeStyle = '#ff0000';
        y = y + 10;
        ctx.moveTo(x, y);
        ctx.lineTo(x + (player.health * 16), y);
        ctx.stroke();
        y = y + 20;
    });
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
		//throttle requests sent to the server. although whether to fire or not is truly handled by the server, we can throttle the requests here to reduce the load.
		  var cFire = new Date();
             if ((cFire - lastFire) / 1000 > 1 / user.archetype.fireRate) {
                 var shotOffset = 0;
                 if (user.direction != "left") {
                     shotOffset = 25
                 }
                 var shot = {user: user};
                 socket.emit('shot', shot);
                 lastFire = cFire;
             }
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
