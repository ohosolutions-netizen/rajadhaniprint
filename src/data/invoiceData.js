// Mock invoice data - mirrors the Zoho Deluge data structure
export const invoiceData = {
  // Customer Info
  cusName: "ASRA COLLECTIONS",
  BillingAddress: "PARAMBIL P.O,KOZHIKODE-673012,KOZHIKODE,Kerala,673012",
  ShippingAddress: "PARAMBIL P.O,KOZHIKODE-673012,KOZHIKODE,Kerala,673012",
  phone: "+919895589204",
  gstnum: "",

  // Invoice Details
  invoicenum: "RFINV26-27/1908",
  invdate: "08-May-2026",
  invtype: "Cash",
  billtype: "Cash",
  remark: "APS KOZHIKODE",
  salesman: "SALES TEAM",
  billcreate: "Admin User",

  // Financial Summary
  subtotal: 91440.00,
  discount: 0,
  totaldisc: 0,
  totaltax: 4344.76,
  gross: 95785.00,
  roundOff: 0.24,

  // E-Invoice
  irn: "",
  ebill: "",

  // Line Items
  lineItems: [
    { sl: 1, barcode: "31299", itemName: "LADIES 3PCS BRINDAVAN 361", hsnCode: "62114210", gst: 5, qty: 4.00, rate: 1180.00, amount: 4720.00 },
    { sl: 2, barcode: "32001", itemName: "3 PIECE SET J&S-1885", hsnCode: "62114210", gst: 5, qty: 5.00, rate: 1050.00, amount: 5250.00 },
    { sl: 3, barcode: "32096", itemName: "3 PIECE SET RC KIRTI VOL.2", hsnCode: "620444", gst: 5, qty: 4.00, rate: 970.00, amount: 3880.00 },
    { sl: 4, barcode: "33048", itemName: "CO-ORD SET PC-848", hsnCode: "621142", gst: 5, qty: 10.00, rate: 1198.00, amount: 11980.00 },
    { sl: 5, barcode: "36132", itemName: "CO-ORD SET RA-C01304 GARARA", hsnCode: "621142", gst: 5, qty: 4.00, rate: 875.00, amount: 3500.00 },
    { sl: 6, barcode: "32507", itemName: "FLAIR KURTI STC 2451", hsnCode: "621142", gst: 5, qty: 5.00, rate: 598.00, amount: 2990.00 },
    { sl: 7, barcode: "37833", itemName: "CO-ORD SET BM-GAMTHI AARDHNA", hsnCode: "621142", gst: 5, qty: 5.00, rate: 995.00, amount: 4975.00 },
    { sl: 8, barcode: "37830", itemName: "CO-ORD SET ARS-1912", hsnCode: "620419", gst: 5, qty: 5.00, rate: 1070.00, amount: 5350.00 },
    { sl: 9, barcode: "38070", itemName: "LADIES 3 PIECE SET STC 2502", hsnCode: "621142", gst: 5, qty: 4.00, rate: 999.00, amount: 3996.00 },
    { sl: 10, barcode: "33045", itemName: "3 PIECE SET VK 24ES026", hsnCode: "621142", gst: 5, qty: 5.00, rate: 1245.00, amount: 6225.00 },
    { sl: 11, barcode: "37519", itemName: "CO-ORD SET BM-LAJAUUB KK APLIC", hsnCode: "621142", gst: 5, qty: 5.00, rate: 999.00, amount: 4995.00 },
    { sl: 12, barcode: "38048", itemName: "LADIES 3 PIECE SET STC 2501", hsnCode: "621142", gst: 5, qty: 5.00, rate: 1198.00, amount: 5990.00 },
    { sl: 13, barcode: "33894", itemName: "3 PIECE SET PC-830", hsnCode: "621142", gst: 5, qty: 5.00, rate: 1065.00, amount: 5325.00 },
    { sl: 14, barcode: "33072", itemName: "3 PIECE SET KNS RICHA 429", hsnCode: "620419", gst: 5, qty: 5.00, rate: 1120.00, amount: 5600.00 },
    { sl: 15, barcode: "33823", itemName: "3 PIECE SET SSF-1022", hsnCode: "621142", gst: 5, qty: 5.00, rate: 1440.00, amount: 7200.00 },
    { sl: 16, barcode: "12611", itemName: "LADIES 3PCS SET", hsnCode: "62114210", gst: 5, qty: 4.00, rate: 620.00, amount: 2480.00 },
  ],
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

function extractItemCode(value) {
  const text = getDisplayValue(value).trim();
  if (!text) return '';

  const match = text.match(/^([A-Za-z0-9-]+)/);
  return match ? match[1] : text;
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

export function mapCreatorRecordToInvoice(record) {
  if (!record || typeof record !== 'object') {
    return invoiceData;
  }

  const rawLineItems = getLineItemsValue(record.Line_Item);
  const mappedLineItems = rawLineItems.map((item, index) => {
    const quantity = toNumber(item.ORDER_QTY);
    const rate = toNumber(item.RATE);
    const amount = toNumber(pickFirstValue(item.TOTAL_AMOUNT, item.AMOUNT, quantity * rate));
    const gst = extractPercent(item.Tax);

    return {
      sl: toNumber(pickFirstValue(item.SL_NO, index + 1)) || index + 1,
      barcode: extractItemCode(item.ITEMCODE),
      itemName: getDisplayValue(pickFirstValue(item.ITEMNAME, item.ITEMCODE, item.SI_Line_Item)) || `Item ${index + 1}`,
      hsnCode: getDisplayValue(item.HSN_CODE),
      gst,
      qty: quantity,
      rate,
      amount,
      taxAmount: toNumber(item.Tax_amount),
    };
  });

  const subtotal = toNumber(pickFirstValue(
    record.Total,
    record.Base_Amount,
    record.Bill_Amount,
    mappedLineItems.reduce((sum, item) => sum + item.amount, 0),
  ));
  const discountAmount = toNumber(record.Discount_Amount);
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
    cusName: getDisplayValue(record.Customer) || invoiceData.cusName,
    BillingAddress: getAddressValue(pickFirstValue(
      record.Customer_Billing_Address,
      record.Billing_Address,
      record.Customer_Shipping_Address,
    )) || invoiceData.BillingAddress,
    ShippingAddress: getAddressValue(pickFirstValue(
      record.Customer_Shipping_Address,
      record.Billing_Address,
      record.Customer_Billing_Address,
    )) || invoiceData.ShippingAddress,
    phone: getDisplayValue(pickFirstValue(record.Mobile_Number, record.Whatsapp_Number)) || invoiceData.phone,
    gstnum: getDisplayValue(record.GST_Number),
    invoicenum: getDisplayValue(record.Invoice_No) || invoiceData.invoicenum,
    invdate: normalizeDate(record.Invoice_Date) || invoiceData.invdate,
    invtype: getDisplayValue(record.Type_field) || invoiceData.invtype,
    billtype: getDisplayValue(record.Bill_Type) || invoiceData.billtype,
    remark: getDisplayValue(record.Remark),
    salesman: getDisplayValue(record.Sales_Man) || invoiceData.salesman,
    billcreate: getDisplayValue(record.Bill_Created_By) || invoiceData.billcreate,
    subtotal,
    discount: 0,
    totaldisc: discountAmount,
    totaltax: totalTax,
    gross: grossAmount,
    roundOff: toNumber(record.Round_Off),
    irn: getDisplayValue(pickFirstValue(record.E_invoice_ID, record.eInvoice_Status)),
    ebill: '',
    lineItems: mappedLineItems,
  };
}

// Build HSN grouped list from line items
export function buildHsnList(lineItems) {
  const hsnMap = {};
  for (const item of lineItems) {
    const hsn = item.hsnCode;
    const taxValue = item.gst;
    const taxAmount = item.taxAmount ?? ((item.amount * item.gst) / (100 + item.gst));
    const totalAmount = item.amount;
    if (hsnMap[hsn]) {
      hsnMap[hsn].Tax_Amount += taxAmount;
      hsnMap[hsn].Total_Amount += totalAmount;
    } else {
      hsnMap[hsn] = {
        HSN: hsn,
        Tax_Value: taxValue,
        Tax_Amount: taxAmount,
        Total_Amount: totalAmount,
      };
    }
  }
  return Object.values(hsnMap);
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
