import { Contract, BigNumber, Wallet } from 'ethers';
import { BaseProvider, Provider } from '@ethersproject/providers';
import { ContractsBlob, TierPrizeData } from '@generationsoftware/pt-v5-utils-js';

import { DrawAuctionState } from './utils/getDrawAuctionContextMulticall';

export interface ArbLiquidatorRelayerContext {
  tokenInAllowance: BigNumber;
  tokenInBalance: BigNumber;
}

export interface DrawAuctionRelayerContext {
  rngFeeTokenAllowance: BigNumber;
  rngFeeTokenBalance: BigNumber;
}

export interface ProviderOptions {
  chainId: number;
  provider: Provider;
}

export interface Token {
  name: string;
  decimals: number;
  address: string;
  symbol: string;
}

export interface TokenWithRate extends Token {
  assetRateUsd: number;
}

export interface TiersContext {
  numTiers: number;
  tiersRangeArray: number[];
}

export interface ClaimPrizeContext {
  feeToken: TokenWithRate;
  drawId: number;
  isDrawFinalized: boolean;
  tiers: TiersContext;
  tierPrizeData: {
    [tierNum: string]: TierPrizeData;
  };
}

export interface PrizeClaimerConfigParams {
  chainId: number;
  readProvider: BaseProvider;
  wallet: Wallet;
  relayerAddress: string;
  signer: Wallet;
  feeRecipient: string;
  useFlashbots: boolean;
  minProfitThresholdUsd: number;
  covalentApiKey?: string;
}

export interface ArbLiquidatorConfigParams {
  chainId: number;
  readProvider: BaseProvider;
  writeProvider: Provider;
  wallet: Wallet;
  relayerAddress: string;
  signer: Wallet;
  swapRecipient: string;
  useFlashbots: boolean;
  minProfitThresholdUsd: number;
  covalentApiKey?: string;
}

export interface ArbLiquidatorContext {
  tokenIn: TokenWithRate;
  tokenOut: Token;
  underlyingAssetToken: TokenWithRate;
  relayer: ArbLiquidatorRelayerContext;
}

export interface WithdrawClaimRewardsConfigParams {
  chainId: number;
  rewardsRecipient: string;
  relayerAddress: string;
  minProfitThresholdUsd: number;
  covalentApiKey?: string;
}

export interface WithdrawClaimRewardsContext {
  rewardsToken: TokenWithRate;
}

export interface DrawAuctionConfigParams {
  rngChainId: number;
  rngReadProvider: BaseProvider;
  rngWallet: Wallet;
  rngRelayerAddress: string;
  signer: Wallet;
  rewardRecipient: string;
  useFlashbots: boolean;
  minProfitThresholdUsd: number;
  covalentApiKey?: string;
}

export interface RngDrawAuctionContext {
  rngFeeTokenIsSet: boolean;
  rngFeeToken: TokenWithRate;
  rngFeeAmount: BigNumber;
  rngFeeUsd: number;
  rngIsAuctionOpen: boolean;
  rngIsRngComplete: boolean;
  rngCurrentFractionalRewardString: string;
  rngRelayer: DrawAuctionRelayerContext;
}

export interface DrawAuctionContext extends RngDrawAuctionContext {
  rngNativeTokenMarketRateUsd: number;
  relays: Relay[];
  drawAuctionState?: DrawAuctionState;
  rngExpectedRewardTotal?: BigNumber; // sum of all rewards from all prize pools
  rngExpectedRewardTotalUsd?: number; // sum of all rewards from all prize pools in USD
}

export interface RngResults {
  randomNumber: BigNumber;
  rngCompletedAt: number;
}

export interface AuctionResult {
  recipient: string;
  rewardFraction: number;
}

export interface RelayDrawAuctionContext {
  prizePoolOpenDrawEndsAt: number;
  rngResults: RngResults;
  rngLastAuctionResult: AuctionResult;
  rngExpectedReward: number; // why is this a number and not a BigNumber like `rngRelayExpectedReward` or `rngExpectedReward`?
  rngExpectedRewardUsd: number;
  rewardToken: TokenWithRate;
  rngRelayIsAuctionOpen: boolean;
  rngRelayExpectedReward: BigNumber;
  rngRelayExpectedRewardUsd: number;
  rngRelayLastSequenceId: number;
  nativeTokenMarketRateUsd?: number;
}

export interface RelayConfig {
  RELAY_CHAIN_ID: string;
  RELAY_RELAYER_API_KEY: string;
  RELAY_RELAYER_API_SECRET: string;
  RELAY_JSON_RPC_URI: string;
  RELAY_CUSTOM_RELAYER_PRIVATE_KEY?: string;
}

export interface Relay {
  chainId: number;
  contractsBlob: ContractsBlob;
  relayerAccount: RelayerAccount;
  readProvider: BaseProvider;
  writeProvider: Provider;
  contracts?: RelayAuctionContracts;
  context?: RelayDrawAuctionContext;
}

export interface RelayerAccount {
  signer: Wallet;
  relayerAddress: string;
  wallet: Wallet;
}

export interface RngAuctionContracts {
  chainlinkVRFV2DirectRngAuctionHelperContract: Contract;
  rngAuctionContract: Contract;
  rngAuctionRelayerRemoteOwnerContracts: Contract[];
  rngAuctionRelayerDirect?: Contract;
}

export interface RelayAuctionContracts {
  prizePoolContract: Contract;
  remoteOwnerContract: Contract;
  rngRelayAuctionContract: Contract;
}

export interface VaultWithContext {
  id: string;
  vaultContract: Contract;
  liquidationPair?: string;
  asset?: string;
}

export interface YieldVaultMintRateConfigParams {
  chainId: number;
  wallet: Wallet;
  readProvider: BaseProvider;
  relayerAddress: string;
  signer: Wallet;
}

export interface SendTransactionArgs {
  data: string;
  to: string;
  gasLimit: number;
  gasPrice: string;
}

export interface WalletSendTransactionArgs extends SendTransactionArgs {
  value?: BigNumber;
}
