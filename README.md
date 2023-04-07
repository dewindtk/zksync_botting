# zksync_botting
Zksync botting utility for MVHQ fam


***DISCLAIMER: Do not use your main wallets for botting.*** The private keys of user wallets are stored in a txt file, unencrypted. It is generally absolutely not recommended to store private keys like this unencrypted, on a hardware. I will look into encryption of these in the near future. In the meantime, *** PLEASE Do not use your main wallets for botting. ***

### How to install dependencies:
 - Install nodejs from [here](https://nodejs.org/en) if you have not already. This is the runtime enviroment which will allow you to run javascript from the terminal.

### How to download the code and set up the enviroment:
 - Simply click on the green **Code** on the top right of this page, extract the Folder and put it wherever you like (Desktop is fine)
 - Open cmd or Powershell and navigate INTO the extracted folder with the command: `cd ... `. Example: `cd Desktop`, then `cd zksync_botting`. Everything you do below is folder specific, if you would like to start over, Simply delete the folder and start over.
 - IN THE FOLDER WITH ALL THE SCRIPTS, Initialise NodeJS with the command: `npm init`. Press enter a few times to accept the default config.
 - Install all libraries with the command `npm i`

### How to run the bot
 - Type in the command: `node zk_sync_bot.js`. You can auto-complete the name of the bot by typing in the first few letters and hitting `tab`

# How the bot works
*First and foremost, you can stop the bot by simply closing the window or pressing ctr+c at all times. It will inturrupt any tasks and stop sending new txs. Also, you can clear adn clean the terminal with the command `cls`.*

When you start the bot, you will have 3 options:
 - Task loop
 - Create new wallets
 - List all available wallets
 - Check current ERA gas price

*Check current ERA gas price* return the current gas price (base fee, prio is the same) per computational Unit of the network.

 *Create new wallets* is intuitive. You can specify a number of new wallets you wish to create and their randomly generated private keys will be stored in `user_wallets.json` in the format: {"wallet_address": "private key"}. **These will not be encrypted** so make sure when you interact with this file you close it afterwards so nobody peaks. However, storing private keys like this on a device unencrypted is generally not recommended. So please ***Do not use your main wallets for botting.***
 The private keys will not appear in the UI of the bot.
 If you have wallets that you wish to use for the bot, please add them to this file in the correct format, seperating them with a comma like so:
 ```
{   
    "0xaddress1": "privatekey1",
    "0xaddress2": "privatekey2",
    "0xaddress3": "privatekey3"
}
 ```

 *List all available wallets* lists all the wallets that are saved in the `user_wallets.json` file.

 *Task loop* is where you will be able to run your bot. You have 3 options:
  - Load the default task loop: When you click this, a prompt will state the default loop and ask you to confirm it.
  - Load a custom task loop: a list of loops the user has created will appear here. If there are none, it will show none. You will have the option to delete your loops here as well.
  - Create a custom loop: here you will be able to queue up tasks to form a custom loop. You will be able to queue as many as you wish, with the option to remove the last task from the queue, and confirm the loop to save it to the file `custom_loops.json`

  ***Currently supported tasks***
  - Bridge x ETH from ETH to ERA
  - Bridge x ETH from ERA to ETH
  - Wait until an ETH balance on ETH reaches x
  - Wait until an ETH balance on ERA reaches x
  - Wait x milliseconds

  Then, a prompt will ask you on which wallet you wish to perform the loop on. You can select multiple, they will be run in parallel.

  You may open several instanes of the bot in multiple terminals to run different loops on different wallets.

  Happy botting, please report any bugs immediately to kaikun26 xD and any feature requests will be added asap