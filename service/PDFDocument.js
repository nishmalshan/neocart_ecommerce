const PDFDocument = require('pdfkit');
const path = require('path');


function addHeader(doc, order) {
    doc
      .fontSize(20)
      .text('INVOICE', { align: 'center' })
      .moveDown();
  }



  function addCustomerInformation(doc, order) {
    doc
      .fontSize(12)
      .text(`Order ID: ${order._id}`, 50, 120)
      .text(`Date: ${new Date(order.orderDate).toLocaleDateString()}`, 50, 140)
      .moveDown()
      .text('Bill To:', 50, 180)
      .text(`${order.address[0].name}`, 50, 200)
      .text(`${order.address[0].address}`, 50, 220)
      .text(`${order.address[0].city}, ${order.address[0].state}, ${order.address[0].pincode}`, 50, 240);
  }
  



  function addInvoiceTable(doc, order) {
    doc.moveDown().fontSize(14).text('Products:', 50, 270, { underline: true });
  
    const tableTop = 300;
    const tableHeaders = ['Product', 'Quantity', 'Unit Price', 'Total'];
    const columnWidths = [200, 70, 100, 100];
  
    // Draw table headers
    doc.fontSize(12);
    tableHeaders.forEach((header, i) => {
      doc.text(header, 50 + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), tableTop);
    });
  
    doc.moveTo(50, tableTop + 20).lineTo(550, tableTop + 20).stroke();
  
    let rowTop = tableTop + 30;
  
    order.items.forEach(item => {
      const itemPrice = typeof item.price === 'number' ? item.price : 0;
      const quantity = item.quantity || 0;
      const total = (quantity * itemPrice).toFixed(2);
  
      doc.fontSize(10);
      doc.text(item.productId.name || 'Unknown Product', 50, rowTop);
      doc.text(quantity.toString(), 250, rowTop);
      doc.text(`Rs.${itemPrice.toFixed(2)}`, 320, rowTop);
      doc.text(`Rs.${total}`, 420, rowTop);
  
      rowTop += 20;
    });
  
    doc.moveTo(50, rowTop).lineTo(550, rowTop).stroke();
  
    const totalPrice = order.items.reduce((acc, item) => {
      const itemPrice = typeof item.price === 'number' ? item.price : 0;
      return acc + (item.quantity || 0) * itemPrice;
    }, 0);
  
    doc
      .moveDown()
      .fontSize(12)
      .text(`Total Price: Rs.${totalPrice.toFixed(2)}`, { align: 'right' });
  }
  




  function addFooter(doc) {
    doc
      .fontSize(10)
      .text('Thank you for your business.', 50, 780, { align: 'center', width: 500 });
  }






  module.exports = {
    addHeader,
    addCustomerInformation,
    addInvoiceTable,
    addFooter
  }