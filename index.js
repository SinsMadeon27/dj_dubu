const {
    executionAsyncResource
} = require('async_hooks');

var https = require('https');
var fs = require('fs');

const mxapi = '008e8364a7f91a607b6c1daa07fedb68';

const Discord = require('discord.js');
const ytdl = require('ytdl-core');

const {
    YTSearcher
} = require('ytsearcher');

const searcher = new YTSearcher({
    key: process.env.youtube_api,
    revealed: true
});

const lyrics = require("azlyrics-scraper");

const client = new Discord.Client(),
    settings = {
        prefix: "dubu",
        token: process.env.token
    };

const queue = new Map();


client.on("ready", () => {
    console.log("Siap bos!");
    // if (client.guilds.cache.size > 1) {
    //     var serrr = "servers";
    // } else {
    //     var serrr = "server";
    // }
    // client.user.setActivity(`Build with Love by ${client.users.fetch('474267205446664202')}.`, {
    //     type: "STREAMING"
    // });
    client.user.setActivity(`ArtProject.id who build me with love.`, {
        type: "LISTENING"
    });

});

client.on("message", async (message) => {
    const prefix = settings.prefix;
    if (message.content.toLocaleLowerCase().startsWith(prefix)) {
        const args = message.content.slice(prefix.length).split(/ +/g);
        const isi = message.content.slice(prefix.length + 1).slice(args[1].length + 1);

        const serverQueue = queue.get(message.guild.id);

        switch (args[1]) {
            case 'play':
                // console.log("Muterin lagu " + isi);
                execute(message, serverQueue, isi);
                break;
            case 'stop':
                stop(message, serverQueue);
                break;
            case 'skip':
                skip(message, serverQueue);
                break;
            case 'list':
                list(message, serverQueue);
                break;
            case 'leave':
                leave(message, serverQueue);
                break;
            case 'liriknya':
                liriknya(message, serverQueue);
                break;
            case 'help':
                message.channel.send({
                    embed: {
                        color: 'BLUE',
                        fields: [
                            { name: 'Command yang tersedia', value: `----**Coming Soon!**----` }
                        ]
                    }
                });
                break;
            default:
                message.channel.send({
                    embed: {
                        color: 'BLUE',
                        footer: { text: `More info: \`${settings.prefix} help\`` },
                        fields: [
                            { name: '‎‎‏‏‎ ‎', value: `Keknya salah Command ya ?` },
                            { name: '‎‎‏‏‎ ‎', value: `‎‎‏‏‎ ` },
                            { name: 'Command yang tersedia', value: `----**Coming Soon!**----\n\n` },
                            { name: '‎‎‏‏‎ ‎', value: `‎‎‏‏‎ ` }
                        ]
                    }
                });
                break;
        }
    }

    // FUNCTIONS
    async function execute(message, serverQueue, isi) {
        let vc = message.member.voice.channel;
        if (!vc) {
            return message.channel.send(`Masuk ke channel voice dulu lah cok! wkwkwk ${message.author}`);
        } else {
            message.channel.send(`**Nyari lagu ${isi}**`);
            let result = await searcher.search(isi, {
                type: "video"
            });
            
            const songInfo = await ytdl.getInfo(result.first.url);
            // console.log(songInfo.videoDetails);
            // var judul, artis;

            // if (songInfo.videoDetails.media.song = null) {
            //     judul = '';
            // } else {
            //     judul = songInfo.videoDetails.media.song;
            // }

            // if (songInfo.videoDetails.media.artist = null) {
            //     artis = '';
            // } else {
            //     artis = songInfo.videoDetails.media.artist;
            // }

            let song = {
                title: result.first.title.replace('&#39;',"'"),
                url: result.first.url,
                channel: result.first.title,
                channelurl: "https://www.youtube.com/channel/"+result.first.channelId,
                search: isi,
                media_song: songInfo.videoDetails.media.song,
                media_artist: songInfo.videoDetails.media.artist,
                requestedby: message.member
            };

            // message.channel.send("Ketemu!\nLink: " + result.first.url);
            message.channel.send({
                embed: {
                    color: 'BLUE',
                    fields: [
                        { name: 'Judul', value: `[${result.first.title}](${result.first.url})` },
                        { name: 'Channel', value: `[${result.first.channelTitle}](https://www.youtube.com/channel/${result.first.channelId})` }
                    ]
                }
            });
            if (!serverQueue) {
                const queueConstructor = {
                    txtChannel: message.channel,
                    vChannel: vc,
                    connection: null,
                    songs: [],
                    volume: 10,
                    playing: true
                };

                queue.set(message.guild.id, queueConstructor);
                queueConstructor.songs.push(song);

                try {
                    let connection = await vc.join();
                    // console.log("join vc");
                    queueConstructor.connection = connection;
                    play(message, message.guild, queueConstructor.songs[0]);
                    // console.log(queueConstructor.songs)
                } catch (err) {
                    console.error(err);
                    queue.delete(message.guild.id);
                    message.channel.send(`Wah ada error kak :) info: ${err}`);
                }
            } else {
                serverQueue.songs.push(song);
                message.channel.send({
                    embed: {
                        color: 'BLUE',
                        fields: [
                            { name: 'Judul', value: `[${song.title}](${song.url})` },
                            { name: 'Channel', value: `[${song.channel}](https://www.youtube.com/channel/${song.channelId})` }
                        ]
                    }
                });
                // console.log(serverQueue.songs)
            }
        }
    }

    function play(message, guild, song) {
        const serverQueue = queue.get(guild.id);
        // console.log(song);

        if (!song || song == 'undefined') {
            setTimeout(function() {
                serverQueue.vChannel.leave();
                queue.delete(guild.id);
                serverQueue.txtChannel.send({
                    embed: {
                        color: 'BLUE',
                        fields: [
                            { name: 'Info', value: 'Aku leave voice channel yaa.. udah ga ada lagu lagi soalnya...' }
                        ]
                    }
                })
                return;
            },15000);
        }

        const dispatcher = serverQueue.connection
            .play(ytdl(song.url))
            .on('finish', () => {
                if (serverQueue.songs.length > 1) {
                    serverQueue.songs.shift();
                    play(message, guild, serverQueue.songs[0]);
                    // console.log(serverQueue.songs[0]);
                } else {
                    serverQueue.vChannel.leave();
                    queue.delete(guild.id);
                    serverQueue.txtChannel.send({
                        embed: {
                            color: 'BLUE',
                            fields: [
                                { name: 'Info', value: 'Aku leave voice channel yaa.. udah ga ada lagu lagi soalnya...' }
                            ]
                        }
                    })
                    return;
                }
            })
            serverQueue.txtChannel.send({
                embed: {
                    color: 'BLUE',
                    fields: [
                        { name: 'Lagu', value: `[${song.title}](${song.url})`, inline: true },
                        { name: 'Requested by', value: `[${song.requestedby}]`, inline: true },
                        { name: 'Lirik', value: 'command: `liriknya`' },
                        { name: 'Liat Playlist', value: 'command: `list`' }
                    ]
                }
            });
    }

    function leave(message, serverQueue) {
        serverQueue.vChannel.leave();
        queue.delete(message.guild.id);
        message.channel.send("Anjir diusir..");
    }

    function stop(message, serverQueue) {
        if (!message.member.voice.channel)
            message.channel.send("Masuk ke channel voice dulu lah co!");
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end();
    }

    function skip(message, serverQueue) {
        if (!message.member.voice.channel)
            message.channel.send("Masuk ke channel voice dulu lah co!");
        if (!serverQueue)
            message.channel.send("Skip apaan ? Tadi lagu terakhir");
            serverQueue.connection.dispatcher.end();
        // else {
        //     message.channel.send("Iya iya, udah request malah di skip...");
        //     serverQueue.songs.shift();
        //     play(message.guild.id, serverQueue.songs[0]);
        // }
    }

    function list(message, serverQueue) {
        if (!serverQueue) {
            message.channel.send("Gak ada lagu di playlist");
        } else {
            var listqueue = '';
            var index = 1;
            for (var i = 1; i < serverQueue.songs.length; i++) {
                listqueue += index++ + ". ";
                listqueue += `${serverQueue.songs[i].title} [Req by: ${serverQueue.songs[i].requestedby}]\n`;
            };

            
            if (listqueue.length < 2) {
                sh_listqueue = "Gak ada lagi...";
            } else {
                sh_listqueue = listqueue;
            }

            console.log(sh_listqueue);

            message.channel.send({
                embed: {
                    color: 'BLUE',
                    fields: [
                        { name: 'Yang lagi diputer', value: `${serverQueue.songs[0].title} [Req by: ${serverQueue.songs[0].requestedby}]` },
                        { name: 'Abis ini', value: `${sh_listqueue}` },
                    ]
                }
            });
        }
    }

    function liriknya(message, serverQueue) {
        if (!serverQueue) {
            message.channel.send("Lirik apaan ? Muter lagu aja kagak cok...");
        } else if (!message.member.voice.channel) {
            message.channel.send("Masuk ke channel voice dulu lah co!");
        } else {
            // message.channel.send(serverQueue.songs[0].media_song);
            if (serverQueue.songs[0].media_song == null) {
                message.channel.send({
                    embed: {
                        color: 'BLUE',
                        fields: [
                            { name: 'Oops!', value: 'Aku gabisa nyari lirik lagu ini\nhehehe maap', inline: true }
                        ]
                    }
                });
            } else {
                // console.log(serverQueue.songs[0].requestedby);
                // console.log(serverQueue.songs[0].media_song);
                // console.log(serverQueue.songs[0].media_artist);

                var options = {
                    'method': 'GET',
                    'hostname': 'api.musixmatch.com',
                    'path': `/ws/1.1/track.search?format=json&callback=callback&q_track=${encodeURI(serverQueue.songs[0].media_song)}&q_artist=${encodeURI(serverQueue.songs[0].media_artist)}&quorum_factor=1&apikey=${mxapi}`,
                    'headers': {
                    },
                    'maxRedirects': 20
                };
                console.log("getTrack Success!\n\n");
                console.log(options);
                console.log("\n\n");


                // var options = {
                //     'method': 'GET',
                //     'hostname': 'api.musixmatch.com',
                //     'path': `/ws/1.1/track.search?format=json&callback=callback&q_track=RBB%20(Really%20Bad%20Boy)&q_artist=Red%20Velvet%20(%EB%A0%88%EB%93%9C%EB%B2%A8%EB%B2%B3)&quorum_factor=1&apikey=${mxapi}`,
                //     'headers': {
                //     },
                //     'maxRedirects': 20
                // };
                
                var req = https.request(options, function (res) {
                    var getTrack = [];
                
                    res.on("data", function (track) {
                    getTrack.push(track);
                    });
                
                    res.on("end", function (track) {
                        console.log(getTrack.toString().replace(/,,/g,',').replace(/u3,0/g,'u30'));
                        var resultssss = JSON.parse(getTrack.toString().replace(/,,/g,',').replace(/u3,0/g,'u30'));
                        var lyrics_id = resultssss.message.body.track_list[0].track.track_id;

                        var options2 = {
                            'method': 'GET',
                            'hostname': 'api.musixmatch.com',
                            'path': `/ws/1.1/track.lyrics.get?callback=callback&format=json&track_id=${lyrics_id}&apikey=${mxapi}`,
                            'headers': {
                            },
                            'maxRedirects': 20
                        }
                        console.log("getLyrics Success!\n\n");
                        console.log(options2);
                        console.log("\n\n");

                        var req2 = https.request(options2, function (res2) {
                            var getLyrics = [];

                            res2.on("data", function (lyrics) {
                                getLyrics.push(lyrics);
                            });

                            res2.on("end", function (lyrics) {
                                var lyres = JSON.parse(getLyrics.toString().replace(/,,/g,',').replace(/u3,0/g,'30'));
                                // console.log(getLyrics.toString());
                                var lirik = lyres.message.body.lyrics.lyrics_body.replace('******* This Lyrics is NOT for Commercial use *******','').replace('(1409621095152)','');
                                message.channel.send({
                                    embed: {
                                        color: 'BLUE',
                                        author: { name: `${serverQueue.songs[0].media_artist} - ${serverQueue.songs[0].media_song}` },
                                        footer: { text: '\n\nLiriknya aku ambil dari MusiXMatch ya brohhh, tapi gak dikasih full njir cuma segitu..' },
                                        fields: [
                                            { name: 'Liriknya nih bosss', value: `${lirik}`},
                                        ]
                                    }
                                })
                            });

                            res2.on("error", function (error) {
                                console.log(error);
                            });
                        });

                        req2.end();
                    });
                
                    res.on("error", function (error) {
                    console.error(error);
                    });
                });
                
                req.end();
            }
        }
    }

    function callback(x) {
        return x;
    }
});

client.login(settings.token)