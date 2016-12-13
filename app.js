var express = require('express');
var app = express();
var port = process.env.PORT || 8080;
var server = app.listen(port);
var io = require('socket.io').listen(server);
//set up the public folder to load audio, images and js scripts for the webpage.
app.use(express.static('public'))
//serve the web page.
app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});


var players = [];
var shots = [];

//update the location of all the users.
function updateUsers(user){
	var notFound = true;
	players.forEach(function(player){
		if (player.id == user.id){
			player.username = user.username;
			player.x = user.x;
			player.y = user.y;
			player.direction = user.direction;	
			player.score = 0;		
			notFound = false;
		}
	});

	if(notFound){
	console.log(user)
		players.push(user);
	}
	io.emit('players', players);
}

//update the location of all shots
function updateShots(){
	shots.forEach(function(shot){
		if (shot.velocity == "left"){
			shot.x--;
		}else{
			shot.x++;
		}
		players.forEach(function(player){
		//need to fix this so it has 16px in any direction as a hit. this way it doesn't just take the middle as a hit
		if(player.x > shot.x - 16 
		&& player.x < shot.x + 16  
		&& player.y >  shot.y - 16 
		&& player.y < shot.y + 16 
		&& player.id  != shot.user
		){
		player.alive = false;
		}
		});
				io.emit('players',players);
	});
	io.emit('shots',shots);
	}

//add  a bullet to the shots
function addToShots(shot){
	shots.push(shot);
}

//handle incoming messages
io.on('connection',function(socket){
	socket.on('user',function(msg){
		console.log(msg);
		//update where this user is on the system
		updateUsers(msg)
	});
	socket.on('disconnect',function(user){
			console.log("user has disconnected");
	});
	
	socket.on('shot',function(shot){
		addToShots(shot);
		io.emit('pew',null);
		
	});
});

setInterval(updateShots, 10);
