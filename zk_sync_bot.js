import zksync from "zksync-web3";
import ethers, { BigNumber } from "ethers";
import fs from "fs";
import inquirer from 'inquirer'

import axios from"axios"
axios.default
const axiosConfig = {
    headers: {Authorization: "5a203b2d-ce61-4444-b4ff-c5e1838e6cb8"}
};
const zkSyncProvider = new zksync.Provider("https://mainnet.era.zksync.io");
const ethProvider = new ethers.providers.JsonRpcProvider("https://eth-mainnet.g.alchemy.com/v2/3whcw0AqSjmu1MWl7GCV2sS1hwkbp9yq");
const arbProvider = new ethers.providers.JsonRpcProvider("https://arb-mainnet.g.alchemy.com/v2/JfI5EuiX5GKnIkdrJJvsfnd-_rP4Q3to");

async function main(){

    let user_wallets = await fs.promises.readFile('user_wallets.json', { encoding: 'utf8' })
    user_wallets = JSON.parse(user_wallets)

    const action_list_main = ['Task loop', 'Create new Wallets', 'List all available Wallets', 'Check current ERA gas price']
    const options = ['Load default loop', 'Load custom loop', 'Create custom loop']
    
    while(1){
        const _default_loop = await fs.promises.readFile('default_loop.json', { encoding: 'utf8' })
        const default_loop = JSON.parse(_default_loop)
        const _custom_loops = await fs.promises.readFile('custom_loops.json', { encoding: 'utf8' })
        const custom_loops = JSON.parse(_custom_loops)
        const _tasks = await fs.promises.readFile('tasks.json', { encoding: 'utf8' })
        const tasks = JSON.parse(_tasks)

        let action = await inq_1_action(action_list_main)
    
        switch (action){
            case 'List all available Wallets':
                console.log(Object.keys(user_wallets))
                break;

            case 'Create new Wallets':
                let wallet_count_tocreate = "ff"
                while(isNaN(wallet_count_tocreate)){
                    wallet_count_tocreate = await inq_2_wallet_count()
                    if (isNaN(wallet_count_tocreate)) {console.log("Please input a valid number\n")}
                }
                for (var i=0;i<wallet_count_tocreate;i++){
                    let temp_wallet = ethers.Wallet.createRandom([{extraEntropy: "721"}])
                    user_wallets[temp_wallet.address] = temp_wallet.privateKey
                }
                await fs.promises.writeFile(`user_wallets.json`, JSON.stringify(user_wallets, null, 2))
                console.log("\nWallets created and saved\n")
                break;
            
            case 'Check current ERA gas price':
                let era_gas_price = await zkSyncProvider.getGasPrice()
                era_gas_price = ethers.utils.formatUnits(era_gas_price, "gwei")
                console.log("\n --- Gas price on ERA is now ", era_gas_price, "gwei. --- \n")
                break;

            //Task loop
            case 'Task loop': 
                //Ask: Load default loop, Load custom loop, Create custom loop
                let option = await inq_2_task_option(options)
                let exit = 0
                while(!exit){
                    switch (option){
                        case 'Load default loop':
                            let confirm = await inq_3_confirm_loop(default_loop)
                            if (!confirm) {exit=1; console.log("Proposition declined"); break;}
                            else {
                                let wallets_unconnected = await inq_3_chose_wallets(user_wallets)
                                await task_orchestrator(default_loop, wallets_unconnected);// TODOTODOTODTOOZ
                                exit = 1;
                                break;
                            }
                        case 'Load custom loop':
                            let chosen_loop = await inq_3_chose_custom_loop(custom_loops)
                            if (chosen_loop == null) {console.log("\nNo custom loops found. Please create one first.\n"); exit=1; break;} //exit to inq_2_task_option
                            else{
                                let confirm2 = await inq_3_confirm_loop(chosen_loop)
                                if (!confirm2) {exit=1; console.log("Proposition declined"); break;}
                                else {
                                    let wallets_unconnected = await inq_3_chose_wallets(user_wallets)
                                    await task_orchestrator(chosen_loop, wallets_unconnected);// TODOTODOTODTOOZ
                                    exit = 1;
                                    break;
                                }
                            }
                        case 'Create custom loop':
                            const custom_loop = await inq_3_create_custom_loop(tasks, custom_loops)
                            let confirm3 = await inq_3_confirm_loop(custom_loop)
                            if (!confirm3) {exit=1; console.log("Proposition declined"); break;}
                            else {
                                let wallets_unconnected = await inq_3_chose_wallets(user_wallets)
                                await task_orchestrator(custom_loop, wallets_unconnected);;// TODOTODOTODTOOZ
                                exit = 1;
                                break;
                            }
                    }
                }
                
        }
    }
}

function task_to_message(task){
    switch (Object.keys(task)[0]){
        case "b_orb_ETH_ERA":
            return ("Bridge " + (task["b_orb_ETH_ERA"]!=-1? task["b_orb_ETH_ERA"]:"all") + " ETH from ETH --> ERA")
        case "b_orb_ERA_ETH":
            return ("Bridge " + (task["b_orb_ERA_ETH"]!=-1? task["b_orb_ERA_ETH"]:"all") + " ETH from ERA --> ETH")
        case "delay_ms":
            return ("Delay " + task["delay_ms"] + " ms")
        case "await_bal_ETH":
            return ("Wait for ETH balance to reach " + task["await_bal_ETH"] + " ETHer")
        case "await_bal_ERA":
            return ("Wait for ERA balance to reach " + task["await_bal_ERA"] + " ETHer")
        default: 
            return "Task undefined"
    }
}

async function inq_3_chose_wallets(user_wallets){
    let q_wallet_choice = await inquirer.prompt([
        {
            type: 'checkbox',
            name: 'a',
            message: '\n ------- Choose the wallets you wish to perform the loops on -------:',
            choices: Object.keys(user_wallets),
            default: [Object.keys(user_wallets)[0]]
    }])
    let Wallet_array_tasks_unconnected = []
    for (let wallet of q_wallet_choice.a){
        let temp = new ethers.Wallet(user_wallets[wallet])
        Wallet_array_tasks_unconnected.push(temp)
    }
    return Wallet_array_tasks_unconnected
}

async function inq_3_create_custom_loop(tasks, loops){
    let exit = 0
    let custom_loop = []
    let choices = tasks.map(x => task_to_message(x))
    choices.push("* Delete previous")
    choices.push("* Confirm loop")
    while(!exit){
        console.log("\nYour custom loop: ", custom_loop.length == 0? "Empty":"")
        for (var obj of custom_loop){
            console.log(" - ", task_to_message(obj))
        }

        
        //question list tasks concatenate 
        let task = await inquirer.prompt([{
            type: 'list',
            name: 'a',
            message: '\n ------- Please chose a task. ------- ',
            choices: choices,
            default: choices[0],
        }])
        switch(task.a){
            case '* Delete previous':
                if(custom_loop.length == 0){break}
                custom_loop.pop()
                break;
            case '* Confirm loop':
                exit = 1
                break;
            default:
                let amount = await inquirer.prompt([{
                    type: 'number',
                    name: 'a',
                    message: ' ------- Please chose an amount. ------- ',
                    default: 0,
                }])
                if (isNaN(amount.a)){console.log("Please input a valid number");break;}

                let task_without_amount = tasks[choices.indexOf(task.a)]
                task_without_amount[Object.keys(task_without_amount)[0]] = amount.a.toString()
                custom_loop.push(task_without_amount)
        }
    }

    //Please name your loop:
    let exit2 = 0
    let custom_name = ""
    while(!exit2){
        let namename = await inquirer.prompt([{
            type: 'input',
            name: 'a',
            message: ' ------- Please name your loop. ------- ',
            default: "",
        }])
        if (Object.keys(loops).includes(namename.a)){
            console.log("This loop name already exists. Please chose another.")
        }
        else{
            exit2 = 1;
            custom_name = namename.a
        }
    }
    loops[custom_name] = custom_loop
    await fs.promises.writeFile(`custom_loops.json`, JSON.stringify(loops, null, 2));
    return custom_loop
}

async function inq_3_chose_custom_loop(loops){
    while(1){
        if (Object.keys(loops).length == 0){
            return null
        }
        let choices = Object.keys(loops)
        if (Object.keys(loops).length != 0) {choices.push("* Delete custom loops")}
        let res = await inquirer.prompt([
            {
                type: 'list',
                name: 'a',
                message: ' ------- Please chose your custom loop. ------- ',
                choices: choices,
                default: choices[0],
            }
        ])
        switch (res.a){
            case "* Delete custom loops":
                let to_delete = await inquirer.prompt([{
                    type: 'checkbox',
                    name: 'a',
                    message: '\n ------- Choose the loops to delete -------:',
                    choices: Object.keys(loops),
                    default: [Object.keys(loops)[0]]
                }])
                for (var to_del of to_delete.a){
                    delete loops[to_del]
                    console.log("Deleted: ", to_del)
                }
                await fs.promises.writeFile(`custom_loops.json`, JSON.stringify(loops, null, 2))
                break;
            default: 
                return loops[res.a]
        }
    }
}

async function inq_3_confirm_loop(loop){
    let message = '\n ------- Please confirm the current task loop: ------- '
    for (let task of loop){
        message += "\n         - " + task_to_message(task)
    }
    let res = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'a',
            message: message,
            default: true
        }
    ])
    return res.a
}

async function inq_2_task_option(options){
    let res = await inquirer.prompt([
        {
            type: 'list',
            name: 'a',
            message: ' ------- Please chose an option. ------- ',
            choices: options,
            default: 'Load default task',
        }
    ])
    return res.a
}
async function inq_2_wallet_count(){
    let res = await inquirer.prompt([
        {
            type: 'number',
            name: 'a',
            message: ' ------- How many wallets do you wish to create? ------- ',
            default: 1
        }
    ])
    return res.a
}
async function inq_1_action(action_list_main){
    let res = await inquirer.prompt([
        {
            type: 'list',
            name: 'a',
            message: '\n\n        *********************** Welcome ser *************************\n\n\n ------- Chose your action -------',
            choices: action_list_main,
            default: 'Task loop',
        }
    ])
    return res.a
}

//loops: array of task Objects, ID and amount  
async function task_orchestrator(loops, wallets_unconnected){
    let promise_arr = []
    for (var wallet_unconnected of wallets_unconnected){
        promise_arr.push(task_queuer(loops, wallet_unconnected))
    }
    await Promise.all(promise_arr)
}

async function task_queuer(loops, wallet_unconnected){
    for (var task of loops){
        await task_switch(wallet_unconnected, task)
    }
}

async function task_switch(wallet_unconnected, task){
    switch(Object.keys(task)[0]){
        case 'b_orb_ETH_ERA':
            console.log(" --- Attemping bridge from ETH to ERA of amount: ", task["b_orb_ETH_ERA"], " on wallet: ", wallet_unconnected.address, " --- ")
            await bridge_orbiter_ETH_to_ERA(wallet_unconnected, task["b_orb_ETH_ERA"])
            break;
        case "b_orb_ERA_ETH":
            console.log(" --- Attemping bridge from ERA to ETH of amount: ", task["b_orb_ERA_ETH"],  " on wallet: ", wallet_unconnected.address, " --- ")
            await bridge_orbiter_ERA_to_ETH(wallet_unconnected, task["b_orb_ERA_ETH"])
            break;
        case "delay_ms":   
            console.log(" --- Waiting ", task["delay_ms"], "milliseconds for wallet ", wallet_unconnected.address,"---")
            await delay(parseInt(task["delay_ms"]))
            break;
        case "await_bal_ETH":
            console.log(" --- Waiting for wallet ", wallet_unconnected.address, " on ETH to reach ", task["await_bal_ETH"], " ETHer")
            await await_bal_ETH(wallet_unconnected, task["await_bal_ETH"])
            break;
        case "await_bal_ERA":
            console.log(" --- Waiting for wallet ", wallet_unconnected.address, " on ERA to reach ", task["await_bal_ERA"], " ETHer")
            await await_bal_ERA(wallet_unconnected, task["await_bal_ERA"])
            break;
        default: 
            console.log(" --- Task undefined, skipping --- ", Object.keys(task)[0])
            break;
    }
}

async function await_bal_ETH(wallet_unconnected, value){
    let eth_wallet = wallet_unconnected.connect(ethProvider)
    let expect_value = ethers.utils.parseEther(value)
    let balance_enough = 0;
    while(!balance_enough){
        let eth_balance = await eth_wallet.getBalance()
        balance_enough = eth_balance.gte(expect_value)
        if (!balance_enough){
            console.log(" - Balance on wallet ", wallet_unconnected.address, " has not reached", value," yet, waiting 5 sec. - ")
            await delay(5000)
        }
    }
    console.log(" - Balance for wallet", wallet_unconnected.address, " of ", value, "ETH on ETH reached. - ")
}

async function await_bal_ERA(wallet_unconnected, value){
    let era_wallet = new zksync.Wallet(wallet_unconnected.privateKey).connect(zkSyncProvider)
    let expect_value = ethers.utils.parseEther(value)
    let balance_enough = 0;
    while(!balance_enough){
        let era_balance = await era_wallet.getBalance()
        balance_enough = era_balance.gte(expect_value)
        if (!balance_enough){
            console.log(" - Balance on wallet ", wallet_unconnected.address, " has not reached", value," yet, waiting 5 sec. - ")
            await delay(5000)
        }
    }
    console.log(" - Balance for wallet", wallet_unconnected.address, " of ", value, "ETH on ERA reached. - ")
}

//Arbitrum: 9002
//Era: 9014
//WARNING: withholder fee.
//MAKE SURE eth_wallet <<-------------------
async function bridge_orbiter_ETH_to_ERA(wallet_unconnected, value){// add 0.0013

    //WALLET UNCONNECTED INCOMING !!!
    const eth_wallet = wallet_unconnected.connect(ethProvider)
    let expected_value_ERA = value-0.003
    // if (value == -1){
        
    // }
    // else {
    //     tx_value = ethers.utils.parseEther(value).add(ORBITER_ERA_NETWORK_ID)
    // }
    

    let balance_enough = false;
    let tx
    while(!balance_enough){
        value = value.toString()
        const ORBITER_ETH_ADDRESS = "0x80c67432656d59144ceff962e8faf8926599bcf8"
        const ORBITER_ERA_NETWORK_ID = "9014"
        let tx_value = ethers.utils.parseEther(value).add(ORBITER_ERA_NETWORK_ID)


        let blocknativeGas = await axios.get("https://api.blocknative.com/gasprices/blockprices?confidenceLevels=90&unit=wei",axiosConfig);
        let blockNativeGasData = blocknativeGas.data.blockPrices[0].estimatedPrices[0];
        tx = {
            from: eth_wallet.address,
            to: ORBITER_ETH_ADDRESS,
            value: tx_value,
            nonce: await ethProvider.getTransactionCount(eth_wallet.address, "latest"),
            gasLimit: "21000",
            maxFeePerGas: ethers.utils.parseUnits(Math.ceil(blockNativeGasData.maxFeePerGas).toString(), "gwei"),
            maxPriorityFeePerGas: ethers.utils.parseUnits(Math.ceil(blockNativeGasData.maxPriorityFeePerGas).toString(), "gwei"),
        }

        let txcost_wei = BigNumber.from(tx.gasLimit).mul(BigNumber.from(tx.maxFeePerGas).add(BigNumber.from(tx.maxPriorityFeePerGas)))
        let balance = await ethProvider.getBalance(eth_wallet.address)
        balance_enough = balance.gte(txcost_wei.add(tx.value))
        if (!balance_enough) {
            console.log(" - Not enough Balance on wallet ",eth_wallet.address," to send transaction for ETH to ERA bridge, waiting 5 seconds... - ")
            await delay(5000);
        }
    }

    let tx_send = await eth_wallet.sendTransaction(tx)
    console.log(" - Tx submitted for bridge ETH to ERA on wallet: ",eth_wallet.address,", hash (ETH): ", tx_send.hash, " - ")
    let receipt = await tx_send.wait()
    console.log(receipt.status? (" - Tx included for bridge ETH to ERA on wallet: ",eth_wallet.address, " - ") : (" - Tx inclusion failed for bridge ETH to ERA on wallet: ",eth_wallet.address, " - "))
}

async function bridge_orbiter_ERA_to_ETH(wallet_unconnected, value){// add 0.0013

    const era_wallet = new zksync.Wallet(wallet_unconnected.privateKey).connect(zkSyncProvider)
    const ORBITER_ERA_ADDRESS = "0xE4eDb277e41dc89aB076a1F049f4a3EfA700bCE8"
    const ORBITER_ETH_NETWORK_ID = "9001"

    let balance_enough = false;
    while(!balance_enough){
        let zk_gas = await zkSyncProvider.getGasPrice()
        let zk_balance = await era_wallet.getBalance()
        let gas_estimate = await zkSyncProvider.estimateGas({
            from: era_wallet.address,
            to: ORBITER_ERA_ADDRESS,
        })
        let needed = BigNumber.from(gas_estimate).mul(zk_gas).add(ethers.utils.parseEther(value.toString()).add(ORBITER_ETH_NETWORK_ID))
        balance_enough = zk_balance.gte(needed)
        if (!balance_enough) {
            console.log(" - Not enough Balance on wallet ",era_wallet.address," to send transaction for ERA to ETH bridge, waiting 5 seconds... - ")
            await delay(5000);
        }
    }

    const tx_transfer = await era_wallet.transfer({
        to: ORBITER_ERA_ADDRESS,
        token: zksync.utils.ETH_ADDRESS,
        amount: ethers.utils.parseEther(value).add(ORBITER_ETH_NETWORK_ID),
    });
    console.log(" - Tx submitted for bridge ERA to ETH on wallet: ", era_wallet.address, ", hash (ERA)" , tx_transfer.hash, " - ")
    let receipt = await tx_transfer.wait()
    console.log(receipt.status? (" - Tx included for bridge ERA to ETH on wallet: ",era_wallet.address, " - ") : (" - Tx inclusion failed for bridge ERA to ETH on wallet: ",era_wallet.address, " - "))
}


//WARN ARB BRIDIGN
async function bridge_orbiter_ERA_to_ARB(era_wallet, value){// add 0.0013


    const ORBITER_ERA_ADDRESS = "0xE4eDb277e41dc89aB076a1F049f4a3EfA700bCE8"
    const ORBITER_ARB_NETWORK_ID = "9002"

    const tx_transfer = await era_wallet.transfer({
        to: ORBITER_ERA_ADDRESS,
        token: zksync.utils.ETH_ADDRESS,
        amount: ethers.utils.parseEther(value).add(ORBITER_ARB_NETWORK_ID),
    });
    console.log("tx submitted, hash (ERA): ", tx_transfer.hash)
    let receipt = await tx_transfer.wait()
    console.log(receipt.status? "tx included":"tx inclusion failed")
}

async function bridge_orbiter_ARB_to_ETH(arb_wallet, value){

    const ORBITER_ARB_ADDRESS = "0xE4eDb277e41dc89aB076a1F049f4a3EfA700bCE8"
    const ORBITER_ETH_NETWORK_ID = "9001"
    
    const tx = {
        from: arb_wallet.address,
        to: ORBITER_ARB_ADDRESS,
        value: ethers.utils.parseEther(value).add(ORBITER_ETH_NETWORK_ID),
        nonce: await arbProvider.getTransactionCount(arb_wallet.address, "latest"),
        maxFeePerGas: ethers.utils.parseUnits("0.1", "gwei"),
        maxPriorityFeePerGas: ethers.utils.parseUnits("0.1", "gwei"),
    }
    let gas_limit = await arbProvider.estimateGas()
    tx.gasLimit = gas_limit.toString()

    let tx_send = await arb_wallet.sendTransaction(tx)
    console.log("tx submitted, hash (ARB): ", tx_send.hash)
    let receipt = await tx_send.wait()
    console.log(receipt.status? "tx included":"tx inclusion failed")
}

async function disperse_ERA(wallet_from, wallets_to_arr, amounts_arr){ //Check if this is L1 or L2

    if(wallets_to_arr.length != amounts_arr.length){
        throw new Error("Amounts length does not match wallets length")
    }

    for (var i=0;i<amounts_arr.length;i++){
        const transfer = await wallet_from.transfer({
            to: wallets_to_arr[i].address,
            token: zksync.utils.ETH_ADDRESS,
            amount: ethers.utils.parseEther(amounts_arr[i.toString])
        })
        // Await commitment
        const committedTxReceipt = await transfer.wait();
        // Await finalization on L1
        const finalizedTxReceipt = await transfer.waitFinalize();
    }
}


const delay = ms => new Promise(res => setTimeout(res, ms));


main()