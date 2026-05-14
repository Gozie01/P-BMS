// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

contract BloodMatchingReviewerRevision {
    enum BloodType {
        Ap,
        An,
        Bp,
        Bn,
        ABp,
        ABn,
        Op,
        On
    }

    enum Severity {
        Low,
        Moderate,
        High,
        Critical
    }

    struct BloodBank {
        uint256 bankTotal;
        uint256 outofBankTotal;
        uint256 totalBlood;
        uint256 nextSerial;
        string outPut;
    }

    struct BloodUnit {
        bytes32 code;
        BloodType bloodType;
        uint256 donatedAt;
        uint256 serialNumber;
        string phenotype;
        address donor;
        bool available;
    }

    struct ConsentRecord {
        bytes32 donorIdHash;
        bytes32 consentVersionHash;
        bool counsellingAcknowledged;
        uint256 recordedAt;
        bool exists;
    }

    struct ReactionRecord {
        bytes32 bagCode;
        bytes32 clinicianIdHash;
        string reactionType;
        Severity severity;
        uint256 reportedAt;
        string notes;
    }

    struct SpecialCaseRecord {
        bytes32 bagCode;
        bytes32 reviewerIdHash;
        string scenario;
        bool emergencyOverride;
        uint256 loggedAt;
    }

    mapping(BloodType => BloodType[]) private compatibility;
    mapping(BloodType => BloodBank) private bloodBanks;
    mapping(bytes32 => BloodUnit) private bloodUnits;
    mapping(address => bool) public isRegisteredDonor;
    mapping(address => bytes32) public donorIdHashes;
    mapping(address => ConsentRecord) private consentRecords;
    mapping(bytes32 => ReactionRecord[]) private reactionLogs;
    mapping(bytes32 => SpecialCaseRecord[]) private specialCaseLogs;

    bytes32[] private donationQueue;

    uint256 public totalBloodAll;
    uint256 public constant expirationDate = 3456000;

    event DonorRegistered(address donorAddress, bytes32 donorIdHash);
    event ConsentRecorded(
        address donorAddress,
        bytes32 donorIdHash,
        bytes32 consentVersionHash,
        bool counsellingAcknowledged,
        uint256 timestamp
    );
    event BloodDonated(
        BloodType bloodType,
        bytes32 code,
        uint256 time,
        uint256 serial,
        address donor,
        string phenotype
    );
    event BloodMatched(
        BloodType recipient,
        BloodType donor,
        bytes32 code,
        uint256 time,
        string phenotype
    );
    event BloodExpired(BloodType bloodType, bytes32 code, uint256 time);
    event HemovigilanceReported(
        bytes32 bagCode,
        bytes32 clinicianIdHash,
        string reactionType,
        Severity severity,
        uint256 timestamp
    );
    event SpecialCaseLogged(
        bytes32 bagCode,
        bytes32 reviewerIdHash,
        string scenario,
        bool emergencyOverride,
        uint256 timestamp
    );

    constructor() {
        compatibility[BloodType.Ap] = [BloodType.Ap, BloodType.An, BloodType.Op, BloodType.On];
        compatibility[BloodType.An] = [BloodType.An, BloodType.On];
        compatibility[BloodType.Bp] = [BloodType.Bp, BloodType.Bn, BloodType.Op, BloodType.On];
        compatibility[BloodType.Bn] = [BloodType.Bn, BloodType.On];
        compatibility[BloodType.ABp] = [
            BloodType.Ap,
            BloodType.An,
            BloodType.Bp,
            BloodType.Bn,
            BloodType.ABp,
            BloodType.ABn,
            BloodType.Op,
            BloodType.On
        ];
        compatibility[BloodType.ABn] = [BloodType.ABn, BloodType.An, BloodType.Bn, BloodType.On];
        compatibility[BloodType.Op] = [BloodType.Op, BloodType.On];
        compatibility[BloodType.On] = [BloodType.On];

        bloodBanks[BloodType.Ap].outPut = "A+ is a match";
        bloodBanks[BloodType.An].outPut = "A- is a match";
        bloodBanks[BloodType.Bp].outPut = "B+ is a match";
        bloodBanks[BloodType.Bn].outPut = "B- is a match";
        bloodBanks[BloodType.ABp].outPut = "AB+ is a match";
        bloodBanks[BloodType.ABn].outPut = "AB- is a match";
        bloodBanks[BloodType.Op].outPut = "O+ is a match";
        bloodBanks[BloodType.On].outPut = "O- is a match";
    }

    function registerDonor(bytes32 donorIdHash) external {
        require(donorIdHash != bytes32(0), "Donor hash required");
        isRegisteredDonor[msg.sender] = true;
        donorIdHashes[msg.sender] = donorIdHash;
        emit DonorRegistered(msg.sender, donorIdHash);
    }

    function recordConsent(bytes32 consentVersionHash, bool counsellingAcknowledged) external {
        require(isRegisteredDonor[msg.sender], "Only registered donors can record consent.");
        require(donorIdHashes[msg.sender] != bytes32(0), "Donor identity hash missing.");
        require(consentVersionHash != bytes32(0), "Consent version required");

        consentRecords[msg.sender] = ConsentRecord({
            donorIdHash: donorIdHashes[msg.sender],
            consentVersionHash: consentVersionHash,
            counsellingAcknowledged: counsellingAcknowledged,
            recordedAt: block.timestamp,
            exists: true
        });

        emit ConsentRecorded(
            msg.sender,
            donorIdHashes[msg.sender],
            consentVersionHash,
            counsellingAcknowledged,
            block.timestamp
        );
    }

    function updateDonation(BloodType bloodType) external returns (bytes32, uint256, uint256) {
        return _updateDonation(bloodType, "");
    }

    function updateDonationWithPhenotype(
        BloodType bloodType,
        string calldata phenotype
    ) external returns (bytes32, uint256, uint256) {
        return _updateDonation(bloodType, phenotype);
    }

    function compareBlood(BloodType recipientType) external returns (bytes32, string memory, string memory) {
        return _compareBlood(recipientType, "");
    }

    function compareBloodWithPhenotype(
        BloodType recipientType,
        string calldata requiredPhenotype
    ) external returns (bytes32, string memory, string memory) {
        return _compareBlood(recipientType, requiredPhenotype);
    }

    function reportReaction(
        bytes32 bagCode,
        bytes32 clinicianIdHash,
        string calldata reactionType,
        Severity severity,
        string calldata notes
    ) external {
        require(bloodUnits[bagCode].code != bytes32(0), "Unknown bag code");
        require(clinicianIdHash != bytes32(0), "Clinician hash required");
        require(bytes(reactionType).length != 0, "Reaction type required");

        reactionLogs[bagCode].push(
            ReactionRecord({
                bagCode: bagCode,
                clinicianIdHash: clinicianIdHash,
                reactionType: reactionType,
                severity: severity,
                reportedAt: block.timestamp,
                notes: notes
            })
        );

        emit HemovigilanceReported(bagCode, clinicianIdHash, reactionType, severity, block.timestamp);
    }

    function flagSpecialHandling(
        bytes32 bagCode,
        bytes32 reviewerIdHash,
        string calldata scenario,
        bool emergencyOverride
    ) external {
        require(bloodUnits[bagCode].code != bytes32(0), "Unknown bag code");
        require(reviewerIdHash != bytes32(0), "Reviewer hash required");
        require(bytes(scenario).length != 0, "Scenario required");

        specialCaseLogs[bagCode].push(
            SpecialCaseRecord({
                bagCode: bagCode,
                reviewerIdHash: reviewerIdHash,
                scenario: scenario,
                emergencyOverride: emergencyOverride,
                loggedAt: block.timestamp
            })
        );

        emit SpecialCaseLogged(bagCode, reviewerIdHash, scenario, emergencyOverride, block.timestamp);
    }

    function viewBankTotal() external view returns (uint256) {
        return
            bloodBanks[BloodType.Ap].bankTotal +
            bloodBanks[BloodType.An].bankTotal +
            bloodBanks[BloodType.Bp].bankTotal +
            bloodBanks[BloodType.Bn].bankTotal +
            bloodBanks[BloodType.ABp].bankTotal +
            bloodBanks[BloodType.ABn].bankTotal +
            bloodBanks[BloodType.Op].bankTotal +
            bloodBanks[BloodType.On].bankTotal;
    }

    function viewBloodGroupBankTotal(BloodType bloodGroup) external view returns (uint256) {
        return bloodBanks[bloodGroup].bankTotal;
    }

    function viewTotalSpent() external view returns (uint256) {
        return
            bloodBanks[BloodType.Ap].outofBankTotal +
            bloodBanks[BloodType.An].outofBankTotal +
            bloodBanks[BloodType.Bp].outofBankTotal +
            bloodBanks[BloodType.Bn].outofBankTotal +
            bloodBanks[BloodType.ABp].outofBankTotal +
            bloodBanks[BloodType.ABn].outofBankTotal +
            bloodBanks[BloodType.Op].outofBankTotal +
            bloodBanks[BloodType.On].outofBankTotal;
    }

    function viewGroupTotal(BloodType bloodType) external view returns (uint256) {
        return bloodBanks[bloodType].totalBlood;
    }

    function viewTotal() external view returns (uint256) {
        return totalBloodAll;
    }

    function viewDonationMetadata(
        bytes32 bagCode
    )
        external
        view
        returns (
            BloodType bloodType,
            uint256 donatedAt,
            uint256 serialNumber,
            string memory phenotype,
            address donor,
            bool available
        )
    {
        BloodUnit storage unit = bloodUnits[bagCode];
        require(unit.code != bytes32(0), "Unknown bag code");
        return (unit.bloodType, unit.donatedAt, unit.serialNumber, unit.phenotype, unit.donor, unit.available);
    }

    function viewConsent(
        address donor
    )
        external
        view
        returns (
            bytes32 donorIdHash,
            bytes32 consentVersionHash,
            bool counsellingAcknowledged,
            uint256 recordedAt,
            bool exists
        )
    {
        ConsentRecord storage consent = consentRecords[donor];
        return (
            consent.donorIdHash,
            consent.consentVersionHash,
            consent.counsellingAcknowledged,
            consent.recordedAt,
            consent.exists
        );
    }

    function viewReactionCount(bytes32 bagCode) external view returns (uint256) {
        return reactionLogs[bagCode].length;
    }

    function viewLatestReaction(
        bytes32 bagCode
    )
        external
        view
        returns (
            bytes32 clinicianIdHash,
            string memory reactionType,
            Severity severity,
            uint256 reportedAt,
            string memory notes
        )
    {
        uint256 count = reactionLogs[bagCode].length;
        require(count > 0, "No reactions recorded");
        ReactionRecord storage record = reactionLogs[bagCode][count - 1];
        return (
            record.clinicianIdHash,
            record.reactionType,
            record.severity,
            record.reportedAt,
            record.notes
        );
    }

    function viewSpecialCaseCount(bytes32 bagCode) external view returns (uint256) {
        return specialCaseLogs[bagCode].length;
    }

    function viewLatestSpecialCase(
        bytes32 bagCode
    )
        external
        view
        returns (
            bytes32 reviewerIdHash,
            string memory scenario,
            bool emergencyOverride,
            uint256 loggedAt
        )
    {
        uint256 count = specialCaseLogs[bagCode].length;
        require(count > 0, "No special case recorded");
        SpecialCaseRecord storage record = specialCaseLogs[bagCode][count - 1];
        return (record.reviewerIdHash, record.scenario, record.emergencyOverride, record.loggedAt);
    }

    function _updateDonation(
        BloodType bloodType,
        string memory phenotype
    ) internal returns (bytes32, uint256, uint256) {
        require(isRegisteredDonor[msg.sender], "Only registered donors can donate.");
        require(consentRecords[msg.sender].exists, "Consent must be recorded before donation.");

        uint256 donationTime = block.timestamp;
        uint256 serial = bloodBanks[bloodType].nextSerial++;
        bytes32 code = keccak256(
            abi.encodePacked(msg.sender, donationTime, serial, uint8(bloodType), phenotype)
        );

        bloodUnits[code] = BloodUnit({
            code: code,
            bloodType: bloodType,
            donatedAt: donationTime,
            serialNumber: serial,
            phenotype: phenotype,
            donor: msg.sender,
            available: true
        });

        bloodBanks[bloodType].bankTotal++;
        bloodBanks[bloodType].totalBlood++;
        totalBloodAll++;
        donationQueue.push(code);

        emit BloodDonated(bloodType, code, donationTime, serial, msg.sender, phenotype);
        return (code, donationTime, serial);
    }

    function _compareBlood(
        BloodType recipientType,
        string memory requiredPhenotype
    ) internal returns (bytes32, string memory, string memory) {
        for (uint256 i = 0; i < donationQueue.length; i++) {
            bytes32 bagCode = donationQueue[i];
            BloodUnit storage unit = bloodUnits[bagCode];

            if (!unit.available) {
                continue;
            }

            if (_isExpired(unit.donatedAt)) {
                unit.available = false;
                bloodBanks[unit.bloodType].bankTotal--;
                bloodBanks[unit.bloodType].outofBankTotal++;
                emit BloodExpired(unit.bloodType, unit.code, unit.donatedAt);
                continue;
            }

            if (isCompatible(recipientType, unit.bloodType) && _phenotypeMatches(requiredPhenotype, unit.phenotype)) {
                unit.available = false;
                bloodBanks[unit.bloodType].bankTotal--;
                bloodBanks[unit.bloodType].outofBankTotal++;

                emit BloodMatched(recipientType, unit.bloodType, unit.code, block.timestamp, unit.phenotype);
                return (unit.code, bloodBanks[unit.bloodType].outPut, unit.phenotype);
            }
        }

        return (bytes32(0), "there is no match", "");
    }

    function isCompatible(BloodType recipient, BloodType donor) public view returns (bool) {
        for (uint256 i = 0; i < compatibility[recipient].length; i++) {
            if (compatibility[recipient][i] == donor) {
                return true;
            }
        }
        return false;
    }

    function _isExpired(uint256 donationTime) internal view returns (bool) {
        return donationTime < block.timestamp - expirationDate;
    }

    function _phenotypeMatches(
        string memory requiredPhenotype,
        string memory donorPhenotype
    ) internal pure returns (bool) {
        if (bytes(requiredPhenotype).length == 0) {
            return true;
        }

        return keccak256(bytes(requiredPhenotype)) == keccak256(bytes(donorPhenotype));
    }
}
