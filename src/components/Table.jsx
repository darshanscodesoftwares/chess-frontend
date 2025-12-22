// src/components/Table.jsx
export default function Table({ columns, data, keyField = "id" }) {
  return (
    <table className="table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key || col.accessor}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 && (
          <tr>
            <td colSpan={columns.length} style={{ textAlign: "center" }}>
              No data
            </td>
          </tr>
        )}
        {data.map((row, i) => (
          <tr key={row[keyField] ?? i}>
            {columns.map((col) => (
              <td key={col.key || col.accessor}>
                {col.render ? col.render(row) : row[col.accessor]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
