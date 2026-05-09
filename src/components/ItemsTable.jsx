import React from 'react';

const borderStyle = '1px solid black';

export default function ItemsTable({ lineItems, totalqty, fillerCount = 0, suppressTotal = false }) {
  return (
    <div className="items-table-wrap">
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
          {lineItems.map((item, idx) => (
            <tr key={idx} className="items-row">
              <td className="items-cell" style={{ border: borderStyle, borderBottom: 'none', borderTop: 'none' }}>{item.sl}</td>
              <td className="items-cell items-barcode" style={{ fontWeight: 'bold', border: borderStyle, borderBottom: 'none', borderTop: 'none' }}>
                <div className="items-text-clip">{item.barcode}</div>
              </td>
              <td className="items-cell items-description" style={{ border: borderStyle, borderBottom: 'none', borderTop: 'none' }}>
                <div className="items-text-clip">{item.itemName}</div>
              </td>
              <td className="items-cell" style={{ border: borderStyle, borderBottom: 'none', borderTop: 'none' }}>{item.hsnCode}</td>
              <td className="items-cell" style={{ border: borderStyle, borderBottom: 'none', borderTop: 'none', textAlign: 'right' }}>{item.gst}</td>
              <td className="items-cell" style={{ border: borderStyle, borderBottom: 'none', borderTop: 'none', textAlign: 'right' }}>{item.qty.toFixed(2)}</td>
              <td className="items-cell" style={{ border: borderStyle, borderBottom: 'none', borderTop: 'none', textAlign: 'right' }}>{item.rate.toFixed(2)}</td>
              <td className="items-cell" style={{ border: borderStyle, borderBottom: 'none', borderTop: 'none', textAlign: 'right' }}>{item.amount.toFixed(2)}</td>
            </tr>
          ))}
          {/* Filler rows */}
          {Array.from({ length: fillerCount }).map((_, i) => (
            <tr key={`filler-${i}`} className="items-row" style={{ visibility: 'hidden' }}>
              <td className="items-cell" style={{ border: borderStyle, borderBottom: 'none', borderTop: 'none' }}>&nbsp;</td>
              <td className="items-cell" style={{ border: borderStyle, borderBottom: 'none', borderTop: 'none' }}>&nbsp;</td>
              <td className="items-cell items-description" style={{ border: borderStyle, borderBottom: 'none', borderTop: 'none' }}>
                <div className="items-text-clip">PLACEHOLDER</div>
              </td>
              <td className="items-cell" style={{ border: borderStyle, borderBottom: 'none', borderTop: 'none' }}>&nbsp;</td>
              <td className="items-cell" style={{ border: borderStyle, borderBottom: 'none', borderTop: 'none' }}>&nbsp;</td>
              <td className="items-cell" style={{ border: borderStyle, borderBottom: 'none', borderTop: 'none' }}>&nbsp;</td>
              <td className="items-cell" style={{ border: borderStyle, borderBottom: 'none', borderTop: 'none' }}>&nbsp;</td>
              <td className="items-cell" style={{ border: borderStyle, borderBottom: 'none', borderTop: 'none' }}>&nbsp;</td>
            </tr>
          ))}
          {/* Total row */}
          {!suppressTotal && (
            <tr>
              <td style={{ border: borderStyle }}></td>
              <td style={{ border: borderStyle }}>Total</td>
              <td style={{ border: borderStyle }}></td>
              <td style={{ border: borderStyle }}></td>
              <td style={{ border: borderStyle }}></td>
              <td style={{ border: borderStyle, textAlign: 'right' }}>{totalqty}</td>
              <td style={{ border: borderStyle }}></td>
              <td style={{ border: borderStyle }}></td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
