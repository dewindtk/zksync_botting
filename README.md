# zksync_botting
Zksync botting utility for MVHQ fam

### How to install dependencies:
 - Install nodejs from [here](https://nodejs.org/en) if you have not alread. This is the runtime enviroment which will allow you to run javascript from the terminal.

### How to download the code and set up the enviroment:
 - Simply click on the green **Code** on the top right of this page, extract the Folder and put it wherever you like (Desktop is fine)
 - Open cmd or Powershell and navigate INTO the extracted folder with the command: `cd ... `. Example: `cd Desktop`, then `cd zksync_botting`. Everything you do below is folder specific, if you would like to start over, Simply delete the folder and start over.
 - IN THE FOLDER WITH ALL THE SCRIPTS, Initialise NodeJS with the command: `npm init`. Press enter a few times to accept the default config.
 - Install all the dependant libraries with the command `npm i`

### How to run the bot
 - Type in the command: `node zk_sync_bot.js`. You can auto-complete the name of the bot by typing in the first few letters and hitting `tab`

# How the bot works
When you start the bot, you will have 3 options:
 - Task loop
 - Create new wallets
 - List all available wallets

 **Create new wallets** is intuitive. You can specify a number of new wallets you wish to create and their randomly generated private keys will be stored in `user_wallets.json` in the format: {"wallet_address": "private key"}. **These will not be encrypted** so make sure when you interact with this file you close it afterwards so nobody peaks. Encryption would be useless because this code is open-source.
 The private keys will not appear in the UI of the bot.
 If you have wallets that you wish to use for the bot, please add them to this file in the correct format, seperating them with a comma like so:
 `
{   
    "0xaddress1": "privatekey1",
    "0xaddress2": "privatekey2",
    "0xaddress3": "privatekey3"
}
 `

 **List all available wallets** lists all the wallets that are saved in the `ùser_wallets.json` file.

 **Task loop** is where you will be able to run your bot. You have 3 options:
  - Load the default task loop: When you click this, a prompt will state the default loop and ask you to confirm it.
  - Load a custom tak loop: a list of loops the user has created will appear here. If there are none, it will show none. You will have the option to delete your loops here as well.
  - Create a custom loop: here you will be able to queue up tasks to form a custom loop. You will be able to queue as many as you wish, with the option to remove the last task from the queue, and confirm the loop to save it to the file `custom_loops.json`