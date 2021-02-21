const { executionAsyncResource } = require('async_hooks');

const Discord = require('discord.js');
const ytdl    = require('ytdl-core');

const { YTSearcher } = require('ytsearcher');

const searcher = new YTSearcher({
  key: process.env.youtube_api,
  revealed: true
});

const client = new Discord.Client(),
settings = {
  prefix: "dil",
  token: process.env.token
};

const queue = new Map();


client.on("ready", () => {
  console.log("Siap bos!");
})

client.on("message", async(message) => {
  const prefix = settings.prefix;
  if (message.content.startsWith(prefix)) {
    const args = message.content.slice(prefix.length).split(/ +/g);
    const isi = message.content.slice(prefix.length +1).slice(args[1].length +1);

    const serverQueue = queue.get(message.guild.id);
    switch (args[1]) {
      case 'play':
        console.log("Muterin lagu " + isi);
        execute(message, serverQueue);
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
    }

    async function execute(message, serverQueue) {
      let vc = message.member.voice.channel;
      if (!vc) {
        return message.channel.send("Masuk ke channel voice dulu lah co!");
      } else {
        let result = await searcher.search(isi, { type: "video" });
        message.channel.send("hasil: "+ result.first.url);
        const songInfo = await ytdl.getInfo(result.first.url);
        let song = {
          title: songInfo.videoDetails.title,
          url: songInfo.videoDetails.video_url,
          search: isi
        };

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
            queueConstructor.connection = connection;
            play(message.guild, queueConstructor.songs[0]);
            console.log(queueConstructor.songs)
          } catch (err) {
            console.error(err);
            queue.delete(message.guild.id);
            message.channel.send(`Wah ada error kak :) info: ${err}`);
          }
        } else {
          queueConstructor.song.push(song);
          message.channel.send("Lagu " + songInfo.videoDetails.title + " udah aing masukin ke list ya broh~~~");
        }
      }
    }

    function play(guild, song) {
      const serverQueue = queue.get(guild.id);
      if(!song) {
        serverQueue.vChannel.leave();
        queue.delete(guild.id);
        return;
      }
      const dispatcher= serverQueue.connection;
        
      dispatcher.play(ytdl(song.url));
      dispatcher.on('finish', () => {
        serverQueue.songs.shift();
        play(guild, serverQueue.songs[0]);
      });
    }

    function stop(message, serverQueue) {
      if (!message.member.voice.channel)
        return message.channel.send("Masuk ke channel voice dulu lah co!");
      serverQueue.songs = [];
      serverQueue.connection.dispatcher.end();
    }
    function skip(message, serverQueue) {
      if (!message.member.voice.channel) {
        return message.channel.send("Masuk ke channel voice dulu lah co!");
      }
      if (!serverQueue) {
        return message.channel.send("Skip apaan ? Tadi lagu terakhir");
        serverQueue.connection.dispatcher.end();
      } else {
        return message.channel.send("Iya iya, udah request malah di skip...");
      }
    }
    function list(message, serverQueue) {
      console.log(serverQueue);
    }
  }
})

client.login(settings.token)