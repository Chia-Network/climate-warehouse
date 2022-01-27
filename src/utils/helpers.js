'use strict';

import _ from 'lodash';

export const paginationParams = (page, limit) => {
  if (page === undefined || limit === undefined) {
    return {
      offset: undefined,
      limit: undefined,
    };
  }

  if (page < 1) {
    page = 1;
  }

  if (limit < 1) {
    limit = 1;
  }

  return {
    limit: limit ? limit : 15,
    offset: (page ? page - 1 : 0) * limit,
  };
};

export const optionallyPaginatedResponse = ({ count, rows }, page, limit) => {
  if (page) {
    return {
      page,
      pageCount: Math.ceil(count / (limit || 15)),
      data: rows,
    };
  } else {
    return rows;
  }
};

export const columnsToInclude = (userColumns, foreignKeys) => {
  const attributeModelMap = foreignKeys.map(
    (relationship) => relationship.name + 's',
  );

  const filteredIncludes = _.intersection(userColumns, attributeModelMap).map(
    (fk) =>
      foreignKeys.find((model) => {
        return model.name === fk.substring(0, fk.length - 1);
      }),
  );

  return {
    attributes: userColumns.filter(
      (column) => !attributeModelMap.includes(column),
    ),
    include: filteredIncludes.map((include) => {
      if (include.name === 'label') {
        return {
          model: include,
          as: include.name + 's',
        };
      }
      return include;
    }),
  };
};

export const defaultSerialNumberPattern = /[.*\D]+([0-9]+)+[-][.*\D]+([0-9]+)$/;

export const transformSerialNumberBlock = (
  serialNumberBlock,
  // serial number format: ABC1000-ABC1010
  serialNumberPattern,
) => {
  const unitBlocks = serialNumberBlock.match(serialNumberPattern);

  if (!unitBlocks) {
    return [null, null, null];
  }

  const blockStart = Number(unitBlocks[1]);
  const blockEnd = Number(unitBlocks[2]);
  return [blockStart, blockEnd, blockEnd - blockStart];
};

export const createSerialNumberStr = (
  originalSerialNumberBlock,
  blockStart,
  blockEnd,
  serialNumberPattern = defaultSerialNumberPattern,
) => {
  const unitBlocks = originalSerialNumberBlock.match(serialNumberPattern);
  return unitBlocks[0]
    .replace(unitBlocks[1], blockStart)
    .replace(unitBlocks[2], blockEnd);
};
