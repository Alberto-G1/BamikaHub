import React from 'react';
import PropTypes from 'prop-types';
import './Table.css';

/**
 * Table Component - Responsive data table
 * @param {array} columns - Column definitions [{key, label, render}]
 * @param {array} data - Data rows
 * @param {boolean} loading - Loading state
 * @param {node} emptyState - Empty state component
 * @param {boolean} striped - Striped rows
 * @param {boolean} hoverable - Highlight on hover
 */
const Table = ({ 
  columns = [],
  data = [],
  loading = false,
  emptyState,
  striped = true,
  hoverable = true,
  className = ''
}) => {
  if (loading) {
    return (
      <div className="table-loading">
        <div className="table-skeleton">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton-row">
              {columns.map((col, j) => (
                <div key={j} className="skeleton-cell skeleton" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="table-empty">
        {emptyState || (
          <div className="empty-state-simple">
            <div className="empty-icon">📋</div>
            <p>No data available</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`table-responsive ${className}`}>
      <table 
        className={`table-bamika ${striped ? 'table-striped' : ''} ${hoverable ? 'table-hover' : ''}`}
        role="table"
      >
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={row.id || index}>
              {columns.map((col) => (
                <td key={`${row.id || index}-${col.key}`}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

Table.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    render: PropTypes.func
  })).isRequired,
  data: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  emptyState: PropTypes.node,
  striped: PropTypes.bool,
  hoverable: PropTypes.bool,
  className: PropTypes.string
};

export default Table;
