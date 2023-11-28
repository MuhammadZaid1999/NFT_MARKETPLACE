const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Marketplace", function () {

  let acc1, acc2;
  let marketplaceAddress;
  let nftAddress;
  let nft;
  let nftMarketplace;
  let listPrice = ethers.utils.parseEther("0.01", "ether");

  before(async function () {
    [acc1, acc2] = await ethers.getSigners();
    
    const Marketplace = await ethers.getContractFactory("Marketplace");
    nftMarketplace = await Marketplace.deploy();
    marketplaceAddress = nftMarketplace.address;

    const NFT = await ethers.getContractFactory("NFT");
    nft = await NFT.deploy();
    nftAddress = nft.address;
  });

  it("Should Mint NFT", async function () {
    await nft.safeMint(acc1.address, "aaaaaaaaaaaaaa");
  });

  it("Should list an NFT onto the marketplace", async function () {
    await nft.approve(marketplaceAddress, 1);
    await nftMarketplace.createListing(1, nftAddress, listPrice); //0.01 ETH
  });

  it("Should sell an active NFT listed on the marketplace ", async function () {
   
    await expect(
      await nftMarketplace
        .connect(acc2)
        .buyListing(1, nftAddress, { value: listPrice })
    ).not.to.be.reverted;

    item = await nftMarketplace.getMarketItem(1);
    expect(item.owner).to.equal(acc2.address);
  });

  it("Test a market sale that does not send sufficient funds", async function () {
    await nft.safeMint(acc1.address, "bbbbbbbbbbbbb");
    await nft.approve(marketplaceAddress, 2);
    await nftMarketplace.createListing(2, nftAddress, listPrice);

    await expect(
      nftMarketplace.connect(acc2).buyListing(2, nftAddress, { value:  ethers.utils.parseEther("0.02", "ether")})
    ).to.be.revertedWith(
      "Value sent does not meet list price for NFT"
    );

    item = await nftMarketplace.getMarketItem(2);
    expect(item.owner).to.equal("0x0000000000000000000000000000000000000000");
  });
});
