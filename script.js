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

// Add an event listener for the "Add Action" button
document.getElementById('add-action').addEventListener('click', () => {
    const actionType = document.getElementById('action-type').value;
    const actionText = document.getElementById('action-text').value;

    // Add the action to the commands array
    commands.push({
        type: 'do-action',
        actionType: actionType,
        actionText: actionText,
    });

    // Display the command in the command list
    displayCommands();
    
    // Clear the input fields
    document.getElementById('action-type').value = 'none';
    document.getElementById('action-text').value = '';
});

// Add an event listener for the "Generate Bot Code" button
document.getElementById('generate-code').addEventListener('click', () => {
    const botToken = document.getElementById('bot-token').value;
    const botPrefix = document.getElementById('bot-prefix').value;
    const pythonCode = generateBotCode(botToken, botPrefix);
    
    // Display the generated Python code
    document.getElementById('generated-code').textContent = pythonCode;
});

// Function to display commands in the list
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
            li.textContent = actionTypeStr;
        }
        commandList.appendChild(li);
    }
}

// Function to generate Python code based on user-defined instructions
function generateBotCode(botToken, botPrefix) {
    let pythonCode = `
import discord
from discord.ext import commands

intents = discord.Intents.default()
intents.typing = False
intents.presences = False

bot = commands.Bot(command_prefix="${botPrefix}", intents=intents)

@bot.event
async def on_ready():
    print("Bot is online")

@bot.event
async def on_message(message):
    if message.author == bot.user:
        return
    `;
    
    let lastEventCheck = '';
    let lastEventActions = '';
    
    // Loop through user-defined commands and generate code
    for (const command of commands) {
        if (command.type === 'if-x') {
            pythonCode += `
    if "${command.trigger}" in message.content:
        await message.channel.send("${command.response}")
            `;
        } else if (command.type === 'say-x') {
            if (command.lastEvent === 'trigger') {
                lastEventCheck = `
    last_event_triggered = False
                `;
                pythonCode += `
    if "${command.text}" in message.content:
        if not last_event_triggered:
            await message.channel.send("${command.text}")
        last_event_triggered = True
                `;
            } else {
                pythonCode += `
    if "${command.text}" in message.content:
        await message.channel.send("${command.text}")
                `;
            }
        } else if (command.type === 'do-action') {
            if (command.actionType === 'say') {
                lastEventActions += `
    await message.channel.send("${command.actionText}")
                `;
            } else if (command.actionType === 'ban') {
                lastEventActions += `

        # Get the member to ban
        member = message.author
        await member.ban(reason="Banned by bot")
                `;
            } else if (command.actionType === 'kick') {
                lastEventActions += `

        # Get the member to kick
        member = message.author
        await member.kick(reason="Kicked by bot")
                `;
            } else if (command.actionType === 'dm') {
                lastEventActions += `

        # Get the user to send a direct message
        user = message.author
        await user.send("Your custom DM message here")
                `;
            } else if (command.actionType === 'delete') {
                lastEventActions += `
    if "${command.actionText}" in message.content:
        await message.delete()
                `;
            }
        }
    }
    
    pythonCode += lastEventCheck + lastEventActions + `
    await bot.process_commands(message)

bot.run("${botToken}")
    `;
    
    return pythonCode;
}

});
