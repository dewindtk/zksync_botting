import zksync from "zksync-web3";
import ethers, { BigNumber } from "ethers";
import fs from "fs";
import inquirer from 'inquirer'
import fetch from "node-fetch";
import axios from"axios"
axios.default

const axiosConfig = {headers: {Authorization: "5a203b2d-ce61-4444-b4ff-c5e1838e6cb8"}};
const zkSyncProvider = new zksync.Provider("https://mainnet.era.zksync.io");
const ethProvider = new ethers.providers.JsonRpcProvider("https://eth-mainnet.g.alchemy.com/v2/3whcw0AqSjmu1MWl7GCV2sS1hwkbp9yq");
const arbProvider = new ethers.providers.JsonRpcProvider("https://arb-mainnet.g.alchemy.com/v2/JfI5EuiX5GKnIkdrJJvsfnd-_rP4Q3to");
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"


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
        case"s_swap_ETH_USDC":
            return ("SyncSwap " + task["s_swap_ETH_USDC"] + " ETH to USDC")
        case"s_swap_USDC_ETH":
            return ("SyncSwap " + (task["s_swap_USDC_ETH"]!=-1? task["s_swap_USDC_ETH"]:"all") + " USDC to ETH")
        case"s_swap_ETH_BUSD":
            return ("SyncSwap " + task["s_swap_ETH_BUSD"] + " ETH to bUSD")
        case"s_swap_BUSDC_ETH":
            return ("SyncSwap " + (task["s_swap_BUSDC_ETH"]!=-1? task["s_swap_BUSDC_ETH"]:"all") + " bUSD to ETH")
        case"s_swap_USDC_BUSD":
            return ("SyncSwap " + (task["s_swap_USDC_BUSD"]!=-1? task["s_swap_USDC_BUSD"]:"all") + " USDC to bUSD")
        case"s_swap_BUSD_USDC":
            return ("SyncSwap " + (task["s_swap_BUSD_USDC"]!=-1? task["s_swap_BUSD_USDC"]:"all") + " bUSD to USDC")
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
            message: '\n\n  ********************************************************\n *********************** Welcome! *************************\n  ********************************************************\n\n ------- Chose your action -------',
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

    const bUSD = "0x2039bb4116b4efc145ec4f0e2ea75012d6c0f181"
    const wETH = "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91"
    const USDC = "0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4"

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
        case "s_swap_ETH_USDC":
            console.log(" --- Attempting SyncSwap from ETH to USDC of amount: ",task["s_swap_ETH_USDC"]==-1?"all":task["s_swap_ETH_USDC"]," ETH on wallet: ", wallet_unconnected.address, " --- ")
            await sync_swap(wallet_unconnected, wETH, USDC, task["s_swap_ETH_USDC"], 2)
            break;
        case "s_swap_USDC_ETH":
            console.log(" --- Attempting SyncSwap from USDC to ETH of amount: ",task["s_swap_USDC_ETH"]==-1?"all":task["s_swap_USDC_ETH"]," USDC on wallet: ", wallet_unconnected.address, " --- ")
            await sync_swap(wallet_unconnected, USDC, wETH, task["s_swap_USDC_ETH"], 2)
            break;
        case "s_swap_ETH_BUSD":
            console.log(" --- Attempting SyncSwap from ETH to bUSD of amount: ",task["s_swap_ETH_BUSD"]==-1?"all":task["s_swap_ETH_BUSD"]," ETH on wallet: ", wallet_unconnected.address, " --- ")
            await sync_swap(wallet_unconnected, wETH, bUSD, task["s_swap_ETH_BUSD"], 2)
            break;
        case "s_swap_BUSDC_ETH":
            console.log(" --- Attempting SyncSwap from bUSD to ETH of amount: ",task["s_swap_BUSDC_ETH"]==-1?"all":task["s_swap_BUSDC_ETH"]," bUSD on wallet: ", wallet_unconnected.address, " --- ")
            await sync_swap(wallet_unconnected, bUSD, wETH, task["s_swap_BUSDC_ETH"], 2)
            break;
        case "s_swap_USDC_BUSD":
            console.log(" --- Attempting SyncSwap from USDC to bUSD of amount: ",task["s_swap_USDC_BUSD"]==-1?"all":task["s_swap_USDC_BUSD"]," USDC on wallet: ", wallet_unconnected.address, " --- ")
            await sync_swap(wallet_unconnected, USDC, bUSD, task["s_swap_USDC_BUSD"], 2)
            break;
        case "s_swap_BUSD_USDC":
            console.log(" --- Attempting SyncSwap from bUSD to USDC of amount: ",task["s_swap_BUSD_USDC"]==-1?"all":task["s_swap_BUSD_USDC"]," bUSD on wallet: ", wallet_unconnected.address, " --- ")
            await sync_swap(wallet_unconnected, bUSD, USDC, task["s_swap_BUSD_USDC"], 2)
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
    const ORBITER_ETH_ADDRESS = "0x80c67432656d59144ceff962e8faf8926599bcf8"
    const ORBITER_ERA_NETWORK_ID = "9014"
    let balance_enough = false;
    let tx
    while(!balance_enough){

        let blocknativeGas = await axios.get("https://api.blocknative.com/gasprices/blockprices?confidenceLevels=90&unit=wei",axiosConfig);
        let blockNativeGasData = blocknativeGas.data.blockPrices[0].estimatedPrices[0];
        tx = {
            from: eth_wallet.address,
            to: ORBITER_ETH_ADDRESS,
            value: null,
            nonce: await ethProvider.getTransactionCount(eth_wallet.address, "latest"),
            gasLimit: "21000",
            maxFeePerGas: ethers.utils.parseUnits(Math.ceil(blockNativeGasData.maxFeePerGas).toString(), "gwei"),
            maxPriorityFeePerGas: ethers.utils.parseUnits(Math.ceil(blockNativeGasData.maxPriorityFeePerGas).toString(), "gwei"),
        }
        let txcost_wei = BigNumber.from(tx.gasLimit).mul(BigNumber.from(tx.maxFeePerGas).add(BigNumber.from(tx.maxPriorityFeePerGas)))
        let balance = await ethProvider.getBalance(eth_wallet.address)

        if (value == -1){
            tx.value =  round_down_up_fromback(balance.sub(txcost_wei)).add(ORBITER_ERA_NETWORK_ID); //May have rounding eerror stuffs here...check again
        }
        else {
            tx.value = ethers.utils.parseEther(value).add(ORBITER_ERA_NETWORK_ID)
            balance_enough = balance.gte(txcost_wei.add(tx.value))
            if (!balance_enough) {
                console.log(" - Not enough Balance on wallet ",eth_wallet.address," to send transaction for ETH to ERA bridge, waiting 5 seconds... - ")
                await delay(5000);
            }
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

        if (value == -1){
            value =  round_down_up_fromback(zk_balance.sub(BigNumber.from(gas_estimate))).add(ORBITER_ETH_NETWORK_ID); //May have rounding eerror stuffs here...check again
            balance_enough = 1
        }
        else{
            value = ethers.utils.parseEther(value.toString()).add(ORBITER_ETH_NETWORK_ID)
            let needed = BigNumber.from(gas_estimate).mul(zk_gas).add(value)
            balance_enough = zk_balance.gte(needed)
            if (!balance_enough) {
                console.log(" - Not enough Balance on wallet ",era_wallet.address," to send transaction for ERA to ETH bridge, waiting 5 seconds... - ")
                await delay(5000);
            }
        }        
    }

    const tx_transfer = await era_wallet.transfer({
        to: ORBITER_ERA_ADDRESS,
        token: zksync.utils.ETH_ADDRESS,
        amount: value,
    });
    console.log(" - Tx submitted for bridge ERA to ETH on wallet: ", era_wallet.address, ", hash (ERA)" , tx_transfer.hash, " - ")
    let receipt = await tx_transfer.wait()
    if (receipt.status){
        console.log(" - Tx included for bridge ERA to ETH on wallet: ",era_wallet.address, " - ")
    }
    else{
        console.log(" - Tx inclusion failed for bridge ERA to ETH on wallet: ",era_wallet.address, " - ")
    }
}


async function sync_swap(wallet_unconnected, token_in, token_out, amount_in, slippage) {
    let era_wallet = new zksync.Wallet(wallet_unconnected.privateKey).connect(zkSyncProvider)
    const classicPoolFactoryAddress = "0xf2DAd89f2788a8CD54625C60b55cD3d2D0ACa7Cb"
    const routerAddress = "0x2da10A1e27bF85cEdD8FFb1AbBe97e53391C0295"
    const wETH = "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91"

    const decimals_abi = ["function decimals() public view returns (uint8)", "function approve(address spender, uint256 value) public returns (bool)", "function balanceOf(address who) public view returns (uint256)"]
    const token_in_contract = new ethers.Contract(token_in, decimals_abi, zkSyncProvider)
    const token_in_decimals = await token_in_contract.decimals()

    let value;
    const era_gasPrice = await zkSyncProvider.getGasPrice()
    //Implement -1
    if (amount_in == -1){
        if (token_in == wETH){
            let eth_bal = await era_wallet.getBalance()
            value = eth_bal.sub(BigNumber.from("4300000").mul(era_gasPrice))
        }
        else{
            let token_bal = await token_in_contract.balanceOf(wallet_unconnected.address)
            value = token_bal
        }
    }
    else{
        value = ethers.utils.parseUnits(amount_in, token_in_decimals);
    }

    let classicPoolFactoryAbi_json = await fetch("https://gist.githubusercontent.com/0xnakato/13e8393c09ea842912f5f2e5995e9770/raw/7d4edfa0a29de02f7b84d4fb79f1e6125ed0e7cc/SyncSwapClassicPoolFactory.json")
    const classicPoolFactoryAbi = await classicPoolFactoryAbi_json.json()
    let poolAbi_json = await fetch("https://gist.githubusercontent.com/0xnakato/56cea29869fafb72d3c5e18c8160073d/raw/cfb62de530c2eaf822d6ebeb9518f20cbcde417b/SyncSwapClassicPool.json")
    const poolAbi = await poolAbi_json.json()
    let routerAbi_json = await fetch("https://gist.githubusercontent.com/0xnakato/80ca6221ef258b7b27bf309c8a3eeff2/raw/50b1b27d5a5741a37667d35e62b7f9bccd0c5847/SyncSwapRouter.json")
    const routerAbi = await routerAbi_json.json()
    //POTENTIALLY ANOTHER POOL ABI FOR STABLE: https://syncswap.gitbook.io/api-documentation/resources/abis

    const classicPoolFactory = new ethers.Contract(
        classicPoolFactoryAddress,
        classicPoolFactoryAbi,
        zkSyncProvider
    );

    const poolAddress = await classicPoolFactory.getPool(token_in, token_out);
    // Checks whether the pool exists.
    if (poolAddress === ZERO_ADDRESS) {
        throw Error('Pool does not exist.');
    }
    const pool = new ethers.Contract(poolAddress, poolAbi, zkSyncProvider);

    const amount_Out = await pool.getAmountOut(token_in, value, era_wallet.address)
    const withdrawMode = 1;
    const swapData = ethers.utils.defaultAbiCoder.encode(
        ["address", "address", "uint8"],
        [token_in, era_wallet.address, withdrawMode], // tokenIn, to, withdraw mode
    );
    const steps = [{
        pool: poolAddress,
        data: swapData,
        callback: ZERO_ADDRESS, // we don't have a callback
        callbackData: '0x',
    }];

    // If we want to use the native ETH as the input token,
    // the `tokenIn` on path should be replaced with the zero address.
    // Note: however we still have to encode the wETH address to pool's swap data.

    const paths = [{
        steps: steps,
        // tokenIn: token_in,
        tokenIn: (token_in=="0x5aea5775959fbc2557cc8789bc1bf90a239d9a91")? ZERO_ADDRESS:token_in, //Anomaly
        amountIn: value,
    }];

    const router = new ethers.Contract(routerAddress, routerAbi, zkSyncProvider);

    // Note: checks approval for ERC20 tokens.
    // The router will handle the deposit to the pool's vault account.


    //Approve, gas Limit 1000000

    if (token_in != wETH){
        const approval = await token_in_contract.connect(era_wallet).approve(routerAddress, value)
        console.log("Token Approval tx submitted for swap on wallet ",wallet_unconnected.address, ", hash: ", approval.hash)
        await approval.wait()
        console.log("Token Approval on wallet ", wallet_unconnected.address, " complete")
    }
    

    const response = await router.connect(era_wallet).swap(
        paths, // paths
        amount_Out.mul(BigNumber.from("100").sub(BigNumber.from(slippage)).div(BigNumber.from("100"))), // amountOutMin // Note: ensures slippage here
        BigNumber.from(Math.floor(Date.now() / 1000)).add(1800), // deadline // 30 minutes
        {
            // value: (token_in==ZERO_ADDRESS)?value:BigNumber.from(0), //Anomaly
            value: (token_in==wETH)?value:BigNumber.from(0),
            gasLimit: BigNumber.from("4300000"),
            gasPrice: era_gasPrice,
        },
    );

    console.log("Swap submitted from on wallet ",wallet_unconnected.address,", hash: ", response.hash)
    const wait = await response.wait();
    console.log("Swap on wallet ",wallet_unconnected.address," included")     
}

//WARN ARB BRIDIGN
// async function bridge_orbiter_ERA_to_ARB(era_wallet, value){// add 0.0013


//     const ORBITER_ERA_ADDRESS = "0xE4eDb277e41dc89aB076a1F049f4a3EfA700bCE8"
//     const ORBITER_ARB_NETWORK_ID = "9002"

//     const tx_transfer = await era_wallet.transfer({
//         to: ORBITER_ERA_ADDRESS,
//         token: zksync.utils.ETH_ADDRESS,
//         amount: ethers.utils.parseEther(value).add(ORBITER_ARB_NETWORK_ID),
//     });
//     console.log("tx submitted, hash (ERA): ", tx_transfer.hash)
//     let receipt = await tx_transfer.wait()
//     console.log(receipt.status? "tx included":"tx inclusion failed")
// }

// async function bridge_orbiter_ARB_to_ETH(arb_wallet, value){

//     const ORBITER_ARB_ADDRESS = "0xE4eDb277e41dc89aB076a1F049f4a3EfA700bCE8"
//     const ORBITER_ETH_NETWORK_ID = "9001"
    
//     const tx = {
//         from: arb_wallet.address,
//         to: ORBITER_ARB_ADDRESS,
//         value: ethers.utils.parseEther(value).add(ORBITER_ETH_NETWORK_ID),
//         nonce: await arbProvider.getTransactionCount(arb_wallet.address, "latest"),
//         maxFeePerGas: ethers.utils.parseUnits("0.1", "gwei"),
//         maxPriorityFeePerGas: ethers.utils.parseUnits("0.1", "gwei"),
//     }
//     let gas_limit = await arbProvider.estimateGas()
//     tx.gasLimit = gas_limit.toString()

//     let tx_send = await arb_wallet.sendTransaction(tx)
//     console.log("tx submitted, hash (ARB): ", tx_send.hash)
//     let receipt = await tx_send.wait()
//     console.log(receipt.status? "tx included":"tx inclusion failed")
// }

// async function disperse_ERA(wallet_from, wallets_to_arr, amounts_arr){ //Check if this is L1 or L2

//     if(wallets_to_arr.length != amounts_arr.length){
//         throw new Error("Amounts length does not match wallets length")
//     }

//     for (var i=0;i<amounts_arr.length;i++){
//         const transfer = await wallet_from.transfer({
//             to: wallets_to_arr[i].address,
//             token: zksync.utils.ETH_ADDRESS,
//             amount: ethers.utils.parseEther(amounts_arr[i.toString])
//         })
//         // Await commitment
//         const committedTxReceipt = await transfer.wait();
//         // Await finalization on L1
//         const finalizedTxReceipt = await transfer.waitFinalize();
//     }
// }

function round_down_up_fromback(BN_wei){
    if(BN_wei.toString().length < 5){
        process.exit("Rounding error code terminated hoho you are trying to transfer millionths of a penny pls reconsider?")
    }
    return (BN_wei.div(10000).sub(1).mul(10000))
}


const delay = ms => new Promise(res => setTimeout(res, ms));


main()