# Implementation Plan - Sales Invoice Redesign

## 1. Goal
Refactor the `Sales & Invoice` module to strictly follow the visual design provided in the reference image. This involves creating a complex "Create Sale Invoice" form with detailed header information, a tabluar item list with calculations, and comprehensive footer details including tax, banking, and terms.

## 2. Proposed UI Structure

We will replace the current simple modal `window.openNewSaleModal` with a full-page view similar to the new "Create Quotation" implementation or a highly detailed large modal. Given the density of the form, a **Full Page View** is recommended.

### Grid Layout
The form is divided into three main sections:
1.  **Header (2 Columns)**
    *   **Left (Customer Info):** Name (M/S), Address, Contact Person, Phone, GSTIN, Rev Charge, Ship To, Place of Supply.
    *   **Right (Invoice Detail):** Invoice/Challan Dates, Numbers, Buyer Order No, L.R. No, Destination, Motor Vehicle No, Terms, E-way No, Delivery Mode.
2.  **Item Table (Full Width)**
    *   Columns: Sr, Product, HSN, Qty, UOM, Price, Discount, IGST, Total.
    *   Footer: Total Inv. Val.
3.  **Footer (2 Columns)**
    *   **Left:** Due Date, Bank Details, Terms & Conditions, Notes.
    *   **Right (Calculations):** Taxable, TCS, Tax, Discount, Round Off, Grand Total, Payment Type (Buttons), Smart Suggestion.

## 3. Data Model Enhancements
The existing `sales` object in `Store.state.sales` is too simple (`{id, customer, items (string), date, amount}`).
We need a robust `invoice` object:

```javascript
{
    id: "INV-2026-...",
    type: "invoice", // or 'challan'
    // Customer Info
    customer: {
        name: "", // M/S
        address: "",
        contactPerson: "",
        phone: "",
        gstin: "",
        placeOfSupply: ""
    },
    shipping: {
        shipTo: "", // Address
        destination: "",
        motorVehicleNo: "",
        eWayBillNo: "",
        deliveryMode: ""
    },
    // Invoice Details
    details: {
        invoiceType: "Tax Invoice",
        invoiceNo: { prefix: "", no: "", count: "1305" },
        challanNo: "",
        buyerOrderNo: "...",
        lrNo: "",
        date: "2026-01-03",
        challanDate: "",
        termsOfPayment: "",
        reverseCharge: false
    },
    // Items
    items: [
        { 
            id: 1, 
            name: "", 
            description: "", 
            hsn: "", 
            qty: 0, 
            uom: "nos", 
            price: 0, 
            discount: 0, 
            igstRate: 18, 
            total: 0 
        }
    ],
    // Footer / Calcs
    summary: {
        totalTaxable: 0,
        tcs: { type: "percentage", val: 0, amount: 0 },
        totalTax: 0,
        discount: { type: "flat", val: 0, amount: 0 },
        roundOff: true,
        grandTotal: 0,
        amountInWords: ""
    },
    payment: {
        dueDate: "",
        bank: "",
        type: "Credit" // Credit, Cash, Cheque, Online
    },
    terms: {
        title: "Declaration",
        content: "We declare..."
    },
    notes: ""
}
```

## 4. Implementation Steps

1.  **Preparation**:
    *   Define `createInvoiceState` in `sales.js` to hold the form data.
    *   Create helper function `calculateInvoiceTotals()` to handle the complex math (Line item calculations -> Summary -> Rounding).

2.  **View Construction**:
    *   **Functions**: `renderCreateInvoice()`
    *   **HTML Structure**:
        *   Use `display: grid; grid-template-columns: 1fr 1fr;` for the top and bottom sections.
        *   Use `<table>` for the items.
        *   Use specific input classes like `glass-input` but sized appropriately (dense).
        *   Implement the "Payment Type" buttons (Credit/Cash/Cheque/Online).

3.  **State Logic**:
    *   `window.updateInvoiceGlobal(field, value)`
    *   `window.updateInvoiceItem(index, field, value)`
    *   `window.addInvoiceItem()`
    *   `window.removeInvoiceItem()`
    *   `window.saveInvoice()` -> Pushes to `Store.state.sales`.

4.  **Integration**:
    *   Modify `renderSales` (List View) to have a "New Invoice" button that calls `window.initCreateInvoice()` instead of `openNewSaleModal`.
    *   Ensure `backToSales()` functions correctly.

## 5. Verification
    *   Manually click "New Direct Sale" (Renamed to "Create Invoice").
    *   Verify all form fields from image exist.
    *   Add items and verify calculations (Tax, Discount, Grand Total).
    *   Save and verify it appears in the list.

