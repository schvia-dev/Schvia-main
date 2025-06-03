import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface TableColumn<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyField: keyof T;
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  className?: string;
}

function Table<T>({
  columns,
  data,
  keyField,
  isLoading = false,
  emptyMessage = 'No data available',
  onRowClick,
  className = '',
}: TableProps<T>) {
  const { theme } = useTheme();

  // build tailwind classes rather than raw strings
  const bgClass     = theme === 'light' ? 'bg-white' : 'bg-[#3F3D56]';
  const textClass   = theme === 'light' ? 'text-gray-800' : 'text-[#cbd5ff]';
  const headerTextClass = theme === 'light'
    ? 'text-gray-500'   // light-mode header text
    : 'text-[#1a1a40]';  // dark-mode header text
  const headerBg    = theme === 'light'
    ? 'bg-gray-50'
    : 'bg-[#cbd5ff]';              // arbitrary dark mode header
  const divideClass = theme === 'light'
    ? 'divide-gray-200'
    : 'divide-[#cbd5ff]';          // arbitrary dark mode divider
  const borderClass = theme === 'light'
    ? 'border-gray-200'
    : 'border-[#cbd5ff]';          // arbitrary dark mode border
  const hoverClass  = theme === 'light'
    ? 'hover:bg-gray-50'
    : 'hover:bg-gray-600';

  // helper to render cell value
  const getCellValue = (row: T, acc: TableColumn<T>['accessor']) =>
    typeof acc === 'function' ? acc(row) : (row[acc] as React.ReactNode);

  if (isLoading) {
    return (
      <div className={`${bgClass} rounded-lg shadow ${className}`}>
        <div className="p-4 text-center">Loading...</div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className={`${bgClass} rounded-lg shadow ${className}`}>
        <div className="p-4 text-center">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className={`${bgClass} rounded-lg shadow overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table
          className={`
            min-w-full
            border ${borderClass}
            divide-y ${divideClass}
            ${bgClass}
          `}
        >
          <thead className={`${headerBg}`}>
            <tr className="border-b">
              {columns.map(col => (
                <th
                  key={col.header}
                  scope="col"
                  className={`
                    px-6 py-3
                    text-left text-xs font-medium uppercase tracking-wider
                    ${headerTextClass}
                    ${col.className || ''}
                  `}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className={`divide-y ${divideClass}`}>
            {data.map(row => (
              <tr
                key={String(row[keyField])}
                className={`${onRowClick ? `cursor-pointer ${hoverClass}` : ''}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map(col => (
                  <td
                    key={`${String(row[keyField])}-${col.header}`}
                    className={`
                      border-b ${borderClass}
                      px-6 py-4 whitespace-nowrap
                      ${textClass}
                      ${col.className || ''}
                    `}
                  >
                    {getCellValue(row, col.accessor)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Table;
