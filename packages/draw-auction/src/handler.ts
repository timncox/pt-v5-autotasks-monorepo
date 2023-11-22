import { ethers } from 'ethers';
import {
  instantiateRelayerAccount,
  DrawAuctionConfigParams,
  RelayerAccount,
} from '@generationsoftware/pt-v5-autotasks-library';

import { executeTransactions } from './transactions';

export async function handler(event) {
  const rngReadProvider = new ethers.providers.JsonRpcProvider(
    BUILD_JSON_RPC_URI,
    Number(BUILD_CHAIN_ID),
  );

  const relayerAccount: RelayerAccount = await instantiateRelayerAccount(
    rngReadProvider,
    BUILD_CUSTOM_RELAYER_PRIVATE_KEY,
  );

  const drawAuctionConfigParams: DrawAuctionConfigParams = {
    rngChainId: Number(BUILD_CHAIN_ID),
    rngWallet: relayerAccount.wallet,
    rngRelayerAddress: relayerAccount.relayerAddress,
    rngReadProvider,
    signer: relayerAccount.signer,
    covalentApiKey: BUILD_COVALENT_API_KEY,
    rewardRecipient: BUILD_REWARD_RECIPIENT,
    useFlashbots: BUILD_USE_FLASHBOTS,
    minProfitThresholdUsd: Number(BUILD_MIN_PROFIT_THRESHOLD_USD),
  };
  console.log('JSON.parse(BUILD_RELAYS)');
  console.log(BUILD_RELAYS);

  await executeTransactions(drawAuctionConfigParams, BUILD_RELAYS);
}
