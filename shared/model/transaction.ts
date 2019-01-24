export enum TransactionType {
    REGISTER = 0,
    SEND = 10,
    SIGNATURE = 20,
    DELEGATE = 30,
    STAKE = 40,
    SENDSTAKE = 50,
    VOTE = 60,
    MULTI = 70,
    DAPP = 80,
    IN_TRANSFER = 90,
    OUT_TRANSFER = 100,
}

export enum TransactionStatus {
    CREATED,
    QUEUED,
    PROCESSED,
    QUEUED_AS_CONFLICTED,
    VERIFIED,
    UNCONFIRM_APPLIED,
    PUT_IN_POOL,
    BROADCASTED,
    APPLIED,
    DECLINED
}
export interface IModelAsset {

}

export interface IModelTransaction<T extends IModelAsset> {
    id: string;
    blockId: string;
    type: number;
    senderPublicKey: string;
    senderId: string;
    recipientId: string;
    signature: string;
    trsName: TransactionType;
    rowId?: number; // useless
    amount?: bigint;
    timestamp?: number;
    stakedAmount?: bigint; // useless ?
    stakeId?: string; // useless
    groupBonus?: bigint; // useless
    pendingGroupBonus?: bigint; // useless
    fee?: bigint;
    signSignature?: string;
    requesterPublicKey?: string; // useless
    signatures?: string; // useless
    reward?: string; // useless
    status?: TransactionStatus;
    asset?: T;
}

export interface IAirdropAsset {
    withAirdropReward: boolean;
    sponsors: Array<string>;
    totalReward: number;
}

export interface IAsset {

}

export interface IAssetRegister extends IAsset {
    referral: string;
}

export interface IAssetTransfer extends IAsset {
    recipientId: string;
}

export interface IAssetSignature extends IAsset {
    publicKey: string;
}

export interface IAssetDelegate extends IAsset {
    username: string;
    url?: string;
}

// TODO rewrite in future
export interface IAssetStake extends IAsset {
    stakeOrder: {
        stakedAmount: number,
        nextVoteMilestone: number,
        startTime: number
    };
    airdropReward: IAirdropAsset;

}

export interface IAssetSendStake extends IAsset {
    recipientId: string;
}

export interface IAssetVote extends IAsset {
    votes: Array<string>;
    reward: number;
    unstake: number;
    airdropReward: IAirdropAsset;
}

export class Transaction<T extends IAsset> {
    id: string;
    blockId: string;
    type: number;
    senderPublicKey: string;
    senderId: string;
    recipientId: string;
    signature: string;
    trsName: TransactionType;
    amount?: bigint;
    timestamp?: number;
    stakedAmount?: bigint; // useless ?
    fee?: bigint;
    signSignature?: string;
    status?: TransactionStatus;
    asset?: T;
}
