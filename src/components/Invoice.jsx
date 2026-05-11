import React from 'react';
import InvoiceHeader from './InvoiceHeader';
import ItemsTable from './ItemsTable';
import SummarySection from './SummarySection';
import { buildHsnList, numberToWords } from '../data/invoiceData';

// ── Layout constants (all sizes in 15 px "row-unit" equivalents) ───────────

// How many data rows fit on a full item page (44 × 15 px fits A4 content area).
const ITEM_ONLY_PAGE_SIZE = 44;

// Conservative content capacity for a non-item page (post-items / summary / HSN / terms).
// Actual measured capacity is ~49 units; 44 is deliberately conservative so we never overflow.
const CONTENT_PAGE_UNITS = 44;

// Height reserved for the pre-printed letterhead strip (margin-top on the header table).
const HEADER_TOP_SPACE = '141px';

// Summary Top height in row-units.
//   Row 1: bank details + amounts table  ≈ 130 px  → 9 units
//   Row 2: E-Invoice QR + Scan QR + notes ≈ 120 px → 8 units
//   Borders / padding                              → 1 unit
//   Safety margin                                  + 2 units
//   Total                                          = 20 units
const SUMMARY_UNITS = 20;

// HSN table double-row header in row-units (2 header rows × 15 px ≈ 30 px ≈ 2 units).
const HSN_HEADER_UNITS = 2;

// Terms & Conditions section height in row-units (~150 px / 15 px ≈ 10; +2 safety = 12).
const TERMS_UNITS = 12;

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
 * Sections are placed in order, one after the other, on the current page.
 * When a section (or the minimum useful fragment of it) does not fit in the
 * remaining space, a new page is started.
 *
 *   1. Line items  – one or more item pages; last page shows the Total row.
 *   2. Summary Top – fixed height (SUMMARY_UNITS).  Placed on the last item
 *      page if spare ≥ SUMMARY_UNITS, otherwise starts a new summary page.
 *   3. HSN table   – dynamic, may split freely across pages.  The header is
 *      repeated on each page that contains HSN rows.
 *   4. Terms & Conditions – fixed height (TERMS_UNITS).  Placed on the page
 *      where the last HSN row lands if spare ≥ TERMS_UNITS, otherwise placed
 *      at the top of a fresh page.
 *
 * Page descriptor shape:
 *   items        {Array|null}  – line items (null for non-item pages)
 *   suppressTotal {boolean}    – hide Total row (intermediate item pages)
 *   showTop      {boolean}     – render Summary Top block
 *   hsnSlice     {Array}       – HSN rows to render on this page
 *   showTerms    {boolean}     – render Terms & Conditions block
 *   showHeader   {boolean}     – show full InvoiceHeader vs. letterhead spacer
 *                                (false only for HSN-continuation pages)
 */
function buildInvoicePlan(lineItems, hsnList) {
  const chunks = chunkLineItems(lineItems, ITEM_ONLY_PAGE_SIZE);
  if (chunks.length === 0) chunks.push([]); // guard: empty invoice

  const pages = [];

  // ── Leading item pages (no Total row shown) ─────────────────────────────
  chunks.slice(0, -1).forEach((chunk) => {
    pages.push({
      items: chunk,
      suppressTotal: true,
      showTop: false,
      hsnSlice: [],
      showTerms: false,
      showHeader: true,
    });
  });

  // ── Last item page ───────────────────────────────────────────────────────
  const lastChunk = chunks[chunks.length - 1];
  let spare = ITEM_ONLY_PAGE_SIZE - lastChunk.length; // row-units available below items+Total

  let cur = {
    items: lastChunk,
    suppressTotal: false,
    showTop: false,
    hsnSlice: [],
    showTerms: false,
    showHeader: true,
  };
  pages.push(cur);

  // ── Section 2: Summary Top ───────────────────────────────────────────────
  if (spare >= SUMMARY_UNITS) {
    cur.showTop = true;
    spare -= SUMMARY_UNITS;
  } else {
    // Summary does not fit → start a dedicated post-items page.
    spare = CONTENT_PAGE_UNITS - SUMMARY_UNITS;
    cur = {
      items: null,
      suppressTotal: false,
      showTop: true,
      hsnSlice: [],
      showTerms: false,
      showHeader: true,
    };
    pages.push(cur);
  }

  // ── Section 3: HSN table (may split across pages) ───────────────────────
  const hsnRemaining = [...hsnList];
  let hsnEverPlaced = false; // tracks whether any HSN row has been placed yet

  while (hsnRemaining.length > 0) {
    const minFit = HSN_HEADER_UNITS + 1; // need room for header + at least one row
    if (spare >= minFit) {
      // Place as many rows as fit on this page.
      const rowCapacity = spare - HSN_HEADER_UNITS;
      const take = Math.min(rowCapacity, hsnRemaining.length);
      cur.hsnSlice = hsnRemaining.splice(0, take);
      spare -= HSN_HEADER_UNITS + take;
      hsnEverPlaced = true;
    } else {
      // Not enough room even for one row → overflow to a new page.
      // If HSN was already started on a previous page this is a "continuation"
      // page (show only the letterhead spacer, no invoice-details header).
      // If HSN hasn't started yet this is a fresh page (show full header).
      cur = {
        items: null,
        suppressTotal: false,
        showTop: false,
        hsnSlice: [],
        showTerms: false,
        showHeader: !hsnEverPlaced,
      };
      pages.push(cur);
      spare = CONTENT_PAGE_UNITS;
    }
  }

  // ── Section 4: Terms & Conditions ───────────────────────────────────────
  if (spare >= TERMS_UNITS) {
    cur.showTerms = true;
  } else {
    pages.push({
      items: null,
      suppressTotal: false,
      showTop: false,
      hsnSlice: [],
      showTerms: true,
      showHeader: true,
    });
  }

  return pages;
}

// ── Page renderer ──────────────────────────────────────────────────────────

/**
 * Renders one planned page as an `.a4-page` element.
 */
function renderPlannedPage({
  page, summaryData, copyLabel, invoiceId,
  isLastCopy, isLastPage, marginTop, pageKey,
  pageNumber, totalPages,
}) {
  const { items, suppressTotal, showTop, hsnSlice, showTerms, showHeader } = page;
  const { totalqty } = summaryData;

  const hasSummaryContent = showTop || hsnSlice.length > 0 || showTerms;
  const isTermsOnly       = !showTop && hsnSlice.length === 0 && showTerms;

  let innerContent;

  if (items !== null) {
    // ── Item page (leading pages show no Total; last page shows Total + optional summary) ──
    innerContent = (
      <div className="invoice-page-content">
        <InvoiceHeader
          data={{ ...summaryData, marginTop }}
          copyLabel={copyLabel}
          invoiceId={invoiceId}
        />
        <ItemsTable
          lineItems={items}
          totalqty={totalqty}
          fillerCount={0}
          suppressTotal={suppressTotal}
          extendAfterTotal={false}
        />
        {hasSummaryContent && (
          <SummarySection
            data={summaryData}
            hsnList={hsnSlice}
            showTop={showTop}
            showTerms={showTerms}
          />
        )}
      </div>
    );
  } else {
    // ── Post-item page (summary / HSN / terms) ───────────────────────────────
    // summary-page-shell → flex column so Terms anchor (margin-top:auto) pins to bottom.
    // terms-only-page-shell → overrides flex so Terms starts at the top of the section.
    const shellClass = [
      'invoice-page-content',
      'summary-page-shell',
      isTermsOnly ? 'terms-only-page-shell' : '',
    ].filter(Boolean).join(' ');

    innerContent = (
      <div className={shellClass}>
        {showHeader
          ? <InvoiceHeader data={{ ...summaryData, marginTop }} copyLabel={copyLabel} invoiceId={invoiceId} />
          : <div style={{ height: marginTop }} />  /* letterhead spacer for continuation pages */
        }
        <SummarySection
          data={summaryData}
          hsnList={hsnSlice}
          showTop={showTop}
          showTerms={showTerms}
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

/**
 * Renders one complete invoice copy set (Customer / Office / Transport copy).
 * Delegates all pagination decisions to buildInvoicePlan().
 */
export function InvoiceCopy({ data, copyLabel, isLastCopy, invoiceId }) {
  const { lineItems } = data;
  const hsnList  = buildHsnList(lineItems);
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

export default function Invoice({ data, invoiceId, copyFilter = 'all' }) {
  const allCopies = [
    { label: 'Customer Copy' },
    { label: 'Office Copy' },
    { label: 'Transport Copy' },
  ];
  const copies = copyFilter === 'all'
    ? allCopies
    : allCopies.filter((c) => c.label === copyFilter);

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
