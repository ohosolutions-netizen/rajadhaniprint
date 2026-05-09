import React from 'react';
import InvoiceHeader from './InvoiceHeader';
import ItemsTable from './ItemsTable';
import SummarySection from './SummarySection';
import { buildHsnList, numberToWords } from '../data/invoiceData';

/**
 * Renders a single invoice page (header + items, optionally + summary).
 */
function InvoicePage({ data, copyLabel, lineItems, showSummary, hsnList, fillerCount, showFillerOnly, fillerOnlyCount, marginTop, invoiceId }) {
  const totalqty = lineItems.reduce((s, i) => s + i.qty, 0);
  return (
    <div className="invoice-page-content" style={{ marginBottom: showSummary ? 0 : undefined }}>
      <InvoiceHeader data={{ ...data, marginTop: marginTop || '0px' }} copyLabel={copyLabel} invoiceId={invoiceId} />
      {!showFillerOnly ? (
        <ItemsTable lineItems={lineItems} totalqty={totalqty} fillerCount={fillerCount || 0} />
      ) : (
        <div style={{ height: fillerOnlyCount ? `${Math.max(0, fillerOnlyCount) * 17}px` : 0 }} />
      )}
      {showSummary && (
        <SummarySection data={data} hsnList={hsnList} />
      )}
    </div>
  );
}

function SummaryContinuationPage({ data, hsnList, showTerms }) {
  return (
    <div className="invoice-page-content summary-page-shell">
      <div style={{ height: HEADER_TOP_SPACE }} />
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

const ITEM_ONLY_PAGE_SIZE = 44;
const COMBINED_LAST_PAGE_SIZE = 15;
const COMBINED_HSN_LIMIT = 4;
const ITEM_ONLY_FILL_TARGET = 43;
const SUMMARY_ONLY_FILL_TARGET = 15;
const SUMMARY_ONLY_OVERFLOW_FILL = 26;
const SMALL_COMBINED_FILL_TARGET = 13;
const LARGE_COMBINED_FILL_TARGET = 14;
const HEADER_TOP_SPACE = '148px';
const SUMMARY_SINGLE_PAGE_HSN_WITH_TERMS = 18;
const SUMMARY_FIRST_PAGE_HSN_ROWS = 36;
const SUMMARY_CONTINUATION_HSN_ROWS = 30;
const SUMMARY_LAST_PAGE_HSN_ROWS_WITH_TERMS = 0;

function buildSummarySegments(hsnList) {
  if (hsnList.length <= SUMMARY_SINGLE_PAGE_HSN_WITH_TERMS) {
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
        />
      )}
      {(!isLastCopy || !isLastPage) && <div className="page-break" />}
    </div>
  );
}

function buildLongInvoicePlan(lines, hsnsize, lineItems) {
  const fullPageCount = Math.floor(lines / ITEM_ONLY_PAGE_SIZE);
  const remainder = lines % ITEM_ONLY_PAGE_SIZE;
  const baseChunks = chunkLineItems(lineItems, ITEM_ONLY_PAGE_SIZE);
  const plan = [];

  if (remainder === 0) {
    baseChunks.forEach((chunk) => {
      plan.push({
        type: 'items',
        lineItems: chunk,
        fillerCount: 0,
      });
    });
    plan.push({
      type: 'summary-only',
      fillerOnlyCount: hsnsize > 24
        ? SUMMARY_ONLY_OVERFLOW_FILL
        : Math.max(0, SUMMARY_ONLY_FILL_TARGET - hsnsize),
    });
    return plan;
  }

  const leadingFullChunks = baseChunks.slice(0, fullPageCount);
  const trailingChunk = baseChunks[fullPageCount] || [];
  const canUseCombinedLastPage =
    remainder <= COMBINED_LAST_PAGE_SIZE &&
    remainder + hsnsize <= COMBINED_LAST_PAGE_SIZE + 4 &&
    hsnsize <= COMBINED_HSN_LIMIT;

  leadingFullChunks.forEach((chunk) => {
    plan.push({
      type: 'items',
      lineItems: chunk,
      fillerCount: 0,
    });
  });

  if (canUseCombinedLastPage) {
    plan.push({
      type: 'combined',
      lineItems: trailingChunk,
      fillerCount: hsnsize <= COMBINED_HSN_LIMIT
        ? Math.max(0, SMALL_COMBINED_FILL_TARGET - trailingChunk.length)
        : 0,
    });
    return plan;
  }

  plan.push({
    type: 'items',
    lineItems: trailingChunk,
    fillerCount: trailingChunk.length <= COMBINED_LAST_PAGE_SIZE
      ? Math.max(0, LARGE_COMBINED_FILL_TARGET - trailingChunk.length)
      : Math.max(0, ITEM_ONLY_FILL_TARGET - trailingChunk.length),
  });

  plan.push({
    type: 'summary-only',
    fillerOnlyCount: hsnsize > 24
      ? SUMMARY_ONLY_OVERFLOW_FILL
      : Math.max(0, SUMMARY_ONLY_FILL_TARGET - hsnsize),
  });

  return plan;
}

/**
 * Renders one complete invoice copy set (may span 1 or 2 pages depending on item/HSN count).
 * Mirrors the Zoho Deluge branching logic:
 *   Branch A: lines <= 16 && totaline <= 18  → all on one page
 *   Branch B: lines <= 16 && totaline > 18   → page1: items; page2: filler + summary + HSN + terms
 *   Branch C: lines > 16 && lines <= 46      → page1: items (44-row filler); page2: filler + summary + HSN + terms
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
  if (lines <= 16 && totaline <= 18 && hsnsize <= COMBINED_HSN_LIMIT) {
    const fillerCount = lines < 16 && hsnsize <= 4 ? 14 - lines : 0;
    return (
      <div className="a4-page">
        <InvoicePage data={summaryData} copyLabel={copyLabel} lineItems={lineItems}
          showSummary hsnList={hsnList} fillerCount={fillerCount} marginTop={mt1} invoiceId={invoiceId} />
        {!isLastCopy && <div className="page-break" />}
      </div>
    );
  }

  /* ─── Branch B: items on page 1, summary+HSN on page 2 ─── */
  if (lines <= 16 && (totaline > 18 || hsnsize > COMBINED_HSN_LIMIT)) {
    // Page 1: full item list + 28 filler rows
    const page1Filler = 28;
    const summarySegments = buildSummarySegments(hsnList);
    return (
      <>
        <div className="a4-page">
          <div className="invoice-page-content">
            <InvoiceHeader data={{ ...summaryData, marginTop: mt1 }} copyLabel={copyLabel} invoiceId={invoiceId} />
            <ItemsTable lineItems={lineItems} totalqty={totalqty} fillerCount={page1Filler} />
          </div>
          {!isLastCopy && <div className="page-break" />}
        </div>
        {summarySegments.map((segment, index) => {
          const isLastPage = index === summarySegments.length - 1;
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

  /* ─── Branch C: >16 items, fits in 2 pages each ─── */
  if (lines > 16 && lines <= 44) {
    const page1Filler = lines < 44 ? 44 - lines : 0;
    const summarySegments = buildSummarySegments(hsnList);
    return (
      <>
        <div className="a4-page">
          <div className="invoice-page-content">
            <InvoiceHeader data={{ ...summaryData, marginTop: mt1 }} copyLabel={copyLabel} invoiceId={invoiceId} />
            <ItemsTable lineItems={lineItems} totalqty={totalqty} fillerCount={page1Filler} />
          </div>
          <div className="page-break" />
        </div>
        {summarySegments.map((segment, index) => {
          const isLastPage = index === summarySegments.length - 1;
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

  /* ─── Long invoice branches (>46 lines) ───
     Mirrors the Zoho pattern:
     - 46 item rows per item-only page
     - last page may carry up to 16 remaining items + summary/HSN
     - if that overflows, render a separate summary page
  ─── */
  if (lines > 46) {
    const plan = buildLongInvoicePlan(lines, hsnsize, lineItems);

    return (
      <>
        {plan.map((page, pageIndex) => {
          if (page.type === 'summary-only') {
            const summarySegments = buildSummarySegments(hsnList);
            return summarySegments.map((segment, index) => {
              const isLastSegment = pageIndex === plan.length - 1 && index === summarySegments.length - 1;
              return renderSummarySegmentPage({
                copyLabel,
                summaryData,
                invoiceId,
                segment,
                isLastCopy,
                isLastPage: isLastSegment,
                mt2,
                pageKey: `${copyLabel}-summary-${pageIndex + 1}-${index + 1}`,
              });
            });
          }

          const isLastPage = pageIndex === plan.length - 1;
          return (
            <div className="a4-page" key={`${copyLabel}-page-${pageIndex + 1}`}>
              <div className="invoice-page-content">
                <InvoiceHeader
                  data={{ ...summaryData, marginTop: mt1 }}
                  copyLabel={copyLabel}
                  invoiceId={invoiceId}
                />
                <ItemsTable
                  lineItems={page.lineItems}
                  totalqty={totalqty}
                  fillerCount={page.fillerCount}
                  suppressTotal={false}
                />
                {page.type === 'combined' && (
                  <SummarySection data={summaryData} hsnList={hsnList} />
                )}
              </div>
              {(!isLastCopy || !isLastPage) && <div className="page-break" />}
            </div>
          );
        })}
      </>
    );
  }

  return (
    <div className="a4-page">
      <div className="invoice-page-content">
        <InvoiceHeader data={{ ...summaryData, marginTop: mt1 }} copyLabel={copyLabel} invoiceId={invoiceId} />
        <ItemsTable lineItems={lineItems} totalqty={totalqty} fillerCount={0} />
        <SummarySection data={summaryData} hsnList={hsnList} />
      </div>
      {!isLastCopy && <div className="page-break" />}
    </div>
  );
}

export default function Invoice({ data, invoiceId }) {
  const copies = [
    { label: 'Customer Copy' },
    { label: 'Office Copy' },
    { label: 'Transport Copy' },
  ];
  return (
    <div className="invoice-document">
      {copies.map((copy, i) => (
        <InvoiceCopy
          key={copy.label}
          data={data}
          copyLabel={copy.label}
          invoiceId={invoiceId}
          isLastCopy={i === copies.length - 1}
        />
      ))}
    </div>
  );
}
