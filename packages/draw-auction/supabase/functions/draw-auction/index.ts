import { Wallet, ethers } from 'ethers';
// import { RelayerParams } from '@openzeppelin/defender-relay-client';
import {
  executeDrawAuctionTxs,
  Relay,
  RelayConfig,
  instantiateRelayerAccount,
  DrawAuctionConfigParams,
  RelayerAccount,
} from '@generationsoftware/pt-v5-autotasks-library';

interface StringMap {
  [key: string]: string;
}

export const CHAIN_IDS = {
  mainnet: 1,
  optimism: 10,
  arbitrum: 42161,
  arbitrumGoerli: 421613,
  arbitrumSepolia: 421614,
  sepolia: 11155111,
  optimismSepolia: 11155420,
};

export const CONTRACTS_STORE: StringMap = {
  [CHAIN_IDS.mainnet]:
    'https://raw.githubusercontent.com/GenerationSoftware/pt-v5-mainnet/a1b2e242447006908ab43ddd922540a04de8cb44/deployments/ethereum/contracts.json',
  [CHAIN_IDS.optimism]:
    'https://raw.githubusercontent.com/GenerationSoftware/pt-v5-mainnet/50a56ede71b3e9f4a2ba3bc6a8ae48360f70aa86/deployments/optimism/contracts.json',
  [CHAIN_IDS.sepolia]:
    'https://raw.githubusercontent.com/GenerationSoftware/pt-v5-testnet/d44412f6392888a3a1e9f16fca93e2de45f85033/deployments/ethSepolia/contracts.json',
  [CHAIN_IDS.arbitrumSepolia]:
    'https://raw.githubusercontent.com/GenerationSoftware/pt-v5-testnet/83632ac5a6edaa8f01dce24a6fa637d6191d772a/deployments/arbitrumSepolia/contracts.json',
  [CHAIN_IDS.optimismSepolia]:
    'https://raw.githubusercontent.com/GenerationSoftware/pt-v5-testnet/d44412f6392888a3a1e9f16fca93e2de45f85033/deployments/optimismSepolia/contracts.json',
};

export interface TokenData {
  chainId: number;
  address: string;
  name: string;
  decimals: number;
  symbol: string;
  extensions: {
    underlyingAsset: {
      address: string;
      symbol: string;
      name: string;
    };
  };
}

export interface ContractData {
  address: string;
  chainId: number;
  type: string;
  abi: any;
  version: {
    major: number;
    minor: number;
    patch: number;
  };
  tokens?: TokenData[];
}

export interface ContractsBlob {
  name: string;
  version: {
    major: number;
    minor: number;
    patch: number;
  };
  timestamp: string;
  contracts: ContractData[];
}

// const nodeFetch = require('node-fetch');

/**
 * Downloads the latest contracts blob from the raw data source on GitHub
 * @param {number} chainId
 * @returns {ContractsBlob} contracts
 */
export const downloadContractsBlob = async (chainId: number): Promise<ContractsBlob> => {
  let contracts;

  // if (!fetch) {
  //   fetch = nodeFetch;
  // }

  try {
    const response = await fetch(CONTRACTS_STORE[chainId.toString()]);
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    const body = await response.json();
    contracts = body;
  } catch (err) {
    console.log(err);
  }

  return contracts;
};

// This sets up each relay config with a Relay object containing it's contracts,
// relayerAccount, read and write providers and chainId
export const getRelays = async (relayConfigs: RelayConfig[]): Promise<Relay[]> => {
  let relays: Relay[] = [];

  for (const relayConfig of Object.values(relayConfigs)) {
    const chainId = Number(relayConfig.RELAY_CHAIN_ID);

    const mockEvent = {
      apiKey: relayConfig.RELAY_RELAYER_API_KEY,
      apiSecret: relayConfig.RELAY_RELAYER_API_SECRET,
    };

    const readProvider = new ethers.providers.JsonRpcProvider(
      relayConfig.RELAY_JSON_RPC_URI,
      chainId,
    );
    const writeProvider = readProvider;

    const relayerAccount: RelayerAccount = await instantiateRelayerAccount(
      writeProvider,
      readProvider,
      mockEvent,
      relayConfig.RELAY_CUSTOM_RELAYER_PRIVATE_KEY,
    );

    const contractsBlob: ContractsBlob = await downloadContractsBlob(chainId);

    relays.push({
      chainId,
      contractsBlob,
      relayerAccount,
      readProvider,
      writeProvider,
    });
  }

  return relays;
};

export const executeTransactions = async (
  drawAuctionConfigParams: DrawAuctionConfigParams,
  relayConfig,
): Promise<void> => {
  // try {
  console.log('dl');
  const rngContracts = await downloadContractsBlob(drawAuctionConfigParams.rngChainId);
  console.log('rngContracts');
  console.log(rngContracts);
  const relays: Relay[] = await getRelays(relayConfig);
  console.log('relays');
  console.log(relays);

  await executeDrawAuctionTxs(rngContracts, drawAuctionConfigParams, relays);
  // } catch (e) {
  // console.error(e);
  // }
};

// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

console.log('Hello from Functions!');

Deno.serve(async (req) => {
  const { name } = await req.json();
  const data = {
    message: `Hello ${name}!`,
  };

  const rngReadProvider = new ethers.providers.JsonRpcProvider(
    'https://eth-sepolia.g.alchemy.com/v2/9xg3A76SbSW4X4IpBL6aZJdU_GJhbvkL',
    11155111,
  );
  const wallet = new Wallet(
    '5ca7399a6c56cc5f849c521e1136cfabf992bf12d4094d0e90db60c41f42b462',
    rngReadProvider,
  );
  let relayerAccount = { relayerAddress: wallet.address, relayer: wallet, signer: wallet };

  const drawAuctionConfigParams: DrawAuctionConfigParams = {
    rngChainId: 11155111,
    rngRelayer: relayerAccount.relayer,
    rngRelayerAddress: relayerAccount.relayerAddress,
    rngReadProvider,
    signer: relayerAccount.signer,
    covalentApiKey: 'cqt_rQFBjYK3rbc4fVqDQR7mRPX67cKb',
    rewardRecipient: '0x49ca801A80e31B1ef929eAB13Ab3FBbAe7A55e8F',
    useFlashbots: false,
    minProfitThresholdUsd: Number(1),
  };
  console.log('drawAuctionConfigParams');
  console.log(drawAuctionConfigParams);
  console.log(rngReadProvider);

  await executeTransactions(drawAuctionConfigParams, {
    '421614': {
      RELAY_CHAIN_ID: '421614',
      RELAY_RELAYER_API_KEY: 'd',
      RELAY_RELAYER_API_SECRET: 'e',
      RELAY_JSON_RPC_URI: 'https://arb-sepolia.g.alchemy.com/v2/FcAZ5PWxkgHjtvNd8zL0IfZMVFAwQaQ4',
      RELAY_CUSTOM_RELAYER_PRIVATE_KEY:
        '5ca7399a6c56cc5f849c521e1136cfabf992bf12d4094d0e90db60c41f42b462',
    },
  });

  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/draw-auction' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
