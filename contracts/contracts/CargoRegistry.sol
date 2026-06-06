// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
}

interface ICargoEscrow {
    function createJobAndFund(
        uint256 _tokenId,
        address _client,
        address _provider,
        address _evaluator,
        address _token,
        uint256 _amount,
        uint256 _expiry
    ) external returns (uint256 jobId);

    function certifyDeliverableFromRegistry(uint256 jobId, address verifier) external;
    function markAsDamaged(uint256 jobId) external;
}

interface IAgentRegistry {
    function isRegisteredAgent(address agentWallet) external view returns (bool);
}

contract CargoRegistry is ERC721, ERC721Enumerable, Ownable, ReentrancyGuard {
    // --- Core Traceability State ---
    struct CargoBatch {
        address producer;
        string origin;
        uint256 harvestDate;
        string latLong;
        string ipfsMetadata;
        uint256 priceUsdc; // In 6 decimals USDC/EURC
        bool isForSale;
        string status; // E.g., "Harvested", "In Transit", "Delivered", "Sold"
        address paymentToken; // Address of token (USDC or EURC)
    }

    struct Verification {
        address verifier;
        string credentialType; // E.g., "Organic", "ISO9001", "FairTrade"
        string ipfsVcHash;     // W3C Verifiable Credentials JSON-LD document hash
        string verifierName;
        uint256 timestamp;
    }

    uint256 public nextTokenId = 1;
    IERC20 public immutable usdc;
    address public constant EURC = 0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a;
    address public feeCollector;
    uint256 public constant MINT_FEE_USDC = 100000; // 0.10 USDC (6 decimals)
    uint256 public platformCommissionBps = 50; // 0.5% default (in basis points)
    uint256 public constant MAX_COMMISSION_BPS = 1000; // 10% maximum

    address public cargoEscrow;
    address public agentRegistry;
    mapping(uint256 => uint256) public tokenEscrowJobs;
    mapping(uint256 => address) public designatedEvaluators;

    mapping(uint256 => CargoBatch) public cargoBatches;
    mapping(uint256 => Verification[]) public cargoVerifications;
    mapping(address => bool) public authorizedVerifiers;
    mapping(address => string) public verifierNames;

    // --- Events ---
    event CargoMinted(
        uint256 indexed tokenId,
        address indexed producer,
        string origin,
        uint256 harvestDate,
        string latLong,
        string ipfsMetadata
    );
    
    event CargoListed(uint256 indexed tokenId, uint256 priceUsdc);
    
    event CargoPurchased(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 priceUsdc
    );
    
    event CargoVerified(
        uint256 indexed tokenId,
        address indexed verifier,
        string credentialType,
        string ipfsVcHash
    );

    event StatusUpdated(uint256 indexed tokenId, string status);
    event PlatformCommissionBpsUpdated(uint256 newBps);

    // --- Modifiers ---
    modifier onlyTokenOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "Caller is not token owner");
        _;
    }

    modifier onlyAuthorizedVerifier() {
        require(authorizedVerifiers[msg.sender], "Caller is not an authorized verifier");
        _;
    }

    constructor(address _usdcAddress) ERC721("CargoTrust Digital Twin Token", "CRGO") Ownable(msg.sender) {
        feeCollector = msg.sender;
        usdc = IERC20(_usdcAddress);
        
        // Pre-authorize standard test verifier for UI convenience
        authorizedVerifiers[msg.sender] = true;
        verifierNames[msg.sender] = "CargoTrust Quality Assurance Lab";
    }

    // --- Admin Functions ---
    function setVerifier(address _verifier, bool _status, string calldata _name) external onlyOwner {
        authorizedVerifiers[_verifier] = _status;
        verifierNames[_verifier] = _name;
    }

    function setFeeCollector(address _feeCollector) external onlyOwner {
        require(_feeCollector != address(0), "Zero address fee collector");
        feeCollector = _feeCollector;
    }

    function setPlatformCommissionBps(uint256 _bps) external onlyOwner {
        require(_bps <= MAX_COMMISSION_BPS, "Bps exceeds maximum limit");
        platformCommissionBps = _bps;
        emit PlatformCommissionBpsUpdated(_bps);
    }

    // --- Feature A: Product Digital Twin Creator ---
    /**
     * @notice Mints a new digital twin batch, transferring 0.10 USDC flat fee to the treasury
     */
    function mintCargo(
        string calldata _origin,
        uint256 _harvestDate,
        string calldata _latLong,
        string calldata _ipfsMetadata
    ) external nonReentrant returns (uint256) {
        // Collect 0.10 USDC mint fee
        require(
            usdc.transferFrom(msg.sender, feeCollector, MINT_FEE_USDC),
            "USDC mint fee payment failed"
        );

        uint256 tokenId = nextTokenId++;
        
        // Mint NFT using OpenZeppelin's internal _mint
        _mint(msg.sender, tokenId);

        // Record supply chain digital twin metadata
        cargoBatches[tokenId] = CargoBatch({
            producer: msg.sender,
            origin: _origin,
            harvestDate: _harvestDate,
            latLong: _latLong,
            ipfsMetadata: _ipfsMetadata,
            priceUsdc: 0,
            isForSale: false,
            status: "Harvested",
            paymentToken: address(usdc)
        });

        emit CargoMinted(tokenId, msg.sender, _origin, _harvestDate, _latLong, _ipfsMetadata);

        return tokenId;
    }

    // --- Feature B: Payment-Linked Ownership Transfer Contract ---
    /**
     * @notice Lists a cargo twin for sale in USDC
     */
    function listCargo(uint256 _tokenId, uint256 _priceUsdc) external onlyTokenOwner(_tokenId) nonReentrant {
        require(_priceUsdc > 0, "Price must be greater than zero");
        CargoBatch storage batch = cargoBatches[_tokenId];
        batch.priceUsdc = _priceUsdc;
        batch.paymentToken = address(usdc);
        batch.isForSale = true;
        
        emit CargoListed(_tokenId, _priceUsdc);
    }

    /**
     * @notice Lists a cargo twin for sale in specified payment token (USDC or EURC)
     */
    function listCargo(uint256 _tokenId, uint256 _priceUsdc, address _paymentToken) external onlyTokenOwner(_tokenId) nonReentrant {
        require(_priceUsdc > 0, "Price must be greater than zero");
        require(_paymentToken == address(usdc) || _paymentToken == EURC, "Unsupported payment token");
        CargoBatch storage batch = cargoBatches[_tokenId];
        batch.priceUsdc = _priceUsdc;
        batch.paymentToken = _paymentToken;
        batch.isForSale = true;
        
        emit CargoListed(_tokenId, _priceUsdc);
    }

    /**
     * @notice Performs the atomic trade: buyer pays listed token, gets token immediately (routed through escrow if cargoEscrow is active).
     */
    function purchaseCargo(uint256 _tokenId) external nonReentrant {
        CargoBatch storage batch = cargoBatches[_tokenId];
        require(batch.isForSale, "Cargo is not for sale");
        
        address seller = ownerOf(_tokenId);
        address buyer = msg.sender;
        uint256 price = batch.priceUsdc;
        address listedToken = batch.paymentToken == address(0) ? address(usdc) : batch.paymentToken;

        require(buyer != seller, "Buyer cannot be seller");

        // Calculate platform commission and seller shares
        uint256 commission = (price * platformCommissionBps) / 10000;
        uint256 sellerAmount = price - commission;

        // Atomic Payment: Transfer listed token directly from buyer to feeCollector & seller/escrow
        if (commission > 0) {
            require(
                IERC20(listedToken).transferFrom(buyer, feeCollector, commission),
                "Commission payment failed"
            );
        }

        if (cargoEscrow != address(0)) {
            require(
                IERC20(listedToken).transferFrom(buyer, cargoEscrow, sellerAmount),
                "Escrow payment transfer failed"
            );
            address evaluator = designatedEvaluators[_tokenId] == address(0) ? feeCollector : designatedEvaluators[_tokenId];
            uint256 jobId = ICargoEscrow(cargoEscrow).createJobAndFund(
                _tokenId,
                buyer,
                seller,
                evaluator,
                listedToken,
                sellerAmount,
                block.timestamp + 7 days
            );
            tokenEscrowJobs[_tokenId] = jobId;
        } else {
            require(
                IERC20(listedToken).transferFrom(buyer, seller, sellerAmount),
                "Payment failed"
            );
        }

        // Atomic Ownership Transfer
        _transfer(seller, buyer, _tokenId);

        // Update state
        batch.isForSale = false;
        batch.status = "Ownership Transferred";

        emit CargoPurchased(_tokenId, seller, buyer, price);
        emit StatusUpdated(_tokenId, "Ownership Transferred");
    }

    /**
     * @notice Performs the atomic trade with payment token routing.
     * If paying in the listed token, performs direct payment (or escrow routing).
     * If paying in EURC but listed in USDC, verifies backend quote signature, pulls EURC from buyer to feeCollector, and disburses USDC from feeCollector to seller/escrow.
     */
    function purchaseCargo(
        uint256 _tokenId,
        address _paymentToken,
        uint256 _paymentAmount,
        uint256 _deadline,
        bytes calldata _signature
    ) external nonReentrant {
        CargoBatch storage batch = cargoBatches[_tokenId];
        require(batch.isForSale, "Cargo is not for sale");
        
        address seller = ownerOf(_tokenId);
        address buyer = msg.sender;
        uint256 listedPrice = batch.priceUsdc;
        address listedToken = batch.paymentToken == address(0) ? address(usdc) : batch.paymentToken;

        require(buyer != seller, "Buyer cannot be seller");

        if (_paymentToken == listedToken) {
            // Pay directly in the listed currency
            uint256 commission = (listedPrice * platformCommissionBps) / 10000;
            uint256 sellerAmount = listedPrice - commission;

            if (commission > 0) {
                require(
                    IERC20(listedToken).transferFrom(buyer, feeCollector, commission),
                    "Commission payment failed"
                );
            }

            if (cargoEscrow != address(0)) {
                require(
                    IERC20(listedToken).transferFrom(buyer, cargoEscrow, sellerAmount),
                    "Escrow payment transfer failed"
                );
                address evaluator = designatedEvaluators[_tokenId] == address(0) ? feeCollector : designatedEvaluators[_tokenId];
                uint256 jobId = ICargoEscrow(cargoEscrow).createJobAndFund(
                    _tokenId,
                    buyer,
                    seller,
                    evaluator,
                    listedToken,
                    sellerAmount,
                    block.timestamp + 7 days
                );
                tokenEscrowJobs[_tokenId] = jobId;
            } else {
                require(
                    IERC20(listedToken).transferFrom(buyer, seller, sellerAmount),
                    "Payment failed"
                );
            }
        } else {
            // Cross-currency payment (e.g. paying EURC for USDC listing)
            // Verify backend signature
            bytes32 messageHash = keccak256(
                abi.encodePacked(_tokenId, _paymentToken, _paymentAmount, _deadline, buyer)
            );
            bytes32 ethSignedMessageHash = keccak256(
                abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
            );
            address signer = recoverSigner(ethSignedMessageHash, _signature);
            require(signer == owner() || signer == feeCollector, "Invalid quote signature");
            require(block.timestamp <= _deadline, "Quote expired");

            // Pull _paymentAmount of EURC from buyer to feeCollector
            require(
                IERC20(_paymentToken).transferFrom(buyer, feeCollector, _paymentAmount),
                "EURC payment failed"
            );

            // Pay seller in USDC (funded from feeCollector treasury balance)
            uint256 commission = (listedPrice * platformCommissionBps) / 10000;
            uint256 sellerAmount = listedPrice - commission;

            if (cargoEscrow != address(0)) {
                // Route seller portion to escrow from feeCollector
                require(
                    IERC20(listedToken).transferFrom(feeCollector, cargoEscrow, sellerAmount),
                    "USDC routing to escrow failed"
                );
                address evaluator = designatedEvaluators[_tokenId] == address(0) ? feeCollector : designatedEvaluators[_tokenId];
                uint256 jobId = ICargoEscrow(cargoEscrow).createJobAndFund(
                    _tokenId,
                    buyer,
                    seller,
                    evaluator,
                    listedToken,
                    sellerAmount,
                    block.timestamp + 7 days
                );
                tokenEscrowJobs[_tokenId] = jobId;
            } else {
                require(
                    IERC20(listedToken).transferFrom(feeCollector, seller, sellerAmount),
                    "USDC settlement from treasury failed"
                );
            }
        }

        // Atomic Ownership Transfer
        _transfer(seller, buyer, _tokenId);
        batch.isForSale = false;
        batch.status = "Ownership Transferred";

        emit CargoPurchased(_tokenId, seller, buyer, listedPrice);
        emit StatusUpdated(_tokenId, "Ownership Transferred");
    }

    function recoverSigner(bytes32 _ethSignedMessageHash, bytes memory _sig) public pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_sig);
        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    function splitSignature(bytes memory sig) public pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "invalid signature length");
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }

    // --- Feature C: Authorized Verifier Credentials Dashboard ---
    /**
     * @notice Appends quality attestations signed cryptographically on-chain by independent certifiers
     */
    function addVerification(
        uint256 _tokenId,
        string calldata _credentialType,
        string calldata _ipfsVcHash
    ) external onlyAuthorizedVerifier {
        require(_ownerOf(_tokenId) != address(0), "Token does not exist");
        
        cargoVerifications[_tokenId].push(Verification({
            verifier: msg.sender,
            credentialType: _credentialType,
            ipfsVcHash: _ipfsVcHash,
            verifierName: verifierNames[msg.sender],
            timestamp: block.timestamp
        }));

        CargoBatch storage batch = cargoBatches[_tokenId];
        batch.status = string(abi.encodePacked("Certified ", _credentialType));

        emit CargoVerified(_tokenId, msg.sender, _credentialType, _ipfsVcHash);
        emit StatusUpdated(_tokenId, batch.status);

        if (cargoEscrow != address(0)) {
            uint256 jobId = tokenEscrowJobs[_tokenId];
            if (jobId != 0) {
                ICargoEscrow(cargoEscrow).certifyDeliverableFromRegistry(jobId, msg.sender);
            }
        }
    }

    // --- Tracking Functions ---
    function updateStatus(uint256 _tokenId, string calldata _newStatus) external {
        address tokenOwner = ownerOf(_tokenId);
        
        bool isAgent = false;
        if (agentRegistry != address(0)) {
            try IAgentRegistry(agentRegistry).isRegisteredAgent(msg.sender) returns (bool res) {
                isAgent = res;
            } catch {}
        }

        require(
            tokenOwner == msg.sender || 
            authorizedVerifiers[msg.sender] || 
            isApprovedForAll(tokenOwner, msg.sender) ||
            isAgent,
            "Not authorized to update status"
        );

        cargoBatches[_tokenId].status = _newStatus;
        emit StatusUpdated(_tokenId, _newStatus);

        if (keccak256(bytes(_newStatus)) == keccak256(bytes("Damaged"))) {
            if (cargoEscrow != address(0)) {
                uint256 jobId = tokenEscrowJobs[_tokenId];
                if (jobId != 0) {
                    ICargoEscrow(cargoEscrow).markAsDamaged(jobId);
                }
            }
        }
    }

    function setCargoEscrow(address _cargoEscrow) external onlyOwner {
        cargoEscrow = _cargoEscrow;
    }

    function setAgentRegistry(address _agentRegistry) external onlyOwner {
        agentRegistry = _agentRegistry;
    }

    function setDesignatedEvaluator(uint256 _tokenId, address _evaluator) external onlyTokenOwner(_tokenId) {
        designatedEvaluators[_tokenId] = _evaluator;
    }

    // --- Verifiable Fetching ---
    function getVerifications(uint256 _tokenId) external view returns (Verification[] memory) {
        return cargoVerifications[_tokenId];
    }

    function getCargoDetails(uint256 _tokenId) external view returns (CargoBatch memory) {
        require(_ownerOf(_tokenId) != address(0), "Cargo token does not exist");
        return cargoBatches[_tokenId];
    }

    // --- Custom Query Helper for Frontend UI (Zero Mocking) ---
    function getActiveBatches() external view returns (uint256[] memory, address[] memory, string[] memory) {
        uint256 total = nextTokenId - 1;
        uint256[] memory ids = new uint256[](total);
        address[] memory currentOwners = new address[](total);
        string[] memory statuses = new string[](total);
        
        for (uint256 i = 1; i <= total; i++) {
            ids[i - 1] = i;
            currentOwners[i - 1] = ownerOf(i);
            statuses[i - 1] = cargoBatches[i].status;
        }
        return (ids, currentOwners, statuses);
    }

    // --- Required Overrides ---

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
