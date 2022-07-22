const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig }= require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe ("Raffle Staging Tests", function (){
    let raffle, raffleEntranceFee, deployer

    beforeEach(async function (){
        deployer= (await getNamedAccounts()).deployer
        raffle= await ethers.getContract("Raffle", deployer)
        raffleEntranceFee= await raffle.getEntranceFee()
    })

    describe("fulfillRandomWords", function(){
        it("works with live chainlink keepers and chainlink vrf, we get a random winner", async function(){
            console.log("Setting up test...")
            const startingTimeStamp= await raffle.getLatestTimeStamp()
            const accounts = await ethers.getSigners()

            console.log("Setting up Listener...")
            await new Promise( async (resolve, reject)=>{
                raffle.once("winnerPicked", async() =>{
                    console.log("WinnerPicked event fired!")
                    try{
                        const recentWinner= await raffle.getRecentWinner()
                        const raffleState= await raffle.getRaffleState()
                        const winnerEndingBalance= await accounts[0].getBalance()
                        const endingTimeStamp= await raffle.getLatestTimeStamp()

                        await expect (raffle.getPlayer(0)).to.be.reverted
                        assert.equal(recentWinner.toString(), accounts[0].address)
                        assert.equal(raffleState, 0)
                        assert.equal(
                            winnerEndingBalance.toString(),
                            winnerStartingBalance.add(raffleEntranceFee).toString()
                        )
                        assert(endingTimeStamp> startingTimeStamp)
                        resolve()
                    }
                    catch(error){
                        console.log(error)
                        reject(e)
                    }
                })
                console.log("Entering Raffle...")
                await raffle.enterRaffle({value: raffleEntranceFee})
                console.log("Ok, time to wait...")
                const winnerStartingBalance= await accounts[0].getBalance()
            })
        })
    })
})