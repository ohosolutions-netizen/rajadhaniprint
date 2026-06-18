// Empty invoice shape used until live data is loaded.
export const invoiceData = {
  // Customer Info
  cusName: "",
  BillingAddress: "",
  ShippingAddress: "",
  phone: "",
  gstnum: "",

  // Invoice Details
  invoicenum: "",
  invdate: "",
  invtype: "",
  billtype: "",
  transport: "",
  agentName: "",
  integrationId: "",
  remark: "",
  salesman: "",
  billcreate: "",

  // Financial Summary
  subtotal: 0,
  discount: 0,
  totaldisc: 0,
  totaltax: 0,
  gross: 0,
  roundOff: 0,

  // E-Invoice
  eInvoiceStatus: "",
  irn: "",
  ebill: "",
  stateCode: "",

  // Line Items
  lineItems: [],
};

function pickFirstValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return '';
}

function getDisplayValue(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) {
    return value.map(getDisplayValue).filter(Boolean).join(', ');
  }
  if (typeof value === 'object') {
    return String(pickFirstValue(
      value.zc_display_value,
      value.display_value,
      value.name,
      value.value,
      value.ID,
    ));
  }
  return '';
}

function getPrimaryName(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) {
    return value.map(getPrimaryName).filter(Boolean).join(', ');
  }
  if (typeof value === 'object') {
    return String(pickFirstValue(
      value.Name,
      value.name,
      value.zc_display_value,
      value.display_value,
      value.value,
      value.ID,
    ));
  }
  return '';
}

function extractItemCode(value) {
  const text = getDisplayValue(value).trim();
  if (!text) return '';

  const match = text.match(/^([A-Za-z0-9-]+)/);
  return match ? match[1] : text;
}

function stripLeadingItemCode(value) {
  const text = getDisplayValue(value).trim();
  if (!text) return '';

  return text.replace(/^[A-Za-z0-9-]+\s*-\s*/, '').trim();
}

function getAddressValue(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value !== 'object') return String(value);

  const addressParts = [
    value.address_line_1,
    value.address_line_2,
    value.district_city,
    value.state_province,
    value.postal_Code,
    value.country,
  ].filter(Boolean);

  return addressParts.length ? addressParts.join(', ') : getDisplayValue(value);
}

function getLineItemsValue(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    if (Array.isArray(value.rows)) return value.rows;
    if (Array.isArray(value.data)) return value.data;
    if (Array.isArray(value.value)) return value.value;
  }
  return [];
}

function toNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').trim();
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (value && typeof value === 'object') {
    return toNumber(
      pickFirstValue(value.value, value.display_value, value.zc_display_value)
    );
  }
  return 0;
}

function extractPercent(value) {
  if (typeof value === 'number') return value;
  const text = getDisplayValue(value);
  const match = text.match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

function normalizeDate(value) {
  return getDisplayValue(value);
}

function normalizeFieldKey(key) {
  return String(key || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function getRecordValueByAliases(record, aliases) {
  for (const alias of aliases) {
    if (record[alias] !== undefined && record[alias] !== null && record[alias] !== '') {
      return record[alias];
    }
  }

  const normalizedAliases = aliases.map(normalizeFieldKey);
  for (const [key, value] of Object.entries(record)) {
    if (
      normalizedAliases.includes(normalizeFieldKey(key)) &&
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      return value;
    }
  }

  return '';
}

export function mapCreatorRecordToInvoice(record) {
  if (!record || typeof record !== 'object') {
    return invoiceData;
  }

  const rawLineItems = getLineItemsValue(record.Line_Item);
  const mappedLineItems = rawLineItems.map((item, index) => {
    const quantity = toNumber(pickFirstValue(
      item.P_QTY,
      item.ORDER_QTY,
      item.Quantity,
      item.Qty,
    ));
    const rate = toNumber(item.RATE);
    const amount = toNumber(pickFirstValue(item.AMOUNT, item.Amount, item.TOTAL_AMOUNT, quantity * rate));
    const hsnTotalAmount = toNumber(pickFirstValue(item.TOTAL_AMOUNT, amount));
    const gst = extractPercent(item.Tax);

    return {
      sl: toNumber(pickFirstValue(item.SL_NO, index + 1)) || index + 1,
      barcode: extractItemCode(item.ITEMCODE),
      itemName: stripLeadingItemCode(pickFirstValue(item.ITEMNAME, item.ITEMCODE, item.SI_Line_Item)) || `Item ${index + 1}`,
      hsnCode: getDisplayValue(item.HSN_CODE),
      gst,
      qty: quantity,
      rate,
      amount,
      hsnTotalAmount,
      taxAmount: toNumber(pickFirstValue(
        item.Tax_Amount,
        item.Tax_amount,
        item.TAX_AMOUNT,
        item.TaxAmount,
        item['Tax Amount'],
      )),
    };
  });

  const subtotal = toNumber(pickFirstValue(
    record.Total,
    record.Base_Amount,
    record.Bill_Amount,
    mappedLineItems.reduce((sum, item) => sum + item.amount, 0),
  ));
  const discountAmount = toNumber(record.Discount_Amount);
  const discountValue = toNumber(record.Discount_Value);
  const totalTax = toNumber(pickFirstValue(
    record.Tax,
    mappedLineItems.reduce((sum, item) => sum + (item.taxAmount || 0), 0),
  ));
  const grossAmount = toNumber(pickFirstValue(
    record.Bill_Amount,
    record.Total,
    subtotal + totalTax - discountAmount,
  ));

  return {
    ...invoiceData,
    cusName: getPrimaryName(record.Customer),
    BillingAddress: getAddressValue(pickFirstValue(
      record.Customer_Billing_Address,
      record.Billing_Address,
      record.Customer_Shipping_Address,
    )),
    ShippingAddress: getAddressValue(pickFirstValue(
      record.Customer_Shipping_Address,
      record.Billing_Address,
      record.Customer_Billing_Address,
    )),
    phone: getDisplayValue(pickFirstValue(record.Mobile_Number, record.Whatsapp_Number)),
    gstnum: getDisplayValue(record.GST_Number),
    invoicenum: getDisplayValue(record.Invoice_No),
    invdate: normalizeDate(record.Invoice_Date),
    invtype: getDisplayValue(record.Type_field),
    billtype: getDisplayValue(record.Bill_Type),
    transport: getDisplayValue(getRecordValueByAliases(record, [
      'TRANSPORT',
      'Transport',
      'Transporter',
      'Transport_Name',
      'TransportName',
    ])),
    agentName: getDisplayValue(getRecordValueByAliases(record, [
      'AGENT_NAME',
      'Agent_Name',
      'AgentName',
      'Agent',
      'Agent_Name_Field',
    ])),
    integrationId: getDisplayValue(record.Integration_ID),
    remark: getDisplayValue(record.Remark),
    salesman: getDisplayValue(record.Sales_Man),
    billcreate: getDisplayValue(record.Bill_Created_By),
    subtotal,
    discount: discountValue,
    totaldisc: discountAmount,
    totaltax: totalTax,
    gross: grossAmount,
    roundOff: toNumber(record.Round_Off),
    stateCode: getDisplayValue(record.Place_of_Supply),
    eInvoiceStatus: getDisplayValue(getRecordValueByAliases(record, [
      'eInvoice_Status',
      'E_Invoice_Status',
      'EInvoice_Status',
      'EInvoiceStatus',
    ])),
    irn: getDisplayValue(pickFirstValue(
      record.IRN_Number,
      record.E_invoice_ID,
      record.E_Invoice_ID,
      record.IRN,
      record.irn,
    )),
    ebill: getDisplayValue(pickFirstValue(
      record.E_Invoice_QR,
      record.E_Invoice_QR_Data,
      record.E_invoice_QR_Data,
      record.E_Invoice_QR_Link,
      record.E_invoice_QR_Link,
      record.QR_Code_Link,
      record.QR_Link,
      record.QR_Data,
    )),
    lineItems: mappedLineItems,
  };
}

// Build HSN grouped list from line items
export function buildHsnList(lineItems, expectedTotalTax = null) {
  const hsnMap = {};
  for (const item of lineItems) {
    const hsn = item.hsnCode;
    const taxValue = item.gst;
    const hsnTaxKey = `${hsn}__${Number(taxValue).toFixed(4)}`;
    const taxAmount = item.taxAmount ?? ((item.amount * item.gst) / (100 + item.gst));
    const totalAmount = item.hsnTotalAmount ?? item.amount;
    if (hsnMap[hsnTaxKey]) {
      hsnMap[hsnTaxKey].Tax_Amount += taxAmount;
      hsnMap[hsnTaxKey].Total_Amount += totalAmount;
    } else {
      hsnMap[hsnTaxKey] = {
        HSN: hsn,
        Tax_Value: taxValue,
        Tax_Amount: taxAmount,
        Total_Amount: totalAmount,
      };
    }
  }

  const hsnList = Object.values(hsnMap);
  const invoiceTax = Number(expectedTotalTax);
  if (expectedTotalTax !== null && expectedTotalTax !== undefined && expectedTotalTax !== '' && Number.isFinite(invoiceTax) && hsnList.length > 0) {
    const hsnTaxTotal = hsnList.reduce((sum, item) => sum + item.Tax_Amount, 0);
    const taxDifference = Number((invoiceTax - hsnTaxTotal).toFixed(2));

    if (taxDifference !== 0) {
      const adjustmentTarget = hsnList.reduce((largest, item) =>
        item.Total_Amount > largest.Total_Amount ? item : largest
      );
      adjustmentTarget.Tax_Amount = Number((adjustmentTarget.Tax_Amount + taxDifference).toFixed(2));
    }
  }

  return hsnList;
}

// Convert number to words (en-us style)
export function numberToWords(num) {
  const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
    'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN',
    'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

  function convertHundreds(n) {
    let result = '';
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' HUNDRED ';
      n %= 100;
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) result += ones[n] + ' ';
    return result;
  }

  if (num === 0) return 'ZERO';
  let result = '';
  const intPart = Math.floor(num);
  const decPart = Math.round((num - intPart) * 100);

  if (intPart >= 10000000) {
    result += convertHundreds(Math.floor(intPart / 10000000)) + 'CRORE ';
  }
  if (intPart >= 100000) {
    result += convertHundreds(Math.floor((intPart % 10000000) / 100000)) + 'LAKH ';
  }
  if (intPart >= 1000) {
    result += convertHundreds(Math.floor((intPart % 100000) / 1000)) + 'THOUSAND ';
  }
  if (intPart >= 100) {
    result += convertHundreds(Math.floor((intPart % 1000) / 100)) + 'HUNDRED ';
  }
  const rem = intPart % 100;
  if (rem >= 20) {
    result += tens[Math.floor(rem / 10)] + ' ';
    if (rem % 10 > 0) result += ones[rem % 10] + ' ';
  } else if (rem > 0) {
    result += ones[rem] + ' ';
  }

  // Trim and simplify
  result = result.trim();
  if (decPart > 0) {
    result += ' AND ' + convertHundreds(decPart).trim() + ' PAISE';
  }
  return result.trim();
}
