import React from 'react';

function cleanCustomerName(name, ...addresses) {
  let cleanedName = String(name || '').trim();
  if (!cleanedName) return '';

  const dashIndex = cleanedName.indexOf('-');
  if (dashIndex > 0) {
    return cleanedName.slice(0, dashIndex).trim();
  }

  const addressParts = addresses
    .flatMap((address) => String(address || '').split(','))
    .map((part) => part.trim())
    .filter((part) => part.length >= 4)
    .sort((a, b) => b.length - a.length);

  for (const part of addressParts) {
    const escapedPart = part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleanedName = cleanedName.replace(new RegExp(`\\s+${escapedPart}$`, 'i'), '').trim();
  }

  return cleanedName;
}

export default function InvoiceHeader({ data, copyLabel, invoiceId }) {
  const {
    cusName, BillingAddress, ShippingAddress, phone, gstnum, stateCode,
    invoicenum, invdate, billtype, invtype, transport, agentName, remark,
    marginTop = '116px',
  } = { ...data, ...data };
  const displayCustomerName = cleanCustomerName(cusName, BillingAddress, ShippingAddress);
  const billingAddressParts = String(BillingAddress || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const shippingAddressParts = String(ShippingAddress || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  return (
    <table className="details-table" style={{ width: '100%', marginTop: data.marginTop || '116px', border: '1px solid #000' }}>
      <tbody>
        <tr>
          <td className="header-party-cell" style={{ width: '37%', border: '1px solid #000', position: 'relative', paddingBottom: '36px' }}>
            <div className="header-section-title">Bill To:</div>
            <div className="header-party-name">{displayCustomerName || cusName}</div>
            <div className="header-wrap-text">
              {billingAddressParts.map((part, index) => (
                <React.Fragment key={`${part}-${index}`}>
                  {index > 0 ? ', ' : ''}
                  {part}
                  {index < billingAddressParts.length - 1 ? <wbr /> : null}
                </React.Fragment>
              ))}
            </div>
            <div style={{ position: 'absolute', bottom: '4px', left: '6px', right: '6px' }}>
              <div><b>Phone:</b> {phone}</div>
              <div><b>GSTIN:</b> {gstnum}</div>
              {stateCode && <div><b>State Code:</b> <span style={{ fontWeight: 400 }}>{stateCode}</span></div>}
            </div>
          </td>
          <td className="header-party-cell" style={{ width: '37%', border: '1px solid #000' }}>
            <div className="header-section-title">Ship To:</div>
            <div className="header-party-name">{displayCustomerName || cusName}</div>
            <div className="header-wrap-text">
              {shippingAddressParts.map((part, index) => (
                <React.Fragment key={`${part}-${index}`}>
                  {index > 0 ? ', ' : ''}
                  {part}
                  {index < shippingAddressParts.length - 1 ? <wbr /> : null}
                </React.Fragment>
              ))}
            </div>
          </td>
          <td className="header-details-cell" style={{ width: '26%', border: '1px solid #000', padding: '0px' }}>
            <table className="header-details-table" style={{ width: '100%' }}>
              <tbody>
                <tr>
                  <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black' }}><b>INVOICE NO</b></td>
                  <td style={{ fontWeight: 700, borderBottom: '1px solid black' }}>{invoicenum}</td>
                </tr>
                <tr>
                  <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black' }}><b>Date</b></td>
                  <td style={{ fontWeight: 400, borderBottom: '1px solid black' }}>{invdate}</td>
                </tr>
                <tr>
                  <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black' }}><b>Bill Type</b></td>
                  <td style={{ fontWeight: 400, borderBottom: '1px solid black' }}>{billtype}</td>
                </tr>
                <tr>
                  <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black' }}><b>Type</b></td>
                  <td style={{ fontWeight: 400, borderBottom: '1px solid black' }}>{invtype}</td>
                </tr>
                <tr>
                  <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black' }}><b>Transport</b></td>
                  <td style={{ fontWeight: 400, borderBottom: '1px solid black' }}>{transport}</td>
                </tr>
                <tr>
                  <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black' }}><b>Agent</b></td>
                  <td style={{ fontWeight: 400, borderBottom: '1px solid black' }}>{agentName}</td>
                </tr>
                <tr>
                  <td style={{ borderRight: '1px solid black', borderBottom: '1px solid black' }}><b>Remark</b></td>
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
