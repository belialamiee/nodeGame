var express = require('express');
var app = express();
var port = process.env.PORT || 8080;
var server = app.listen(port);
var io = require('socket.io').listen(server);
//set up the public folder to load audio, images and js scripts for the webpage.
app.use(express.static('public'));
//serve the web page.
app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});


//todo gracefully handle discconects, add colours/name tags,
//todo slow down restarts, give the players a moment to savour their glory, add in bonus for being last one alive.

var livePlayers = 0;
var players = [];
var shots = [];
var messages = [];

//update the location of all the users.
function updateUsers(user){
	var notFound = true;
	players.forEach(function(player){
		if (player.id == user.id){
			player.username = user.username;
			player.x = user.x;
			player.y = user.y;
			player.direction = user.direction;			
			notFound = false;
		}
	});

	if(notFound){
		user.score = 0;
		players.push(user);
		livePlayers++;
	}
}

//update the location of all shots
function updateGame(){
	shots.forEach(function(shot, index, object){
		if (shot.velocity == "left"){
			shot.x--;
		}else{
			shot.x++;
		}
		
		if(shot.x > 500 || shot.x < 0 || shot.y > 500 || shot.y < 0){
			object.splice(index,1);
		}
		players.forEach(function(player){
		//need to fix this so it has 16px in any direction as a hit. this way it doesn't just take the middle as a hit
		if(shot.x > player.x
		&& shot.x < player.x + 22 
		&& shot.y >  player.y -5
		&& shot.y < player.y + 27  
		&& player.id  != shot.user
		&& player.alive
		){	
			player.alive = false;
			livePlayers--;
			updateScore(shot);
			object.splice(index,1);
			console.log(player.username + " was killed");
			}
		});
				io.emit('players',players);
	});
	io.emit('shots',shots);
	io.emit('players', players);
	io.emit('msg',messages);
	//if only one player is left alive then restart the game. need to display a results screen for 1 min before restarting
			if(livePlayers <= 1 && players.length > 1){
				restartGame();
			}

}

//start the game, make sure everyone is alive and place them in random positions
function restartGame(){
	players.forEach(function(player){
		player.alive = true;
		player.x = Math.round(Math.random() * 480);
        player.y = Math.round(Math.random() * 480);
	});
	livePlayers = players.length;

}

function updateScore(shot){
	players.forEach(function(player){
		if(shot.user == player.id){
			player.score++;
		}	
	});
}	

//add  a bullet to the shots
function addToShots(shot){
	shots.push(shot);
}

//handle incoming messages
io.on('connection',function(socket){

	socket.on('msg',function(msg){
		messages.push(msg);
		
	});

	socket.on('user',function(u){
		updateUsers(u)
	});
	socket.on('disconnect',function(user){
			console.log("user has disconnected");
	});
	
	socket.on('shot',function(shot){
		addToShots(shot);
		io.emit('pew',null);
		
	});
});

setInterval(updateGame, 10);
