import { Wallet } from 'ethers';
import { Provider } from '@ethersproject/providers';
import { RelayerAccount } from '../types';

// Takes a generic set of providers, the lambda event params (in the case of an OZ Defender setup),
// and an optional EOA private key and creates a RelayerAccount
export const instantiateRelayerAccount = async (
  readProvider: Provider,
  customRelayerPrivateKey?: string,
): Promise<RelayerAccount> => {
  let wallet, signer, relayerAddress, ozRelayer;

  wallet = new Wallet(customRelayerPrivateKey, readProvider);
  relayerAddress = wallet.address;
  signer = wallet;

  return { wallet, signer, relayerAddress };
};
