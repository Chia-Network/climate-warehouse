import _ from 'lodash';

import * as dataLayer from './persistance';
import wallet from './wallet';
import * as simulator from './simulator';
import { encodeHex, decodeHex } from '../utils/datalayer-utils';
import { getConfig } from '../utils/config-loader';
import { logger } from '../config/logger.cjs';

logger.info('climate-warehouse:datalayer:writeService');

const { USE_SIMULATOR } = getConfig().APP;

const createDataLayerStore = async () => {
  let storeId;
  if (USE_SIMULATOR) {
    storeId = await simulator.createDataLayerStore();
  } else {
    storeId = await dataLayer.createDataLayerStore();

    logger.info(
      `Created storeId: ${storeId}, waiting for this to be confirmed on the blockchain.`,
    );
    await waitForStoreToBeConfirmed(storeId);
  }

  return storeId;
};

const waitForStoreToBeConfirmed = async (storeId, retry = 0) => {
  if (retry > 120) {
    throw new Error(
      `Creating storeId: ${storeId} timed out. Its possible the transaction is stuck.`,
    );
  }

  const storeExistAndIsConfirmed = await dataLayer.getRoot(storeId);

  if (!storeExistAndIsConfirmed) {
    logger.info(`Still waiting for ${storeId} to confirm`);
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 30000);
    });
    return waitForStoreToBeConfirmed(storeId, retry + 1);
  }
  logger.info(`StoreId: ${storeId} has been confirmed. Congrats!`);
};

const syncDataLayer = async (storeId, data, failedCallback) => {
  logger.info(`Syncing ${storeId}`);
  const changeList = Object.keys(data).map((key) => {
    return {
      action: 'insert',
      key: encodeHex(key),
      value: encodeHex(data[key]),
    };
  });

  await pushChangesWhenStoreIsAvailable(storeId, changeList, failedCallback);
};

const retry = (storeId, changeList, failedCallback, retryAttempts) => {
  logger.info(`Retrying pushing to store ${storeId}: ${retryAttempts}`);
  if (retryAttempts >= 60) {
    logger.info(
      'Could not push changelist to datalayer after retrying 10 times',
    );
    failedCallback();
    return;
  }

  setTimeout(async () => {
    await pushChangesWhenStoreIsAvailable(
      storeId,
      changeList,
      failedCallback,
      retryAttempts + 1,
    );
  }, 30000);
};

const pushChangesWhenStoreIsAvailable = async (
  storeId,
  changeList,
  failedCallback = _.noop,
  retryAttempts = 0,
) => {
  if (USE_SIMULATOR) {
    return simulator.pushChangeListToDataLayer(storeId, changeList);
  } else {
    const hasUnconfirmedTransactions =
      await wallet.hasUnconfirmedTransactions();

    const storeExistAndIsConfirmed = await dataLayer.getRoot(storeId);

    if (!hasUnconfirmedTransactions && storeExistAndIsConfirmed) {
      logger.info(
        `pushing to datalayer ${storeId} ${JSON.stringify(
          changeList.map((change) => {
            return {
              action: change.action,
              key: decodeHex(change.key),
              value: /{([^*]*)}/.test(decodeHex(change.value))
                ? JSON.parse(decodeHex(change.value))
                : decodeHex(change.value),
            };
          }),
          null,
          2,
        )}`,
      );

      const success = await dataLayer.pushChangeListToDataLayer(
        storeId,
        changeList,
      );

      if (!success) {
        logger.info(
          `RPC failed when pushing to store ${storeId}, attempting retry.`,
        );
        retry(storeId, changeList, failedCallback, retryAttempts);
      }
    } else {
      retry(storeId, changeList, failedCallback, retryAttempts);
    }
  }
};

const pushDataLayerChangeList = (storeId, changeList, failedCallback) => {
  pushChangesWhenStoreIsAvailable(storeId, changeList, failedCallback);
};

const dataLayerAvailable = async () => {
  if (USE_SIMULATOR) {
    return simulator.dataLayerAvailable();
  } else {
    return dataLayer.dataLayerAvailable();
  }
};

export default {
  dataLayerAvailable,
  pushDataLayerChangeList,
  syncDataLayer,
  createDataLayerStore,
};
