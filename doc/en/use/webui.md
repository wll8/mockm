# Web Management Interface 📱

Access management interface: http://localhost:9005

## 🔍 Request Monitoring

### Real-time Request List
All intercepted requests are displayed in real-time with support for sorting and searching.

![Request List Details](~@doc/image/mockm_api_list_2020-09-21_100140.png)

| Column | Description | Function |
|--------|-------------|----------|
| **ID** | Unique request identifier | Click to view details |
| **Code** | HTTP status code | 🟢 2xx 🟡 3xx 🔴 4xx/5xx |
| **Type** | Response content type | JSON, HTML, images, etc. |
| **Method** | HTTP request method | GET, POST, PUT, DELETE |
| **API** | Request path | Supports search filtering |

### Quick Operations
- 🔍 **Search & Filter** - Quickly find by path, status code, method
- 📊 **Sort** - Click column headers to sort by any column
- 🔄 **Auto Refresh** - New requests display in real-time

## 🔬 Request Details

### Core Features

#### 🔄 Replay
![Replay Feature](~@doc/image/mockm_replay_2020-11-10-11-21-51.png)

**One-click error reproduction**: Re-send requests with identical parameters.

**Use Cases**:
- 🐛 Quickly reproduce bugs without re-login
- 🧪 Test API stability
- 🔄 Verify fix effectiveness

#### 📸 Capture
![Capture Feature](~@doc/image/mockm_capture_2020-11-10-11-29-22.png)

**Quick documentation**: One-click capture of current page state.

**Suitable for**:
- 📝 Bug report attachments
- 📊 Interface state recording
- 🤝 Sharing issues with team

#### 📖 Swagger Integration
![Swagger Integration](~@doc/image/mockm_swagger_2020-11-10-11-32-18.png)

**Auto-linked documentation**: Automatically displays corresponding Swagger debug interface after OpenAPI configuration.

**Core Advantages**:
- 🔑 Automatically carries latest token, no manual login needed
- 📋 View complete interface definitions and parameter descriptions
- 🧪 Test interfaces directly in documentation

#### 📜 History
![History](~@doc/image/mockm_history_2020-11-10-11-33-26.png)

**Parameter comparison tool**: View all request history for the same interface.

| Column | Description |
|--------|-------------|
| **Code** | HTTP status code |
| **Req** | Request body size (query + body) |
| **Res** | Response body size |

**Usage Tips**:
- 🔍 Quickly locate anomalies by request/response size
- 📊 Compare parameter differences between requests
- 🧭 Sort by size to quickly find problematic requests

::: details 💡 Common Issues
**Q: Page not updated after replay?**  
A: Replay generates new request records, check latest results in History.

**Q: Capture feature not working?**  
A: May fail with excessive page content or iframes, recommend using professional screenshot tools.

**Q: Swagger button not showing?**  
A: Check if OpenAPI configuration is correct and current interface exists in documentation.
:::

### 📋 Request Response Details

**Complete HTTP communication display**:

**Request Section**:
- 🌐 **Request Line** - Method, URL, query parameters
- 📄 **Request Headers** - Complete Headers information  
- 📦 **Request Body** - POST/PUT data content

**Response Section**:
- ✅ **Status Line** - Status code, status message
- 📋 **Response Headers** - Server returned Headers
- 📄 **Response Body** - Actual returned data content

::: details View Request Details

![Request Details Interface](~@doc/image/mockm_api_detail_2020-09-21_100052.png)

:::

::: tip 💡 JSON Preview Tip
Ensure response header `Content-Type` is `application/json` for proper preview. Recommend backend using `res.json()` instead of `res.send()`.
:::

## ⚙️ Interface Management

### 🎛️ Interface Control Panel
![Interface Edit Interface](~@doc/image/mockm_apiWebEdit_2020-11-10-14-03-22.png)

**Visual management of all interfaces** with WebAPI online editing support.

If there are no real interfaces yet, you can use this feature to create `interfaces|documentation` for frontend-backend reference. It describes request addresses, methods, parameter positions, types, responses, and can generate interfaces for frontend calls.

Interfaces created here are called webApi interfaces, which merge with interfaces written in [config.api](../config/option.md#config-api). Duplicates are overridden by the latter.

MockM converts filled `field names, example values, types` into corresponding response data, supporting MockJS syntax.

::: details Conversion Rules
- Field name: The name of the field, can use MockJS generation rules.
- Example value: Example value for the field, supports MockJS syntax, like @cname for random Chinese names.
:::

**Quick Operations**:
- ➕ **New Interface** - Click `+` button in table header
- 🔄 **Batch Toggle** - One-click disable/enable all WebAPI
- ⚙️ **Individual Control** - Control single interface enable status

## ✏️ Online Interface Editor

### 🎯 Edit Mode Selection

#### 📊 Table Mode - Quick Structured Data Building
![Table Edit Mode](~@doc/image/mockm_apiWebEdit_2020-11-10-14-05-27.png)

**Use Cases**: Structured data, API prototype design

**Core Features**:
- 📝 **Field Definition** - Field name, example value, type settings
- 🎲 **Data Generation** - Supports MockJS syntax
- 📋 **Real-time Preview** - Immediate view of generated effects
- 🔧 **Response Header Settings** - Custom HTTP Headers

**Supported Field Types**:

| Type | Description | Example |
|------|-------------|---------|
| `string` | String | `"username"` |
| `number` | Number | `123`, `3.14` |
| `boolean` | Boolean | `true`, `false` |
| `object` | Object | Nested field structure |
| `array` | Array | Array object collection |
| `eval` | JS Code | `Date.now()`, `Mock.mock('@name')` |

**Enhanced MockJS Support**:
- 🎭 **Placeholders** - Like `@name` (name), `@email` (email)
- 🔢 **Quantity Control** - Like `name|2-5` (2-5 characters)
- 📊 **Rule Generation** - Like `list|10-20` (10-20 data items)

**Shortcuts**:
- `Ctrl+S` - Save interface
- `Ctrl+E` - Switch to code mode

#### 💻 Code Mode - Complete Custom Logic
![Code Edit Mode](~@doc/image/mockm_apiWebEdit_2020-11-10-14-07-10.png)

**Use Cases**: Complex business logic, conditional responses

**Global `tool` Object**:
```javascript
{
  libObj: {
    mockjs,    // MockJS instance
    axios      // HTTP request library
  },
  wrapApiData,  // Unified data wrapper function
  listToData,   // Table data conversion function
  cur          // Current interface information
}
```

**Practical Example**:
```javascript
(req, res) => {
  const { wrapApiData, listToData, cur, libObj: { mockjs } } = tool
  
  // Get request parameters
  const { body, query, params } = req
  
  // Return different data based on parameters
  if (query.type === 'error') {
    return res.status(500).json({ error: 'Simulated error' })
  }
  
  // Use table data
  const { table, example } = cur.responses['200']
  const tableData = listToData(table, example).data
  
  // Combine return data
  const data = {
    user: mockjs.mock('@name'),
    timestamp: Date.now(),
    request: { body, query, params },
    tableData
  }
  
  // Set custom response headers
  res.set({ 'X-Custom-Header': 'MockM Generated' })
  
  // Return unified format data
  res.json(wrapApiData({ data, code: 200 }))
}
```

#### 📜 History Mode - Reuse Real Data
![History Data Mode](~@doc/image/mockm_apiWebEdit_2020-12-03-10-44-49.png)

**Use Cases**:
- 🔄 **Reproduce Issues** - Use response data from specific requests
- 🧪 **A/B Testing** - Fix a successful response
- 📊 **Data Consistency** - Ensure stable test environment data

**Operation Method**: Input historical request ID, the interface will always return the complete response (including Headers) of the specified request.

### 🚀 Batch Operations

#### 📝 Text Import - Quick Field Structure Creation
Double-click table add button, enter structured text in popup:

```text
User Information
- Name
- Email  
- Avatar
- Profile
  - Age
  - Birthday
  - Phone
- Address Info
  - Province
  - City
  - Detailed Address
```

**Smart Features**:
- 🔄 **Auto Translation** - Chinese field names auto-generate English key names
- 🎯 **Type Inference** - Smart type inference based on field names
- 🎲 **Mock Generation** - Auto-match appropriate MockJS rules

![Batch Add Demo](https://z3.ax1x.com/2021/05/18/gfuHTU.gif)

**Hierarchy Support**:
- Use `-` or space indentation for sub-levels
- Support multi-level nested structures
- Auto-generate object and array types

::: tip 💡 Pro Tips
**Table Mode vs Code Mode Selection**:
- 📊 **Table Mode** - Suitable for quick prototypes, clearly structured APIs
- 💻 **Code Mode** - Suitable for complex logic, dynamic responses, conditional judgments
- 📜 **History Mode** - Suitable for reproducing issues, fixed test data

**Best Practices**:
1. Use table mode for quick scaffolding of new interfaces
2. Switch to code mode when logic judgment is needed
3. Temporarily use history mode when debugging issues
:::

**Save Methods**:
- `Ctrl+S` - Shortcut save
- Click `Action → Save` - Menu save
- Auto-save prompt - Shows save status after modifications
