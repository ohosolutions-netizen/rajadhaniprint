import React, { useState } from 'react';

const B = '1px solid black';

function formatIndianAmount(value) {
  const number = Number(value) || 0;
  return number.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function EmptyItemsSpacer({ showHeader = false, showTotal = false, totalqty = 0 }) {
  const columns = ['5%', '8%', '41%', '8%', '5%', '8%', '9%', '14%'];

  return (
    <div className="summary-items-spacer summary-items-spacer-with-header">
      <table className="items-table summary-empty-items-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <colgroup>
          {columns.map((width, index) => <col key={index} style={{ width }} />)}
        </colgroup>
        {showHeader && (
          <thead>
            <tr>
              <th style={{ border: B }}>Sl.</th>
              <th style={{ border: B }}>Barcode</th>
              <th style={{ border: B }}>Description of Goods</th>
              <th style={{ border: B }}>HSN Code</th>
              <th style={{ border: B }}>GST</th>
              <th style={{ border: B }}>Quantity</th>
              <th style={{ border: B }}>Rate</th>
              <th style={{ border: B }}>Total</th>
            </tr>
          </thead>
        )}
        <tbody>
          <tr className="summary-empty-items-fill-row">
            {columns.map((_, index) => (
              <td key={index} className="summary-empty-items-cell">&nbsp;</td>
            ))}
          </tr>
          {showTotal && (
            <tr className="items-total-row summary-continuation-total">
              <td className="items-total-cell"></td>
              <td className="items-total-cell"></td>
              <td className="items-total-cell" style={{ textAlign: 'right', fontWeight: 'bold' }}>Total Qty</td>
              <td className="items-total-cell"></td>
              <td className="items-total-cell"></td>
              <td className="items-total-cell" style={{ textAlign: 'right' }}>{totalqty} Pcs</td>
              <td className="items-total-cell"></td>
              <td className="items-total-cell"></td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const summaryRegularLabelStyle = {
  padding: '4px 10px',
  fontWeight: 700,
  fontSize: '9pt',
  lineHeight: 'normal',
  textShadow: 'none',
};

const summaryRegularValueStyle = {
  textAlign: 'right',
  padding: '4px 10px',
  fontWeight: 700,
  fontSize: '9pt',
  lineHeight: 'normal',
  textShadow: 'none',
};

export function SummaryTop({ data }) {
  const [qrFailed, setQrFailed] = useState(false);
  const {
    gross, grossEng, subtotal, discount, totaldisc, totaltax,
    roundOff, irn, ebill,
  } = data;
  const taxvalue = subtotal - totaldisc;

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <colgroup>
        {/* 10-column grid: top row colspan=5 (50/50), bottom row colspan=3,3,4 (30/30/40) */}
        <col style={{ width: '10%' }} />
        <col style={{ width: '10%' }} />
        <col style={{ width: '10%' }} />
        <col style={{ width: '10%' }} />
        <col style={{ width: '10%' }} />
        <col style={{ width: '10%' }} />
        <col style={{ width: '10%' }} />
        <col style={{ width: '10%' }} />
        <col style={{ width: '10%' }} />
        <col style={{ width: '10%' }} />
      </colgroup>
      <tbody>
        <tr>
          <td
            colSpan={6}
            style={{
              borderTop: B,
              borderBottom: B,
              borderLeft: B,
              borderRight: 'none',
              padding: '8px 6px',
              verticalAlign: 'top',
            }}
          >
            <div style={{ fontSize: '9pt', paddingBottom: '5px', borderBottom: '1px solid #bbb', marginBottom: '8px', fontWeight: 'bold' }}>
              Rupees {grossEng} Only
            </div>
            <div style={{ fontSize: '8.1pt', lineHeight: 1.35, fontWeight: 'bold' }}>
              Our Bank Details<br />
              SOUTH INDIAN BANK LTD<br />
              A/c No:0024083000003067<br />
              IFSC Code:SIBL0000024<br />
              BRANCH:MARKET ROAD, ERNAKULAM
            </div>
            {irn && (
              <div style={{ marginTop: '4px', fontSize: '6.75pt', lineHeight: 1.2, wordBreak: 'break-all' }}>
                IRN: {irn}
              </div>
            )}
          </td>

          <td
            colSpan={4}
            style={{
              borderTop: B,
              borderBottom: B,
              borderLeft: 'none',
              borderRight: B,
              verticalAlign: 'top',
              padding: 0,
              position: 'relative',
              paddingBottom: '42px',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={summaryRegularLabelStyle}>Total</td>
                  <td style={summaryRegularValueStyle}>{subtotal.toFixed(2)}</td>
                </tr>
                {discount > 0 && (
                  <tr>
                    <td style={summaryRegularLabelStyle}>Total Discount @{discount.toFixed(2)}%</td>
                    <td style={summaryRegularValueStyle}>{totaldisc.toFixed(2)}</td>
                  </tr>
                )}
                <tr>
                  <td style={summaryRegularLabelStyle}>Total Taxable Value</td>
                  <td style={summaryRegularValueStyle}>{taxvalue.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={summaryRegularLabelStyle}>Total Tax Amount</td>
                  <td style={summaryRegularValueStyle}>{totaltax.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={summaryRegularLabelStyle}>Round Off</td>
                  <td style={summaryRegularValueStyle}>{roundOff.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            {/* Bill Amount pinned to bottom of cell */}
            <div style={{ position: 'absolute', bottom: '10px', left: 0, right: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '6px 10px', fontWeight: 900, fontSize: '10.8pt', border: 'none', textShadow: '0.3px 0 0 currentColor' }}>
                      Bill Amount
                    </td>
                    <td style={{ textAlign: 'right', padding: '6px 10px', fontSize: '14.4pt', fontWeight: 900, border: 'none', textShadow: '0.45px 0 0 currentColor, -0.2px 0 0 currentColor' }}>
                      ₹{formatIndianAmount(gross)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </td>
        </tr>

        <tr>
          {/* Wide E-Invoice QR section */}
          <td colSpan={5} style={{ border: B, padding: '6px 10px', verticalAlign: 'top', textAlign: 'left' }}>
            {ebill && !qrFailed && (
              <img
                src={ebill}
                style={{ width: '112px', height: '112px', objectFit: 'contain', display: 'block' }}
                alt="E-Invoice QR"
                onError={() => setQrFailed(true)}
              />
            )}
          </td>

          {/* Narrow Scan and Pay section */}
          <td colSpan={2} style={{ border: B, textAlign: 'center', padding: '6px', verticalAlign: 'top' }}>
            <img
              src="https://qrcode.tec-it.com/API/QRCode?data=upi%3A%2F%2Fpay%3Fpa%3Dpaytmqr1nxn70zbes%40paytm%26pn%3DPaytm&size=5"
              alt="Scan and Pay QR"
              style={{ width: '112px', height: '112px', display: 'block', margin: '0 auto', objectFit: 'contain' }}
            />
            <p style={{ margin: '2px 0 0 0', fontSize: '8pt', fontWeight: 'bold' }}>Scan and Pay</p>
          </td>

          {/* Notes section */}
          <td colSpan={3} style={{ border: B, padding: '6px', verticalAlign: 'top', fontSize: '9pt' }}>
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
      className="hsn-table"
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
    <div style={{ borderTop: 'none', borderRight: B, borderBottom: B, borderLeft: B, padding: '7px 10px', fontSize: '6.8pt' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px', minHeight: '118px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>Terms &amp; Conditions:</div>
          <div style={{ fontWeight: 'normal', lineHeight: 1.35 }}>
            1. Price are net<br />
            2. Goods are dispatched on buyer&apos;s A/c &amp; risk.<br />
            3. All disputes are subject to Ernakulam jurisdiction only.<br />
            4. All remittance are to be made in favour of RAJADHANI FASHIONS, Ernakulam<br />
            5. Payment within 15days. If not paid, interest will be charged at 21% annum<br />
            <b>6. Goods sold will not taken back.</b><br />
            <b>7. Damage goods will be taken back only for colour damages from 2 months pre- invoice only.</b>
          </div>
          <div style={{ marginTop: 'auto', paddingTop: '6px', fontWeight: 'bold' }}>Salesman:{salesman}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            {companyLabel}
          </div>
          <div>
            <div>Authorized Signatory</div>
            <div style={{ marginTop: '4px', fontWeight: 'bold' }}>Bill Created By: {billcreate}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SummarySection({
  data,
  hsnList,
  showTop = true,
  showTerms = true,
  showEmptyItemsHeader = false,
  continueItemsTable = false,
}) {
  const shouldShowSpacer = showTerms;

  return (
    <div
      className="summary-section-root"
      style={{ border: continueItemsTable ? 'none' : B, marginTop: 0 }}
    >
      {shouldShowSpacer && (
        <EmptyItemsSpacer
          showHeader={showEmptyItemsHeader}
          showTotal={continueItemsTable}
          totalqty={data.totalqty}
        />
      )}
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
