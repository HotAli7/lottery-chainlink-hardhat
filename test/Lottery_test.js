
const { expect } = require("chai")
const { expectRevert } = require('@openzeppelin/test-helpers')

describe("Lottery Contract", function () {
    let hardhatGovernance;
    let hardhatRandomness;
    let hardhatLottery;
    let owner;
    let addr1;
    let addr2;
    let addrs;
    let _governance;

  let randomNumberConsumer, vrfCoordinatorMock, seed, link, keyhash, fee
  beforeEach(async () => {
    const MockLink = await ethers.getContractFactory("MockLink")
    const VRFCoordinatorMock = await ethers.getContractFactory("VRFCoordinatorMock")
    const Lottery = await ethers.getContractFactory("Lottery");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners(100);

    keyhash = '0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4'
    fee = '1000000000000000000'
    tokenAddress = '0xe1be5d3f34e89de342ee97e6e90d405884da6c67';
    feeWalletAddress = '0x4B64f9FEA9aCB68245b990F0A818F5b0D4AF353F'
    link = await MockLink.deploy()
    vrfCoordinatorMock = await VRFCoordinatorMock.deploy(link.address)    
    hardhatLottery = await Lottery.deploy(vrfCoordinatorMock.address, link.address, keyhash, fee);
    
    await hardhatLottery.setToken(link.address)
    await hardhatLottery.setFeeWallet(feeWalletAddress)
  })
  it("Start New Lottery", async () => {
    //Before we can do an API request, we need to fund it with LINK
    // await hre.run("fund-link", { contract: randomNumberConsumer.address, linkAddress: link.address })
    await link.transfer(hardhatLottery.address, '5000000000000000000')
    let startTransaction = await hardhatLottery.start_new_lottery()
    for (let i = 0; i < addrs.length; i++) {
      console.log(addrs[i].address)
      const r1 = parseInt(Math.random() * 100000) % 26
      const r2 = parseInt(Math.random() * 100000) % 26
      const r3 = parseInt(Math.random() * 100000) % 26
      console.log("Entered random number: ", r1, r2, r3);
      await link.transfer(addrs[i].address, '5000000000000000000')
      await link.connect(addrs[i]).approve(feeWalletAddress, '5000000000000000000')
      await link.connect(addrs[i]).approve(hardhatLottery.address, '5000000000000000000')
      let enterTransaction = await hardhatLottery.connect(addrs[i]).enter(r1, r2, r3)
      
    
    let balance = await hardhatLottery.balance()  
    console.log("Remain Balance: ", parseInt(balance))
    }

    const players = await hardhatLottery.get_players();
    console.log("Entered Players: ", players)
    
    let endTransaction = await hardhatLottery.end_lottery()
    let pickWinnerTransaction = await hardhatLottery.pickWinner()

    await link.transfer(hardhatLottery.address, '5000000000000000000')
    let transaction = await hardhatLottery.getRandomNumber(321)
    let tx_receipt = await transaction.wait()
    let requestId = tx_receipt.events[2].topics[0]
    //Test the result of the random number request

    let randomNumber1 = parseInt(Math.random() * 100000)
    let randomNumber2 = parseInt(Math.random() * 100000)
    let randomNumber3 = parseInt(Math.random() * 100000)

    await vrfCoordinatorMock.callBackWithRandomness(requestId, randomNumber1.toString(), hardhatLottery.address)
    await vrfCoordinatorMock.callBackWithRandomness(requestId, randomNumber2.toString(), hardhatLottery.address)
    await vrfCoordinatorMock.callBackWithRandomness(requestId, randomNumber3.toString(), hardhatLottery.address)

    let winnerNumber1 = await hardhatLottery.winnerNumber1()
    let winnerNumber2 = await hardhatLottery.winnerNumber2()
    let winnerNumber3 = await hardhatLottery.winnerNumber3()  

    let randomNumberId = await hardhatLottery.randomNumberId()
    console.log("Random Number Id: ", parseInt(randomNumberId, 16))
    console.log("Winner Number1: ", parseInt(winnerNumber1), randomNumber1)
    expect(winnerNumber1).to.equal(randomNumber1 % 26)
    console.log("Winner Number2: ", parseInt(winnerNumber2), randomNumber2)
    expect(winnerNumber2).to.equal(randomNumber2 % 26)
    console.log("Winner Number3: ", parseInt(winnerNumber3), randomNumber3)
    expect(winnerNumber3).to.equal(randomNumber3 % 26)
    
    let winnerType = await hardhatLottery.winnerType()  
    console.log("Winner Type: ", winnerType)
    
    let balance = await hardhatLottery.balance()  
    console.log("Remain Balance: ", parseInt(balance))
    
    let winner = await hardhatLottery.winner()  
    console.log("Contract addresses: ", hardhatLottery.address, vrfCoordinatorMock.address, link.address)
  })
})
