import React, { useEffect, useState } from 'react';
import './index.css';
import Invoice from './components/Invoice';
import { mapCreatorRecordToInvoice } from './data/invoiceData';

const TEST_INVOICE_ID = '316828000003416382';
const CREATOR_APP_NAME = 'oho-erp';
const CREATOR_REPORT_NAME = 'API_Report_Sales';
const CREATOR_FIELDS = [
  'Customer',
  'Warehouse',
  'Sales_Order',
  'Customer_Billing_Address',
  'Customer_Shipping_Address',
  'Billing_Address',
  'GST_Number',
  'Mobile_Number',
  'Whatsapp_Number',
  'Invoice_No',
  'Invoice_Date',
  'Bill_Type',
  'Type_field',
  'TRANSPORT',
  'Transport',
  'Transporter',
  'AGENT_NAME',
  'Agent_Name',
  'Agent',
  'AgentName',
  'Remark',
  'Sales_Man',
  'Bill_Created_By',
  'Integration_ID',
  'Total',
  'Discount_Value',
  'Discount_Amount',
  'Tax',
  'Round_Off',
  'Bill_Amount',
  'Place_of_Supply',
  'IRN_Number',
  'E_invoice_ID',
  'E_Invoice_QR',
  'E_Invoice_QR_Data',
  'E_Invoice_QR_Link',
  'eInvoice_Status',
  'Line_Item',
].join(',');
const SDK_WAIT_MS = 8000;
const SDK_POLL_MS = 250;
const PRINT_OPTIONS = [
  { value: 'all', label: 'All Copies' },
  { value: 'Customer Copy', label: 'Customer Copy' },
  { value: 'Office Copy', label: 'Office Copy' },
  { value: 'Transport Copy', label: 'Transport Copy' },
];

function getInvoiceIdFromUrl() {
  const hrefMatch = window.location.href.match(/[?#&]invoiceid=([^&#]+)/i);
  if (hrefMatch?.[1]) {
    return decodeURIComponent(hrefMatch[1]);
  }

  const searchParams = new URLSearchParams(window.location.search);
  const directInvoiceId = searchParams.get('invoiceid');
  if (directInvoiceId) return directInvoiceId;

  const hash = window.location.hash || '';
  const queryStart = hash.indexOf('?');
  if (queryStart === -1) return '';

  const hashParams = new URLSearchParams(hash.slice(queryStart + 1));
  return hashParams.get('invoiceid') || '';
}

async function waitForCreatorSdk(timeoutMs = SDK_WAIT_MS) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const creatorSdk = window.ZOHO?.CREATOR;
    if (creatorSdk) {
      return creatorSdk;
    }
    await new Promise((resolve) => window.setTimeout(resolve, SDK_POLL_MS));
  }

  return null;
}

async function fetchInvoiceFromReport(creatorSdk, invoiceId) {
  const baseConfig = {
    app_name: CREATOR_APP_NAME,
    report_name: CREATOR_REPORT_NAME,
    field_config: 'custom',
    fields: CREATOR_FIELDS,
  };

  if (creatorSdk.DATA?.getRecords) {
    const criteriaVariants = [
      `(ID == "${invoiceId}")`,
      `(ID = "${invoiceId}")`,
    ];

    for (const criteria of criteriaVariants) {
      try {
        const response = await creatorSdk.DATA.getRecords({
          ...baseConfig,
          criteria,
          max_records: 200,
        });

        if (response?.code === 3000 && Array.isArray(response.data) && response.data.length > 0) {
          return {
            source: `report criteria ${criteria}`,
            record: response.data[0],
          };
        }
      } catch (error) {
        console.warn(`Report fetch failed for criteria ${criteria}`, error);
      }
    }
  }

  if (creatorSdk.DATA?.getRecordById) {
    const response = await creatorSdk.DATA.getRecordById({
      ...baseConfig,
      id: invoiceId,
    });

    if (response?.code === 3000 && response.data) {
      return {
        source: 'getRecordById fallback',
        record: response.data,
      };
    }
  }

  return null;
}


export default function App() {
  const [invoiceId, setInvoiceId] = useState(() => getInvoiceIdFromUrl());
  const [sdkMode, setSdkMode] = useState(() =>
    getInvoiceIdFromUrl() ? 'Page URL detected' : 'Detecting host'
  );
  const [invoiceDetails, setInvoiceDetails] = useState(null);
  const [fetchedCustomer, setFetchedCustomer] = useState('');
  const [fetchedBilling, setFetchedBilling] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPrintOptionsOpen, setIsPrintOptionsOpen] = useState(false);
  const [selectedPrintOption, setSelectedPrintOption] = useState('all');
  const [activePrintOption, setActivePrintOption] = useState('all');
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);

  const handlePrint = () => {
    setSelectedPrintOption('all');
    setIsPrintOptionsOpen(true);
  };

  const handlePrintConfirm = () => {
    setActivePrintOption(selectedPrintOption);
    setIsPrintOptionsOpen(false);
    setIsPreparingPrint(true);
  };

  const handlePrintCancel = () => {
    setIsPrintOptionsOpen(false);
    setSelectedPrintOption('all');
  };

  useEffect(() => {
    let isActive = true;

    async function loadInvoiceContext() {
      const fallbackInvoiceId = getInvoiceIdFromUrl();
      const targetInvoiceId = fallbackInvoiceId || TEST_INVOICE_ID;
      if (isActive) {
        setSdkMode('Waiting for Creator SDK');
      }

      const creatorSdk = await waitForCreatorSdk();

      if (!creatorSdk) {
        if (isActive) {
          setInvoiceId(fallbackInvoiceId);
          setSdkMode(targetInvoiceId === TEST_INVOICE_ID ? 'Creator SDK not found, using test ID' : 'Creator SDK not found');
          setIsLoading(false);
        }
        return;
      }

      try {
        if (typeof creatorSdk.init === 'function') {
          if (isActive) {
            setSdkMode('Initializing Creator SDK');
          }
          await creatorSdk.init();
        }

        let queryParams = {};
        if (creatorSdk.UTIL?.getQueryParams) {
          if (isActive) {
            setSdkMode('Reading page parameters');
          }
          queryParams = await creatorSdk.UTIL.getQueryParams();
        }

        const creatorInvoiceId =
          queryParams?.invoiceid ||
          queryParams?.InvoiceID ||
          queryParams?.invoiceId ||
          '';
        const resolvedInvoiceId = creatorInvoiceId || fallbackInvoiceId || TEST_INVOICE_ID;

        if (isActive) {
          setInvoiceId(creatorInvoiceId || fallbackInvoiceId);
          setSdkMode(creatorInvoiceId ? 'Zoho Creator JS SDK connected' : 'Using test ID fallback');
        }

        if (!creatorSdk.DATA?.getRecordById) {
          if (!creatorSdk.DATA?.getRecords) {
            if (isActive) {
              setSdkMode('Creator JS SDK connected, data APIs unavailable');
              setIsLoading(false);
            }
            return;
          }
        }

        if (isActive) {
          setSdkMode(`Fetching invoice ${resolvedInvoiceId} from report`);
        }

        const fetched = await fetchInvoiceFromReport(creatorSdk, resolvedInvoiceId);

        if (!fetched?.record) {
          if (isActive) {
            setSdkMode(`No report data returned for ID ${resolvedInvoiceId}`);
            setIsLoading(false);
          }
          return;
        }

        if (isActive) {
          const mappedInvoice = mapCreatorRecordToInvoice(fetched.record);

          setInvoiceDetails(mappedInvoice);
          setFetchedCustomer(
            fetched.record.Customer?.display_value ||
            fetched.record.Customer?.zc_display_value ||
            fetched.record.Customer ||
            ''
          );
          setFetchedBilling(
            fetched.record.Customer_Billing_Address ||
            fetched.record.Billing_Address?.zc_display_value ||
            fetched.record.Billing_Address?.display_value ||
            fetched.record.Billing_Address ||
            ''
          );
          setSdkMode(`Loaded live invoice from ${CREATOR_REPORT_NAME} via ${fetched.source}`);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Unable to read invoice data from Zoho Creator JS SDK.', error);
        if (isActive) {
          setInvoiceId(fallbackInvoiceId);
          setSdkMode(`Creator read failed (${error?.message || 'unknown error'})`);
          setIsLoading(false);
        }
      }
    }

    loadInvoiceContext();
    return () => { isActive = false; };
  }, []);

  useEffect(() => {
    if (!isPreparingPrint || !invoiceDetails) return undefined;

    const timer = window.setTimeout(() => {
      window.print();
    }, 80);

    return () => window.clearTimeout(timer);
  }, [isPreparingPrint, invoiceDetails, activePrintOption]);

  useEffect(() => {
    function handleAfterPrint() {
      setIsPreparingPrint(false);
      setActivePrintOption('all');
      setSelectedPrintOption('all');
    }

    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  return (
    <>
      {/* Toolbar – hidden when printing */}
      <div className="toolbar no-print">
        <div>
          <h1>Rajdhani Fashions</h1>
          <span>Tax Invoice Preview{invoiceDetails?.invoicenum ? ` — ${invoiceDetails.invoicenum}` : ''}</span>
        </div>
        <button className="print-btn" onClick={handlePrint}>🖨 Print / Save PDF</button>
      </div>

      {isPrintOptionsOpen && (
        <div className="print-options-backdrop no-print">
          <div className="print-options-modal">
            <h2>Print Options</h2>
            <p>Select which copy set should be sent to the print window.</p>
            <div className="print-options-list">
              {PRINT_OPTIONS.map((option) => (
                <label className="print-option-item" key={option.value}>
                  <input
                    type="radio"
                    name="print-copy-option"
                    value={option.value}
                    checked={selectedPrintOption === option.value}
                    onChange={(event) => setSelectedPrintOption(event.target.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            <div className="print-options-actions">
              <button type="button" className="print-options-secondary" onClick={handlePrintCancel}>Cancel</button>
              <button type="button" className="print-btn" onClick={handlePrintConfirm}>Continue</button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Pages */}
      {isLoading ? (
        <div className="loading-state">
          <div className="loading-state-card">
            <h2>Loading invoice...</h2>
            <p>Please wait while the latest data is fetched from Zoho Creator.</p>
          </div>
        </div>
      ) : invoiceDetails ? (
        <Invoice
          data={invoiceDetails}
          invoiceId={invoiceId || TEST_INVOICE_ID}
          copyFilter={activePrintOption}
        />
      ) : (
        <div className="loading-state">
          <div className="loading-state-card">
            <h2>Invoice data unavailable</h2>
            <p>{sdkMode}</p>
          </div>
        </div>
      )}
    </>
  );
}
