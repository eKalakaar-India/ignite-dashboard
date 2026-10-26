import { DEFAULT_PAGE_SIZE } from './constants.js';

export const buildPagination = ({ page = 1, pageSize = DEFAULT_PAGE_SIZE, total = 0 }) => {
  const currentPage = Math.max(1, Number(page));
  const limit = Math.max(1, Number(pageSize));
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    page: currentPage,
    pageSize: limit,
    total,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  };
};

export const getPaginationParams = (query) => {
  const page = Number(query.page ?? 1);
  const pageSize = Number(query.pageSize ?? DEFAULT_PAGE_SIZE);

  return {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : DEFAULT_PAGE_SIZE,
  };
};
