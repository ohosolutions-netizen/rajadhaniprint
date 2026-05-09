import React from 'react';

const B = '1px solid black';

export function SummaryTop({ data }) {
  const {
    gross, grossEng, subtotal, discount, totaldisc, totaltax,
    roundOff, irn, ebill,
  } = data;

  const taxvalue = subtotal - totaldisc;

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <tbody>
        <tr>
          <td style={{ width: '40%', border: B, padding: '8px 6px', verticalAlign: 'top' }}>
            <div style={{ fontSize: '10pt', paddingBottom: '5px', borderBottom: '1px solid #bbb', marginBottom: '8px', fontWeight: 'bold' }}>
              Rupees {grossEng} Only
            </div>
            <div style={{ fontSize: '9pt', lineHeight: 1.35, fontWeight: 'bold' }}>
              Our Bank Details<br />
              SOUTH INDIAN BANK LTD<br />
              A/c No:0024083000003067<br />
              IFSC Code:SIBL0000024<br />
              BRANCH:MARKET ROAD, ERNAKULAM
            </div>
            {irn && (
              <div style={{ marginTop: '4px', fontSize: '7.5pt', lineHeight: 1.2, wordBreak: 'break-all' }}>
                IRN: {irn}
              </div>
            )}
          </td>

          <td style={{ width: '15%', border: B, verticalAlign: 'top' }} />

          <td style={{ width: '45%', border: B, verticalAlign: 'top', padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '3px 10px', fontWeight: 'bold' }}>Total</td>
                  <td style={{ textAlign: 'right', padding: '3px 10px' }}>{subtotal.toFixed(2)}</td>
                </tr>
                {discount > 0 && (
                  <tr>
                    <td style={{ padding: '3px 10px', fontWeight: 'bold' }}>Total Discount @{discount}%</td>
                    <td style={{ textAlign: 'right', padding: '3px 10px' }}>{totaldisc.toFixed(2)}</td>
                  </tr>
                )}
                <tr>
                  <td style={{ padding: '3px 10px', fontWeight: 'bold' }}>Total Taxable Value</td>
                  <td style={{ textAlign: 'right', padding: '3px 10px' }}>{taxvalue.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 10px', fontWeight: 'bold' }}>Total Tax Amount</td>
                  <td style={{ textAlign: 'right', padding: '3px 10px' }}>{totaltax.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 10px', fontWeight: 'bold' }}>Round Off</td>
                  <td style={{ textAlign: 'right', padding: '3px 10px' }}>{roundOff.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: B }}>
              <tbody>
                <tr>
                  <td style={{ padding: '6px 10px', fontWeight: 'bold', fontSize: '10pt', border: 'none' }}>
                    Bill Amount
                  </td>
                  <td style={{ textAlign: 'right', padding: '6px 10px', fontSize: '14pt', fontWeight: 'bold', border: 'none' }}>
                    {gross.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>

        <tr>
          <td style={{ border: B, padding: '6px', verticalAlign: 'middle', textAlign: 'center' }}>
            {ebill ? (
              <img src={ebill} style={{ width: '96px', height: '96px', objectFit: 'contain' }} alt="E-Invoice QR" />
            ) : (
              <div
                style={{
                  width: '96px',
                  height: '96px',
                  border: '1px dashed #bbb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8pt',
                  color: '#aaa',
                  margin: '0 auto',
                }}
              >
                E-Invoice QR
              </div>
            )}
          </td>

          <td style={{ border: B, textAlign: 'center', padding: '6px', verticalAlign: 'middle' }}>
            <img
              src="https://qrcode.tec-it.com/API/QRCode?data=upi%3A%2F%2Fpay%3Fpa%3Dpaytmqr1nxn70zbes%40paytm%26pn%3DPaytm&size=5"
              alt="Scan and Pay QR"
              style={{ width: '96px', height: '96px', display: 'block', margin: '0 auto', objectFit: 'contain' }}
            />
            <p style={{ margin: '2px 0 0 0', fontSize: '8pt', fontWeight: 'bold' }}>Scan and Pay</p>
          </td>

          <td style={{ border: B, padding: '6px', verticalAlign: 'top', fontSize: '9pt' }}>
            Notes:
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export function HsnTable({ hsnList }) {
  if (!hsnList || hsnList.length === 0) {
    return null;
  }

  return (
    <table
      cellSpacing="0"
      cellPadding="0"
      style={{ borderCollapse: 'collapse', width: '100%', textAlign: 'center', marginTop: 0 }}
    >
      <thead>
        <tr>
          <th rowSpan="2" style={{ border: B, fontWeight: 'bold', padding: '2px 4px', lineHeight: 1.1 }}>HSN/SAC</th>
          <th rowSpan="2" style={{ border: B, fontWeight: 'bold', padding: '2px 4px', lineHeight: 1.1 }}>Taxable Value</th>
          <th colSpan="2" style={{ border: B, fontWeight: 'bold', padding: '2px 4px', lineHeight: 1.1 }}>Central Tax</th>
          <th colSpan="2" style={{ border: B, fontWeight: 'bold', padding: '2px 4px', lineHeight: 1.1 }}>State Tax</th>
          <th rowSpan="2" style={{ border: B, fontWeight: 'bold', padding: '2px 4px', lineHeight: 1.1 }}>Total Tax Amount</th>
        </tr>
        <tr>
          <th style={{ border: B, fontWeight: 'bold', padding: '2px 4px', lineHeight: 1.1 }}>Rate</th>
          <th style={{ border: B, fontWeight: 'bold', padding: '2px 4px', lineHeight: 1.1 }}>Amount</th>
          <th style={{ border: B, fontWeight: 'bold', padding: '2px 4px', lineHeight: 1.1 }}>Rate</th>
          <th style={{ border: B, fontWeight: 'bold', padding: '2px 4px', lineHeight: 1.1 }}>Amount</th>
        </tr>
      </thead>
      <tbody>
        {hsnList.map((item, idx) => (
          <tr key={idx}>
            <td style={{ border: B, fontWeight: 'bold', padding: '1px 4px', lineHeight: 1.1 }}>{item.HSN}</td>
            <td style={{ border: B, fontWeight: 'bold', padding: '1px 4px', lineHeight: 1.1 }}>{item.Total_Amount.toFixed(2)}</td>
            <td style={{ border: B, fontWeight: 'bold', padding: '1px 4px', lineHeight: 1.1 }}>{(item.Tax_Value / 2).toFixed(1)}</td>
            <td style={{ border: B, fontWeight: 'bold', padding: '1px 4px', lineHeight: 1.1 }}>{(item.Tax_Amount / 2).toFixed(3)}</td>
            <td style={{ border: B, fontWeight: 'bold', padding: '1px 4px', lineHeight: 1.1 }}>{(item.Tax_Value / 2).toFixed(1)}</td>
            <td style={{ border: B, fontWeight: 'bold', padding: '1px 4px', lineHeight: 1.1 }}>{(item.Tax_Amount / 2).toFixed(3)}</td>
            <td style={{ border: B, fontWeight: 'bold', padding: '1px 4px', lineHeight: 1.1 }}>{item.Tax_Amount.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function TermsSection({ data }) {
  const { salesman, billcreate, companyLabel = 'For RAJADHANI FASHIONS' } = data;
  return (
    <div style={{ borderTop: B }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ border: 'none', padding: '8px 10px', verticalAlign: 'top', fontSize: '9pt' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>Terms &amp; Conditions:</div>
              <div style={{ fontWeight: 'normal', lineHeight: 1.35 }}>
                1. Price are net<br />
                2. Goods are dispatched on buyer&apos;s A/c &amp; risk.<br />
                3. All disputes are subject to Ernakulam jurisdiction only.<br />
                4. All remittance are to be made in favour of RAJADHANI FASHIONS, Ernakulam<br />
                5. Payment within 15days. If not paid, interest will be charged at 21% annum<br />
                6. Goods sold will not taken back.<br />
                7. Damage goods will be taken back only for colour damages from 2 months pre- invoice only.
              </div>
              <div style={{ marginTop: '6px', fontWeight: 'bold' }}>Salesman:{salesman}</div>
            </td>

            <td style={{ border: 'none', padding: '8px 10px', verticalAlign: 'top', textAlign: 'right', fontSize: '9pt' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '60px' }}>{companyLabel}</div>
              <div>Authorized Signatory</div>
              <div style={{ marginTop: '4px' }}>Bill Created By: {billcreate}</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function SummarySection({ data, hsnList, showTop = true, showTerms = true }) {
  return (
    <div className="summary-section-root" style={{ border: B, marginTop: 0 }}>
      {showTop && <SummaryTop data={data} />}
      <HsnTable hsnList={hsnList} />
      {showTerms && (
        <div className="summary-terms-anchor">
          <TermsSection data={data} />
        </div>
      )}
    </div>
  );
}
