import { processTransactions } from './transactions';

const handlerLoadParams = () => {
  return { chainId: Number(BUILD_CHAIN_ID) };
};

export async function handler(event) {
  const params = handlerLoadParams();

  await processTransactions(event, params);
}
