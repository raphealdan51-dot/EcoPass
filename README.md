# 🌍 EcoPass: Sustainable Travel Offset Network

Welcome to EcoPass, a Web3 platform on the Stacks blockchain that empowers travelers to offset their carbon emissions in real-time while earning tradable NFT passes for exclusive eco-friendly experiences. Say goodbye to opaque carbon credits and hello to transparent, blockchain-verified sustainable travel!

## ✨ Features

🌿 **Calculate & Offset Emissions**: Automatically compute trip carbon footprint and offset via verified green projects  
🔗 **Mint NFT Passes**: Receive tradable NFTs representing your offset achievements, unlocking perks like priority bookings or discounts  
📊 **Transparent Verification**: Immutable proofs for all offsets, preventing greenwashing  
🔄 **Trade & Marketplace**: Buy/sell NFT passes on a decentralized exchange for experiences or credits  
🏆 **Reward System**: Earn points for sustainable choices, redeemable for real-world rewards  
🛡️ **Secure Registry**: Prevent duplicate claims with unique trip hashes  
📈 **Analytics Dashboard**: Track personal impact and global offset stats  
🤝 **Partnership Integration**: Connect with airlines/hotels for seamless on-chain offsets

## 🛠 How It Works

**For Travelers**

- Input trip details (e.g., flight route, hotel stay) to generate a carbon estimate via integrated oracle  
- Call `offset-trip` with your trip hash, estimated emissions, and payment in STX/sSTX  
- Mint an NFT pass via `mint-eco-pass` – now you have proof of offset and access to exclusives!  
- Trade your pass on the marketplace for upgrades or sell to others  

**For Verifiers & Providers**

- Eco-projects register via `register-project` with verification proofs  
- Travelers verify offsets using `check-offset-status`  
- Experience providers claim NFTs for redemption via `redeem-pass`  
