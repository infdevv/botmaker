
document.addEventListener('DOMContentLoaded', function () {
    const commands = [];

    // Add an event listener for the "Add If X Command" button
    document.getElementById('add-if-x').addEventListener('click', () => {
        const triggerText = document.getElementById('trigger-text').value;
        const responseText = document.getElementById('response-text').value;

        // Add the "if X is said" command to the commands array
        commands.push({
            type: 'if-x',
            trigger: triggerText,
            response: responseText,
        });

        // Display the command in the command list
        displayCommands();

        // Clear the input fields
        document.getElementById('trigger-text').value = '';
        document.getElementById('response-text').value = '';
    });

    // Add an event listener for the "Add Say X Command" button
    document.getElementById('add-say-x').addEventListener('click', () => {
        const sayText = document.getElementById('say-text').value;
        const lastEvent = document.getElementById('last-event').value;

        // Add the "Say X" command to the commands array
        commands.push({
            type: 'say-x',
            text: sayText,
            lastEvent: lastEvent,
        });

        // Display the command in the command list
        displayCommands();

        // Clear the input fields
        document.getElementById('say-text').value = '';
    });

    document.getElementById('add-action').addEventListener('click', () => {
        const actionType = document.getElementById('action-type').value;
        const actionText = document.getElementById('action-text').value;
        const customMessage = document.getElementById('custom-message').value;

        // Add the action to the commands array
        commands.push({
            type: 'do-action',
            actionType: actionType,
            actionText: actionText,
            customMessage: customMessage,
        });

        // Display the command in the command list
        displayCommands();

        // Clear the input fields
        document.getElementById('action-type').value = 'none';
        document.getElementById('action-text').value = '';
        document.getElementById('custom-message').value = '';
    });

    // Add an event listener for the "Generate Bot Code" button
    document.getElementById('generate-code').addEventListener('click', () => {
        const botToken = document.getElementById('bot-token').value;
        const botPrefix = document.getElementById('bot-prefix').value;
        const pythonCode = generateBotCode(botToken, botPrefix);

        // Display the generated Python code
        document.getElementById('generated-code').textContent = pythonCode;
    });

    function displayCommands() {
        const commandList = document.getElementById('command-list');
        commandList.innerHTML = '';

        for (const command of commands) {
            const li = document.createElement('li');
            if (command.type === 'if-x') {
                li.textContent = `If "${command.trigger}" is said, respond with "${command.response}"`;
            } else if (command.type === 'say-x') {
                const lastEventStr = command.lastEvent === 'trigger' ? ' (Only if Last Event)' : '';
                li.textContent = `Say "${command.text}"${lastEventStr}`;
            } else if (command.type === 'do-action') {
                const actionTypeStr = command.actionType !== 'none' ? `Do "${command.actionType}" with "${command.actionText}"` : 'No action';
                const customMessageStr = command.customMessage ? `Custom Message: "${command.customMessage}"` : '';
                li.textContent = `${actionTypeStr} ${customMessageStr}`;
            }
            commandList.appendChild(li);
        }
    }

   function generateBotCode(botToken, botPrefix) {
    const commandGenerators = {
        'if-x': generateIfXCode,
        'say-x': generateSayXCode,
        'do-action': generateDoActionCode,
    };

    let pythonCode = `
import discord
from discord.ext import commands

intents = discord.Intents.all()
bot = commands.Bot(command_prefix="${botPrefix}", intents=intents)

@bot.event
async def on_ready():
    print("Bot is online")

    activity = discord.Activity(type=discord.ActivityType.listening, name=" 🧱Made With BotCraft (Beta) 🧱")
    await bot.change_presence(activity=activity)

@bot.event
async def on_message(message):
    if message.author == bot.user:
        return
    `;

    let lastEventCheck = '';
    let lastEventActions = '';

    for (const command of commands) {
        if (command.type in commandGenerators) {
            pythonCode += commandGenerators[command.type](command);
        }
    }

    pythonCode += lastEventCheck + lastEventActions + `
    await bot.process_commands(message)

bot.run("${botToken}")
    `;

    return pythonCode;
}

function generateIfXCode(command) {
    return `
    if message.content.startswith("f"):
        await message.channel.send("${command.response}")
    `;
}

function generateSayXCode(command) {
    let code = `
    if "${command.text}" in message.content:
    `;

    if (command.lastEvent === 'trigger') {
        code += `
        if not last_event_triggered:
            await message.channel.send("${command.text}")
        last_event_triggered = True
        `;
    } else {
        code += `
        await message.channel.send("${command.text}")
        `;
    }

    return code;
}

function generateDoActionCode(command) {
    if (command.actionType === 'say') {
        return `
    await message.channel.send("${command.actionText}")
    `;
    } else if (command.actionType === 'ban') {
        return `
    if "${command.actionText}" in message.content:
        # Get the user to ban
        user_id = int(mention.strip('<@!>'))
        user = message.guild.get_member(user_id)

        if user:
            await user.ban(reason="Banned by bot")
    `;
    } else if (command.actionType === 'kick') {
        return `
    if "${command.actionText}" in message.content:
        # Find the member to kick by name
        member_name = "${command.actionText}"
        member = discord.utils.get(message.guild.members, display_name=member_name)

        if member:
            await member.kick(reason="Kicked by bot")
    `;
    } else if (command.actionType === 'dm') {
        return `
        mentioned_users = message.mentions

        if not mentioned_users:
            await message.channel.send("No user mentioned.")
            return

        # Ban each mentioned user
        for user in mentioned_users:
            await user.send("${command.customMessage || 'Your custom DM message here'}")
    `;
    } else if (command.actionType === 'delete') {
        return `
    if "${command.actionText}" in message.content:
        await message.delete()
    `;
    } else {
        return ''; // Handle other action types as needed
    }
}

});
