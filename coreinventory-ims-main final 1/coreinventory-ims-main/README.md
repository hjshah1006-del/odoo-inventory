# CoreInventory 
### Enterprise Inventory Management System

![Status](https://img.shields.io/badge/Status-Live-brightgreen)
![Stack](https://img.shields.io/badge/Stack-React%20%2B%20Supabase-blue)
![Deployment](https://img.shields.io/badge/Deployed-Vercel-black)

A modular, real-time Inventory Management System 
that digitizes and streamlines all stock-related 
operations within a business. Built to replace 
manual registers, Excel sheets, and scattered 
tracking methods with a centralized, easy-to-use 
web application.

---

## Live Demo
**[https://coreinventory-ims.vercel.app](https://coreinventory-ims.vercel.app)**

---

## Features

### Real-Time Dashboard
- 5 live KPI cards (Total Products, Low Stock, 
  Pending Receipts, Pending Deliveries, Transfers)
- Bar chart of top 5 products by stock quantity
- Live activity feed of recent stock movements
- Smart filters by warehouse, location, 
  category and document type

### Receipts (Incoming Stock)
- Create receipts with supplier details
- Add multiple product lines per receipt
- Status workflow: Draft → Confirmed → Done
- Validate to automatically increase stock
- Auto-generated reference numbers (RC-001)
- Every movement logged to stock ledger

### Delivery Orders (Outgoing Stock)
- Create delivery orders for customers
- Pick → Pack → Validate workflow
- Validates stock availability before confirming
- Auto-decreases stock on validation
- Prevents over-delivery with stock check
- Auto-generated reference numbers (DO-001)

### Internal Transfers
- Move stock between warehouses and locations
- Source and destination location tracking
- Total stock unchanged, location updated
- Complete transfer history logged
- Reference numbers (TR-001)

### Stock Adjustments
- Fix mismatches between system and physical count
- Select product and location
- Enter physically counted quantity
- System calculates and applies difference
- Mandatory reason field for audit purposes

### Product Management
- Full product CRUD with SKU/barcode
- Product categories and units of measure
- Sales price and cost price fields
- Stock availability per location breakdown
- Reordering rules with min/max quantities
- Low stock alerts with visual indicators

### Move History / Stock Ledger
- Complete log of every stock movement
- Filter by product, type, date range
- Shows quantity change, locations, user
- Full audit trail for accountability

### Settings
- Multi-warehouse management
- Location management per warehouse
- Product category management

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18 + Vite | UI Framework |
| Styling | Tailwind CSS | Design System |
| Database | PostgreSQL | Data Storage |
| Backend | Supabase | Auth + API + DB |
| Deployment | Vercel | Hosting |
| Charts | Recharts | Data Visualization |

---

## Database Schema
```
products          → name, sku, category, 
                    unit, price, reorder_min
warehouses        → name, address
locations         → name, warehouse_id
stock             → product_id, location_id, 
                    quantity
receipts          → supplier, status, date, 
                    created_by
receipt_lines     → receipt_id, product_id, 
                    quantity
deliveries        → customer, status, date, 
                    created_by
delivery_lines    → delivery_id, product_id, 
                    quantity
transfers         → from_location, to_location, 
                    status, date
transfer_lines    → transfer_id, product_id, 
                    quantity
adjustments       → product_id, location_id, 
                    old_qty, new_qty, reason
stock_ledger      → product_id, movement_type,
                    from_loc, to_loc, qty_change,
                    reference_id, date, user
```

---

## Local Development

### Prerequisites
```bash
Node.js v18+
npm or yarn
```

### Setup
```bash
# Clone the repository
git clone https://github.com/hjshah1006-del/coreinventory-ims.git

# Navigate to project
cd coreinventory-ims

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### Environment Variables
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

---

## Project Structure
```
src/
├── components/          
│   ├── Sidebar.jsx      ← Navigation
│   ├── KPICard.jsx      ← Dashboard cards
│   ├── Modal.jsx        ← Form modals
│   └── Table.jsx        ← Data tables
├── pages/               
│   ├── Dashboard.jsx    ← Overview & KPIs
│   ├── Products.jsx     ← Product management
│   ├── Receipts.jsx     ← Incoming stock
│   ├── Deliveries.jsx   ← Outgoing stock
│   ├── Transfers.jsx    ← Internal transfers
│   ├── Adjustments.jsx  ← Stock corrections
│   ├── Ledger.jsx       ← Move history
│   └── Settings.jsx     ← Warehouse config
├── integrations/        
│   └── supabase/        ← Database client
└── App.jsx              ← Root component
```

---

## Security

- Row Level Security (RLS) enabled on all tables
- JWT-based authentication via Supabase Auth
- Environment variables for all sensitive keys
- Users can only access their own data

---

## Inventory Flow Example
```
Step 1: Receive 100kg Steel from vendor
        → Create Receipt → Validate
        → Stock: +100kg 

Step 2: Move to Production Floor
        → Internal Transfer
        → Stock location updated 

Step 3: Deliver 20kg to customer
        → Delivery Order → Validate
        → Stock: -20kg 

Step 4: 3kg found damaged
        → Stock Adjustment
        → Stock: -3kg, reason logged 

Everything tracked in Stock Ledger!
```

---

## Developer

**Hrishika Shah and Parv Patel**
