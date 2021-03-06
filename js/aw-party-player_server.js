
function addSpotifyPlaylistToActualPlaylist(){
	var nb = 0;
	for(var index in my_convert_data){
		var id_youtube = my_convert_data[index];
		addToPlaylistOnServer(id_youtube,true);
		nb++;
	}
	if(nb>0){
		return true;
	}
	else{
		alert('Aucune chansons trouvées... Pas de conversion possible.');
		return false;
	}
}

function FoundYoutubeIDException(data){
	throw{
		name: "FoundYoutubeIDException",
		message: data
	}
}

//conversion vers youtube
function convertSpotify(){
	my_convert_data = [];//re-init
	console.log(my_import_data);
	
	for (var id_spotify in my_import_data){
		var track_name = my_import_data[id_spotify];
		console.log(track_name);
		//debut de la recherche sur youtube
		$('#track_spotify_'+id_spotify).append('&nbsp;<img src="/img/ajax_loader.gif" class="loader" width="20px" />');
		var cb = function(data,params){
			var cur_id_spotify = params;
			var duree = 0;
			var cur_elem = $('#track_spotify_'+cur_id_spotify);
			
			//que faire avec le resultat de la requete
			if(data != null && typeof data.feed.entry !== 'undefined' && data.feed.entry.length > 0){
				try {
					
					//on recherche d'abord les video venant de VEVO
					data.feed.entry.forEach(function(element,index,array){
				        if( typeof(element['media$group']) !== 'undefined' 
				        && typeof(element['media$group']['media$content']) !== 'undefined' 
				        && typeof(element['media$group']['media$content'][0]) !== 'undefined'
				        )
				        duree = element['media$group']['media$content'][0]['duration'];
				        //si le resultat vient de VEVO et ne contient pas des trucs trop court ou trop long (spam)
				        if(element['author'][0]['name']['$t'].indexOf('VEVO') !== false && duree > minDurationSearchTrack && duree < maxDurationSearchTrack){
				            FoundYoutubeIDException(element['media$group']['yt$videoid']['$t']);
			            } 
				    });
					
					//ensuite les autres chaine de video
				    data.feed.entry.forEach(function(element,index,array){
				        if( typeof(element['media$group']) !== 'undefined' 
				        && typeof(element['media$group']['media$content']) !== 'undefined' 
				        && typeof(element['media$group']['media$content'][0]) !== 'undefined'
				        )
				        duree = element['media$group']['media$content'][0]['duration'];
				        //si le resultat ne contient pas des trucs trop court ou trop long (spam)
				        if(duree > minDurationSearchTrack && duree < maxDurationSearchTrack){
				            FoundYoutubeIDException(element['media$group']['yt$videoid']['$t']);
			            } 
				    });
				} 
				//si une chanson assez longue est trouvé, on break le foreach, et on l'ajoute à la liste
				catch(e){
					if ( e.name == "FoundYoutubeIDException") {
					    cur_elem.find('.loader').hide();
				        cur_elem.append('&nbsp;<img src="/img/check.svg" class="check" width="20px" />');
				        my_convert_data.push(e.message);
			        }
			        else
			        	throw e;
				}
			}
			//si rien n'est trouvé
			if(duree == 0){
				cur_elem.find('.loader').hide();
				cur_elem.append('&nbsp;<img src="/img/fail.svg" class="fail" width="20px" />');
			}
			
		}
		
		searchTrackOnYoutube(track_name,cb,id_spotify);
	}
}

//Listing des chasnons d'une playlist spotify
function importSpotifyPlaylist(href,optionnal_last_called_url) {
	BB.hide();
    callSpotify(href, null, function (data) {
		//Construction de la présentation de la playlist
		my_import_data = [];
		var message = "<ul>";
		data.tracks.items.forEach(function(element,index,array){
			
			if (element.track.name != "" && element.track.id != ""){
		    	var track_name = element.track.artists[0].name+" - "+element.track.name;
		    	var id= element.track.id;
		    	message += "<li href='#' id='track_spotify_"+id+"'>"+track_name+"</li>";
		    	my_import_data[id] = track_name;
		    }
		});
		message += "</ul>";
		
		var btn_success = {
			label: "Ajouter les chansons à la playlist",
			className: "btn-success",
			callback: function() {        
			    return addSpotifyPlaylistToActualPlaylist();
			}
		  };
		
		if(typeof optionnal_last_called_url !== 'undefined' && optionnal_last_called_url !== ''){
			var boutons = {
			  back: {
				label: "Retour",
				className: "btn-default",
				callback: function() {        
				    BB.hide();
				    importSpotify(optionnal_last_called_url);
				}
			  },
		      success: btn_success
		    };
		}
		else{
			var boutons = {
		      success: btn_success
		    };
		}
		
		BB = bootbox.dialog({
		    message: message,
		    title: "Playlist : "+data.name,
		    closeButton: true,
		    buttons: boutons
		  });
		  
		  //lancement de la conversion
		  convertSpotify();
		
	}
    );
    
    
}

function fetchCurrentUserProfile(callback) {
    var url = 'https://api.spotify.com/v1/me';
    callSpotify(url, null, callback);
}
function fetchSavedTracks(callback) {
    var url = 'https://api.spotify.com/v1/me/tracks';
    callSpotify(url, {}, callback);
}
function callSpotify(url, data, callback) {
    $.ajax(url, {
        dataType: 'json',
        data: data,
        headers: {
            'Authorization': 'Bearer ' + $.cookie('spotify_token')
        },
        success: function(r) {
            callback(r);
        },
        error: function(r) {
            callback(null);
        }
    });
}

//Listing des playlist importable depuis spotify
function importSpotify(optionnal_url){
	var playlist_url = "https://api.spotify.com/v1/users/"+spotifyUser.id+"/playlists";
	if(typeof optionnal_url !== 'undefined' && optionnal_url != ''){
		playlist_url = optionnal_url;
	}
	
    callSpotify(playlist_url, null, function (data) { 
	    console.log("import4");
	    var message = "<ul>";
		data.items.forEach(function(element,index,array){
		    if (element.name != "" && element.tracks.total > 0)
		    message += "<li> <a href='#' onclick='importSpotifyPlaylist(\""+element.href+"\",\""+playlist_url+"\");'>"+element.name+"</a> ("+element.tracks.total+" titres)</li>";
		});
		message += "</ul>";
		
		//si un next existe on ajoute au bouton
		if(typeof data.next !== 'undefined' && data.next !== null ){
			var btn = {
				label: "Suivant",
				className: "btn-primary",
				callback: function() {
					BB.hide();
				    importSpotify(data.next);
				}
			};
		}
		//sinon on met un bouton fermer
		else{
			var btn = {
				label: "Fermer",
				className: "btn-primary",
				callback: function() {
				    BB.hide();
				}
			};
		}
		
		//si un previous existe on l'ajoute au bouton
		if(typeof data.previous !== 'undefined' && data.previous !== null ){
			var boutons = {
				btn_prev: {
					label: "Précédent",
					className: "btn-primary",
					callback: function() {
						BB.hide();
					    importSpotify(data.previous);
					}
				},
				main: btn
			};
		}
		else{
			var boutons = {
		      main: btn
		    }
		}
		
		
		BB = bootbox.dialog({
		    message: message,
		    title: "Vos playlists sur Spotify",
		    closeButton: true,
		    buttons: boutons
		 });
	});
}

function authorizeSpotifyUser(){
    var url = 'https://accounts.spotify.com/authorize?client_id=' + spotify_client_id +
        '&response_type=token' +
        '&scope=user-library-read' +
        "&state=" + window.btoa(current_url) +
        '&redirect_uri=' + encodeURIComponent(base_url);
    document.location = url;
}

function markAllAsUnread(){
    $.getJSON(serverURL, {
        'mode': 'unread_all',
        'sessid': sessid,
        'user': username
    }, function (data) { 
        if(data.result == 'error'){
            bootbox.alert(data.error);
        }
        else{
            lastPlayedId = 0;
	        loadPlaylistFromServer();
        }
    });
}

//construire le html d'un item de playlist, sur le serveur
function buildHTMLPlaylistItem(element,title,user,vote,date){
    var id = element.id;
    var d = new Date();
    d.setTime(element.addTime*1000);
    var html = '<div id="'+element.id+'" ';
    html += 'data-add-date="'+element.addTime+'" ';
    html += 'data-vote="'+element.vote+'" ';
    html += 'data-user="'+element.addUser+'" ';
    html += 'class="list-group-item ';
    if(element.alreadyRead){
        html += 'alreadyRead';
    }
    html += '" ';
    html += 'style="float: left; width: 100%;" ';
    html += '>';
    
    html += '<div class="playlist_item_title">'+title+'</div>';
    
    //ligne de date
    html += '<div class="playlist_item_ligne" style="float:left" >';
        html += '<div class="playlist_item_user"> Ajouté par '+element.addUser+'</div>';
        html += '<div class="playlist_item_date"> le '+d.getDate() + '/' + (d.getMonth()+1) + '/' + d.getFullYear()+' à '+d.getHours()+':'+('0'+d.getMinutes()).slice(-2)+'</div>';
    html += '</div>';
    
    
    html += '<div class="playlist_item_ligne" style="float:right" >';
    //bouton lecture
    html += '<button type="button" class="btn btn-success" title="Lire ce titre" onclick="loadByYoutubeId(\''+id+'\')"><span class="glyphicon glyphicon-play"></span></button>&nbsp;';
    //bouton de suppression
    html += '<button type="button" class="btn btn-danger" title="Supprimer ce titre" onclick="deleteFromPlaylistOnServer(\''+id+'\')"><span class="glyphicon glyphicon-remove"></span></button>&nbsp;';
    //bouton de resultat des votes
    html += '<button type="button" class="btn btn-default" title="Qui a voté?" onclick="afficheVote(\''+id+'\')" style="padding: 4px 8px;" ><span class="glyphicon ';
    if(element.vote >= 0){
        html += 'glyphicon-thumbs-up';
    }
    else{
        html += 'glyphicon-thumbs-down';
    }
    html += '"></span>&nbsp;'+element.vote+'</button>&nbsp;';
    
    
    html += '</div>';
    
        
    html += '</div>';
    
    
    html += '<div style="display:none" id="detail_vote_'+id+'" >';
        html += ''+title+'';
        if(element.votes.length == 0){
            html += '<br/><br/>Pas de votant...<br/><br/>';
        }
        else{
            html += '<ul>';
            $.each(element.votes,function(index,elem){
               html += '<li>';
               if(elem.value == 'plus'){
                   html += '<span class="glyphicon glyphicon-thumbs-up"></span>';
               }
               else{
                   html += '<span class="glyphicon glyphicon-thumbs-down"></span>';
               }
               //html += elem.value;
               html += '&nbsp;'+elem.user+'</li>'; 
            });
            html += '</ul>';
        }
    html += ' </div>'
    
    
    return html;
}

function loadNextTrack(){
    console.log('loading next track');
	$.getJSON(serverURL, {
        'mode': 'next_track',
        'sessid': sessid,
        'last_played': lastPlayedId,
        'user': username
    }, function (data) { 
        if(data.result == 'error' && data.error == 'no_data'){
            //si la playlist est vide on fait rien
            playlistVide();
        }
        else if(data.result == 'error'){
            bootboxInstanceLoadNextTrack = bootbox.alert(data.error,function(){
                bootboxInstanceLoadNextTrack = null;
            });
            playerIsLoaded = false;
        }
        else{
	        if(typeof data.content !== 'undefined' && data.content != 0 && data.content != '' && data.content != 'undefined'){
            	loadByYoutubeId(data.content);
            	if(typeof bootboxInstanceLoadNextTrack !== 'undefined' && bootboxInstanceLoadNextTrack != null){
                    bootboxInstanceLoadNextTrack.modal('hide');
                }
            }else{
	            playerIsLoaded = false;
            }
        }
    });
}

function loadByYoutubeId(id){
	lastPlayedId = id;
    mediaPlayer_id = id;
    
    //var url = "https://www.youtube.com/v/"+id+"?version=3&f=videos&app=youtube_gdata";
    if(modeAudio == true){
        var url = "http://youtubeinmp3.com/fetch/?video=http://www.youtube.com/watch?v="+id;
    }
    else{
        var url = "http://www.youtube.com/watch?v="+id;
    }
    load(url);
    
    //ajout du titre
    var callback = function(data){
        var titre = '';
        if(data.entry.title['$t'] != ''){
            titre = data.entry.title['$t'];
        }
        jQuery('#main-title').html(titre);
    };
    getYoutubeTrackInfo(id,callback);
    
    indicateurLecture(id);
    
    markAsRead(id);
}

function load(url){
    playerIsLoaded = true;
    var htmlin = '<video width="640" height="360" style="max-width:100%;height:100%;" id="audio-player" preload="auto" autoplay controls="controls"><source type="video/youtube" src="'+url+'" /></video>';
    // width="'+player_width+'" height="'+player_height+'"
    //version uniquement audio
    if(url.indexOf("mp3") != -1){
        htmlin = '<audio id="audio-player" autoplay="true" preload="none" src="'+url+'" type="audio/mp3" controls="controls"/></audio>';
    }
    
    jQuery('#player-wrapper').html(htmlin);
    
    var fluidEl = $("#colonne_gauche");
    var newWidth = fluidEl.width() - 40;//prise en compte du padding
    
    mediaPlayer = new MediaElementPlayer("#audio-player",{
        videoWidth: newWidth,
        videoHeight: "100%",
        pluginWidth: newWidth,
        pluginHeight: "100%",
        
        // width of audio player
        audioWidth: '100%',
        // height of audio player
        audioHeight: 30,
        // initial volume when the player starts
        startVolume: 1,
        // useful for <audio> player loops
        loop: false,
        // enables Flash and Silverlight to resize to content size
        enableAutosize: true,
        // the order of controls you want on the control bar (and other plugins below)
        features: ['playpause','progress','current','duration','tracks','volume','fullscreen'],
        // Hide controls when playing and mouse is not over the video
        alwaysShowControls: false,
        // force iPad's native controls
        iPadUseNativeControls: false,
        // force iPhone's native controls
        iPhoneUseNativeControls: false,
        // force Android's native controls
        AndroidUseNativeControls: false,
        // forces the hour marker (##:00:00)
        alwaysShowHours: false,
        // show framecount in timecode (##:00:00:00)
        showTimecodeFrameCount: false,
        // used when showTimecodeFrameCount is set to true
        framesPerSecond: 25,
        // turns keyboard support on and off for this instance
        enableKeyboard: true,
        // when this player starts, it will pause other players
        pauseOtherPlayers: true,
        // array of keyboard commands
        keyActions: [],
        success: function(mediaElement, domObject)
        {
           mediaElement.addEventListener('ended', loadNextTrack, false);
           mediaElement.addEventListener('canplay', function() {
                mediaPlayer.play();
           }, false);
           
           // Resize all videos according to their own aspect ratio
			var newHeight = newWidth * (9/16);//allVideos.data('aspectRatio');
            mediaPlayer.player.setPlayerSize(w,h);
            mediaPlayer.player.setVideoSize(w,h);
           
           /*******fixer la taille de la video
		    var allVideos = $("#audio-player");
		    
			console.log("height:"+allVideos.height());
			console.log("width:"+allVideos.width());
			var ratio = allVideos.height() / allVideos.width();
			console.log("ratio:"+ratio);
			allVideos.data('aspectRatio', ratio );
			// and remove the hard coded width/height
			allVideos.removeAttr('height');
			allVideos.removeAttr('width');
			
			// When the window is resized
			$(window).resize(function() {
			
			 
			
			  
			  
			  console.log("new width:"+newWidth);
			  console.log("new height:"+newHeight);
			  
			 
			  allVideos.width(newWidth).height(newHeight);
			  //mediaElement.width(newWidth).height(newHeight);
			  $('#mep_0').width(newWidth).height(newHeight);
			  mediaElement.pluginHeight = newHeight;
			  mediaElement.height = newHeight;
			
			// Kick off one resize to fix all videos on page load
			}).resize();*/
           
        }
    });
    
    mediaPlayer.play();
    
};


$(document).ready(function(){
	var spotify_buttons = $('.spotify_import_button');
	if ($.cookie('spotify_token') != '') {
		fetchCurrentUserProfile(function(user){
			spotifyUser = null;
			if (user) {
				spotifyUser = user;
				spotify_buttons.html("Importer depuis Spotify");
				spotify_buttons.click(function(){importSpotify();});
			}
			else{
				$.cookie('spotify_token','');
				spotify_buttons.html("Connexion à Spotify");
				spotify_buttons.click(function(){authorizeSpotifyUser();});
			}
		});
	}
	else{
		spotify_buttons.html("Connexion à Spotify");
		spotify_buttons.click(function(){authorizeSpotifyUser();});
	}
})

