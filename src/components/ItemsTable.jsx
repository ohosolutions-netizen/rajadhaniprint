import React from 'react';

const borderStyle = '1px solid black';
const baseTotalRowCellStyle = {
  borderLeft: borderStyle,
  borderRight: borderStyle,
  borderTop: '1.5px solid black',
  borderBottom: borderStyle,
};

export default function ItemsTable({
  lineItems,
  totalqty,
  fillerCount = 0,
  suppressTotal = false,
  pushTotalToBottom = false, // when true, filler rows go BEFORE Total to pin it to the bottom
  hasFollowingSummary = false,
}) {
  const totalRowCellStyle = baseTotalRowCellStyle;

  return (
    <div className={`items-table-wrap${hasFollowingSummary ? ' items-table-wrap-with-summary' : ''}`}>
      <table className="items-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr>
            <th style={{ width: '5%', border: borderStyle }}>Sl.</th>
            <th style={{ width: '8%', border: borderStyle }}>Barcode</th>
            <th style={{ width: '41%', border: borderStyle }}>Description of Goods</th>
            <th style={{ width: '8%', border: borderStyle }}>HSN Code</th>
            <th style={{ width: '5%', border: borderStyle }}>GST</th>
            <th style={{ width: '8%', border: borderStyle }}>Quantity</th>
            <th style={{ width: '9%', border: borderStyle }}>Rate</th>
            <th style={{ width: '14%', border: borderStyle }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((item, idx) => {
            const isLastDataRow = idx === lineItems.length - 1;
            // When filler rows follow (pushTotalToBottom), last item has no bottom border
            // (the filler rows continue the side borders seamlessly into the Total row).
            const itemCellBorderStyle = {
              borderLeft: borderStyle,
              borderRight: borderStyle,
              borderTop: 'none',
              borderBottom: isLastDataRow && !pushTotalToBottom && !hasFollowingSummary ? borderStyle : 'none',
            };

            return (
              <tr key={idx} className="items-row">
                <td className="items-cell" style={itemCellBorderStyle}>{item.sl}</td>
                <td className="items-cell items-barcode" style={{ ...itemCellBorderStyle, fontWeight: 900 }}>
                  <div className="items-text-clip barcode-text-strong">{item.barcode}</div>
                </td>
                <td className="items-cell items-description" style={itemCellBorderStyle}>
                  <div className="items-text-clip">{item.itemName}</div>
                </td>
                <td className="items-cell" style={itemCellBorderStyle}>{item.hsnCode}</td>
                <td className="items-cell" style={{ ...itemCellBorderStyle, textAlign: 'center' }}>{item.gst}</td>
                <td className="items-cell" style={{ ...itemCellBorderStyle, textAlign: 'right' }}>{item.qty.toFixed(2)}</td>
                <td className="items-cell" style={{ ...itemCellBorderStyle, textAlign: 'right' }}>{item.rate.toFixed(2)}</td>
                <td className="items-cell" style={{ ...itemCellBorderStyle, textAlign: 'right' }}>{item.amount.toFixed(2)}</td>
              </tr>
            );
          })}

          {/* Filler rows BEFORE Total — push Total Qty row to the bottom of the page */}
          {pushTotalToBottom && !suppressTotal && fillerCount > 0 &&
            Array.from({ length: fillerCount }).map((_, i) => {
              const preFillerStyle = {
                borderLeft: borderStyle,
                borderRight: borderStyle,
                borderTop: 'none',
                borderBottom: 'none', // Total row's thick top border acts as the cap
              };
              return (
                <tr key={`pre-filler-${i}`} className="items-row">
                  <td className="items-cell" style={preFillerStyle}>&nbsp;</td>
                  <td className="items-cell" style={preFillerStyle}>&nbsp;</td>
                  <td className="items-cell items-description" style={preFillerStyle}>
                    <div className="items-text-clip">&nbsp;</div>
                  </td>
                  <td className="items-cell" style={preFillerStyle}>&nbsp;</td>
                  <td className="items-cell" style={preFillerStyle}>&nbsp;</td>
                  <td className="items-cell" style={preFillerStyle}>&nbsp;</td>
                  <td className="items-cell" style={preFillerStyle}>&nbsp;</td>
                  <td className="items-cell" style={preFillerStyle}>&nbsp;</td>
                </tr>
              );
            })
          }

          {/* Total row */}
          {!suppressTotal && (
            <tr className="items-total-row">
              <td className="items-total-cell" style={totalRowCellStyle}></td>
              <td className="items-total-cell" style={totalRowCellStyle}></td>
              <td className="items-total-cell" style={{ ...totalRowCellStyle, textAlign: 'right', fontWeight: 'bold' }}>Total Qty</td>
              <td className="items-total-cell" style={totalRowCellStyle}></td>
              <td className="items-total-cell" style={totalRowCellStyle}></td>
              <td className="items-total-cell" style={{ ...totalRowCellStyle, textAlign: 'right' }}>{totalqty} Pcs</td>
              <td className="items-total-cell" style={totalRowCellStyle}></td>
              <td className="items-total-cell" style={totalRowCellStyle}></td>
            </tr>
          )}

          {/* Hidden filler rows — intermediate item pages only (fills page height, keeps borders) */}
          {suppressTotal && fillerCount > 0 &&
            Array.from({ length: fillerCount }).map((_, i) => {
              const isLastFillerRow = i === fillerCount - 1;
              const fillerCellStyle = {
                borderLeft: borderStyle,
                borderRight: borderStyle,
                borderTop: 'none',
                borderBottom: isLastFillerRow ? borderStyle : 'none',
              };
              return (
                <tr key={`filler-${i}`} className="items-row" style={{ visibility: 'hidden' }}>
                  <td className="items-cell" style={fillerCellStyle}>&nbsp;</td>
                  <td className="items-cell" style={fillerCellStyle}>&nbsp;</td>
                  <td className="items-cell items-description" style={fillerCellStyle}>
                    <div className="items-text-clip">&nbsp;</div>
                  </td>
                  <td className="items-cell" style={fillerCellStyle}>&nbsp;</td>
                  <td className="items-cell" style={fillerCellStyle}>&nbsp;</td>
                  <td className="items-cell" style={fillerCellStyle}>&nbsp;</td>
                  <td className="items-cell" style={fillerCellStyle}>&nbsp;</td>
                  <td className="items-cell" style={fillerCellStyle}>&nbsp;</td>
                </tr>
              );
            })
          }
        </tbody>
      </table>
    </div>
  );
}
