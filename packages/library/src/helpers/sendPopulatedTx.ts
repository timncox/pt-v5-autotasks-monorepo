import { ethers, BigNumber, PopulatedTransaction, Wallet } from 'ethers';
import chalk from 'chalk';

import { SendTransactionArgs, WalletSendTransactionArgs } from '../types';
import { printSpacer } from '../utils';

const ONE_GWEI = '1000000000';

export const sendPopulatedTx = async (
  wallet: Wallet,
  populatedTx: PopulatedTransaction,
  gasLimit: number,
  gasPrice: BigNumber,
  useFlashbots?: boolean,
): Promise<ethers.providers.TransactionResponse> => {
  const isPrivate = false;
  // const isPrivate = useFlashbots ? canUseIsPrivate(chainId, useFlashbots) : false;
  console.log(chalk.green.bold(`Flashbots (Private transaction) support:`, isPrivate));
  printSpacer();

  const sendTransactionArgs: SendTransactionArgs = {
    data: populatedTx.data,
    to: populatedTx.to,
    gasLimit,
    gasPrice: gasPrice.add(ONE_GWEI).toString(),
  };

  const args: WalletSendTransactionArgs = {
    ...sendTransactionArgs,
  };
  const tx = await wallet.sendTransaction(args);

  return tx;
};
