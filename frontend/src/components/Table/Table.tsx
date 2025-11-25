import React from "react";
import "./table.css"

type ColumnDef = string | { key: string; label?: string };

type TableProps = {
  /** Array de objetos com os mesmos atributos */
  data: Array<Record<PropertyKey, any>>;
  /** Força a ordem/colunas a serem exibidas */
  columns?: ColumnDef[];
  /** Nome do campo que deve ser usado como key única por linha */
  keyField?: string;
  /** Texto que aparece como caption e para aria-label caso ariaLabel não seja passado */
  caption?: string;
  /** aria-label da tabela*/
  ariaLabel?: string;
  /** Mensagem a ser exibida quando não houver dados */
  emptyMessage?: string;
  /** Função para customizar o conteúdo de cada célula */
  renderCell?: (
    value: any,
    row: Record<PropertyKey, any>,
    column: string,
    rowIndex: number
  ) => React.ReactNode;
  // se fornecida, uma coluna extra "Ações" será renderizada
  rowActions?: (row: Record<PropertyKey, any>, rowIndex: number) => React.ReactNode;
  // rótulo do header da coluna de ações
  actionHeader?: string;
  // valor máximo da tabela usando qualquer padrão css
  maxHeight?: string | number;
};

/**
 * Tabela dinâmica: gera <th> e <tr> automaticamente a partir das chaves do objeto.
 */
export default function Table({
  data,
  columns,
  keyField,
  caption,
  ariaLabel,
  emptyMessage = "Nenhum registro encontrado",
  renderCell,
  rowActions,
  actionHeader = "Ações",
  maxHeight
}: TableProps) {
  // uniformiza detectedColumns para { key, label }
  const detectedColumns = React.useMemo(() => {
    if (Array.isArray(columns) && columns.length > 0) {
      return columns.map((c) => (typeof c === "string" ? { key: c, label: c } : { key: c.key, label: c.label ?? c.key }));
    }

    if (!data || data.length === 0) return [] as { key: string; label: string }[];

    return Object.keys(data[0]).map((k) => ({ key: k, label: k }));
  }, [columns, data]);

  const tableAriaLabel = ariaLabel ?? caption ?? "Tabela de dados";

  const toCssSize = React.useCallback((v?: string | number) => {
    if (v === undefined || v === null) return undefined;
    return typeof v === "number" ? `${v}px` : v;
  }, []);

  const wrapperStyle: React.CSSProperties = React.useMemo(() => {
    const s: React.CSSProperties = {};
     if (maxHeight !== undefined) {
      s.maxHeight = toCssSize(maxHeight);
    } 
    return s;
  }, [maxHeight]);


  return (
    <div className="frog-table-wrapper" style={wrapperStyle}>
      <table role="table" aria-label={tableAriaLabel} className="frog-table">
        {caption ? <caption>{caption}</caption> : null}

        <thead>
          <tr role="row">
            {detectedColumns.map((col) => (
              <th key={col.key} role="columnheader" scope="col" aria-sort="none">
                {col.label}
              </th>
            ))}

            {/* coluna extra de ações */}
            {rowActions ? (
              <th role="columnheader" scope="col" aria-sort="none">
                {actionHeader}
              </th>
            ) : null}
          </tr>
        </thead>

        <tbody>
          {(!data || data.length === 0) && (
            <tr role="row">
              <td role="cell" colSpan={Math.max(detectedColumns.length + (rowActions ? 1 : 0), 1)}>
                {emptyMessage}
              </td>
            </tr>
          )}

          {data && data.length > 0 &&
            data.map((row, rowIndex) => {
              const rowKey = (keyField && row[keyField] !== undefined && String(row[keyField])) || String(rowIndex);

              return (
                <tr key={rowKey} role="row" data-rowindex={rowIndex}>
                  {detectedColumns.map((col, colIndex) => {
                    const rawValue = row[col.key];

                    const cellContent = renderCell
                      ? renderCell(rawValue, row, col.key, rowIndex)
                      : rawValue === null || rawValue === undefined
                      ? ""
                      : typeof rawValue === "object"
                      ? JSON.stringify(rawValue)
                      : String(rawValue);

                    if (colIndex === 0) {
                      return (
                        <th key={col.key} role="rowheader" scope="row">
                          {cellContent}
                        </th>
                      );
                    }

                    return (
                      <td key={col.key} role="cell" data-colname={col.key}>
                        {cellContent}
                      </td>
                    );
                  })}

                  {rowActions ? (
                    <td role="cell" data-colname="actions">
                      {rowActions(row, rowIndex)}
                    </td>
                  ) : null}
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}