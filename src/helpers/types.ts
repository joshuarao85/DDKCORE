export enum TransactionStatus {
    CREATED,
    QUEUED,
    PROCESSED,
    QUEUED_AS_CONFLICTED,
    VERIFIED,
    UNCOFIRM_APPLIED,
    PUT_IN_POOL,
    BROADCASTED,
    APPLIED,
    DECLINED
}

export class Transaction {
    id: string;
    recipientId: string;
    senderId: string;
    type: number;
    timestamp: number;
    senderPublicKey: string;
    status?: TransactionStatus;

    [anyKeys: string]: any;
}

export class Account {
    username: string;
    u_username: string;
    status: number;
    isDelegate: number;
    u_isDelegate: number;
    url: string;
    secondSignature: number;
    u_secondSignature: number;
    address: string;
    publicKey: any;
    secondPublicKey: any;
    balance: number;
    u_balance: number;
    voteCount: number;
    vote: number;
    rate: number;
    delegates: string;
    u_delegates: string;
    multisignatures: any;
    u_multisignatures: any;
    multimin: number;
    u_multimin: number;
    multilifetime: number;
    u_multilifetime: number;
    blockId: string;
    nameexist: number;
    u_nameexist: number;
    producedblocks: number;
    missedblocks: number;
    fees: number;
    rewards: number;
    acc_type: number;
    transferedAmount: number;
    endTime: any;
    totalFrozeAmount: number;
    u_totalFrozeAmount: number;
    isMigrated: number;
    name: string;
    email: string;
    country: string;
    phoneNumber: string;
    referralLink: string;
    group_bonus: number;
    pending_group_bonus: number;
    introducer: string;
    virgin: number;
    global: boolean;

    constructor(rawData: any) {
        this.username = rawData.username;
        this.u_username = rawData.u_username;
        this.status = Number(rawData.status);
        this.isDelegate = Number(rawData.isDelegate);
        this.u_isDelegate = Number(rawData.u_isDelegate);
        this.url = rawData.url;
        this.secondSignature = Number(rawData.secondSignature);
        this.u_secondSignature = Number(rawData.u_secondSignature);
        this.address = rawData.address;
        this.publicKey = rawData.publicKey;
        this.secondPublicKey = rawData.secondPublicKey;
        this.balance = Number(rawData.balance);
        this.u_balance = Number(rawData.u_balance);
        this.voteCount = Number(rawData.voteCount);
        this.vote = Number(rawData.vote);
        this.rate = Number(rawData.rate);
        this.delegates = rawData.delegates;
        this.u_delegates = rawData.u_delegates;
        this.multisignatures = rawData.multisignatures;
        this.u_multisignatures = rawData.u_multisignatures;
        this.multimin = Number(rawData.multimin);
        this.u_multimin = Number(rawData.u_multimin);
        this.multilifetime = Number(rawData.multilifetime);
        this.u_multilifetime = Number(rawData.u_multilifetime);
        this.blockId = rawData.blockId;
        this.nameexist = Number(rawData.nameexist);
        this.u_nameexist = Number(rawData.u_nameexist);
        this.producedblocks = Number(rawData.producedblocks);
        this.missedblocks = Number(rawData.missedblocks);
        this.fees = Number(rawData.fees);
        this.rewards = Number(rawData.rewards);
        this.acc_type = Number(rawData.acc_type);
        this.transferedAmount = Number(rawData.transferedAmount);
        this.endTime = rawData.endTime;
        this.totalFrozeAmount = Number(rawData.totalFrozeAmount);
        this.u_totalFrozeAmount = Number(rawData.u_totalFrozeAmount);
        this.isMigrated = Number(rawData.isMigrated);
        this.name = rawData.name;
        this.email = rawData.email;
        this.country = rawData.country;
        this.phoneNumber = rawData.phoneNumber;
        this.referralLink = rawData.referralLink;
        this.group_bonus = Number(rawData.group_bonus);
        this.pending_group_bonus = Number(rawData.pending_group_bonus);
        this.introducer = rawData.introducer;
        this.virgin = Number(rawData.virgin);
        this.global = rawData.global;
    }
}
