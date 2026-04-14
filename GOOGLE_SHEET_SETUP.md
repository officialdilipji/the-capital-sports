# Google Sheets Backend Setup for The Capital Sports

Follow these steps to connect your application to Google Sheets for real-time data synchronization.

## Step 1: Create the Google Sheet
1. Create a new Google Sheet named **Capital Sports Database**.
2. Create the following tabs (sheets) with these exact headers in the first row:

### Tab: `Members`
`id`, `name`, `gender`, `dob`, `contact`, `address`, `joiningDate`, `emergencyContact`, `medical`, `type`, `slot`, `status`, `expiry`, `password`, `photoUrl`

### Tab: `Staff`
`id`, `name`, `role`, `contact`, `password`
*(Add an initial row: `s1`, `Admin`, `Admin`, `0000000000`, `admin123`)*

### Tab: `Payments`
`id`, `memberId`, `memberName`, `amount`, `method`, `transactionId`, `status`, `date`, `type`, `cashStaffName`, `receivedAmount`

### Tab: `Maintenance`
`id`, `staffId`, `date`, `chemicals`, `cleaning`, `repairs`

### Tab: `Guests`
`id`, `name`, `timing`, `amount`, `status`, `date`

### Tab: `Attendance`
`id`, `memberId`, `memberName`, `date`, `checkIn`, `checkOut`, `slot`, `status`

### Tab: `Config`
`key`, `value`
*(Add rows: `upiId` | `capitalsports@upi`, `15Day` | `2000`, `1Month` | `3500`, etc.)*

---

## Step 2: Add the Apps Script
1. In your Google Sheet, go to **Extensions** > **Apps Script**.
2. Delete any existing code and paste the code provided below.
3. Click **Deploy** > **New Deployment**.
4. Select type: **Web App**.
5. Description: `Capital Sports API`.
6. Execute as: **Me**.
7. Who has access: **Anyone**.
8. Click **Deploy** and **Authorize Access**.
9. **Copy the Web App URL** (It should end in `/exec`).

### 🚀 CRITICAL: If you update the code...
If you make any changes to the script code, you **MUST** create a new deployment:
1. Click **Deploy** > **New Deployment**.
2. Ensure version is "New".
3. Click **Deploy**.
*If you don't do this, the URL will continue to run the old (broken) version of your code.*

### ⚠️ Troubleshooting "Unexpected token '<'" or HTML Error
If you see an error about `Unexpected token '<'` or an HTML response, it means the Google Script is crashing.
1. **Check the "Executions" tab**: In the Google Apps Script editor, click the **Executions** icon (clock) on the left. This will show you the exact error message (e.g., "Sheet not found").
2. **Bound Script**: Ensure you created the script by going to **Extensions > Apps Script** *inside* the Google Sheet. If you created a standalone script, it won't be able to find the spreadsheet.
3. **Permissions**: Ensure "Who has access" is set to **Anyone**.

### 🐢 Note on Latency
Google Apps Script can sometimes take 10-15 seconds to respond, especially on the first request (cold start). The application is configured to wait up to 20 seconds. If you consistently get timeout errors, check your internet connection and ensure the spreadsheet isn't overly large.

---

## Step 3: Configure the Application
1. Go to your AI Studio application settings.
2. Add a new secret/environment variable:
   - Key: `GOOGLE_SCRIPT_URL`
   - Value: (Paste the Web App URL you copied)

---

## Google Apps Script Code

```javascript
/**
 * THE CAPITAL SPORTS - GOOGLE SHEETS BACKEND
 * Combined version supporting Member Registration (with Duplicate Prevention), 
 * Payments, Staff, Maintenance, and Guest Management.
 */

function doGet(e) {
  return handleRequest('GET', e);
}

function doPost(e) {
  return handleRequest('POST', e);
}

/**
 * Main request handler to ensure consistent error reporting
 */
function handleRequest(method, e) {
  try {
    const SS = SpreadsheetApp.getActiveSpreadsheet();
    if (!SS) throw new Error("Spreadsheet not found. Ensure this script is created via Extensions > Apps Script INSIDE your Google Sheet.");
    
    if (method === 'GET') {
      const data = {
        members: getSheetData(SS, 'Members'),
        staff: getSheetData(SS, 'Staff'),
        payments: getSheetData(SS, 'Payments'),
        maintenanceLogs: getSheetData(SS, 'Maintenance'),
        adminConfig: getConfigData(SS),
        guests: getSheetData(SS, 'Guests'),
        attendance: getSheetData(SS, 'Attendance')
      };
      return createJsonResponse(data);
    }

    if (method === 'POST') {
      if (!e.postData || !e.postData.contents) throw new Error("No post data received.");
      const body = JSON.parse(e.postData.contents);
      const action = body.type;
      const data = body.data;

      if (action === 'register') {
        const sheet = getOrCreateSheet(SS, 'Members');
        const id = data.id || ('m' + new Date().getTime());
        
        // Check for duplicate ID
        const existingData = sheet.getDataRange().getValues();
        for (let i = 1; i < existingData.length; i++) {
          if (existingData[i][0] === id) {
            return createJsonResponse({ success: true, id, note: "Duplicate prevented" });
          }
        }
        
        sheet.appendRow([
          id, data.name, data.gender, data.dob, data.contact, data.address, 
          data.dateOfJoining || new Date().toISOString(), data.emergencyContact, data.medicalCondition, 
          data.membershipType, data.timingSlot, 'Pending', data.expiryDate || '', '', data.photoUrl || ''
        ]);

        if (data.payment) {
          const pSheet = getOrCreateSheet(SS, 'Payments');
          const p = data.payment;
          pSheet.appendRow([
            p.id, p.memberId, p.memberName || '', p.amount, p.method, p.transactionId || '', 
            p.status || 'Pending', p.date, p.type, p.cashStaffName || '', p.receivedAmount || ''
          ]);
        }

        return createJsonResponse({ success: true, id });
      }

      if (action === 'approve') {
        updateStatus(SS, 'Members', body.id, 'Active');
        return createJsonResponse({ success: true });
      }

      if (action === 'confirmPayment') {
        updateStatus(SS, 'Payments', body.id, 'Completed');
        return createJsonResponse({ success: true });
      }

      if (action === 'removeMember') {
        const sheet = getOrCreateSheet(SS, 'Members');
        const rows = sheet.getDataRange().getValues();
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][0] === body.id) {
            sheet.deleteRow(i + 1);
            break;
          }
        }
        return createJsonResponse({ success: true });
      }

      if (action === 'addMaintenance') {
        const sheet = getOrCreateSheet(SS, 'Maintenance');
        sheet.appendRow([
          'l' + new Date().getTime(), data.staffId, data.date, 
          data.chemicalLevels, data.cleaningStatus, data.repairs
        ]);
        return createJsonResponse({ success: true });
      }

      if (action === 'updateConfig') {
        const sheet = getOrCreateSheet(SS, 'Config');
        sheet.clear();
        sheet.appendRow(['key', 'value']);
        sheet.appendRow(['upiId', data.upiId]);
        if (data.amounts) {
          Object.keys(data.amounts).forEach(key => {
            sheet.appendRow([key, data.amounts[key]]);
          });
        }
        return createJsonResponse({ success: true });
      }

      if (action === 'addStaff') {
        const sheet = getOrCreateSheet(SS, 'Staff');
        const id = 's' + new Date().getTime();
        sheet.appendRow([id, data.name, data.role, data.contact, data.password]);
        return createJsonResponse({ success: true, id });
      }

      if (action === 'removeStaff') {
        const sheet = getOrCreateSheet(SS, 'Staff');
        const rows = sheet.getDataRange().getValues();
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][0] === body.id) {
            sheet.deleteRow(i + 1);
            break;
          }
        }
        return createJsonResponse({ success: true });
      }

      if (action === 'addGuest') {
        const sheet = getOrCreateSheet(SS, 'Guests');
        const id = data.id || ('g' + new Date().getTime());
        sheet.appendRow([
          id, data.name, data.timing, data.amount, data.status || 'Pending', data.date || new Date().toISOString()
        ]);
        return createJsonResponse({ success: true, id });
      }

      if (action === 'approveGuest') {
        updateStatus(SS, 'Guests', body.id, 'Approved');
        return createJsonResponse({ success: true });
      }

      if (action === 'removeGuest') {
        const sheet = getOrCreateSheet(SS, 'Guests');
        const rows = sheet.getDataRange().getValues();
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][0] === body.id) {
            sheet.deleteRow(i + 1);
            break;
          }
        }
        return createJsonResponse({ success: true });
      }

      if (action === 'checkIn') {
        const sheet = getOrCreateSheet(SS, 'Attendance');
        const id = data.id || ('a' + new Date().getTime());
        sheet.appendRow([
          id, data.memberId, data.memberName, data.date, data.checkIn, '', data.slot, 'In'
        ]);
        return createJsonResponse({ success: true, id });
      }

      if (action === 'checkOut') {
        const sheet = getOrCreateSheet(SS, 'Attendance');
        const rows = sheet.getDataRange().getValues();
        const headers = rows[0];
        const checkOutCol = headers.indexOf('checkOut');
        const statusCol = headers.indexOf('status');
        
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][0] === data.id) {
            if (checkOutCol !== -1) sheet.getRange(i + 1, checkOutCol + 1).setValue(data.checkOut);
            if (statusCol !== -1) sheet.getRange(i + 1, statusCol + 1).setValue('Out');
            break;
          }
        }
        return createJsonResponse({ success: true });
      }
      
      throw new Error("Unknown action: " + action);
    }
  } catch (err) {
    return createJsonResponse({ 
      error: err.toString(), 
      stack: err.stack,
      hint: "Check the 'Executions' tab in Apps Script for more details."
    });
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheetData(SS, name) {
  const sheet = SS.getSheetByName(name);
  if (!sheet) return [];
  const range = sheet.getDataRange();
  if (range.getNumRows() < 2) return [];
  const rows = range.getValues();
  const headers = rows.shift();
  return rows.map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      let val = row[i];
      if (val instanceof Date) val = val.toISOString();
      obj[h] = val;
    });
    return obj;
  });
}

function getOrCreateSheet(SS, name) {
  let sheet = SS.getSheetByName(name);
  if (!sheet) {
    sheet = SS.insertSheet(name);
    if (name === 'Members') sheet.appendRow(['id', 'name', 'gender', 'dob', 'contact', 'address', 'joiningDate', 'emergencyContact', 'medical', 'type', 'slot', 'status', 'expiry', 'password', 'photoUrl']);
    if (name === 'Staff') sheet.appendRow(['id', 'name', 'role', 'contact', 'password']);
    if (name === 'Maintenance') sheet.appendRow(['id', 'staffId', 'date', 'chemicals', 'cleaning', 'repairs']);
    if (name === 'Config') sheet.appendRow(['key', 'value']);
    if (name === 'Guests') sheet.appendRow(['id', 'name', 'timing', 'amount', 'status', 'date']);
    if (name === 'Attendance') sheet.appendRow(['id', 'memberId', 'memberName', 'date', 'checkIn', 'checkOut', 'slot', 'status']);
    if (name === 'Payments') sheet.appendRow(['id', 'memberId', 'memberName', 'amount', 'method', 'transactionId', 'status', 'date', 'type', 'cashStaffName', 'receivedAmount']);
  }
  return sheet;
}

function getConfigData(SS) {
  const sheet = SS.getSheetByName('Config');
  if (!sheet) return { upiId: '', amounts: {} };
  const range = sheet.getDataRange();
  if (range.getNumRows() < 2) return { upiId: '', amounts: {} };
  const rows = range.getValues();
  rows.shift();
  const config = { upiId: '', amounts: {} };
  rows.forEach(row => {
    if (row[0] === 'upiId') config.upiId = row[1];
    else config.amounts[row[0]] = Number(row[1]);
  });
  return config;
}

function updateStatus(SS, sheetName, id, status) {
  const sheet = SS.getSheetByName(sheetName);
  if (!sheet) return;
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const statusCol = headers.indexOf('status');
  if (statusCol === -1) return;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.getRange(i + 1, statusCol + 1).setValue(status);
      break;
    }
  }
}

/**
 * RUN THIS MANUALLY to test if your script can access the sheet.
 * Click the 'Run' button in the toolbar above.
 */
function testConnection() {
  const SS = SpreadsheetApp.getActiveSpreadsheet();
  if (!SS) {
    Logger.log("ERROR: Spreadsheet not found! Make sure this script is BOUND to the sheet.");
    return;
  }
  Logger.log("SUCCESS: Connected to spreadsheet: " + SS.getName());
  const sheets = SS.getSheets().map(s => s.getName());
  Logger.log("Available tabs: " + sheets.join(", "));
}
```
