// SPDX-License-Identifier: MIT
pragma solidity > 0.8.10;

contract BloodMatching {
    struct BloodBank {
        uint oldest;
        uint latest;
        uint bankTotal;
        uint outofBankTotal;
        uint totalBlood;
        string outPut;
        mapping(uint => BloodAge) bloodAges;
        mapping(uint => uint) serialCounter; // Counter for unique serial numbers per blood type
    }

    struct BloodAge {
        bytes32 code;
        uint time;
        uint serialNumber;
    }

    mapping(BloodType => BloodType[]) compatibility;
    mapping(BloodType => BloodBank) bloodBanks;
    BloodType[] bloodTypeQueue; // FIFO queue
    mapping(address => bool) isRegisteredDonor; // Mapping to track registered donors

    uint totalBloodAll;
    uint expirationDate = 3456000;

    event DonorRegistered(address donorAddress);
    event BloodDonated(BloodType bloodType, bytes32 code, uint time, uint serial, address donor);
    event BloodMatched(BloodType recipient, BloodType donor, bytes32 code, uint time);
    event BloodExpired(BloodType bloodType, uint time);

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

    constructor() {
        // Initialize compatibility rules
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

        // Initialize bloodBank output messages and serial counters
        bloodBanks[BloodType.Ap].outPut = "A+ is a match";
        bloodBanks[BloodType.Ap].serialCounter[0] = 0;
        bloodBanks[BloodType.An].outPut = "A- is a match";
        bloodBanks[BloodType.An].serialCounter[0] = 0;
        bloodBanks[BloodType.Bp].outPut = "B+ is a match";
        bloodBanks[BloodType.Bp].serialCounter[0] = 0;
        bloodBanks[BloodType.Bn].outPut = "B- is a match";
        bloodBanks[BloodType.Bn].serialCounter[0] = 0;
        bloodBanks[BloodType.ABp].outPut = "AB+ is a match";
        bloodBanks[BloodType.ABp].serialCounter[0] = 0;
        bloodBanks[BloodType.ABn].outPut = "AB- is a match";
        bloodBanks[BloodType.ABn].serialCounter[0] = 0;
        bloodBanks[BloodType.Op].outPut = "O+ is a match";
        bloodBanks[BloodType.Op].serialCounter[0] = 0;
        bloodBanks[BloodType.On].outPut = "O- is a match";
        bloodBanks[BloodType.On].serialCounter[0] = 0;
    }

    function registerDonor() public {
        isRegisteredDonor[msg.sender] = true;
        emit DonorRegistered(msg.sender);
    }

    function updateDonation(BloodType _bloodType) public returns (bytes32, uint, uint) {
        require(isRegisteredDonor[msg.sender], "Only registered donors can donate.");
        require(
            _bloodType == BloodType.Ap ||
                _bloodType == BloodType.Bp ||
                _bloodType == BloodType.ABp ||
                _bloodType == BloodType.Op ||
                _bloodType == BloodType.An ||
                _bloodType == BloodType.Bn ||
                _bloodType == BloodType.ABn ||
                _bloodType == BloodType.On,
            "Invalid blood type"
        );

        bytes32 toBeReturned;
        uint time = block.timestamp;
        uint serial = bloodBanks[_bloodType].serialCounter[bloodBanks[_bloodType].totalBlood]++;

        bloodBanks[_bloodType].bloodAges[bloodBanks[_bloodType].totalBlood].code = keccak256(abi.encodePacked(time, serial));
        bloodBanks[_bloodType].bloodAges[bloodBanks[_bloodType].totalBlood].time = time;
        bloodBanks[_bloodType].bloodAges[bloodBanks[_bloodType].totalBlood].serialNumber = serial;
        toBeReturned = bloodBanks[_bloodType].bloodAges[bloodBanks[_bloodType].totalBlood].code;
        bloodBanks[_bloodType].totalBlood++;
        totalBloodAll++;
        bloodBanks[_bloodType].bankTotal++;
        bloodTypeQueue.push(_bloodType); // Add to FIFO queue
        emit BloodDonated(_bloodType, toBeReturned, time, serial, msg.sender);
        return (toBeReturned, time, serial);
    }

    function compareBlood(BloodType _bloodTypeReci) public returns (bytes32, string memory) {
        bytes32 codeToBeReturned;
        string memory bloodGroupToBeReturned = "there is no match";

        uint queueLength = bloodTypeQueue.length;
        BloodType[] memory tempQueue = new BloodType[](queueLength);
        for (uint i = 0; i < queueLength; i++) {
            tempQueue[i] = bloodTypeQueue[i];
        }

        for (uint i = 0; i < queueLength; i++) {
            BloodType donorType = tempQueue[i];

            if (isCompatible(_bloodTypeReci, donorType) && bloodBanks[donorType].bankTotal > 0) {
                uint oldestIndex = bloodBanks[donorType].oldest;
                uint oldestTime = bloodBanks[donorType].bloodAges[oldestIndex].time;

                if (oldestTime != 0 && oldestTime < block.timestamp - expirationDate) {
                    // Expired
                    bloodBanks[donorType].oldest++;
                    bloodBanks[donorType].bankTotal--;
                    bloodBanks[donorType].outofBankTotal++;
                    emit BloodExpired(donorType, oldestTime);
                } else if (oldestTime != 0) {
                    // Valid
                    bloodGroupToBeReturned = bloodBanks[donorType].outPut;
                    codeToBeReturned = bloodBanks[donorType].bloodAges[oldestIndex].code;
                    bloodBanks[donorType].oldest++;
                    bloodBanks[donorType].bankTotal--;
                    bloodBanks[donorType].outofBankTotal++;
                    removeUsedBlood(donorType);
                    emit BloodMatched(_bloodTypeReci, donorType, codeToBeReturned, block.timestamp);
                    return (codeToBeReturned, bloodGroupToBeReturned);
                }
            }
        }
        return (codeToBeReturned, bloodGroupToBeReturned);
    }

    function isCompatible(BloodType recipient, BloodType donor) private view returns (bool) {
        for (uint i = 0; i < compatibility[recipient].length; i++) {
            if (compatibility[recipient][i] == donor) {
                return true;
            }
        }
        return false;
    }

    function removeUsedBlood(BloodType _bloodType) private {
        BloodType[] memory newQueue = new BloodType[](bloodTypeQueue.length - 1);
        uint j = 0;
        bool removed = false;
        for (uint i = 0; i < bloodTypeQueue.length; i++) {
            if (bloodTypeQueue[i] != _bloodType || removed) {
                newQueue[j] = bloodTypeQueue[i];
                j++;
            } else {
                removed = true;
            }
        }
        bloodTypeQueue = newQueue;
    }

    function viewBankTotal() public view returns (uint) {
        return (
            bloodBanks[BloodType.Ap].bankTotal +
            bloodBanks[BloodType.An].bankTotal +
            bloodBanks[BloodType.Bp].bankTotal +
            bloodBanks[BloodType.Bn].bankTotal +
            bloodBanks[BloodType.ABp].bankTotal +
            bloodBanks[BloodType.ABn].bankTotal +
            bloodBanks[BloodType.Op].bankTotal +
            bloodBanks[BloodType.On].bankTotal
        );
    }

    function viewBloodGroupBankTotal(BloodType _bloodGrop) public view returns (uint) {
        return (bloodBanks[_bloodGrop].bankTotal);
    }

    function viewTotalSpent() public view returns (uint) {
        return (
            bloodBanks[BloodType.Ap].outofBankTotal +
            bloodBanks[BloodType.An].outofBankTotal +
            bloodBanks[BloodType.Bp].outofBankTotal +
            bloodBanks[BloodType.Bn].outofBankTotal +
            bloodBanks[BloodType.ABp].outofBankTotal +
            bloodBanks[BloodType.ABn].outofBankTotal +
            bloodBanks[BloodType.Op].outofBankTotal +
            bloodBanks[BloodType.On].outofBankTotal
        );
    }

    function viewGroupTotal(BloodType _bloodType) public view returns(uint) {
        return (bloodBanks[_bloodType].totalBlood);
    }

    function viewTotal() public view returns(uint) {
        return (totalBloodAll);
    }

    function viewOldestTime() public view returns(uint, uint, uint, uint, uint, uint, uint, uint) {
        return (ApTime(), AnTime(), BpTime(), BnTime(), ABpTime(), ABnTime(), OpTime(), OnTime());
    }

    // Time functions
    function ApTime() private view returns(uint) {
        return bloodBanks[BloodType.Ap].bloodAges[bloodBanks[BloodType.Ap].oldest].time;
    }

    function AnTime() private view returns(uint) {
        return bloodBanks[BloodType.An].bloodAges[bloodBanks[BloodType.An].oldest].time;
    }

    function BpTime() private view returns(uint) {
        return bloodBanks[BloodType.Bp].bloodAges[bloodBanks[BloodType.Bp].oldest].time;
    }

    function BnTime() private view returns(uint) {
        return bloodBanks[BloodType.Bn].bloodAges[bloodBanks[BloodType.Bn].oldest].time;
    }

    function ABpTime() private view returns(uint) {
        return bloodBanks[BloodType.ABp].bloodAges[bloodBanks[BloodType.ABp].oldest].time;
    }

    function ABnTime() private view returns(uint) {
        return bloodBanks[BloodType.ABn].bloodAges[bloodBanks[BloodType.ABn].oldest].time;
    }

    function OpTime() private view returns(uint) {
        return bloodBanks[BloodType.Op].bloodAges[bloodBanks[BloodType.Op].oldest].time;
    }

    function OnTime() private view returns(uint) {
        return bloodBanks[BloodType.On].bloodAges[bloodBanks[BloodType.On].oldest].time;
    }
}