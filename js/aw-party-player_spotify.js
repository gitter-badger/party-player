"use strict";

//exemple d'utilisation de spotify en js

var accessToken = null;
function error(msg) {
    info(msg);
}
function info(msg) {
    $("#info").text(msg);
}
function authorizeUser() {
    var client_id = 'fe46ef0a9b384db28ceafb9f16343ece';
    var redirect_uri = 'http://static.echonest.com/MySavedTracks/index.html';
    var redirect_uri = 'http://localhost:8000';
    var url = 'https://accounts.spotify.com/authorize?client_id=' + client_id +
        '&response_type=token' +
        '&scope=user-library-read' +
        '&redirect_uri=' + encodeURIComponent(redirect_uri);
    document.location = url;
}
function parseArgs() {
    var hash = location.hash.replace(/#/g, '');
    var all = hash.split('&');
    var args = {};
    _.each(all, function(keyvalue) {
        var kv = keyvalue.split('=');
        var key = kv[0];
        var val = kv[1];
        args[key] = val;
    });
    return args;
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
            'Authorization': 'Bearer ' + accessToken
        },
        success: function(r) {
            callback(r);
        },
        error: function(r) {
            callback(null);
        }
    });
}
function showTracks(tracks) {
    var list = $("#item-list");
    console.log('show tracks', tracks);
    if (tracks.offset == 0) {
        $("#main").show();
        $("#intro").hide();
        $("#item-list").empty();
        info("");
    }
    _.each(tracks.items, function(item) {
        var artistName = item.track.artists[0].name;
        var itemElement = $("<div>").text(item.track.name + ' - ' + artistName);
        list.append(itemElement);
    });
    if (tracks.next) {
        callSpotify(tracks.next, {}, function(tracks) {
            showTracks(tracks);
        });
    }
}
$(document).ready(
    function() {
        var args = parseArgs();
        if ('access_token' in args) {
            accessToken = args['access_token'];
            $("#go").hide();
            info('Getting your user profile');
            fetchCurrentUserProfile(function(user) {
                if (user) {
                    $("#who").text(user.id);
                    info('Getting your saved tracks');
                    fetchSavedTracks(function(data) {
                        if (data) {
                            showTracks(data.tracks);
                        } else {
                            error("Trouble getting your saved tracks");
                        }
                    });
                } else {
                    error("Trouble getting the user profile");
                }
            });
        } else {
            $("#go").show();
            $("#go").on('click', function() {
                authorizeUser();
            });
        }
    }
);