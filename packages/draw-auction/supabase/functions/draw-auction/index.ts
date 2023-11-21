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
import { downloadContractsBlob, ContractsBlob } from '@generationsoftware/pt-v5-utils-js';

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
  try {
    const rngContracts = await downloadContractsBlob(drawAuctionConfigParams.rngChainId);

    const relays: Relay[] = await getRelays(relayConfig);

    await executeDrawAuctionTxs(rngContracts, drawAuctionConfigParams, relays);
  } catch (e) {
    console.error(e);
  }
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

  // const rngWriteProvider = new DefenderRelayProvider(event);
  const rngReadProvider = new ethers.providers.JsonRpcProvider(
    'https://eth-sepolia.g.alchemy.com/v2/9xg3A76SbSW4X4IpBL6aZJdU_GJhbvkL',
    11155111,
  );

  let signer, relayer, relayerAddress;
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
  console.log(drawAuctionConfigParams);

  // await executeTransactions(drawAuctionConfigParams, BUILD_RELAYS);

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
