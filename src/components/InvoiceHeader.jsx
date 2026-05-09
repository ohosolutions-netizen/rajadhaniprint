import React from 'react';

export default function InvoiceHeader({ data, copyLabel, invoiceId }) {
  const {
    cusName, BillingAddress, phone, gstnum,
    invoicenum, invdate, billtype, invtype, remark,
    marginTop = '116px',
  } = { ...data, ...data };
  const billingAddressParts = String(BillingAddress || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  return (
    <table className="details-table" style={{ width: '100%', marginTop: data.marginTop || '116px', border: '1px solid #000' }}>
      <tbody>
        <tr>
          <td style={{ width: '50%', border: '1px solid #000', padding: '4px' }}>
            <b>Bill To:</b><br />
            <b>{cusName}</b><br />
            <div className="header-wrap-text">
              {billingAddressParts.map((part, index) => (
                <React.Fragment key={`${part}-${index}`}>
                  {index > 0 ? ', ' : ''}
                  {part}
                  {index < billingAddressParts.length - 1 ? <wbr /> : null}
                </React.Fragment>
              ))}
            </div>
            <b>Phone:</b> {phone}<br />
            <b>GSTIN:</b> {gstnum}
          </td>
          <td style={{ width: '50%', border: '1px solid #000', padding: '0px' }}>
            <table style={{ width: '100%' }}>
              <tbody>
                <tr>
                  <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black' }}><b>INVOICE NO:</b></td>
                  <td style={{ fontWeight: 400, borderBottom: '1px solid black' }}> {invoicenum}</td>
                </tr>
                <tr>
                  <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black' }}><b>Date :</b></td>
                  <td style={{ fontWeight: 400, borderBottom: '1px solid black' }}> {invdate}</td>
                </tr>
                <tr>
                  <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black' }}><b>Bill Type :</b></td>
                  <td style={{ fontWeight: 400, borderBottom: '1px solid black' }}> {billtype}</td>
                </tr>
                <tr>
                  <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black' }}><b>Type :</b></td>
                  <td style={{ fontWeight: 400, borderBottom: '1px solid black' }}>{invtype}</td>
                </tr>
                <tr>
                  <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black' }}><b>Remark :</b></td>
                  <td style={{ fontWeight: 400, borderBottom: '1px solid black' }}>{remark}</td>
                </tr>
              </tbody>
            </table>
            <div className="copy-label">{copyLabel}</div>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
