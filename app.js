var express = require('express');
var app = express();
var port = process.env.PORT || 8080;
var server = app.listen(port);
var io = require('socket.io').listen(server);

app.use(express.static('public'))

var players = [];
var shots = [];
app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

function updateUsers(user){
	var notFound = true;
	players.forEach(function(player){
		if (player.name == user.name){
			player.x = user.x;
			player.y = user.y;
			player.direction = user.direction;			
			notFound = false;
		}
	});

	if(notFound){
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
	});
	io.emit('shots',shots);
	
	}
	//add  a bullet to the shots
function addToShots(shot){
	shots.push(shot);
}

io.on('connection',function(socket){
	socket.on('user',function(msg){
	console.log(msg);
		//update where this user is on the system
		updateUsers(msg)
		//send back to the players
		
	});
	socket.on('disconnect',function(){
	});
	
	socket.on('shot',function(shot){
		addToShots(shot);
		console.log(shot);
		
	});
});

setInterval(updateShots, 10);
