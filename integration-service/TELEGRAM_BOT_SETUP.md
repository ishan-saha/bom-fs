# How to Get Telegram Bot Token

## Step 1: Contact BotFather
1. Open Telegram app or web version: https://web.telegram.org/
2. Search for `@BotFather` or click: https://t.me/botfather
3. Start a chat with BotFather

## Step 2: Create a New Bot
1. Send the command: `/newbot`
2. BotFather will ask for a name for your bot
   - Example: `My Integration Service Bot`
3. BotFather will ask for a username (must end with 'bot')
   - Example: `my_integration_service_bot`

## Step 3: Get Your Token
After creating the bot, BotFather will send you a message like:
```
Done! Congratulations on your new bot. You will find it at t.me/my_integration_service_bot. 
You can now add a description, about section and profile picture for your bot, see /help for a list of commands. 

Use this token to access the HTTP API:
1234567890:ABCdefGHIjklMNOpqrsTUVwxyz123456789

Keep your token secure and store it safely, it can be used by anyone to control your bot.
```

## Step 4: Copy the Token
Copy the token (the long string like `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz123456789`)

## Step 5: Update Your .env File
Open your `.env` file and update:
```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz123456789
```

## Step 6: Get Your Chat ID (For Testing)
1. Send `/start` to your bot
2. Your bot will respond and show your Chat ID
3. Use this Chat ID for testing messages

## Security Note:
- Never share your bot token publicly
- Never commit it to version control
- Keep it in your .env file only

## Bot Commands Setup (Optional):
You can set up commands for your bot by sending to BotFather:
```
/setcommands
```
Then send:
```
start - Start the bot and get your Chat ID
help - Get help information  
status - Check your registration status
```
