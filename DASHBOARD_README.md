# Running the ER Bill Explainer Dashboard

## Quick Start (Mac)

### 1. Install Dependencies

```bash
cd ER-Bill-Explainer
source venv/bin/activate
pip install dash plotly dash-bootstrap-components
```

### 2. Run the Dashboard

```bash
python3 dashboard.py
```

### 3. Open in Browser

The dashboard will automatically start at:
**http://127.0.0.1:8050**

Open this URL in your web browser (Chrome, Safari, Firefox).

---

## Dashboard Features

### 🆕 **Enhanced Features (New!)**

#### ℹ️ **Info Tooltips**
- Hover over any **ℹ️ icon** to see definitions of medical and insurance terms
- Available on all sliders (Copay, Deductible, Coinsurance) and input fields
- Makes the dashboard beginner-friendly for users unfamiliar with healthcare billing

#### 💳 **Custom Bill Entry Mode**
- **Data Mode Selector**: Choose between "Default" (sample data) or "Custom" (your actual bill)
- **Custom Inputs**: Enter your own Total Billed and Allowed Amount values
- **Real-Time Validation**: Color-coded alerts (✅ green, ⚠️ yellow, ❌ red) ensure data integrity
- **Instant Updates**: All charts recalculate immediately based on your custom amounts

---

### 📊 **4 Interactive Pages**

#### 1. **Bill Explained**
- **Waterfall Chart**: Shows bill flow from Total Billed → Allowed → Insurance → You Pay
- **4 KPI Cards**: Total Billed, Allowed Amount, Insurance Pays, You Pay (with info tooltips)
- **Pie Chart**: Breakdown of your costs (Copay, Deductible, Coinsurance)
- **Interactive Sliders**: Adjust copay ($0-$500), deductible ($0-$5,000), coinsurance (0-50%)
- **NEW**: Supports both default dataset and custom user inputs

#### 2. **Cost Breakdown**
- **Top 10 Variance Chart**: Services with highest price difference from Medicare
- **Category Comparison**: Hospital vs Medicare rates by service category
- **NEW: Cumulative Cost Chart**: Shows which services drive the total bill
- **NEW: Category Pie Chart**: Visual breakdown of costs by department
- **NEW: Interactive Service Table**: Sortable, filterable table with color-coded markup alerts
  - Red highlighting for services >50% above Medicare
  - Green highlighting for services >10% below Medicare

#### 3. **Price Comparison**
- **Scatter Plot**: Hospital cash price vs Medicare rate (with size showing gross charge)
- **Box Plot**: Price distribution by category (facility, imaging, lab, procedure)
- **NEW: Markup Distribution Histogram**: Frequency of price variances from Medicare
- **NEW: Service Count Chart**: Number of services in each category
- Color-coded by service category

#### 4. **Insights**
- **Key Findings**: Surprising discovery that Inova prices are below Medicare
- **Statistics**: Percentage of services below Medicare, highest markup service
- **NEW: 💰 Savings Calculator**: Shows if you'd save money with Medicare rates vs hospital cash prices
- **NEW: ✅ Top 5 Best Deals**: Services where hospital charges significantly less than Medicare
- **NEW: ⚠️ Top 5 Highest Markups**: Most overpriced services compared to Medicare benchmarks
- **About Section**: Data sources, limitations, methodology

---

## How to Use

### 🆕 Using Custom Bill Entry Mode

Want to analyze YOUR actual ER bill? Follow these steps:

1. Click the **"Custom (Enter Your Bill)"** radio button in the Data Mode section
2. The Custom Bill Entry card will expand with two input fields
3. Enter your **Total Billed** amount (from your itemized bill)
4. Enter your **Allowed Amount** (from your insurance EOB/explanation of benefits)
5. Watch for the validation alert:
   - ✅ **Green**: Valid inputs - dashboard will update
   - ⚠️ **Yellow**: Missing values - please fill both fields
   - ❌ **Red**: Invalid data - check your numbers
6. Once valid, all KPI cards and charts update to show YOUR scenario!

**Tip**: Find these amounts on your EOB under "Amount Billed" and "Allowed Amount" or "Negotiated Rate"

### 🔍 Understanding Info Tooltips

- Look for the **ℹ️** icon next to any term
- Hover your mouse over it to see a helpful definition
- No need to click - just hover and the tooltip appears!
- Perfect for learning healthcare billing terminology

### Adjust Patient Scenario

Use the sliders at the top to simulate different insurance scenarios:

- **ER Copay**: How much you pay upfront for ER visit ($0-$500)
- **Deductible Remaining**: How much of your deductible hasn't been met ($0-$5,000)
- **Coinsurance**: Your percentage of costs after deductible (0-50%)

The dashboard will **automatically recalculate** "You Pay" based on your selections!

### 🆕 Exploring the New Charts

#### In Cost Breakdown Tab:
- **Cumulative Chart**: See which services drive most of the total cost
- **Category Pie**: Understand department-level cost distribution
- **Service Table**:
  - Click column headers to sort
  - Type in column filters to search
  - Red rows = overpriced services (>50% above Medicare)
  - Green rows = good deals (>10% below Medicare)

#### In Price Comparison Tab:
- **Histogram**: Shows how many services fall into each markup range
  - Most bars left of 0% line = hospital is cheaper than Medicare!
- **Service Count**: See which categories have the most services

#### In Insights Tab:
- **Savings Calculator**: Instant comparison of hospital vs Medicare total costs
- **Top 5 Best Deals**: Services where you're getting great value
- **Top 5 Highest Markups**: Most overpriced services compared to Medicare benchmarks

### Navigate Pages

Click the tabs to switch between:
- **Bill Explained** - See your total cost
- **Cost Breakdown** - Compare individual services
- **Price Comparison** - Visualize hospital vs Medicare
- **Insights** - Learn key findings

---

## Stopping the Dashboard

Press `Ctrl+C` in the terminal where the dashboard is running.

---

## Sharing Your Dashboard

### Option 1: Screenshots
Take screenshots of each page for your portfolio:
- `Cmd+Shift+4` on Mac
- Save to `ER-Bill-Explainer/assets/screenshots/`

### Option 2: Deploy Online (Free)

Deploy to **Render** or **Heroku** for a live URL:

```bash
# Create Procfile
echo "web: gunicorn dashboard:server" > Procfile

# Install gunicorn
pip install gunicorn

# Deploy to Render.com (free tier)
# Follow: https://render.com/docs/deploy-dash
```

### Option 3: Record a Demo Video

Use **QuickTime Player** (Mac):
1. File → New Screen Recording
2. Navigate through your dashboard
3. Save as MP4 for portfolio

---

## Troubleshooting

### Port Already in Use

If you see "Address already in use":

```bash
# Find and kill the process
lsof -ti:8050 | xargs kill -9

# Or change the port in dashboard.py:
# app.run_server(debug=True, port=8051)
```

### Module Not Found

```bash
source venv/bin/activate
pip install -r requirements.txt
```

### Data Not Loading

Make sure you've run the ETL pipeline first:

```bash
python3 scripts/etl/03_process_benchmarks.py
python3 scripts/etl/04_build_star_schema.py
```

---

## Portfolio Presentation Tips

### In Interviews, Say:

> "I built an interactive web dashboard using Python and Plotly Dash to explain ER billing. It processes real hospital price transparency data and compares it to Medicare benchmarks. Users can adjust their insurance parameters with sliders to see how their out-of-pocket costs change in real-time."

### Highlight:

- ✅ **Full-stack skills**: Python backend + interactive web frontend
- ✅ **Data engineering**: ETL pipeline processing 19,000+ rows
- ✅ **Visualization**: 8+ chart types (waterfall, scatter, box, pie, bar)
- ✅ **Real-world data**: Actual hospital MRF + CMS benchmarks
- ✅ **Mac-native**: Built without Windows-only tools

### Demo Flow:

1. Show the **Bill Explained** page with default scenario
2. Adjust sliders to show how costs change
3. Navigate to **Cost Breakdown** to show variance analysis
4. Go to **Insights** to explain the surprising finding (Inova < Medicare)
5. Mention the **ETL pipeline** that processes the raw data

---

## Next Steps

1. ✅ Run the dashboard locally
2. ✅ Take screenshots of all 4 pages
3. ✅ Record a 2-minute demo video
4. ✅ Add screenshots to your portfolio/GitHub
5. ⏳ (Optional) Deploy online for a live demo link

---

## Tech Stack

- **Python 3.9+**
- **Plotly Dash** - Interactive web framework
- **Plotly Express** - Declarative charting
- **Pandas** - Data manipulation
- **Bootstrap** - Responsive styling
- **Real Data**: Inova Alexandria Hospital + CMS Medicare

---

**You now have a fully functional, Mac-compatible, interactive dashboard!** 🎉
