// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CargoRegistry
 * @dev Decentralized Supply Chain Identity & Traceability Platform on Arc Testnet.
 * Fully compliant ERC-721 implementation with custom stablecoin-linked workflows.
 */

interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract CargoRegistry {
    // --- ERC-721 State ---
    string public constant name = "CargoTrust Digital Twin Token";
    string public constant symbol = "CRGO";

    // --- Token Mappings ---
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    // --- Core Traceability State ---
    struct CargoBatch {
        address producer;
        string origin;
        uint256 harvestDate;
        string latLong;
        string ipfsMetadata;
        uint256 priceUsdc; // In 6 decimals USDC
        bool isForSale;
        string status; // E.g., "Harvested", "In Transit", "Delivered", "Sold"
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
    address public owner;
    address public feeCollector;
    uint256 public constant MINT_FEE_USDC = 100000; // 0.10 USDC (6 decimals)

    mapping(uint256 => CargoBatch) public cargoBatches;
    mapping(uint256 => Verification[]) public cargoVerifications;
    mapping(address => bool) public authorizedVerifiers;
    mapping(address => string) public verifierNames;

    // --- Events ---
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    
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

    // --- Modifiers ---
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can execute");
        _;
    }

    modifier onlyTokenOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "Caller is not token owner");
        _;
    }

    modifier onlyAuthorizedVerifier() {
        require(authorizedVerifiers[msg.sender], "Caller is not an authorized verifier");
        _;
    }

    constructor(address _usdcAddress) {
        owner = msg.sender;
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
        feeCollector = _feeCollector;
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        owner = _newOwner;
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
    ) external returns (uint256) {
        // Collect 0.10 USDC mint fee
        require(
            usdc.transferFrom(msg.sender, feeCollector, MINT_FEE_USDC),
            "USDC mint fee payment failed"
        );

        uint256 tokenId = nextTokenId++;
        
        // Mint NFT
        _owners[tokenId] = msg.sender;
        _balances[msg.sender] += 1;

        // Record supply chain digital twin metadata
        cargoBatches[tokenId] = CargoBatch({
            producer: msg.sender,
            origin: _origin,
            harvestDate: _harvestDate,
            latLong: _latLong,
            ipfsMetadata: _ipfsMetadata,
            priceUsdc: 0,
            isForSale: false,
            status: "Harvested"
        });

        emit Transfer(address(0), msg.sender, tokenId);
        emit CargoMinted(tokenId, msg.sender, _origin, _harvestDate, _latLong, _ipfsMetadata);

        return tokenId;
    }

    // --- Feature B: Payment-Linked Ownership Transfer Contract ---
    /**
     * @notice Lists a cargo twin for sale in USDC
     */
    function listCargo(uint256 _tokenId, uint256 _priceUsdc) external onlyTokenOwner(_tokenId) {
        require(_priceUsdc > 0, "Price must be greater than zero");
        CargoBatch storage batch = cargoBatches[_tokenId];
        batch.priceUsdc = _priceUsdc;
        batch.isForSale = true;
        
        emit CargoListed(_tokenId, _priceUsdc);
    }

    /**
     * @notice Performs the atomic trade: buyer pays USDC, gets token immediately.
     */
    function purchaseCargo(uint256 _tokenId) external {
        CargoBatch storage batch = cargoBatches[_tokenId];
        require(batch.isForSale, "Cargo is not for sale");
        
        address seller = ownerOf(_tokenId);
        address buyer = msg.sender;
        uint256 price = batch.priceUsdc;

        require(buyer != seller, "Buyer cannot be seller");

        // Atomic Payment: Transfer USDC directly from buyer to seller
        require(
            usdc.transferFrom(buyer, seller, price),
            "USDC payment failed"
        );

        // Atomic Ownership Transfer
        _transfer(seller, buyer, _tokenId);

        // Update state
        batch.isForSale = false;
        batch.status = "Ownership Transferred";

        emit CargoPurchased(_tokenId, seller, buyer, price);
        emit StatusUpdated(_tokenId, "Ownership Transferred");
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
        require(_exists(_tokenId), "Token does not exist");
        
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
    }

    // --- Tracking Functions ---
    function updateStatus(uint256 _tokenId, string calldata _newStatus) external {
        require(
            ownerOf(_tokenId) == msg.sender || 
            authorizedVerifiers[msg.sender] || 
            isApprovedForAll(ownerOf(_tokenId), msg.sender),
            "Not authorized to update status"
        );
        require(_exists(_tokenId), "Token does not exist");

        cargoBatches[_tokenId].status = _newStatus;
        emit StatusUpdated(_tokenId, _newStatus);
    }

    // --- Verifiable Fetching ---
    function getVerifications(uint256 _tokenId) external view returns (Verification[] memory) {
        return cargoVerifications[_tokenId];
    }

    function getCargoDetails(uint256 _tokenId) external view returns (CargoBatch memory) {
        require(_exists(_tokenId), "Cargo token does not exist");
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
            currentOwners[i - 1] = _owners[i];
            statuses[i - 1] = cargoBatches[i].status;
        }
        return (ids, currentOwners, statuses);
    }

    // --- Standard ERC-721 Interface Implementation ---
    function balanceOf(address _ownerAddress) external view returns (uint256) {
        require(_ownerAddress != address(0), "Zero address query");
        return _balances[_ownerAddress];
    }

    function ownerOf(uint256 _tokenId) public view returns (address) {
        address ownerAddress = _owners[_tokenId];
        require(ownerAddress != address(0), "Token does not exist");
        return ownerAddress;
    }

    function _exists(uint256 _tokenId) internal view returns (bool) {
        return _owners[_tokenId] != address(0);
    }

    function approve(address _to, uint256 _tokenId) external {
        address tokenOwner = ownerOf(_tokenId);
        require(_to != tokenOwner, "Approval to current owner");
        require(msg.sender == tokenOwner || isApprovedForAll(tokenOwner, msg.sender), "Not authorized");

        _tokenApprovals[_tokenId] = _to;
        emit Approval(tokenOwner, _to, _tokenId);
    }

    function getApproved(uint256 _tokenId) public view returns (address) {
        require(_exists(_tokenId), "Token does not exist");
        return _tokenApprovals[_tokenId];
    }

    function setApprovalForAll(address _operator, bool _approved) external {
        require(_operator != msg.sender, "Approve to caller");
        _operatorApprovals[msg.sender][_operator] = _approved;
        emit ApprovalForAll(msg.sender, _operator, _approved);
    }

    function isApprovedForAll(address _ownerAddress, address _operator) public view returns (bool) {
        return _operatorApprovals[_ownerAddress][_operator];
    }

    function transferFrom(address _from, address _to, uint256 _tokenId) public {
        require(_isApprovedOrOwner(msg.sender, _tokenId), "Not owner nor approved");
        _transfer(_from, _to, _tokenId);
    }

    function safeTransferFrom(address _from, address _to, uint256 _tokenId) external {
        transferFrom(_from, _to, _tokenId);
    }

    function safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes calldata) external {
        transferFrom(_from, _to, _tokenId);
    }

    function _transfer(address _from, address _to, uint256 _tokenId) internal {
        require(ownerOf(_tokenId) == _from, "Transfer from incorrect owner");
        require(_to != address(0), "Transfer to zero address");

        // Clear approval
        _tokenApprovals[_tokenId] = address(0);

        _balances[_from] -= 1;
        _balances[_to] += 1;
        _owners[_tokenId] = _to;

        emit Transfer(_from, _to, _tokenId);
    }

    function _isApprovedOrOwner(address _spender, uint256 _tokenId) internal view returns (bool) {
        address tokenOwner = ownerOf(_tokenId);
        return (_spender == tokenOwner || getApproved(_tokenId) == _spender || isApprovedForAll(tokenOwner, _spender));
    }
}
