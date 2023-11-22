import { Contract, PopulatedTransaction } from '@ethersproject/contracts';
import { ContractsBlob, getContracts } from '@generationsoftware/pt-v5-utils-js';
import { YieldVaultMintRateConfigParams } from './types';
import { getGasPrice } from './utils';
import { sendPopulatedTx } from './helpers/sendPopulatedTx';

export async function runYieldVaultHandleMintRate(
  contracts: ContractsBlob,
  params: YieldVaultMintRateConfigParams,
): Promise<void> {
  const { chainId, wallet, readProvider } = params;

  const yieldVaultContracts: Contract[] = getContracts('YieldVault', chainId, wallet, contracts);

  for (const yieldVaultContract of yieldVaultContracts) {
    if (!yieldVaultContract) {
      throw new Error('YieldVault: Contract Unavailable');
    }

    const populatedTx: PopulatedTransaction = await yieldVaultContract.populateTransaction.mintRate();

    try {
      const gasLimit = 200000;
      const { gasPrice } = await getGasPrice(readProvider);
      const tx = await sendPopulatedTx(wallet, populatedTx, gasLimit, gasPrice);
      console.log(`YieldVault: mintRate() ${yieldVaultContract.address}`);

      console.log('TransactionHash:', tx.hash);
      console.log('');
    } catch (error) {
      throw new Error(error);
    }
  }
}
