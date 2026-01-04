import express from 'express';
import { isAuthenticated as requireAuth } from '../auth.js';
import { db } from '../db.js';
import { 
  fixedCosts, 
  variableCosts, 
  laborCosts,
  menuItems,
  orders,
  orderItems
} from '../../shared/schema.js';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { calculateBreakEven } from '../costAnalysis.js';
import puppeteer from 'puppeteer';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

// Verifica che puppeteer sia disponibile all'avvio
console.log('🤖 [PUPPETEER] Verifica disponibilità Puppeteer...');
try {
  console.log('🤖 [PUPPETEER] Puppeteer importato correttamente');
} catch (error) {
  console.error('❌ [PUPPETEER] Errore nell\'importazione di Puppeteer:', error);
}

const router = express.Router();

// Funzione per generare HTML del report
const generateReportHTML = (data: any, type: 'monthly' | 'annual') => {
  const { 
    breakEvenAnalysis, 
    costBreakdown, 
    profitabilityAnalysis, 
    restaurantInfo, 
    period,
    totalRevenue,
    totalCosts,
    netProfit,
    topPerformingItems,
    recommendations
  } = data;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return `
    <!DOCTYPE html>
    <html lang="it">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Report ${type === 'monthly' ? 'Mensile' : 'Annuale'} - Analisi Costi</title>
      <style>
        @page {
          size: A4;
          margin: 12mm 15mm;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.3;
          color: #2c3e50;
          background: white;
          font-size: 10pt;
        }

        .report-container {
          width: 100%;
          max-width: none;
          background: white;
        }

        .header {
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          color: white;
          padding: 20pt;
          text-align: center;
          page-break-after: avoid;
        }

        .header h1 {
          font-size: 24pt;
          margin-bottom: 8pt;
          font-weight: 700;
        }

        .header .subtitle {
          font-size: 14pt;
          opacity: 0.9;
          margin-bottom: 6pt;
        }

        .header .period {
          background: rgba(255,255,255,0.2);
          padding: 8pt 16pt;
          border-radius: 20pt;
          display: inline-block;
          margin-top: 12pt;
          font-weight: 600;
          font-size: 12pt;
        }

        .company-info {
          background: #f8fafc;
          padding: 15pt;
          margin: 0;
          border-bottom: 1pt solid #e2e8f0;
        }

        .company-info h2 {
          color: #1e40af;
          font-size: 16pt;
          margin-bottom: 8pt;
        }

        .content {
          padding: 20pt;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12pt;
          margin-bottom: 20pt;
          page-break-inside: avoid;
        }

        .kpi-card {
          background: #f8fafc;
          padding: 12pt;
          border-radius: 6pt;
          text-align: center;
          border: 1pt solid #e2e8f0;
        }

        .kpi-card .label {
          color: #64748b;
          font-size: 9pt;
          margin-bottom: 4pt;
          text-transform: uppercase;
          letter-spacing: 0.5pt;
          font-weight: 500;
        }

        .kpi-card .value {
          color: #1e293b;
          font-size: 16pt;
          font-weight: 700;
          line-height: 1;
        }

        .kpi-card.profit .value {
          color: #059669;
        }

        .kpi-card.loss .value {
          color: #dc2626;
        }

        .section {
          margin-bottom: 20pt;
          page-break-inside: avoid;
        }

        .section-title {
          color: #1e40af;
          font-size: 14pt;
          font-weight: 600;
          margin-bottom: 10pt;
          padding-bottom: 4pt;
          border-bottom: 1pt solid #e5e7eb;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin: 12pt 0;
          font-size: 9pt;
          page-break-inside: avoid;
        }

        .data-table th {
          background: #1e40af;
          color: white;
          padding: 8pt;
          text-align: left;
          font-weight: 600;
          font-size: 8pt;
          text-transform: uppercase;
        }

        .data-table td {
          padding: 6pt 8pt;
          border-bottom: 1pt solid #e2e8f0;
        }

        .data-table tr:nth-child(even) {
          background: #f8fafc;
        }

        .analysis-box {
          background: #eff6ff;
          border: 1pt solid #3b82f6;
          border-radius: 6pt;
          padding: 12pt;
          margin: 12pt 0;
          page-break-inside: avoid;
        }

        .recommendations-section {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          color: white;
          padding: 15pt;
          border-radius: 6pt;
          margin: 15pt 0;
          page-break-inside: avoid;
        }

        .recommendations-section h3 {
          font-size: 12pt;
          margin-bottom: 8pt;
          font-weight: 600;
        }

        .recommendations-list {
          list-style: none;
          padding: 0;
        }

        .recommendations-list li {
          margin-bottom: 6pt;
          padding-left: 15pt;
          position: relative;
          line-height: 1.3;
        }

        .recommendations-list li:before {
          content: "→";
          position: absolute;
          left: 0;
          font-weight: bold;
          color: #fbbf24;
        }

        .footer {
          background: #374151;
          color: white;
          text-align: center;
          padding: 12pt;
          font-size: 8pt;
          margin-top: 20pt;
        }

        @media print {
          body {
            background: white;
            padding: 0;
          }

          .report-container {
            box-shadow: none;
            border-radius: 0;
          }

          .card:hover {
            transform: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="report-container">
        <!-- Header Section -->
        <div class="header">
          <h1>Report ${type === 'monthly' ? 'Mensile' : 'Annuale'} - Analisi Finanziaria</h1>
          <div class="subtitle">Analisi Completa Costi, Ricavi e Redditività</div>
          <div class="period">${period}</div>
        </div>

        <!-- Company Information -->
        <div class="company-info">
          <h2>${restaurantInfo?.businessName || 'Ristorante'}</h2>
          <p>Report generato il ${new Date().toLocaleDateString('it-IT')}</p>
        </div>

        <!-- Main Content -->
        <div class="content">
          <!-- Executive Summary KPIs -->
          <div class="section">
            <h2 class="section-title">📊 Riassunto Esecutivo</h2>
            <div class="kpi-grid">
              <div class="kpi-card">
                <div class="label">Ricavi Totali</div>
                <div class="value">${formatCurrency(totalRevenue)}</div>
              </div>
              <div class="kpi-card">
                <div class="label">Costi Totali</div>
                <div class="value">${formatCurrency(totalCosts)}</div>
              </div>
              <div class="kpi-card ${netProfit >= 0 ? 'profit' : 'loss'}">
                <div class="label">${netProfit >= 0 ? 'Profitto' : 'Perdita'}</div>
                <div class="value">${formatCurrency(Math.abs(netProfit))}</div>
              </div>
              <div class="kpi-card">
                <div class="label">Break-Even Necessario</div>
                <div class="value">${formatCurrency(breakEvenAnalysis.breakEvenRevenue)}</div>
              </div>
            </div>
          </div>

          <!-- Break-Even Analysis -->
          <div class="section">
            <h2 class="section-title">📈 Analisi Break-Even</h2>

            <div class="analysis-box">
              <h4>Situazione Attuale</h4>
              <p><strong>Punto di Pareggio:</strong> ${formatCurrency(breakEvenAnalysis.breakEvenRevenue)} (${breakEvenAnalysis.breakEvenUnits} ordini)</p>
              <p><strong>Ricavi Attuali:</strong> ${formatCurrency(breakEvenAnalysis.actualRevenue || 0)}</p>
              <p><strong>Margine di Sicurezza:</strong> ${formatPercentage(breakEvenAnalysis.marginOfSafety || 0)}</p>

              ${breakEvenAnalysis.profitLoss >= 0 ? 
                '<p style="color: #059669; font-weight: 600;">✅ Il ristorante sta generando profitto</p>' :
                `<p style="color: #dc2626; font-weight: 600;">⚠️ Deficit: ${formatCurrency(Math.abs(breakEvenAnalysis.profitLoss))} - Servono ${formatCurrency(breakEvenAnalysis.breakEvenRevenue - (breakEvenAnalysis.actualRevenue || 0))} aggiuntivi</p>`
              }
            </div>

            <table class="data-table">
              <thead>
                <tr>
                  <th>Categoria Costo</th>
                  <th>Importo</th>
                  <th>% su Ricavi</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Costi Fissi</td>
                  <td>${formatCurrency(breakEvenAnalysis.totalFixedCosts)}</td>
                  <td>${((breakEvenAnalysis.totalFixedCosts / (breakEvenAnalysis.actualRevenue || 1)) * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                  <td>Costi Variabili</td>
                  <td>${formatCurrency(breakEvenAnalysis.totalVariableCosts || 0)}</td>
                  <td>${(((breakEvenAnalysis.totalVariableCosts || 0) / (breakEvenAnalysis.actualRevenue || 1)) * 100).toFixed(1)}%</td>
                </tr>
                <tr style="font-weight: 600; background: #f1f5f9;">
                  <td>Totale Costi</td>
                  <td>${formatCurrency(totalCosts)}</td>
                  <td>${((totalCosts / (breakEvenAnalysis.actualRevenue || 1)) * 100).toFixed(1)}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Menu Items Profitability -->
          <div class="section">
            <h2 class="section-title">🏆 Analisi Redditività Menu</h2>

            <table class="data-table">
              <thead>
                <tr>
                  <th>Piatto</th>
                  <th>Prezzo</th>
                  <th>Costo</th>
                  <th>Margine</th>
                  <th>Venduti</th>
                  <th>Profitto Tot.</th>
                </tr>
              </thead>
              <tbody>
                ${topPerformingItems.slice(0, 10).map((item: any) => `
                  <tr>
                    <td>
                      ${item.itemName}
                      ${!item.costConfigured ? '<span style="color: #dc2626; font-size: 8pt;"> (⚠️ Costo non configurato)</span>' : ''}
                    </td>
                    <td>${formatCurrency(item.sellingPrice || 0)}</td>
                    <td>${formatCurrency(item.totalCost || 0)}</td>
                    <td>${formatPercentage(item.contributionMarginPercentage || 0)}</td>
                    <td style="text-align: center;">${item.unitsSold || 0}</td>
                    <td style="font-weight: 600; color: #059669;">${formatCurrency(item.totalProfit || 0)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Recommendations Section -->
          <div class="recommendations-section">
            <h3>💡 Raccomandazioni Strategiche</h3>
            <ul class="recommendations-list">
              ${recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
              ${netProfit < 0 ? `
                <li>Aumentare il fatturato di ${formatCurrency(breakEvenAnalysis.breakEvenRevenue - (breakEvenAnalysis.actualRevenue || 0))} per raggiungere il break-even</li>
                <li>Ridurre i costi variabili per migliorare la redditività</li>
                <li>Focalizzarsi sui piatti con margine superiore al 60%</li>
              ` : `
                <li>Ottimizzare i piatti con margine inferiore al 40%</li>
                <li>Considerare l'espansione del menu con piatti simili ai top performers</li>
                <li>Monitorare regolarmente i costi per mantenere la profittabilità</li>
              `}
            </ul>
          </div>

          <!-- Summary and Next Steps -->
          <div class="analysis-box">
            <h4>Prossimi Passi Consigliati</h4>
            <p>1. <strong>Revisione Mensile:</strong> Analizzare questo report ogni mese per identificare tendenze</p>
            <p>2. <strong>Ottimizzazione Menu:</strong> Concentrarsi sui piatti più redditizi</p>
            <p>3. <strong>Controllo Costi:</strong> Monitorare costantemente i costi per mantenere margini sani</p>
            <p>4. <strong>Strategia Prezzi:</strong> Considerare aggiustamenti basati sui margini</p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #374151; color: white; text-align: center; padding: 12pt; font-size: 8pt; margin-top: 20pt;">
          <p>Report Analisi Finanziaria Ristorante</p>
          <p>Generato automaticamente il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}</p>
          <p>Powered by Sistema di Gestione Ristorante</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Endpoint per generare report PDF
router.get('/generate-pdf-report', requireAuth, async (req, res) => {
  try {
    console.log(`🚀 [PDF SERVER] Endpoint raggiunto - START`);
    console.log(`📋 [PDF SERVER] Headers richiesta:`, req.headers);
    console.log(`📋 [PDF SERVER] Query params:`, req.query);

    if (!req.user) {
      console.error(`❌ [PDF SERVER] Utente non autenticato`);
      return res.status(401).json({ error: 'Utente non autenticato' });
    }

    const userId = req.user.id;
    const { type = 'monthly', year, month } = req.query;

    console.log(`🚀 [PDF SERVER] Inizio generazione report PDF ${type} per owner ${userId}`);
    console.log(`📋 [PDF SERVER] Parametri ricevuti:`, { type, year, month });
    console.log(`👤 [PDF SERVER] Utente:`, { id: req.user.id, email: req.user.email });

    // Calcola le date del periodo
    const currentDate = new Date();
    const reportYear = parseInt(year as string) || currentDate.getFullYear();
    const reportMonth = parseInt(month as string) || (currentDate.getMonth() + 1);

    console.log(`📅 [PDF SERVER] Date calcolate:`, { reportYear, reportMonth });

    let startDate: Date;
    let endDate: Date;
    let period: string;

    if (type === 'monthly') {
      startDate = new Date(reportYear, reportMonth - 1, 1);
      endDate = new Date(reportYear, reportMonth, 0);
      period = format(startDate, 'MMMM yyyy', { locale: it });
    } else {
      startDate = new Date(reportYear, 0, 1);
      endDate = new Date(reportYear, 11, 31);
      period = `Anno ${reportYear}`;
    }

    console.log(`📅 [PDF SERVER] Periodo calcolato:`, { startDate, endDate, period });

    // Ottieni dati di analisi
    console.log(`📊 [PDF SERVER] Inizio calcolo break-even analysis...`);
    const breakEvenAnalysis = await calculateBreakEven(userId, type as 'monthly' | 'annual', startDate);
    console.log(`📊 [PDF SERVER] Break-even analysis completata:`, breakEvenAnalysis);

    // Calcola ricavi totali
    console.log(`💰 [PDF SERVER] Inizio calcolo ricavi totali...`);
    const revenueQuery = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), 0)`
      })
      .from(orders)
      .where(
        and(
          eq(orders.userId, userId),
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate),
          eq(orders.status, 'completed')
        )
      );

    const totalRevenue = Number(revenueQuery[0]?.total || 0);
    console.log(`💰 [PDF SERVER] Ricavi totali calcolati: €${totalRevenue}`);

    // Ottieni top piatti performanti con gestione sicura
    console.log(`🏆 [PDF SERVER] Inizio query top piatti performanti...`);
    let topItemsQuery = [];
    try {
      topItemsQuery = await db
        .select({
          itemName: menuItems.name,
          sellingPrice: menuItems.price,
          foodCost: menuItems.costPrice,
          unitsSold: sql<number>`COUNT(${orderItems.id})`,
          totalRevenue: sql<number>`SUM(CAST(${orderItems.price} AS DECIMAL))`,
          totalProfit: sql<number>`SUM(CAST(${orderItems.price} AS DECIMAL) - COALESCE(CAST(${menuItems.costPrice} AS DECIMAL), 0))`,
          contributionMarginPercentage: sql<number>`
            CASE 
              WHEN CAST(${menuItems.price} AS DECIMAL) > 0 THEN
                ((CAST(${menuItems.price} AS DECIMAL) - COALESCE(CAST(${menuItems.costPrice} AS DECIMAL), 0)) / CAST(${menuItems.price} AS DECIMAL)) * 100
              ELSE 0
            END
          `
        })
        .from(orderItems)
        .innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(
          and(
            eq(orders.userId, userId),
            gte(orders.createdAt, startDate),
            lte(orders.createdAt, endDate),
            eq(orders.status, 'completed')
          )
        )
        .groupBy(menuItems.id, menuItems.name, menuItems.price, menuItems.costPrice)
        .orderBy(desc(sql`SUM(CAST(${orderItems.price} AS DECIMAL) - COALESCE(CAST(${menuItems.costPrice} AS DECIMAL), 0))`));

      console.log(`🏆 [PDF SERVER] Query top piatti completata, trovati ${topItemsQuery.length} piatti`);
    } catch (topItemsError) {
      console.error(`❌ [PDF SERVER] Errore nella query top piatti:`, topItemsError);
      topItemsQuery = []; // Fallback a array vuoto
    }

    const topPerformingItems = (topItemsQuery || []).map(item => ({
      itemName: item?.itemName || 'Nome non disponibile',
      sellingPrice: Number(item?.sellingPrice || 0),
      foodCost: Number(item?.foodCost || 0),
      unitsSold: Number(item?.unitsSold || 0),
      totalProfit: Number(item?.totalProfit || 0),
      contributionMarginPercentage: Number(item?.contributionMarginPercentage || 0)
    }));

    console.log(`🏆 [PDF SERVER] Top items processati: ${topPerformingItems.length} elementi`);

    // Calcola breakdown costi
    const totalCosts = breakEvenAnalysis.totalFixedCosts + (breakEvenAnalysis.totalVariableCosts || 0);
    const netProfit = totalRevenue - totalCosts;

    const costBreakdown = {
      'Costi Fissi': breakEvenAnalysis.totalFixedCosts,
      'Costi Variabili': breakEvenAnalysis.totalVariableCosts || 0,
      'Costi del Lavoro': 0, // Da calcolare se necessario
    };

    // Genera raccomandazioni
    const recommendations = [
      netProfit < 0 ? 
        `Aumentare il fatturato di ${Math.abs(netProfit).toFixed(0)}€ per raggiungere il pareggio` :
        `Ottima performance! Profitto di ${netProfit.toFixed(0)}€ raggiunto`,
      topPerformingItems.length > 0 ? 
        `Promuovere maggiormente "${topPerformingItems[0].itemName}" che genera il maggior profitto` :
        'Analizzare il menu per identificare i piatti più redditizi',
      breakEvenAnalysis.marginOfSafety < 20 ? 
        'Diversificare l\'offerta per ridurre il rischio finanziario' :
        'Mantenere l\'attuale strategia di pricing',
      'Monitorare i costi variabili per ottimizzare i margini',
      'Implementare promozioni sui piatti ad alto margine'
    ];

    // Valida i dati prima della generazione
    console.log(`✅ [PDF SERVER] Validazione dati:`);
    console.log(`   breakEvenAnalysis:`, !!breakEvenAnalysis);
    console.log(`   totalRevenue:`, typeof totalRevenue, totalRevenue);
    console.log(`   totalCosts:`, typeof totalCosts, totalCosts);

    if (!breakEvenAnalysis || typeof totalRevenue !== 'number' || typeof totalCosts !== 'number') {
      console.error(`❌ [PDF SERVER] Dati insufficienti per generare il report`);
      throw new Error('Dati insufficienti per generare il report');
    }

    // Prepara dati per il template
    const reportData = {
      breakEvenAnalysis,
      costBreakdown,
      totalRevenue: Math.max(0, totalRevenue),
      totalCosts: Math.max(0, totalCosts),
      netProfit,
      topPerformingItems: topPerformingItems.slice(0, 10), // Limita a 10 elementi
      recommendations,
      period,
      restaurantInfo: {
        name: 'Il Tuo Ristorante',
        owner: req.user.email
      }
    };

    console.log(`📝 [PDF SERVER] Dati report preparati:`, {
      totalRevenue: reportData.totalRevenue,
      totalCosts: reportData.totalCosts,
      netProfit: reportData.netProfit,
      topItemsCount: reportData.topPerformingItems.length,
      recommendationsCount: reportData.recommendations.length
    });

    // Genera HTML
    console.log(`🌐 [PDF SERVER] Inizio generazione HTML...`);
    const htmlContent = generateReportHTML(reportData, type as 'monthly' | 'annual');
    console.log(`🌐 [PDF SERVER] HTML generato, lunghezza: ${htmlContent.length} caratteri`);

    // Controlla che siamo in un ambiente che supporta Puppeteer
    console.log(`🔧 [PDF SERVER] Controllo ambiente per Puppeteer...`);
    console.log(`🔧 [PDF SERVER] NODE_ENV:`, process.env.NODE_ENV);

    // Genera PDF con Puppeteer con configurazione migliorata per Replit
    let browser;
    let pdfBuffer;
    try {
      console.log(`🤖 [PDF SERVER] Avvio Puppeteer...`);

      // Trova il percorso di Chromium nel sistema
      const chromiumPath = process.env.CHROME_BIN || '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium' || '/usr/bin/chromium' || '/usr/bin/chromium-browser' || 'chromium';
      console.log(`🔧 [PDF SERVER] Utilizzando Chromium da: ${chromiumPath}`);

      browser = await puppeteer.launch({
        headless: 'new',
        executablePath: chromiumPath,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-default-apps',
          '--mute-audio',
          '--no-default-browser-check',
          '--no-crash-upload',
          '--disable-ipc-flooding-protection',
          '--disable-backgrounding-occluded-windows',
          '--disable-background-timer-throttling',
          '--disable-features=TranslateUI',
          '--disable-component-extensions-with-background-pages',
          '--disable-default-apps',
          '--disable-domain-reliability',
          '--disable-features=AutofillServerCommunication'
        ],
        timeout: 60000
      });
      console.log(`🤖 [PDF SERVER] Browser Puppeteer avviato con successo`);

      const page = await browser.newPage();
      console.log(`📄 [PDF SERVER] Nuova pagina creata`);

      // Imposta viewport e user agent
      await page.setViewport({ width: 1200, height: 800 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      console.log(`🖥️ [PDF SERVER] Viewport e User Agent impostati`);

      // Carica il contenuto HTML
      console.log(`📝 [PDF SERVER] Caricamento contenuto HTML (${htmlContent.length} caratteri)...`);
      await page.setContent(htmlContent, { 
        waitUntil: ['load', 'domcontentloaded'],
        timeout: 30000
      });
      console.log(`📝 [PDF SERVER] Contenuto HTML caricato con successo`);

      // Attendi che tutto sia renderizzato
      console.log(`⏳ [PDF SERVER] Attesa rendering (2 secondi)...`);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Genera PDF con opzioni ottimizzate
      console.log(`📄 [PDF SERVER] Inizio generazione PDF...`);
      pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: false,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        },
        timeout: 30000
      });
      console.log(`📄 [PDF SERVER] PDF generato, dimensione: ${pdfBuffer.length} bytes`);

      await browser.close();
      console.log(`🤖 [PDF SERVER] Browser chiuso`);

      // Verifica che il PDF sia stato generato correttamente
      if (!pdfBuffer || pdfBuffer.length < 1000) {
        console.error(`❌ [PDF SERVER] PDF troppo piccolo o corrotto: ${pdfBuffer?.length || 0} bytes`);
        throw new Error('PDF generato è troppo piccolo o corrotto');
      }

      console.log(`✅ [PDF SERVER] PDF generato con successo: ${pdfBuffer.length} bytes`);

    } catch (puppeteerError: any) {
      console.error('❌ [PDF SERVER] Errore Puppeteer:', puppeteerError);
      console.error('❌ [PDF SERVER] Stack trace:', puppeteerError?.stack);
      if (browser) {
        try {
          await browser.close();
          console.log(`🤖 [PDF SERVER] Browser chiuso dopo errore`);
        } catch (closeError) {
          console.error('❌ [PDF SERVER] Errore nella chiusura del browser:', closeError);
        }
      }
      throw new Error(`Errore nella generazione PDF: ${puppeteerError?.message || 'Errore sconosciuto'}`);
    }

    // Imposta headers per download PRIMA di inviare qualsiasi risposta
    const filename = `report-${type}-${reportYear}${type === 'monthly' ? `-${reportMonth.toString().padStart(2, '0')}` : ''}.pdf`;

    console.log(`📤 [PDF SERVER] Preparazione risposta HTTP:`);
    console.log(`   Filename: ${filename}`);
    console.log(`   Content-Length: ${pdfBuffer.length}`);
    console.log(`   Content-Type: application/pdf`);

    // Assicurati che non sia già stata inviata una risposta
    if (res.headersSent) {
      console.error(`❌ [PDF SERVER] Headers già inviati! Non posso inviare PDF.`);
      return;
    }

    // Imposta tutti gli headers prima di inviare il contenuto
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length.toString());
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    console.log(`📤 [PDF SERVER] Headers impostati, invio PDF di ${pdfBuffer.length} bytes...`);

    // Invia il buffer PDF direttamente
    res.end(pdfBuffer);
    console.log(`✅ [PDF SERVER] PDF inviato con successo!`);
    return; // Importante: esce dalla funzione dopo aver inviato la risposta

  } catch (error: any) {
    console.error('❌ [PDF SERVER] ERRORE FATALE nella generazione report PDF:', error);
    console.error('❌ [PDF SERVER] Stack trace completo:', error?.stack);
    console.error('❌ [PDF SERVER] Tipo errore:', error?.constructor?.name);
    console.error('❌ [PDF SERVER] Messaggio:', error?.message);

    // Assicurati che non sia già stata inviata una risposta
    if (res.headersSent) {
      console.error(`❌ [PDF SERVER] Headers già inviati, non posso inviare errore`);
      return;
    }

    // Genera un semplice PDF di errore invece di testo
    console.log(`🔄 [PDF SERVER] Tentativo fallback con PDF di errore...`);
    try {
      const errorHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; }
              .error { background: #ffebee; border: 2px solid #f44336; padding: 20px; border-radius: 8px; }
              .title { color: #d32f2f; font-size: 24px; margin-bottom: 20px; }
              .message { color: #666; line-height: 1.6; }
            </style>
          </head>
          <body>
            <div class="error">
              <div class="title">Errore nella Generazione Report</div>
              <div class="message">
                <p>Si è verificato un errore durante la generazione del report PDF.</p>
                <p><strong>Tipo:</strong> ${req.query.type || 'N/A'}</p>
                <p><strong>Anno:</strong> ${req.query.year || 'N/A'}</p>
                ${req.query.type === 'monthly' ? `<p><strong>Mese:</strong> ${req.query.month || 'N/A'}</p>` : ''}
                <p><strong>Errore:</strong> ${error?.message || 'Errore sconosciuto'}</p>
                <p><strong>Data:</strong> ${new Date().toLocaleString('it-IT')}</p>
              </div>
            </div>
          </body>
          </html>
        `;

      // Prova a generare un PDF di errore con Puppeteer
      let errorBrowser;
      try {
        errorBrowser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        const errorPage = await errorBrowser.newPage();
        await errorPage.setContent(errorHtml);
        const errorPdf = await errorPage.pdf({ format: 'A4', printBackground: true });
        await errorBrowser.close();

        const filename = `report-error-${req.query.type || 'unknown'}-${req.query.year || 'unknown'}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.end(errorPdf);
        console.log(`✅ [PDF SERVER] PDF di errore inviato con successo`);
        return;

      } catch (puppeteerError) {
        console.error(`❌ [PDF SERVER] Impossibile generare PDF di errore:`, puppeteerError);
        if (errorBrowser) await errorBrowser.close();
      }

      // Ultimo fallback: JSON error
      res.status(500).json({ 
        error: 'Errore nella generazione del report PDF',
        details: error?.message || 'Errore sconosciuto',
        type: req.query.type || 'unknown',
        year: req.query.year || 'unknown',
        month: req.query.type === 'monthly' ? req.query.month : undefined,
        timestamp: new Date().toISOString()
      });

    } catch (fallbackError: any) {
      console.error('❌ [PDF SERVER] Errore anche nel fallback:', fallbackError);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Errore critico nella generazione del report',
          details: error?.message || 'Errore sconosciuto',
          fallbackError: fallbackError?.message || 'Errore fallback sconosciuto'
        });
      }
    }
  }

  // Helper per formattare valuta
  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  }
});

export default router;