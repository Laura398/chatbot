// ordersDB.js : Fonctions pour accéder aux commandes et générer une facture PDF
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const ordersPath = path.join(__dirname, '../db/orders.json');

function getOrderById(orderId) {
    const orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));
    return orders.find(o => o.orderId === orderId);
}

function generateInvoicePDF(orderId, outputPath) {
    const order = getOrderById(orderId);
    if (!order) throw new Error('Commande introuvable');
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(outputPath));

    doc.fontSize(20).text('Facture', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Numéro de commande : ${order.orderId}`);
    doc.text(`Utilisateur : ${order.userId}`);
    doc.text(`Date : ${order.date}`);
    doc.text(`Statut : ${order.status}`);
    doc.moveDown();
    doc.text('Articles :');
    order.items.forEach(item => {
        doc.text(`- ${item.name} x${item.qty} : ${item.price.toFixed(2)}€`);
    });
    doc.moveDown();
    doc.fontSize(14).text(`Total : ${order.total.toFixed(2)}€`, { align: 'right' });
    doc.end();
}

module.exports = { getOrderById, generateInvoicePDF };
