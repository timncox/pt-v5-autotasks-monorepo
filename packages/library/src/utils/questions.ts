import chalk from 'chalk';
import Configstore from 'configstore';
import inquirer, { DistinctQuestion } from 'inquirer';

import { CHAIN_IDS } from './network';

export type CHAIN_CONFIG = {
  CHAIN_ID: number; // stores last-selected chain ID
};

export type GLOBAL_CONFIG = {
  DEFENDER_TEAM_API_KEY: string;
  DEFENDER_TEAM_SECRET_KEY: string;
};

export type NETWORK_CONFIG = {
  AUTOTASK_ID: string;
  RELAYER_API_KEY: string;
  RELAYER_API_SECRET: string;
  JSON_RPC_URI: string;
  USE_FLASHBOTS: boolean;
  COVALENT_API_KEY?: string;
};

let newRelays = [];
let relayQuestionsClone: DistinctQuestion[] = [];

export async function askChainId(config: Configstore) {
  // Ask for chain info:
  const previousNetwork = config.has('CHAIN_ID') ? config.get('CHAIN_ID') : null;
  const previousNetworkName = previousNetwork
    ? Object.fromEntries(Object.entries(CHAIN_IDS).map(([name, id]) => [id, name]))[previousNetwork]
    : null;
  const { CHAIN_ID } = await inquirer.prompt({
    name: 'CHAIN_ID',
    type: 'list',
    message: chalk.green('Which network?'),
    choices: [
      ...(previousNetworkName ? [`Last Used (${previousNetworkName})`] : []),
      'Mainnet',
      'Optimism',
      'Arbitrum',
      'Arbitrum Goerli',
      'Goerli',
      'Sepolia',
      'Optimism Goerli',
    ],
    filter(val: string) {
      if (val.startsWith('Last Used')) {
        val = previousNetworkName;
      }
      return CHAIN_IDS[camelize(val)];
    },
  });
  config.set('CHAIN_ID', CHAIN_ID);

  return CHAIN_ID;
}

const GLOBAL_CONFIG_QUESTIONS: {
  [key in keyof GLOBAL_CONFIG]: DistinctQuestion & { name: key };
} = {
  DEFENDER_TEAM_API_KEY: {
    name: 'DEFENDER_TEAM_API_KEY',
    type: 'password',
    message: chalk.green('Enter your OpenZeppelin Defender Team API Key:'),
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return 'Please enter your OpenZeppelin Defender Team API Key.';
      }
    },
  },
  DEFENDER_TEAM_SECRET_KEY: {
    name: 'DEFENDER_TEAM_SECRET_KEY',
    type: 'password',
    message: chalk.green('Enter your OpenZeppelin Defender Team Secret Key:'),
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return 'Please enter your OpenZeppelin Defender Team Secret Key.';
      }
    },
  },
};

/* These will be prefixed in the config with `${CHAIN_ID}.` before the key name. */
export const NETWORK_CONFIG_QUESTIONS: {
  [key in keyof NETWORK_CONFIG]: DistinctQuestion & { name: key };
} = {
  AUTOTASK_ID: {
    name: 'AUTOTASK_ID',
    type: 'input',
    message: chalk.green('Enter your OpenZeppelin Defender Autotask ID:'),
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return 'Please enter your OpenZeppelin Defender Autotask ID.';
      }
    },
  },
  RELAYER_API_KEY: {
    name: 'RELAYER_API_KEY',
    type: 'password',
    message: chalk.green('Enter your OpenZeppelin Defender Relayer API Key:'),
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return 'Please enter your OpenZeppelin Defender Relayer API Key.';
      }
    },
  },
  RELAYER_API_SECRET: {
    name: 'RELAYER_API_SECRET',
    type: 'password',
    message: chalk.green('Enter your OpenZeppelin Defender Relayer API Secret:'),
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return 'Please enter your OpenZeppelin Defender Relayer API Secret.';
      }
    },
  },
  JSON_RPC_URI: {
    name: 'JSON_RPC_URI',
    type: 'password',
    message: chalk.green('Enter your JSON RPC URI:'),
    validate: function(value) {
      if (value.length) {
        return true;
      } else {
        return 'Please enter your JSON RPC URI.';
      }
    },
  },
  COVALENT_API_KEY: {
    name: 'COVALENT_API_KEY',
    type: 'password',
    message: chalk.green('(Optional) Enter your Covalent API key for USD price lookups:'),
  },
  USE_FLASHBOTS: {
    name: 'USE_FLASHBOTS',
    type: 'list',
    message: chalk.green(
      'Use Flashbots (only on ETH mainnet or goerli) to keep transactions private from the mempool and reduce failures?',
    ),
    choices: ['Yes', 'No'],
    filter(val) {
      return val === 'Yes' ? true : false;
    },
  },
};

export const configHasKeys = (config: Configstore | Record<string, any>, keys: string[]) => {
  for (const configKey of keys) {
    if (config instanceof Configstore) {
      if (!config.has(configKey)) return false;
    } else {
      if (!(configKey in config)) return false;
    }
  }
  return true;
};

/**
 * populateConfig
 *
 * Asks global & network configuration questions, saves the results to
 * a configstore, and returns the current config in flattened format
 * (network config at root level with global config).
 */
export const populateConfig = async <
  G extends Record<string, any> = {},
  N extends Record<string, any> = {}
>(
  config: Configstore,
  {
    extraConfig,
  }: {
    extraConfig?: {
      global?: DistinctQuestion[];
      network?: DistinctQuestion[];
      relay?: DistinctQuestion[];
    };
  } = {},
  // TODO: bring this back:
  // ): Promise<CHAIN_CONFIG & GLOBAL_CONFIG & NETWORK_CONFIG & G & N> => {
) => {
  const globalQuestions = [
    ...Object.values(GLOBAL_CONFIG_QUESTIONS),
    ...(extraConfig?.global ?? []),
  ];
  const networkQuestions = [
    ...Object.values(NETWORK_CONFIG_QUESTIONS),
    ...(extraConfig?.network ?? []),
  ];
  const relayQuestions = [...(extraConfig?.relay ?? [])];
  const globalKeys = globalQuestions.map((x) => x.name);
  const networkKeys = networkQuestions.map((x) => x.name);
  const relayKeys = relayQuestions.map((x) => x.name);
  let globalAnswers = {};
  let networkAnswers = {};
  let relayAnswers = {};

  relayQuestionsClone = [...relayQuestions];

  // Ask for chain info:
  const CHAIN_ID = await askChainId(config);

  // Check for global config:
  let useExistingGlobal = false;
  if (configHasKeys(config, globalKeys)) {
    const { USE_GLOBAL_CONFIG } = await inquirer.prompt({
      name: 'USE_GLOBAL_CONFIG',
      type: 'list',
      message: chalk.green(
        `Would you like to use the existing OZ Defender config? (${config.path})`,
      ),
      choices: ['Yes', 'No'],
      filter(val: string) {
        return val.toLowerCase().startsWith('y');
      },
    });
    useExistingGlobal = USE_GLOBAL_CONFIG;
  }

  // Ask global questions:
  if (!useExistingGlobal) {
    globalAnswers = await inquirer.prompt(globalQuestions);
  } else {
    globalAnswers = Object.fromEntries(
      Object.entries(config.all).filter(([key]) => globalKeys.includes(key)),
    );
  }

  // Check for network config:
  let useExistingNetwork = false;
  if (`${CHAIN_ID}` in config.all && configHasKeys(config.all[CHAIN_ID], networkKeys)) {
    const { USE_NETWORK_CONFIG } = await inquirer.prompt({
      name: 'USE_NETWORK_CONFIG',
      type: 'list',
      message: chalk.green(`Would you like to use the existing network config? (${config.path})`),
      choices: ['Yes', 'No'],
      filter(val: string) {
        return val.toLowerCase().startsWith('y');
      },
    });
    useExistingNetwork = USE_NETWORK_CONFIG;
  }

  // Ask network questions:
  if (!useExistingNetwork) {
    networkAnswers = await inquirer.prompt(networkQuestions);
  } else {
    networkAnswers = Object.fromEntries(
      Object.entries(config.all[CHAIN_ID]).filter(([key]) => networkKeys.includes(key)),
    );
  }

  // DRAW AUCTION BOT-specific
  let manageRelayConfig = false;
  if (relayKeys.length > 0) {
    migrateOldRelayEntry(CHAIN_ID, config);

    const { MANAGE_RELAY_CONFIG } = await inquirer.prompt({
      name: 'MANAGE_RELAY_CONFIG',
      type: 'list',
      message: chalk.green(
        'Do you want to manage L2 relay configs (L2s where the RngRelayAuction and PrizePool contracts live)?',
      ),
      choices: ['Yes', 'No'],
      filter(val: string) {
        return val.toLowerCase().startsWith('y');
      },
    });
    manageRelayConfig = MANAGE_RELAY_CONFIG;
  }

  // Ask draw auction bot specific L2-relay questions:
  if (manageRelayConfig) {
    relayAnswers = await relayManagementLoop();
  }

  //
  // Set config:
  //
  let flattenedConfig = { CHAIN_ID };

  // - Global:
  for (const [key, value] of Object.entries(globalAnswers)) {
    config.set(key, value);
    flattenedConfig[key] = value;
  }

  // - Network:
  console.log('networkAnswers');
  console.log(networkAnswers);
  for (const [key, value] of Object.entries(networkAnswers)) {
    config.set(`${CHAIN_ID}.${key}`, value);
    flattenedConfig[key] = value;
  }

  // - Relays:
  // console.log('relayAnswers');
  // console.log(relayAnswers);

  // "RELAY_CHAIN_ID": 420,
  // 	"RELAY_RELAYER_API_KEY": "AbiJnBmruHoz9ip3BSTy5feyy5qNN8UR",
  // 	"RELAY_RELAYER_API_SECRET": "4rmTLgkS7zJ35nxcTAj22eAxpgpdbPCx5FRkYLFovtfWU7oW1WN8s2EyV26t3brn",
  // 	"RELAY_JSON_RPC_URI": "https://optimism-goerli.infura.io/v3/61401d36252f4182864d4b21d98982e5",
  console.log('');
  console.log('this should be undefined:');
  console.log(config.get(`${CHAIN_ID}.RELAY_CHAIN_ID`));
  console.log('');

  const existingRelays = config.get(`${CHAIN_ID}.RELAYS`) || [];
  console.log(existingRelays);
  const updatedRelays = [...existingRelays, ...newRelays];
  console.log(updatedRelays);
  config.set(`${CHAIN_ID}.RELAYS`, updatedRelays);
  // config.set(`${CHAIN_ID}.${key}`, value);
  flattenedConfig['RELAYS'] = updatedRelays;

  console.log('flattenedConfig');
  console.log(flattenedConfig);

  // Return flattened config:
  return flattenedConfig as any;
};

export function camelize(str) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, '');
}

/**
 * Show the relay management menu
 */
const addChoice = 'Add new L2 relay config';
const removeChoice = 'Remove L2 relay';
const continueChoice = 'Continue';
export async function relayManagementLoop(): Promise<object> {
  const relayMenuQuestions = [
    {
      type: 'list',
      name: 'MENU_OPTION',
      message: chalk.blue.italic('Relay management'),
      choices: [
        addChoice,
        removeChoice,
        // 'Show all L2 relay configs',
        continueChoice,
      ],
    },
  ];
  const answer = await inquirer.prompt(relayMenuQuestions);
  console.log('answer1');
  console.log(answer);

  let remove = {};
  switch (answer.MENU_OPTION) {
    case addChoice:
      await mainAddRelay();
      break;
    case removeChoice:
      remove = await mainRemoveRelay();
      break;
    case continueChoice:
      // await mainExit();
      break;
  }

  console.log('answer2');
  console.log(answer);

  return { remove };
}

// function mainExit() {
//   console.log(chalk.green.bold('Relay L2s saved!'));
// }

async function mainAddRelay() {
  const addRelayAnswers = await inquirer.prompt(relayQuestionsClone);
  console.log(
    chalk.yellow(
      'Will add L2 Relay config for network with chain ID:',
      addRelayAnswers['RELAY_CHAIN_ID'],
    ),
  );

  newRelays.push(addRelayAnswers);

  await relayManagementLoop();
}

async function mainRemoveRelay() {
  console.log('remove relay loop here');
  console.log('choose which L2 relay config you would like to remove:');

  const removeRelayAnswer = await inquirer.prompt(['Relay 1', 'Relay 2', 'Relay 3']);

  // asyncReadFile(dataPath).then(
  //   /**
  //    * @param {string} fileCountryList
  //    */
  //   (fileCountryList) => {
  //     const countryList = JSON.parse(fileCountryList);
  //     Country.deleteCountry(countryList).then((newCountryList) => {
  //       asyncWriteFile(dataPath, JSON.stringify(newCountryList))
  //         .then(() => {
  //           main();
  //         })
  //         .catch((error) => {
  //           console.log(error);
  //         });
  //     });
  //   },
  // );

  // await relayManagementLoop();
  return removeRelayAnswer;
}

const migrateOldRelayEntry = (chainId, config) => {
  const chainConfig = config.get(`${chainId}.RELAY_CHAIN_ID`);

  const oldRelay = {
    RELAY_CHAIN_ID: config.get(`${chainId}.RELAY_CHAIN_ID`),
    RELAY_RELAYER_API_KEY: config.get(`${chainId}.RELAY_RELAYER_API_KEY`),
    RELAY_RELAYER_API_SECRET: config.get(`${chainId}.RELAY_RELAYER_API_SECRET`),
    RELAY_JSON_RPC_URI: config.get(`${chainId}.RELAY_JSON_RPC_URI`),
  };

  if (oldRelay['RELAY_RELAYER_API_KEY']?.length > 0) {
    config.set(`${chainId}.RELAYS`, [oldRelay]);

    config.delete(`${chainId}.RELAY_CHAIN_ID`);
    config.delete(`${chainId}.RELAY_RELAYER_API_KEY`);
    config.delete(`${chainId}.RELAY_RELAYER_API_SECRET`);
    config.delete(`${chainId}.RELAY_JSON_RPC_URI`);
  }
};
