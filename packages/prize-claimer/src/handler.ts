import { ethers } from 'ethers';
import {
  instantiateRelayerAccount,
  PrizeClaimerConfigParams,
  RelayerAccount,
} from '@generationsoftware/pt-v5-autotasks-library';

import { executeTransactions } from './transactions';

export async function handler(event) {
  const chainId = Number(BUILD_CHAIN_ID);
  const readProvider = new ethers.providers.JsonRpcProvider(BUILD_JSON_RPC_URI, chainId);

  const relayerAccount: RelayerAccount = await instantiateRelayerAccount(
    readProvider,
    BUILD_CUSTOM_RELAYER_PRIVATE_KEY,
  );

  const prizeClaimerConfigParams: PrizeClaimerConfigParams = {
    ...relayerAccount,
    chainId,
    readProvider,
    covalentApiKey: BUILD_COVALENT_API_KEY,
    feeRecipient: BUILD_FEE_RECIPIENT,
    useFlashbots: BUILD_USE_FLASHBOTS,
    minProfitThresholdUsd: Number(BUILD_MIN_PROFIT_THRESHOLD_USD),
  };

  await executeTransactions(prizeClaimerConfigParams);
}
