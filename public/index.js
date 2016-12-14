	//declarations for resources
	var background = new Image();
	background.src = "background.png";

	var playerLeft = new Image();
	playerLeft.src = "playerLeft.png"

	var playerRight = new Image();
	playerRight.src = "playerRight.png"
	
	var shotImage = new Image();
	shotImage.src = "pew.png";
	
	var deadImage = new Image();
	deadImage.src = "blood.png";
	
	var pew = new Audio('pew.mp3');
	
	var backgroundMusic = new Audio('yackety.mp3');
	
	var image = playerLeft;

	var socket = io();

	//empty array to hold all the users.
	var players = [];

	//our user.
    var user = {
		id: Math.random(),
		username: Math.random(),
        x: Math.round(Math.random() * 480),
        y: Math.round(Math.random() * 480),
		direction: "left",
		alive: true
	
    }
	
	var activeShots = [];
	
    var c = document.getElementById("myCanvas");
    var ctx = c.getContext("2d");
	
	$("#username").on("blur",function(){
			user.username = $("#username").val();
			
	});
	
	//draw canvas
	function drawCanvas() {
		updateScores();
		ctx.clearRect(0, 0, 500,500 );
		ctx.drawImage(background, 0,0,500,500)
		if(players){
		
			players.forEach(function(player){
				if(player.direction == "left"){
					image = playerLeft;
				}else{
					image = playerRight;
				}
				if(!player.alive){
					image = deadImage;
				}
				ctx.drawImage(image, player.x, player.y,32,32);				
		
			});
		}
		if(activeShots){
		
			activeShots.forEach(function(shot){
				ctx.drawImage(shotImage, shot.x, shot.y, 8,8);
			});
		}
	}
	
	//update the scores
	function updateScores(){
		var html = "";
		players.forEach(function(player){
			html += "<p>"+ player.username + ": "+ player.score;
			if(player.alive == false){
				html += " : DEAD";
			}
			html += "</p>"	
		});

		$(".players").html(html);
	}

		
	//handle key events
    $(document).keydown(function () {
        // left, up, right, down
		if(user.alive){
		console.log(user.alive);
        if (event.which == 37 || event.which == 38 || event.which == 39 || event.which == 40) {
            event.preventDefault();
        }
        // left
        if (event.which == 37 || event.which == 65) {
            user.direction = "left";
			user.x--;
        }
        // right
        if (event.which == 39 || event.which == 68) {
            user.direction = "right";
			user.x++;
        }
        //down
        if (event.which == 38 || event.which == 87) {
            user.y--;
        }
        // up
        if (event.which == 40 || event.which == 83) {
            user.y++;
        }
		
		if(event.which == 32){
		var shotOffset = 0;
		if(user.direction != "left"){
		shotOffset = 25
		}
		
			var shot = {
				user: user.id,
				x : user.x + shotOffset,
				y : (user.y + 12),
				velocity : user.direction
			};
			socket.emit('shot',shot)
		}
        }
		socket.emit('user',user);
		}); 
	
	//handle incoming information
	socket.on('players', function(users){
		players = users;
		players.forEach(function(player){
			if(player.id == user.id){
				user = player;
			}
		});
		
		drawCanvas();
	});
	socket.on('shots',function(shots){
		activeShots = shots;	
		drawCanvas();
	});
	
	socket.on('pew',function(){
		pew.currentTime = 0;
		pew.play();
	});
	

	
	
  socket.emit('user',user);
  

//  backgroundMusic.play();
