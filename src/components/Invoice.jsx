import React from 'react';
import InvoiceHeader from './InvoiceHeader';
import ItemsTable from './ItemsTable';
import SummarySection from './SummarySection';
import { buildHsnList, numberToWords } from '../data/invoiceData';

// ── Layout constants (all sizes in 15 px "row-unit" equivalents) ───────────

// How many data rows fit on a full item page (44 × 15 px fits A4 content area).
const ITEM_ONLY_PAGE_SIZE = 44;

// Conservative content capacity for a non-item page (post-items / summary / HSN / terms).
const CONTENT_PAGE_UNITS = 44;

// Height reserved for the pre-printed letterhead strip (margin-top on the header table).
const HEADER_TOP_SPACE = '141px';

// Summary Top height in row-units.
//   Row 1: bank details + amounts table  ≈ 120 px  → 8 units
//   Row 2: E-Invoice QR + Scan QR + notes ≈ 105 px → 7 units
//   Borders / padding                              → 1 unit
//   Total                                          = 16 units
const SUMMARY_UNITS = 16;

// HSN table double-row header in row-units.
const HSN_HEADER_UNITS = 2;

// Compact HSN rows render noticeably shorter than item rows.
const HSN_ROW_UNITS = 0.7;

// Terms & Conditions section height in row-units after compact 6.8pt sizing.
// Keep print-safe slack because browser print renders slightly taller than preview.
const TERMS_UNITS = 10;

// ── Chunk helper ───────────────────────────────────────────────────────────

function chunkLineItems(lineItems, chunkSize) {
  const chunks = [];
  for (let i = 0; i < lineItems.length; i += chunkSize) {
    chunks.push(lineItems.slice(i, i + chunkSize));
  }
  return chunks;
}

// ── Page planner ───────────────────────────────────────────────────────────

/**
 * Builds a sequential list of page descriptors for one invoice copy.
 *
 * Layout rules:
 *   1. Line items span one or more pages. The last items page shows the Total row
 *      pinned to the bottom via pre-Total filler rows unless Summary + ALL HSN + T&C
 *      can fit directly after the last item row.
 *   2. Summary is atomic. It is never split and never starts unless it fully fits.
 *   3. If Summary starts on a page, then ALL HSN rows + T&C must also fit there.
 *      Otherwise Summary, HSN and T&C all move to a fresh page.
 *   4. HSN is the only spillable section. On each page, before placing HSN rows,
 *      check whether remaining HSN rows + T&C fit together in the remaining space.
 *      If yes, place them together. If not, place only the HSN rows that fit.
 *   5. T&C is atomic and appears only once, immediately after the last HSN rows.
 *      It is never split and never appears by itself mid-document.
 *
 * Page descriptor shape:
 *   items         {Array|null}  – line items (null for non-item pages)
 *   suppressTotal {boolean}     – hide Total row (intermediate item pages)
 *   fillerRows    {number}      – empty rows before Total to push it to the bottom
 *   showTop       {boolean}     – render Summary Top block
 *   hsnSlice      {Array}       – HSN rows to render on this page
 *   showTerms     {boolean}     – render Terms & Conditions block
 *   showHeader    {boolean}     – show full InvoiceHeader
 */
function buildInvoicePlan(lineItems, hsnList) {
  const chunks = chunkLineItems(lineItems, ITEM_ONLY_PAGE_SIZE);
  if (chunks.length === 0) chunks.push([]); // guard: empty invoice

  const pages = [];

  // Total units needed if Summary + ALL HSN + T&C were on one page.
  const hsnTotalUnits = hsnList.length > 0
    ? HSN_HEADER_UNITS + (hsnList.length * HSN_ROW_UNITS)
    : 0;
  const allSummaryUnits = SUMMARY_UNITS + hsnTotalUnits + TERMS_UNITS;

  // ── Leading item pages (no Total row) ───────────────────────────────────
  chunks.slice(0, -1).forEach((chunk) => {
    pages.push({
      items: chunk,
      suppressTotal: true,
      fillerRows: 0,
      showTop: false,
      hsnSlice: [],
      showTerms: false,
      showHeader: true,
    });
  });

  // ── Last item page ───────────────────────────────────────────────────────
  const lastChunk = chunks[chunks.length - 1];
  let spare = ITEM_ONLY_PAGE_SIZE - lastChunk.length;

  let cur = {
    items: lastChunk,
    suppressTotal: false,
    fillerRows: 0,
    showTop: false,
    hsnSlice: [],
    showTerms: false,
    showHeader: true,
  };
  pages.push(cur);

  // ── Step 1: Can Summary + ALL HSN + T&C fit on the last items page? ──────
  if (spare >= allSummaryUnits) {
    cur.showTop = true;
    if (hsnList.length > 0) cur.hsnSlice = [...hsnList];
    cur.showTerms = true;
    return pages; // no filler needed — Summary follows immediately after items
  }

  // Not enough room → push Total row to the page bottom via filler rows.
  cur.fillerRows = Math.max(0, spare - 1); // spare - 1 accounts for the Total row itself

  // ── Step 2: Fresh Summary page ───────────────────────────────────────────
  // Summary starts here only if it can bring the full HSN + Terms set;
  // otherwise HSN is paginated from this page onward and T&C is attached
  // only to the last HSN slice that fits with it.
  cur = {
    items: null,
    suppressTotal: false,
    fillerRows: 0,
    showTop: true,
    hsnSlice: [],
    showTerms: false,
    showHeader: true,
  };
  pages.push(cur);

  // Can Summary + ALL HSN + T&C fit on one page?
  if (CONTENT_PAGE_UNITS >= allSummaryUnits) {
    if (hsnList.length > 0) cur.hsnSlice = [...hsnList];
    cur.showTerms = true;
    return pages;
  }

  // Summary occupies the top; HSN rows start directly below it.
  spare = CONTENT_PAGE_UNITS - SUMMARY_UNITS;

  // ── Step 3: HSN pagination ───────────────────────────────────────────────
  // Rule: on each page check if remaining HSN rows + T&C fit together.
  //   Yes → place both; T&C follows the last HSN row.
  //   No  → place as many HSN rows as fit (no T&C); overflow to next page.
  // T&C is never placed by itself when HSN exists.
  const hsnRemaining = [...hsnList];
  let termsPlaced = false;

  if (hsnRemaining.length === 0) {
    cur.showTerms = true;
    termsPlaced = true;
    return pages;
  }

  while (hsnRemaining.length > 0) {
    const unitsForAllRemaining = HSN_HEADER_UNITS + (hsnRemaining.length * HSN_ROW_UNITS) + TERMS_UNITS;
    if (spare >= unitsForAllRemaining) {
      // All remaining HSN + T&C fit on this page.
      cur.hsnSlice = [...hsnRemaining];
      hsnRemaining.length = 0;
      cur.showTerms = true;
      termsPlaced = true;
      break;
    }

    const rowCapacity = Math.floor((spare - HSN_HEADER_UNITS) / HSN_ROW_UNITS);
    const take = Math.max(0, Math.min(rowCapacity, hsnRemaining.length));

    if (take > 0) {
      cur.hsnSlice = hsnRemaining.splice(0, take);
    }

    if (hsnRemaining.length > 0) {
      cur = {
        items: null,
        suppressTotal: false,
        fillerRows: 0,
        showTop: false,
        hsnSlice: [],
        showTerms: false,
        showHeader: true,
      };
      pages.push(cur);
      spare = CONTENT_PAGE_UNITS;
    }
  }

  if (!termsPlaced) {
    pages.push({
      items: null,
      suppressTotal: false,
      fillerRows: 0,
      showTop: false,
      hsnSlice: [],
      showTerms: true,
      showHeader: true,
    });
  }

  return pages;
}

// ── Page renderer ──────────────────────────────────────────────────────────

function renderPlannedPage({
  page, summaryData, copyLabel, invoiceId,
  isLastCopy, isLastPage, marginTop, pageKey,
  pageNumber, totalPages,
}) {
  const { items, suppressTotal, showTop, hsnSlice, showTerms, showHeader } = page;
  const { totalqty } = summaryData;

  const hasSummaryContent = showTop || hsnSlice.length > 0 || showTerms;
  const isTermsOnly       = !showTop && hsnSlice.length === 0 && showTerms;
  const hasNoTerms        = !showTerms;
  const hasTermsFooter    = showTerms;

  let innerContent;

  if (items !== null) {
    // ── Item page ──────────────────────────────────────────────────────────
    const itemShellClass = [
      'invoice-page-content',
      showTerms ? 'summary-page-shell terms-footer-page-shell item-terms-footer-page-shell' : '',
    ].filter(Boolean).join(' ');

    innerContent = (
      <div className={itemShellClass}>
        <InvoiceHeader
          data={{ ...summaryData, marginTop }}
          copyLabel={copyLabel}
          invoiceId={invoiceId}
        />
        <ItemsTable
          lineItems={items}
          totalqty={totalqty}
          fillerCount={page.fillerRows ?? 0}
          suppressTotal={suppressTotal || (hasSummaryContent && showTerms)}
          pushTotalToBottom={(page.fillerRows ?? 0) > 0}
          hasFollowingSummary={hasSummaryContent}
        />
        {hasSummaryContent && (
          <SummarySection
            data={summaryData}
            hsnList={hsnSlice}
            showTop={showTop}
            showTerms={showTerms}
            showEmptyItemsHeader={false}
            continueItemsTable={showTerms}
          />
        )}
      </div>
    );
  } else {
    // ── Post-item page (summary / HSN / terms) ─────────────────────────────
    // summary-page-shell: flex column, fills page height.
    // summary-section-root inside it gets flex:1 → fills remaining space.
    // summary-terms-anchor inside that has margin-top:auto → T&C pins to bottom.
    const shellClass = [
      'invoice-page-content',
      'summary-page-shell',
      isTermsOnly ? 'terms-only-page-shell' : '',
      hasNoTerms ? 'no-terms-page-shell' : '',
      hasTermsFooter ? 'terms-footer-page-shell' : '',
    ].filter(Boolean).join(' ');

    innerContent = (
      <div className={shellClass}>
        {showHeader
          ? <InvoiceHeader data={{ ...summaryData, marginTop }} copyLabel={copyLabel} invoiceId={invoiceId} />
          : <div style={{ height: marginTop }} />
        }
        <SummarySection
          data={summaryData}
          hsnList={hsnSlice}
          showTop={showTop}
          showTerms={showTerms}
          showEmptyItemsHeader
        />
      </div>
    );
  }

  return (
    <div className="a4-page" key={pageKey}>
      {innerContent}
      <div className="page-number-label">Page {pageNumber}/{totalPages}</div>
      {(!isLastCopy || !isLastPage) && <div className="page-break" />}
    </div>
  );
}

// ── InvoiceCopy ────────────────────────────────────────────────────────────

export function InvoiceCopy({ data, copyLabel, isLastCopy, invoiceId }) {
  const { lineItems } = data;
  const hsnList  = buildHsnList(lineItems, data.totaltax);
  const gross    = data.gross;
  const grossEng = numberToWords(gross);
  const totalqty = lineItems.reduce((s, i) => s + i.qty, 0);

  const summaryData = {
    ...data,
    gross,
    grossEng,
    totalqty,
    companyLabel: 'For RAJADHANI FASHIONS',
  };

  const plan = buildInvoicePlan(lineItems, hsnList);
  const totalPages = plan.length;

  return (
    <>
      {plan.map((page, index) =>
        renderPlannedPage({
          page,
          summaryData,
          copyLabel,
          invoiceId,
          isLastCopy,
          isLastPage: index === plan.length - 1,
          marginTop: HEADER_TOP_SPACE,
          pageKey: `${copyLabel}-page-${index + 1}`,
          pageNumber: index + 1,
          totalPages,
        })
      )}
    </>
  );
}

// ── Invoice (top-level) ────────────────────────────────────────────────────

export default function Invoice({ data, invoiceId, copyFilter = '3' }) {
  const allCopies = [
    { label: 'Customer Copy' },
    { label: 'Office Copy' },
    { label: 'Transport Copy' },
  ];
  const requestedCopyCount = Number.parseInt(copyFilter, 10);
  const copies = Number.isFinite(requestedCopyCount)
    ? allCopies.slice(0, Math.min(Math.max(requestedCopyCount, 1), allCopies.length))
    : allCopies.filter((copy) => copy.label === copyFilter);

  return (
    <div className="invoice-document">
      {copies.map((copy, i) => (
        <div className="invoice-copy-set" key={copy.label}>
          <InvoiceCopy
            data={data}
            copyLabel={copy.label}
            invoiceId={invoiceId}
            isLastCopy={i === copies.length - 1}
          />
        </div>
      ))}
    </div>
  );
}
