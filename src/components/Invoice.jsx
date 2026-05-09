import React from 'react';
import InvoiceHeader from './InvoiceHeader';
import ItemsTable from './ItemsTable';
import SummarySection from './SummarySection';
import { buildHsnList, numberToWords } from '../data/invoiceData';

/**
 * Renders a single invoice page (header + items, optionally + summary).
 */
function InvoicePage({
  data,
  copyLabel,
  lineItems,
  showSummary,
  hsnList,
  fillerCount,
  showFillerOnly,
  fillerOnlyCount,
  marginTop,
  invoiceId,
  suppressTotal = false,
  extendAfterTotal = false,
}) {
  const totalqty = lineItems.reduce((s, i) => s + i.qty, 0);
  return (
    <div className="invoice-page-content" style={{ marginBottom: showSummary ? 0 : undefined }}>
      <InvoiceHeader data={{ ...data, marginTop: marginTop || '0px' }} copyLabel={copyLabel} invoiceId={invoiceId} />
      {!showFillerOnly ? (
        <ItemsTable
          lineItems={lineItems}
          totalqty={totalqty}
          fillerCount={fillerCount || 0}
          suppressTotal={suppressTotal}
          extendAfterTotal={extendAfterTotal}
        />
      ) : (
        <div style={{ height: fillerOnlyCount ? `${Math.max(0, fillerOnlyCount) * 17}px` : 0 }} />
      )}
      {showSummary && (
        <SummarySection data={data} hsnList={hsnList} />
      )}
    </div>
  );
}

function SummaryContinuationPage({ data, hsnList, showTerms, copyLabel, invoiceId, marginTop }) {
  const shellClassName = `invoice-page-content summary-page-shell${showTerms && hsnList.length === 0 ? ' terms-only-page-shell' : ''}`;
  return (
    <div className={shellClassName}>
      {showTerms ? (
        <InvoiceHeader
          data={{ ...data, marginTop: marginTop || HEADER_TOP_SPACE }}
          copyLabel={copyLabel}
          invoiceId={invoiceId}
        />
      ) : (
        <div style={{ height: HEADER_TOP_SPACE }} />
      )}
      <SummarySection data={data} hsnList={hsnList} showTop={false} showTerms={showTerms} />
    </div>
  );
}

function chunkLineItems(lineItems, chunkSize) {
  const chunks = [];
  for (let index = 0; index < lineItems.length; index += chunkSize) {
    chunks.push(lineItems.slice(index, index + chunkSize));
  }
  return chunks;
}

// Items that fit on a single item-only page
const ITEM_ONLY_PAGE_SIZE = 44;
// Branch A: below this count + small HSN → all on one page
const SAFE_SINGLE_PAGE_ITEM_LIMIT = 8;
// Max HSN rows to allow combined single page
const COMBINED_HSN_LIMIT = 4;
// Pixels reserved for the printed company header strip
const HEADER_TOP_SPACE = '141px';
// "Row units" consumed by the summary top block (totals + QR)
const SUMMARY_ON_ITEM_PAGE_UNITS = 12;
// Row units consumed by the HSN table header row (spans 2 header rows)
const ITEM_PAGE_HSN_HEADER_UNITS = 2;
// Row units consumed by the terms & conditions block
const TERMS_SECTION_UNITS = 12;
// HSN rows small enough to keep terms on the same summary page
const SUMMARY_TOP_PAGE_HSN_WITH_TERMS_LIMIT = 1;
// Maximum HSN rows on the first summary page
const SUMMARY_FIRST_PAGE_HSN_ROWS = 36;
// Maximum HSN rows on a continuation summary page
const SUMMARY_CONTINUATION_HSN_ROWS = 30;
// HSN rows that can share the final summary page with terms
const SUMMARY_LAST_PAGE_HSN_ROWS_WITH_TERMS = 0;

function removeTopFromFirstSummarySegment(segments) {
  return segments.map((segment, index) => (
    index === 0 ? { ...segment, showTop: false } : segment
  ));
}

/**
 * Splits hsnList into page segments, each carrying showTop / showTerms flags.
 * Terms are treated as an independent block: kept on the first page only when
 * the HSN block is tiny enough to leave room; otherwise pushed to a dedicated page.
 */
function buildSummarySegments(hsnList) {
  if (hsnList.length <= SUMMARY_TOP_PAGE_HSN_WITH_TERMS_LIMIT) {
    return [{ hsnList, showTop: true, showTerms: true }];
  }

  if (hsnList.length <= SUMMARY_FIRST_PAGE_HSN_ROWS) {
    return [
      { hsnList, showTop: true, showTerms: false },
      { hsnList: [], showTop: false, showTerms: true },
    ];
  }

  const segments = [];
  segments.push({
    hsnList: hsnList.slice(0, SUMMARY_FIRST_PAGE_HSN_ROWS),
    showTop: true,
    showTerms: false,
  });

  let index = SUMMARY_FIRST_PAGE_HSN_ROWS;
  while (index < hsnList.length) {
    const remaining = hsnList.length - index;

    if (remaining <= SUMMARY_LAST_PAGE_HSN_ROWS_WITH_TERMS) {
      segments.push({
        hsnList: hsnList.slice(index),
        showTop: false,
        showTerms: true,
      });
      break;
    }

    if (remaining <= SUMMARY_CONTINUATION_HSN_ROWS) {
      segments.push({
        hsnList: hsnList.slice(index),
        showTop: false,
        showTerms: false,
      });
      segments.push({
        hsnList: [],
        showTop: false,
        showTerms: true,
      });
      break;
    }

    const nextIndex = index + SUMMARY_CONTINUATION_HSN_ROWS;
    segments.push({
      hsnList: hsnList.slice(index, nextIndex),
      showTop: false,
      showTerms: false,
    });
    index = nextIndex;
  }

  return segments;
}

/**
 * Decides which post-item sections (summary top, HSN rows, terms) fit on the
 * current item page and which must overflow to dedicated summary pages.
 *
 * Rules (from spec):
 *  - Summary top only appears if it AND the entire HSN block both fit.
 *  - HSN is the only spillable section (may continue across pages).
 *  - Terms never split; if they don't fit after HSN they move to the next page.
 *
 * @param {Array}  hsnList            - Full HSN grouped rows.
 * @param {number} itemPageSpareUnits - Spare row-equivalent units on the item page.
 */
function buildPostItemSections(hsnList, itemPageSpareUnits = 0) {
  const remainingHsn = [...hsnList];
  const itemPageSection = {
    showTop: false,
    hsnList: [],
    showTerms: false,
  };

  let termsPlaced = false;
  let topPlaced = false;

  const fullHsnUnits = remainingHsn.length > 0
    ? ITEM_PAGE_HSN_HEADER_UNITS + remainingHsn.length
    : 0;
  // Summary top and the entire HSN block must both fit together or neither goes inline.
  const canFitTopAndEntireHsn = itemPageSpareUnits >= SUMMARY_ON_ITEM_PAGE_UNITS + fullHsnUnits;

  if (canFitTopAndEntireHsn) {
    itemPageSection.showTop = true;
    topPlaced = true;

    itemPageSection.hsnList = remainingHsn.splice(0);
    const unitsLeft = itemPageSpareUnits - SUMMARY_ON_ITEM_PAGE_UNITS - fullHsnUnits;

    if (remainingHsn.length === 0 && unitsLeft >= TERMS_SECTION_UNITS) {
      itemPageSection.showTerms = true;
      termsPlaced = true;
    }
  }

  if (remainingHsn.length === 0) {
    return {
      itemPageSection,
      summaryPages: termsPlaced ? [] : [{ hsnList: [], showTop: false, showTerms: true }],
    };
  }

  const summaryPages = topPlaced
    ? removeTopFromFirstSummarySegment(buildSummarySegments(remainingHsn))
    : buildSummarySegments(remainingHsn);

  return {
    itemPageSection,
    summaryPages,
  };
}

function renderSummarySegmentPage({ copyLabel, summaryData, invoiceId, segment, isLastCopy, isLastPage, mt2, pageKey }) {
  return (
    <div className="a4-page" key={pageKey}>
      {segment.showTop ? (
        <div className="invoice-page-content summary-page-shell">
          <InvoiceHeader data={{ ...summaryData, marginTop: mt2 }} copyLabel={copyLabel} invoiceId={invoiceId} />
          <SummarySection
            data={summaryData}
            hsnList={segment.hsnList}
            showTop={segment.showTop}
            showTerms={segment.showTerms}
          />
        </div>
      ) : (
        <SummaryContinuationPage
          data={summaryData}
          hsnList={segment.hsnList}
          showTerms={segment.showTerms}
          copyLabel={copyLabel}
          invoiceId={invoiceId}
          marginTop={mt2}
        />
      )}
      {(!isLastCopy || !isLastPage) && <div className="page-break" />}
    </div>
  );
}

/**
 * Renders one complete invoice copy set (may span multiple pages).
 *
 * Branch A: ≤8 items, small HSN           → all on one page
 * Branch B: ≤16 items                     → page 1: items; page 2+: summary/HSN/terms
 * Branch C: ≤ITEM_ONLY_PAGE_SIZE items    → page 1: items (padded); page 2+: summary/HSN/terms
 * Long    : >ITEM_ONLY_PAGE_SIZE items    → N item-only pages + last page + summary pages
 *
 * All branches use buildPostItemSections() to determine what follows items.
 */
export function InvoiceCopy({ data, copyLabel, isLastCopy, invoiceId }) {
  const { lineItems } = data;
  const lines = lineItems.length;
  const hsnList = buildHsnList(lineItems);
  const hsnsize = hsnList.length;
  const totaline = lines + hsnsize;
  const totalqty = lineItems.reduce((s, i) => s + i.qty, 0);
  const gross = data.gross;
  const grossEng = numberToWords(gross);
  const enrichedData = { ...data, gross, grossEng, totalqty };
  const companyLabel = 'For RAJADHANI FASHIONS';
  const summaryData = { ...enrichedData, companyLabel };
  const mt1 = HEADER_TOP_SPACE;
  const mt2 = HEADER_TOP_SPACE;

  /* ─── Branch A: everything fits on one page ─── */
  if (lines <= SAFE_SINGLE_PAGE_ITEM_LIMIT && totaline <= 18 && hsnsize <= COMBINED_HSN_LIMIT) {
    const fillerCount = lines < 16 && hsnsize <= 4 ? 14 - lines : 0;
    return (
      <div className="a4-page">
        <InvoicePage data={summaryData} copyLabel={copyLabel} lineItems={lineItems}
          showSummary hsnList={hsnList} fillerCount={fillerCount} marginTop={mt1} invoiceId={invoiceId} />
        {!isLastCopy && <div className="page-break" />}
      </div>
    );
  }

  /* ─── Branch B: ≤16 items — two-page split ─── */
  if (lines <= 16) {
    // Conservative spare-unit floor: worst case for this range is 44-16=28
    const page1Filler = 28;
    const { itemPageSection, summaryPages } = buildPostItemSections(hsnList, page1Filler);
    const showInlineSection =
      itemPageSection.showTop ||
      itemPageSection.hsnList.length > 0 ||
      itemPageSection.showTerms;
    const hasMorePages = summaryPages.length > 0;

    return (
      <>
        <div className="a4-page">
          <div className="invoice-page-content">
            <InvoiceHeader data={{ ...summaryData, marginTop: mt1 }} copyLabel={copyLabel} invoiceId={invoiceId} />
            <ItemsTable
              lineItems={lineItems}
              totalqty={totalqty}
              fillerCount={page1Filler}
              suppressTotal={false}
              extendAfterTotal={false}
            />
            {showInlineSection && (
              <SummarySection
                data={summaryData}
                hsnList={itemPageSection.hsnList}
                showTop={itemPageSection.showTop}
                showTerms={itemPageSection.showTerms}
              />
            )}
          </div>
          {(!isLastCopy || hasMorePages) && <div className="page-break" />}
        </div>
        {summaryPages.map((segment, index) => {
          const isLastPage = index === summaryPages.length - 1;
          return renderSummarySegmentPage({
            copyLabel,
            summaryData,
            invoiceId,
            segment,
            isLastCopy,
            isLastPage,
            mt2,
            pageKey: `${copyLabel}-summary-${index + 1}`,
          });
        })}
      </>
    );
  }

  /* ─── Branch C: >16 and ≤ITEM_ONLY_PAGE_SIZE items ─── */
  if (lines <= ITEM_ONLY_PAGE_SIZE) {
    const page1Filler = ITEM_ONLY_PAGE_SIZE - lines;
    const { itemPageSection, summaryPages } = buildPostItemSections(hsnList, page1Filler);
    const showInlineSection =
      itemPageSection.showTop ||
      itemPageSection.hsnList.length > 0 ||
      itemPageSection.showTerms;
    const hasMorePages = summaryPages.length > 0;

    return (
      <>
        <div className="a4-page">
          <div className="invoice-page-content">
            <InvoiceHeader data={{ ...summaryData, marginTop: mt1 }} copyLabel={copyLabel} invoiceId={invoiceId} />
            <ItemsTable
              lineItems={lineItems}
              totalqty={totalqty}
              fillerCount={page1Filler}
              suppressTotal={false}
              extendAfterTotal={false}
            />
            {showInlineSection && (
              <SummarySection
                data={summaryData}
                hsnList={itemPageSection.hsnList}
                showTop={itemPageSection.showTop}
                showTerms={itemPageSection.showTerms}
              />
            )}
          </div>
          {(!isLastCopy || hasMorePages) && <div className="page-break" />}
        </div>
        {summaryPages.map((segment, index) => {
          const isLastPage = index === summaryPages.length - 1;
          return renderSummarySegmentPage({
            copyLabel,
            summaryData,
            invoiceId,
            segment,
            isLastCopy,
            isLastPage,
            mt2,
            pageKey: `${copyLabel}-summary-${index + 1}`,
          });
        })}
      </>
    );
  }

  /* ─── Long invoice: >ITEM_ONLY_PAGE_SIZE items ───
     Split into full item-only pages, then apply the same section-planner
     (buildPostItemSections) to the last chunk — identical to Branches B/C.
  ─── */
  const chunks = chunkLineItems(lineItems, ITEM_ONLY_PAGE_SIZE);
  const leadingChunks = chunks.slice(0, -1);
  const lastChunk = chunks[chunks.length - 1];
  // Spare row-units available on the last item page below the items+total row
  const lastPageSpareUnits = ITEM_ONLY_PAGE_SIZE - lastChunk.length;

  const { itemPageSection, summaryPages } = buildPostItemSections(hsnList, lastPageSpareUnits);
  const showInlineSection =
    itemPageSection.showTop ||
    itemPageSection.hsnList.length > 0 ||
    itemPageSection.showTerms;
  const hasMorePages = summaryPages.length > 0;

  const pages = [];

  // Full item-only pages (no Total row, no summary)
  leadingChunks.forEach((chunk, pageIndex) => {
    pages.push(
      <div className="a4-page" key={`${copyLabel}-page-${pageIndex + 1}`}>
        <div className="invoice-page-content">
          <InvoiceHeader
            data={{ ...summaryData, marginTop: mt1 }}
            copyLabel={copyLabel}
            invoiceId={invoiceId}
          />
          <ItemsTable
            lineItems={chunk}
            totalqty={totalqty}
            fillerCount={0}
            suppressTotal={true}
            extendAfterTotal={false}
          />
        </div>
        <div className="page-break" />
      </div>
    );
  });

  // Last item page — shows Total row, then summary sections if they fit
  pages.push(
    <div className="a4-page" key={`${copyLabel}-page-${chunks.length}`}>
      <div className="invoice-page-content">
        <InvoiceHeader
          data={{ ...summaryData, marginTop: mt1 }}
          copyLabel={copyLabel}
          invoiceId={invoiceId}
        />
        <ItemsTable
          lineItems={lastChunk}
          totalqty={totalqty}
          fillerCount={0}
          suppressTotal={false}
          extendAfterTotal={false}
        />
        {showInlineSection && (
          <SummarySection
            data={summaryData}
            hsnList={itemPageSection.hsnList}
            showTop={itemPageSection.showTop}
            showTerms={itemPageSection.showTerms}
          />
        )}
      </div>
      {(!isLastCopy || hasMorePages) && <div className="page-break" />}
    </div>
  );

  // Overflow summary / HSN / terms pages
  summaryPages.forEach((segment, index) => {
    const isLastPage = index === summaryPages.length - 1;
    pages.push(
      renderSummarySegmentPage({
        copyLabel,
        summaryData,
        invoiceId,
        segment,
        isLastCopy,
        isLastPage,
        mt2,
        pageKey: `${copyLabel}-summary-${index + 1}`,
      })
    );
  });

  return <>{pages}</>;
}

export default function Invoice({ data, invoiceId, copyFilter = 'all' }) {
  const allCopies = [
    { label: 'Customer Copy' },
    { label: 'Office Copy' },
    { label: 'Transport Copy' },
  ];
  const copies = copyFilter === 'all'
    ? allCopies
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
