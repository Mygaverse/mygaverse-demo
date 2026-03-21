// components/tables/utils/columnHelpers.ts
export const getStickyOffsets = (columns: any[]) => {
  let currentOffset = 0;
  return columns.map(col => {
    if (col.sticky === 'left') {
      const offset = `${currentOffset}px`;
      currentOffset += parseInt(col.width || '100');
      return { ...col, stickyOffset: offset };
    }
    return col;
  });
};