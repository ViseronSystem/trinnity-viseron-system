const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function convertHtmlToPdf(htmlPath, pdfPath) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    printBackground: true
  });
  
  await browser.close();
  console.log(`PDF generated: ${pdfPath}`);
}

const htmlFile = process.argv[2] || 'data/Viseron_Analisis_Patentes.html';
const pdfFile = process.argv[3] || 'data/Viseron_Analisis_Patentes.pdf';

convertHtmlToPdf(htmlFile, pdfFile).catch(console.error);
