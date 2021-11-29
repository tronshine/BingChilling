const Discord = require('discord.js');
const ytdl = require('ytdl-core')
const { createAudioPlayer, createAudioResource, joinVoiceChannel } = require('@discordjs/voice');
const youtubesearchapi = require('youtube-search-api');
const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS", "GUILD_MESSAGE_TYPING", "GUILD_VOICE_STATES"] })
const player = createAudioPlayer();
client.once('ready',()=>{
    console.log("BingChilling!");
});

client.on('messageCreate',async message=>{
    const command = parseCommand(message);
    const payload = parsePayload(message);

    switch(command) {
        case "play":
            console.log(payload);
            if(payload === ("$"+command)) break;
            try {
                const ytRes = await getYtUrl(payload);
                console.log(ytRes);
                if(ytRes.length<1){
                    message.reply("Unable to Play Track!");
                    break;
                }
                const channel = message.member.voice.channel;
                if(channel){ 
                    const streamdata = await getAudioStream(ytRes[0].id);
                    const resource = createAudioResource(streamdata);
                    const connection = joinVoiceChannel({
                        channelId: channel.id,
                        guildId: channel.guild.id,
                        adapterCreator: channel.guild.voiceAdapterCreator,
                    });
                    await playAudioVc(connection, message, resource, ytRes);
                }
                else{
                    message.reply("You must be in a Voice Channel!");
                }
            } catch (error) {
                console.log(error);
            }
            break;
        case "help":
            message.reply("1) '$play [song]' = Play Music from YouTube (Search/URL)\n2) '$pause' = Pause Currently Playing\n3) '$resume' = Resume Last Paused Playing\n4) '$stop' = Stop Currently Playing/Clear Queue\n5) '$queue' = List Queue");
            break;
        case "stop":
            message.reply("Stopped!")
            player.stop();
            break;
        default:
            break;
      }
})


client.login(process.env.BC);

//COMMAND PARSER
const parseCommand = (message)=>{
    const prefix = "$";
    if(!message.content.startsWith(prefix)||message.author.bot) return;
        const args = message.content.slice(prefix.length).split(/ +/);
        const command = args.shift().toLowerCase();
        return command;
}
//PAYLOAD PARSER
const parsePayload = (message)=>{
    const args = message.content.substring(message.content.indexOf(" ") + 1);
        return args;
}
//GET YOUTUBE VIDEO ID
const getYtUrl = async (payload)=>{
    try {
        const res = await youtubesearchapi.GetListByKeyword(payload, false, 1);
        return res.items;
    } catch (error) {
        console.log(error);
    }
}
//GET AUDIO STREAM FROM YOUTUBE
const getAudioStream = async (id)=>{
    try {
        const res = await ytdl("https://www.youtube.com/watch?v="+id+"&bpctr=9999999999", {filter:'audioonly'});
        return res;
    } catch (error) {
        console.log(error);
    }
}
//PLAY AUDIO IN VC
const playAudioVc = async (connection, message, resource, ytRes)=>{
    try {
        connection.subscribe(player);
        player.play(resource);
        message.reply("Now Playing: "+ytRes[0].title);
        player.on("idle",()=>{
            try{
                player.stop();
                connection.destroy();
            }
            catch(e){
                console.log(e);
            }
        })
    } catch (error) {
        console.log(error);
    }
}