import { Expense, ExpenseCategory, PaymentMethod, MONTH_NAMES } from '../types/expense';

export interface SpreadsheetInfo {
  id: string;
  name: string;
  webViewLink: string;
  createdTime?: string;
}

const SHEET_TITLE = 'SpendWise - Expenses & Budget Tracker';
const EXPENSES_TAB = '💳 Expenses';
const SUMMARY_TAB = '📊 Summary & Analytics';

/**
 * Searches Google Drive for an existing SpendWise spreadsheet or creates a new one.
 */
export async function findOrCreateExpenseSpreadsheet(
  accessToken: string
): Promise<{ spreadsheet: SpreadsheetInfo; isNew: boolean }> {
  try {
    // 1. Search existing files in user's Drive
    const query = encodeURIComponent(
      `name = '${SHEET_TITLE}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`
    );
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink,createdTime)&orderBy=modifiedTime desc`;

    const searchRes = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        const file = searchData.files[0];
        return {
          spreadsheet: {
            id: file.id,
            name: file.name,
            webViewLink: file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}`,
            createdTime: file.createdTime,
          },
          isNew: false,
        };
      }
    }

    // 2. Not found, create new structured spreadsheet
    const createUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: SHEET_TITLE,
          locale: 'en_US',
          autoRecalc: 'ON_CHANGE',
        },
        sheets: [
          {
            properties: {
              sheetId: 0,
              title: EXPENSES_TAB,
              gridProperties: {
                frozenRowCount: 1,
                rowCount: 500,
                columnCount: 10,
              },
            },
          },
          {
            properties: {
              sheetId: 1,
              title: SUMMARY_TAB,
              gridProperties: {
                frozenRowCount: 2,
                rowCount: 60,
                columnCount: 8,
              },
            },
          },
        ],
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json();
      throw new Error(err.error?.message || 'Failed to create Google Spreadsheet');
    }

    const createdData = await createRes.json();
    const spreadsheetId = createdData.spreadsheetId;
    const webViewLink = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

    // 3. Populate headers, formulas, and professional styles
    await formatNewSpreadsheet(accessToken, spreadsheetId);

    return {
      spreadsheet: {
        id: spreadsheetId,
        name: SHEET_TITLE,
        webViewLink,
      },
      isNew: true,
    };
  } catch (error: any) {
    console.error('Error in findOrCreateExpenseSpreadsheet:', error);
    throw error;
  }
}

/**
 * Applies executive financial styling, color palettes, formulas, and column widths.
 */
export async function formatNewSpreadsheet(accessToken: string, spreadsheetId: string) {
  // A. Set Header values for Expenses Tab
  const expensesHeaders = [
    [
      'Transaction ID',
      'Date',
      'Month',
      'Year',
      'Category',
      'Amount (৳ BDT)',
      'Title / Description',
      'Payment Method',
      'Notes / Details',
      'Created Timestamp',
    ],
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${EXPENSES_TAB}'!A1:J1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: expensesHeaders }),
    }
  );

  // B. Setup Summary & Analytics Tab Values and Formulas
  const summaryRows: any[][] = [
    ['SPENDWISE FINANCIAL OVERVIEW & EXPENSE SUMMARY', '', '', '', ''],
    ['Automated live reporting synchronized with SpendWise dashboard', '', '', '', ''],
    ['', '', '', '', ''],
    ['METRIC', 'VALUE', '', 'METRIC', 'VALUE'],
    ['Total All-Time Spend', `=IFERROR(SUM('${EXPENSES_TAB}'!F2:F), 0)`, '', 'Total Transactions', `=IFERROR(COUNTA('${EXPENSES_TAB}'!A2:A), 0)`],
    ['Average Expense', `=IFERROR(AVERAGE('${EXPENSES_TAB}'!F2:F), 0)`, '', 'Max Single Expense', `=IFERROR(MAX('${EXPENSES_TAB}'!F2:F), 0)`],
    ['', '', '', '', ''],
    ['MONTHLY BREAKDOWN', 'SPEND (৳)', '% OF TOTAL', 'TRANSACTIONS', 'STATUS'],
  ];

  // Add 12 months with formulas
  MONTH_NAMES.forEach((month, idx) => {
    const rowNum = 9 + idx;
    summaryRows.push([
      month,
      `=IFERROR(SUMIF('${EXPENSES_TAB}'!$C$2:$C, "${month}", '${EXPENSES_TAB}'!$F$2:$F), 0)`,
      `=IFERROR(IF($B$5>0, B${rowNum}/$B$5, 0), 0)`,
      `=IFERROR(COUNTIF('${EXPENSES_TAB}'!$C$2:$C, "${month}"), 0)`,
      `=IF(B${rowNum}>0, "Active", "No Expenses")`,
    ]);
  });

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${SUMMARY_TAB}'!A1:E21?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: summaryRows }),
    }
  );

  // C. Execute batchUpdate formatting: Colors, Borders, Widths, Number Formats
  const batchRequests = [
    // 1. Header style for Expenses Tab (Dark Slate #0f172a, White Bold Text)
    {
      repeatCell: {
        range: {
          sheetId: 0,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: 10,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.06, green: 0.09, blue: 0.16 }, // #0f172a
            textFormat: {
              foregroundColor: { red: 1, green: 1, blue: 1 },
              bold: true,
              fontSize: 10,
            },
            horizontalAlignment: 'CENTER',
            verticalAlignment: 'MIDDLE',
            wrapStrategy: 'WRAP',
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,wrapStrategy)',
      },
    },
    // 2. Format Amount Column (Col F, Index 5) as Currency (৳#,##0.00)
    {
      repeatCell: {
        range: {
          sheetId: 0,
          startRowIndex: 1,
          endRowIndex: 500,
          startColumnIndex: 5,
          endColumnIndex: 6,
        },
        cell: {
          userEnteredFormat: {
            numberFormat: {
              type: 'CURRENCY',
              pattern: '"৳"#,##0.00',
            },
            textFormat: { bold: true },
            horizontalAlignment: 'RIGHT',
          },
        },
        fields: 'userEnteredFormat(numberFormat,textFormat,horizontalAlignment)',
      },
    },
    // 3. Format Date Column (Col B, Index 1)
    {
      repeatCell: {
        range: {
          sheetId: 0,
          startRowIndex: 1,
          endRowIndex: 500,
          startColumnIndex: 1,
          endColumnIndex: 2,
        },
        cell: {
          userEnteredFormat: {
            horizontalAlignment: 'CENTER',
          },
        },
        fields: 'userEnteredFormat(horizontalAlignment)',
      },
    },
    // 4. Set Column Widths on Expenses Tab
    {
      updateDimensionProperties: {
        range: { sheetId: 0, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 }, // ID
        properties: { pixelSize: 140 },
        fields: 'pixelSize',
      },
    },
    {
      updateDimensionProperties: {
        range: { sheetId: 0, dimension: 'COLUMNS', startIndex: 1, endIndex: 2 }, // Date
        properties: { pixelSize: 110 },
        fields: 'pixelSize',
      },
    },
    {
      updateDimensionProperties: {
        range: { sheetId: 0, dimension: 'COLUMNS', startIndex: 2, endIndex: 4 }, // Month, Year
        properties: { pixelSize: 95 },
        fields: 'pixelSize',
      },
    },
    {
      updateDimensionProperties: {
        range: { sheetId: 0, dimension: 'COLUMNS', startIndex: 4, endIndex: 5 }, // Category
        properties: { pixelSize: 150 },
        fields: 'pixelSize',
      },
    },
    {
      updateDimensionProperties: {
        range: { sheetId: 0, dimension: 'COLUMNS', startIndex: 5, endIndex: 6 }, // Amount
        properties: { pixelSize: 120 },
        fields: 'pixelSize',
      },
    },
    {
      updateDimensionProperties: {
        range: { sheetId: 0, dimension: 'COLUMNS', startIndex: 6, endIndex: 7 }, // Title
        properties: { pixelSize: 220 },
        fields: 'pixelSize',
      },
    },
    {
      updateDimensionProperties: {
        range: { sheetId: 0, dimension: 'COLUMNS', startIndex: 7, endIndex: 8 }, // Method
        properties: { pixelSize: 130 },
        fields: 'pixelSize',
      },
    },
    {
      updateDimensionProperties: {
        range: { sheetId: 0, dimension: 'COLUMNS', startIndex: 8, endIndex: 9 }, // Notes
        properties: { pixelSize: 200 },
        fields: 'pixelSize',
      },
    },
    // 5. Summary Banner Styling (Indigo #4338ca, White Bold 14pt)
    {
      repeatCell: {
        range: {
          sheetId: 1,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: 5,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.26, green: 0.22, blue: 0.79 },
            textFormat: {
              foregroundColor: { red: 1, green: 1, blue: 1 },
              bold: true,
              fontSize: 13,
            },
            verticalAlignment: 'MIDDLE',
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,verticalAlignment)',
      },
    },
    // 6. Summary Metric Cards Header (Dark Navy #1e293b)
    {
      repeatCell: {
        range: {
          sheetId: 1,
          startRowIndex: 3,
          endRowIndex: 4,
          startColumnIndex: 0,
          endColumnIndex: 5,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.12, green: 0.16, blue: 0.23 },
            textFormat: {
              foregroundColor: { red: 1, green: 1, blue: 1 },
              bold: true,
              fontSize: 10,
            },
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat)',
      },
    },
    // 7. Format Metric Values Currency
    {
      repeatCell: {
        range: {
          sheetId: 1,
          startRowIndex: 4,
          endRowIndex: 6,
          startColumnIndex: 1,
          endColumnIndex: 2,
        },
        cell: {
          userEnteredFormat: {
            numberFormat: {
              type: 'CURRENCY',
              pattern: '"৳"#,##0.00',
            },
            textFormat: { bold: true, fontSize: 11 },
          },
        },
        fields: 'userEnteredFormat(numberFormat,textFormat)',
      },
    },
    // 8. Format Monthly Table Header
    {
      repeatCell: {
        range: {
          sheetId: 1,
          startRowIndex: 7,
          endRowIndex: 8,
          startColumnIndex: 0,
          endColumnIndex: 5,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.12, green: 0.16, blue: 0.23 },
            textFormat: {
              foregroundColor: { red: 1, green: 1, blue: 1 },
              bold: true,
              fontSize: 10,
            },
            horizontalAlignment: 'CENTER',
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
      },
    },
    // 9. Format Monthly Spend Currency
    {
      repeatCell: {
        range: {
          sheetId: 1,
          startRowIndex: 8,
          endRowIndex: 20,
          startColumnIndex: 1,
          endColumnIndex: 2,
        },
        cell: {
          userEnteredFormat: {
            numberFormat: {
              type: 'CURRENCY',
              pattern: '"৳"#,##0.00',
            },
            textFormat: { bold: true },
            horizontalAlignment: 'RIGHT',
          },
        },
        fields: 'userEnteredFormat(numberFormat,textFormat,horizontalAlignment)',
      },
    },
    // 10. Format Monthly %
    {
      repeatCell: {
        range: {
          sheetId: 1,
          startRowIndex: 8,
          endRowIndex: 20,
          startColumnIndex: 2,
          endColumnIndex: 3,
        },
        cell: {
          userEnteredFormat: {
            numberFormat: {
              type: 'PERCENT',
              pattern: '0.0%',
            },
            horizontalAlignment: 'CENTER',
          },
        },
        fields: 'userEnteredFormat(numberFormat,horizontalAlignment)',
      },
    },
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests: batchRequests }),
  });
}

/**
 * Reads all expenses from the Google Sheet
 */
export async function fetchExpensesFromSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<Expense[]> {
  try {
    const range = encodeURIComponent(`'${EXPENSES_TAB}'!A2:J`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('Spreadsheet not found');
      }
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to fetch spreadsheet rows');
    }

    const data = await res.json();
    const rows: any[][] = data.values || [];

    const expenses: Expense[] = [];

    rows.forEach((row, idx) => {
      // Row 1 is header, so index 0 is row 2 in the sheet
      const sheetRowIndex = idx + 2;
      const id = row[0] || `exp-${Date.now()}-${idx}`;
      const date = row[1] || new Date().toISOString().split('T')[0];
      const month = row[2] || MONTH_NAMES[new Date(date).getMonth()] || 'January';
      const year = parseInt(row[3], 10) || new Date(date).getFullYear() || 2026;
      const category = (row[4] || 'Miscellaneous') as ExpenseCategory;
      const amountStr = String(row[5] || '0').replace(/[^0-9.-]+/g, '');
      const amount = parseFloat(amountStr) || 0;
      const title = row[6] || 'Untitled Expense';
      const paymentMethod = (row[7] || 'Other') as PaymentMethod;
      const notes = row[8] || '';
      const createdAt = row[9] || new Date().toISOString();

      if (title || amount > 0) {
        expenses.push({
          id,
          date,
          month,
          year,
          category,
          amount,
          title,
          paymentMethod,
          notes,
          createdAt,
          sheetRowIndex,
        });
      }
    });

    return expenses;
  } catch (error) {
    console.error('fetchExpensesFromSheet error:', error);
    throw error;
  }
}

/**
 * Appends a new expense row to the Google Sheet
 */
export async function appendExpenseToSheet(
  accessToken: string,
  spreadsheetId: string,
  expense: Expense
): Promise<{ sheetRowIndex: number }> {
  try {
    const rowValues = [
      expense.id,
      expense.date,
      expense.month,
      expense.year,
      expense.category,
      expense.amount,
      expense.title,
      expense.paymentMethod,
      expense.notes || '',
      expense.createdAt,
    ];

    const range = encodeURIComponent(`'${EXPENSES_TAB}'!A:J`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowValues],
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to append expense to Google Sheet');
    }

    const data = await res.json();
    // Parse updatedRange like "'💳 Expenses'!A5:J5" to find the row index
    let rowIndex = 2;
    if (data.updates?.updatedRange) {
      const match = data.updates.updatedRange.match(/([0-9]+):[A-Z]+([0-9]+)/);
      if (match && match[1]) {
        rowIndex = parseInt(match[1], 10);
      }
    }

    return { sheetRowIndex: rowIndex };
  } catch (error) {
    console.error('appendExpenseToSheet error:', error);
    throw error;
  }
}

/**
 * Updates an existing expense row in Google Sheet
 */
export async function updateExpenseInSheet(
  accessToken: string,
  spreadsheetId: string,
  expense: Expense,
  rowIndex: number
): Promise<void> {
  try {
    const rowValues = [
      expense.id,
      expense.date,
      expense.month,
      expense.year,
      expense.category,
      expense.amount,
      expense.title,
      expense.paymentMethod,
      expense.notes || '',
      expense.createdAt,
    ];

    const range = encodeURIComponent(`'${EXPENSES_TAB}'!A${rowIndex}:J${rowIndex}`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowValues],
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to update expense in Google Sheet');
    }
  } catch (error) {
    console.error('updateExpenseInSheet error:', error);
    throw error;
  }
}

/**
 * Deletes an expense row from Google Sheet
 */
export async function deleteExpenseFromSheet(
  accessToken: string,
  spreadsheetId: string,
  rowIndex: number // 1-based row index in Google Sheet
): Promise<void> {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;

    // Sheets API uses 0-based indexing for row deletion
    const startIndex = rowIndex - 1;
    const endIndex = rowIndex;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: 0, // Expenses tab
                dimension: 'ROWS',
                startIndex,
                endIndex,
              },
            },
          },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to delete row from Google Sheet');
    }
  } catch (error) {
    console.error('deleteExpenseFromSheet error:', error);
    throw error;
  }
}
