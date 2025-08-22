# 🔄 Blockchain-based Second-Hand Goods Tracker

Welcome to a revolutionary platform for tracking and verifying second-hand goods on the blockchain! This project addresses real-world issues in the resale market, such as counterfeit products, unclear provenance, unverified item conditions, and fraudulent transactions. By leveraging the Stacks blockchain and Clarity smart contracts, users can securely register goods, track ownership history, verify conditions through certified inspectors, and facilitate trustless resales—reducing fraud and building trust in markets like electronics, fashion, vehicles, and collectibles.

## ✨ Features

📦 Register items with origin details and unique identifiers  
🔍 Immutable tracking of ownership transfers and history  
✅ Condition verification by certified inspectors with timestamped reports  
💰 Secure marketplace for listing and selling verified goods  
🛡️ Escrow system for safe transactions with dispute resolution  
📊 Analytics dashboard for market insights and item valuations  
🚫 Anti-fraud mechanisms to detect duplicates or tampered records  
🔒 User authentication and role-based access (sellers, buyers, inspectors)  

## 🛠 How It Works

This project uses 8 interconnected Clarity smart contracts to create a decentralized ecosystem. Each contract handles a specific aspect of the workflow, ensuring modularity, security, and scalability on the Stacks blockchain.

### Key Smart Contracts
1. **UserRegistry.clar**: Manages user registration, roles (e.g., seller, buyer, inspector), and authentication. Users must register with a unique ID and provide verification proofs (e.g., KYC hashes).  
2. **ItemRegistry.clar**: Allows original owners or manufacturers to register new items with details like serial number, origin hash (e.g., SHA-256 of manufacturing docs), description, and initial condition. Prevents duplicate registrations.  
3. **OwnershipTransfer.clar**: Handles secure transfers of item ownership, recording each change on-chain with timestamps and buyer/seller signatures. Includes hooks for royalty payments if applicable.  
4. **ConditionVerification.clar**: Enables certified inspectors to submit verified condition reports (e.g., photos hashed on-chain, grading scores). Reports are immutable and linked to the item's history.  
5. **Marketplace.clar**: A decentralized listing service where sellers can post verified items for sale, set prices, and manage auctions or fixed-price sales. Integrates with escrow for trustless deals.  
6. **Escrow.clar**: Holds funds (in STX or SIP-10 tokens) during transactions, releasing them only after buyer confirmation or dispute resolution. Supports timed releases and refunds.  
7. **DisputeResolution.clar**: Allows buyers to raise disputes over item condition or authenticity. Uses on-chain voting or oracle integration for resolutions, with penalties for bad actors.  
8. **Analytics.clar**: Provides read-only functions to query item histories, market trends, and valuations based on past sales and conditions. Useful for buyers assessing fair prices.

**For Sellers/Manufacturers**  
- Register yourself via UserRegistry.  
- Create a unique hash of your item's origin documents.  
- Call register-item in ItemRegistry with the hash, serial number, title, and description.  
- When selling, use ConditionVerification to get an inspector report, then list on Marketplace.  
- Transfer ownership via OwnershipTransfer after escrow completes.  

Boom! Your item is now traceable and verifiable for resale.

**For Buyers**  
- Browse listings on Marketplace and view full item history via Analytics.  
- Verify condition reports and ownership chain using get-item-details.  
- Purchase via Escrow: Funds are held until you confirm receipt and condition.  
- If issues arise, initiate a dispute in DisputeResolution for fair resolution.

**For Inspectors**  
- Register as a certified inspector in UserRegistry (with proof of credentials).  
- Sellers request verifications; submit reports to ConditionVerification with hashes of photos/inspections.  
- Earn fees or rewards for accurate verifications, tracked on-chain.

**For Verifiers/Anyone**  
- Use public functions like verify-ownership or get-condition-history to instantly check an item's authenticity, origin, and condition without trusting third parties.

That's it! This system empowers a transparent second-hand economy, reducing waste by extending product lifecycles and minimizing fraud—perfect for sustainability-focused markets. Deploy on Stacks for low-cost, Bitcoin-secured transactions.