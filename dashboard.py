"""
ER Bill Explainer - Interactive Plotly Dash Dashboard
Mac-compatible web dashboard for healthcare price transparency
"""

import dash
from dash import dcc, html, Input, Output, callback, dash_table
import dash_bootstrap_components as dbc
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import pandas as pd
from pathlib import Path
import uuid

# Load data
DATA_DIR = Path(__file__).parent / "data" / "processed" / "star_schema"

# Load all tables
dim_service = pd.read_parquet(DATA_DIR / "dim_service.parquet")
dim_provider = pd.read_parquet(DATA_DIR / "dim_provider.parquet")
fact_prices = pd.read_parquet(DATA_DIR / "fact_prices.parquet")
fact_benchmarks = pd.read_parquet(DATA_DIR / "fact_benchmarks.parquet")
fact_scenarios = pd.read_parquet(DATA_DIR / "fact_scenarios.parquet")

# Join data for analysis
full_data = (fact_prices
    .merge(dim_service[['service_id', 'cpt_hcpcs', 'description', 'category']], on='service_id')
    .merge(fact_benchmarks[['service_id', 'medicare_rate']], on='service_id')
    .merge(dim_provider[['provider_id', 'hospital_name']], on='provider_id')
)

# Calculate allowed estimate (negotiated median or Medicare benchmark)
full_data['allowed_estimate'] = full_data['negotiated_median'].fillna(full_data['medicare_rate'])

# Initialize Dash app with Bootstrap theme
app = dash.Dash(__name__, external_stylesheets=[dbc.themes.BOOTSTRAP])
app.title = "ER Bill Explainer"

# Define color scheme
COLORS = {
    'primary': '#1f77b4',
    'success': '#2ca02c',
    'warning': '#ff7f0e',
    'danger': '#d62728',
    'info': '#17a2b8',
    'background': '#f8f9fa',
    'text': '#212529'
}

# Helper function for info tooltips
def create_info_label(label_text, tooltip_text):
    """Create a label with an info icon that shows a tooltip on hover"""
    tooltip_id = f"tooltip-{uuid.uuid4().hex[:8]}"
    return html.Div([
        html.Label([
            label_text,
            html.Span(" ℹ️", id=tooltip_id, style={'cursor': 'help', 'marginLeft': '5px'})
        ]),
        dbc.Tooltip(tooltip_text, target=tooltip_id, placement='top')
    ])

# App layout
app.layout = dbc.Container([
    # Header
    dbc.Row([
        dbc.Col([
            html.H1("ER Bill Explainer Dashboard", className="text-center mb-2"),
            html.P("Understanding Healthcare Costs Through Price Transparency Data", 
                   className="text-center text-muted mb-4"),
            html.Hr()
        ])
    ]),
    
    # Data Mode Selector
    dbc.Row([
        dbc.Col([
            dbc.Card([
                dbc.CardHeader(html.H5("Data Mode")),
                dbc.CardBody([
                    dcc.RadioItems(
                        id='data-mode',
                        options=[
                            {'label': ' Default (All ER Services)', 'value': 'default'},
                            {'label': ' Custom (Enter Your Bill)', 'value': 'custom'}
                        ],
                        value='default',
                        inline=True,
                        labelStyle={'marginRight': '20px'}
                    )
                ])
            ], className="mb-3")
        ])
    ]),
    
    # Custom Input Section (conditionally visible)
    dbc.Row([
        dbc.Col([
            dbc.Collapse(
                dbc.Card([
                    dbc.CardHeader(html.H5("Custom Bill Entry")),
                    dbc.CardBody([
                        dbc.Row([
                            dbc.Col([
                                create_info_label("Total Billed ($)", 
                                    "The hospital's list price (gross charges) before any discounts or insurance negotiations."),
                                dbc.Input(
                                    id='custom-total-billed',
                                    type='number',
                                    placeholder='e.g., 20000',
                                    min=0,
                                    step=100
                                )
                            ], md=6),
                            dbc.Col([
                                create_info_label("Allowed Amount ($)", 
                                    "The negotiated rate that insurance companies have agreed to pay, or the Medicare benchmark rate."),
                                dbc.Input(
                                    id='custom-allowed',
                                    type='number',
                                    placeholder='e.g., 15000',
                                    min=0,
                                    step=100
                                )
                            ], md=6),
                        ]),
                        html.Div(id='input-validation-alert', className='mt-2')
                    ])
                ], className="mb-4"),
                id='custom-inputs-collapse',
                is_open=False
            )
        ])
    ]),
    
    # Scenario Controls
    dbc.Row([
        dbc.Col([
            dbc.Card([
                dbc.CardHeader(html.H5("Patient Responsibility Scenario")),
                dbc.CardBody([
                    dbc.Row([
                        dbc.Col([
                            create_info_label("ER Copay ($)", 
                                "A fixed fee you pay upfront when visiting the emergency room, regardless of services received."),
                            dcc.Slider(
                                id='copay-slider',
                                min=0, max=500, step=50, value=250,
                                marks={i: f'${i}' for i in range(0, 501, 100)},
                                tooltip={"placement": "bottom", "always_visible": True}
                            )
                        ], md=4),
                        dbc.Col([
                            create_info_label("Deductible Remaining ($)", 
                                "The amount you must pay out-of-pocket before your insurance begins covering costs."),
                            dcc.Slider(
                                id='deductible-slider',
                                min=0, max=5000, step=100, value=500,
                                marks={i: f'${i}' for i in range(0, 5001, 1000)},
                                tooltip={"placement": "bottom", "always_visible": True}
                            )
                        ], md=4),
                        dbc.Col([
                            create_info_label("Coinsurance (%)", 
                                "Your percentage share of costs after meeting your deductible (e.g., 20% means you pay 20%, insurance pays 80%)."),
                            dcc.Slider(
                                id='coinsurance-slider',
                                min=0, max=50, step=5, value=20,
                                marks={i: f'{i}%' for i in range(0, 51, 10)},
                                tooltip={"placement": "bottom", "always_visible": True}
                            )
                        ], md=4),
                    ])
                ])
            ], className="mb-4")
        ])
    ]),
    
    # Tabs for different pages
    dbc.Tabs([
        dbc.Tab(label="Bill Explained", tab_id="tab-1"),
        dbc.Tab(label="Cost Breakdown", tab_id="tab-2"),
        dbc.Tab(label="Price Comparison", tab_id="tab-3"),
        dbc.Tab(label="Insights", tab_id="tab-4"),
    ], id="tabs", active_tab="tab-1", className="mb-3"),
    
    # Content area
    html.Div(id="tab-content"),
    
    # Footer
    html.Hr(),
    html.Footer([
        html.P([
            "Data Sources: ",
            html.A("Inova Alexandria Hospital MRF", href="https://www.inova.org/price-transparency", target="_blank"),
            " | ",
            html.A("CMS Medicare Benchmarks", href="https://www.cms.gov", target="_blank")
        ], className="text-center text-muted small")
    ])
], fluid=True, style={'backgroundColor': COLORS['background'], 'padding': '20px'})


# Callback to toggle custom input visibility
@callback(
    Output('custom-inputs-collapse', 'is_open'),
    [Input('data-mode', 'value')]
)
def toggle_custom_inputs(mode):
    return mode == 'custom'


# Callback for input validation
@callback(
    Output('input-validation-alert', 'children'),
    [Input('custom-total-billed', 'value'),
     Input('custom-allowed', 'value'),
     Input('data-mode', 'value')]
)
def validate_custom_inputs(total_billed, allowed, mode):
    if mode != 'custom':
        return None
    
    if total_billed is None or allowed is None:
        return dbc.Alert("⚠️ Please enter both Total Billed and Allowed Amount", color="warning", className="mt-2")
    
    if total_billed < 0 or allowed < 0:
        return dbc.Alert("❌ Values cannot be negative", color="danger", className="mt-2")
    
    if allowed > total_billed:
        return dbc.Alert("❌ Allowed Amount cannot exceed Total Billed", color="danger", className="mt-2")
    
    return dbc.Alert("✅ Valid inputs", color="success", className="mt-2")


# Callback for tab content
@callback(
    Output("tab-content", "children"),
    [Input("tabs", "active_tab"),
     Input("copay-slider", "value"),
     Input("deductible-slider", "value"),
     Input("coinsurance-slider", "value"),
     Input("data-mode", "value"),
     Input("custom-total-billed", "value"),
     Input("custom-allowed", "value")]
)
def render_tab_content(active_tab, copay, deductible, coinsurance, data_mode, custom_total, custom_allowed):
    # Determine data source
    if data_mode == 'custom' and custom_total is not None and custom_allowed is not None and custom_allowed <= custom_total:
        total_billed = custom_total
        total_allowed = custom_allowed
    else:
        total_billed = full_data['gross_charge'].sum()
        total_allowed = full_data['allowed_estimate'].sum()
    
    if active_tab == "tab-1":
        return render_bill_explained(copay, deductible, coinsurance, total_billed, total_allowed)
    elif active_tab == "tab-2":
        return render_cost_breakdown()
    elif active_tab == "tab-3":
        return render_price_comparison()
    elif active_tab == "tab-4":
        return render_insights()


def calculate_patient_owes(allowed_total, copay, deductible, coinsurance_pct):
    """Calculate patient responsibility"""
    deductible_part = min(deductible, allowed_total)
    coinsurance_part = (coinsurance_pct / 100) * (allowed_total - deductible_part)
    return copay + deductible_part + coinsurance_part


def render_bill_explained(copay, deductible, coinsurance, total_billed, total_allowed):
    """Page 1: Bill Explained in 60 Seconds"""
    
    # Calculate patient responsibility
    patient_owes = calculate_patient_owes(total_allowed, copay, deductible, coinsurance)
    insurance_pays = total_allowed - patient_owes
    
    # Waterfall chart
    waterfall_fig = go.Figure(go.Waterfall(
        name="Bill Flow",
        orientation="v",
        measure=["absolute", "relative", "relative", "total"],
        x=["Total Billed", "Discount to Allowed", "Insurance Pays", "You Pay"],
        y=[total_billed, -(total_billed - total_allowed), -insurance_pays, patient_owes],
        text=[f"${total_billed:,.0f}", f"-${total_billed - total_allowed:,.0f}", 
              f"-${insurance_pays:,.0f}", f"${patient_owes:,.0f}"],
        textposition="outside",
        connector={"line": {"color": "rgb(63, 63, 63)"}},
    ))
    waterfall_fig.update_layout(
        title="How Your ER Bill Breaks Down",
        showlegend=False,
        height=400
    )
    
    # Patient cost breakdown pie chart
    breakdown_data = pd.DataFrame({
        'Component': ['Copay', 'Deductible', 'Coinsurance'],
        'Amount': [
            copay,
            min(deductible, total_allowed),
            (coinsurance / 100) * (total_allowed - min(deductible, total_allowed))
        ]
    })
    breakdown_data = breakdown_data[breakdown_data['Amount'] > 0]
    
    pie_fig = px.pie(
        breakdown_data, 
        values='Amount', 
        names='Component',
        title="Your Cost Breakdown",
        color_discrete_sequence=px.colors.qualitative.Set2
    )
    pie_fig.update_traces(textposition='inside', textinfo='percent+label')
    pie_fig.update_layout(height=400)
    
    return dbc.Row([
        # KPI Cards
        dbc.Col([
            dbc.Row([
                dbc.Col([
                    dbc.Card([
                        dbc.CardBody([
                            html.H6("Total Billed", className="text-muted"),
                            html.H3(f"${total_billed:,.0f}", className="text-primary")
                        ])
                    ])
                ], md=3),
                dbc.Col([
                    dbc.Card([
                        dbc.CardBody([
                            html.H6("Allowed Amount", className="text-muted"),
                            html.H3(f"${total_allowed:,.0f}", className="text-info")
                        ])
                    ])
                ], md=3),
                dbc.Col([
                    dbc.Card([
                        dbc.CardBody([
                            html.H6("Insurance Pays", className="text-muted"),
                            html.H3(f"${insurance_pays:,.0f}", className="text-success")
                        ])
                    ])
                ], md=3),
                dbc.Col([
                    dbc.Card([
                        dbc.CardBody([
                            html.H6("You Pay", className="text-muted"),
                            html.H3(f"${patient_owes:,.0f}", className="text-danger")
                        ])
                    ])
                ], md=3),
            ], className="mb-4"),
            
            # Charts
            dbc.Row([
                dbc.Col([
                    dcc.Graph(figure=waterfall_fig)
                ], md=8),
                dbc.Col([
                    dcc.Graph(figure=pie_fig)
                ], md=4),
            ])
        ])
    ])


def render_cost_breakdown():
    """Page 2: Test Cost Breakdown"""
    
    # Create comparison table
    comparison_df = full_data[['cpt_hcpcs', 'description', 'category', 
                                'gross_charge', 'cash_price', 'negotiated_median', 
                                'medicare_rate']].copy()
    comparison_df['variance_pct'] = ((comparison_df['cash_price'] - comparison_df['medicare_rate']) 
                                      / comparison_df['medicare_rate'] * 100).round(1)
    
    # Bar chart of top variances
    top_variance = comparison_df.nlargest(10, 'variance_pct')
    bar_fig = px.bar(
        top_variance,
        x='variance_pct',
        y='description',
        orientation='h',
        title="Top 10 Services by Price Variance from Medicare",
        labels={'variance_pct': 'Variance from Medicare (%)', 'description': 'Service'},
        color='variance_pct',
        color_continuous_scale=['green', 'yellow', 'red']
    )
    bar_fig.update_layout(height=500)
    
    # Category comparison
    category_avg = comparison_df.groupby('category').agg({
        'cash_price': 'mean',
        'medicare_rate': 'mean'
    }).reset_index()
    
    category_fig = go.Figure()
    category_fig.add_trace(go.Bar(
        name='Hospital Cash Price',
        x=category_avg['category'],
        y=category_avg['cash_price'],
        marker_color=COLORS['primary']
    ))
    category_fig.add_trace(go.Bar(
        name='Medicare Rate',
        x=category_avg['category'],
        y=category_avg['medicare_rate'],
        marker_color=COLORS['success']
    ))
    category_fig.update_layout(
        title="Average Price by Category",
        barmode='group',
        height=400
    )
    
    
    # NEW: Interactive Service Table
    table_data = comparison_df[['description', 'category', 'cash_price', 'medicare_rate', 'variance_pct']].copy()
    table_data['variance_$'] = (comparison_df['cash_price'] - comparison_df['medicare_rate']).round(2)
    table_data = table_data.rename(columns={
        'description': 'Service',
        'category': 'Category',
        'cash_price': 'Hospital Price',
        'medicare_rate': 'Medicare Rate',
        'variance_pct': 'Variance %',
        'variance_$': 'Variance $'
    })
    
    # NEW: Cumulative Cost Chart
    sorted_hospital = comparison_df.sort_values('cash_price', ascending=False)
    sorted_hospital['cumulative_hospital'] = sorted_hospital['cash_price'].cumsum()
    sorted_hospital['cumulative_medicare'] = sorted_hospital['medicare_rate'].cumsum()
    sorted_hospital['rank'] = range(1, len(sorted_hospital) + 1)
    
    cumulative_fig = go.Figure()
    cumulative_fig.add_trace(go.Scatter(
        x=sorted_hospital['rank'],
        y=sorted_hospital['cumulative_hospital'],
        name='Hospital Cumulative',
        mode='lines+markers',
        line=dict(color=COLORS['primary'], width=3)
    ))
    cumulative_fig.add_trace(go.Scatter(
        x=sorted_hospital['rank'],
        y=sorted_hospital['cumulative_medicare'],
        name='Medicare Cumulative',
        mode='lines+markers',
        line=dict(color=COLORS['success'], width=3)
    ))
    cumulative_fig.update_layout(
        title="Cumulative Cost by Service (Ranked by Hospital Price)",
        xaxis_title="Service Rank",
        yaxis_title="Cumulative Cost ($)",
        height=400
    )
    
    # NEW: Category Pie Chart
    category_totals = comparison_df.groupby('category')['cash_price'].sum().reset_index()
    pie_category_fig = px.pie(
        category_totals,
        values='cash_price',
        names='category',
        title="Cost Distribution by Category",
        color_discrete_sequence=px.colors.qualitative.Set3
    )
    pie_category_fig.update_traces(textposition='inside', textinfo='percent+label')
    pie_category_fig.update_layout(height=400)
    
    return html.Div([
        # Existing charts row
        dbc.Row([
            dbc.Col([
                dcc.Graph(figure=bar_fig)
            ], md=6),
            dbc.Col([
                dcc.Graph(figure=category_fig)
            ], md=6),
        ], className="mb-4"),
        
        # NEW: Cumulative and Pie charts row
        dbc.Row([
            dbc.Col([
                dcc.Graph(figure=cumulative_fig)
            ], md=8),
            dbc.Col([
                dcc.Graph(figure=pie_category_fig)
            ], md=4),
        ], className="mb-4"),
        
        # NEW: Interactive Service Table
        dbc.Row([
            dbc.Col([
                html.H5("Detailed Service Comparison", className="mb-3"),
                dash_table.DataTable(
                    data=table_data.to_dict('records'),
                    columns=[{'name': i, 'id': i} for i in table_data.columns],
                    page_size=10,
                    sort_action='native',
                    filter_action='native',
                    style_table={'overflowX': 'auto'},
                    style_cell={
                        'textAlign': 'left',
                        'padding': '10px',
                        'fontSize': '12px'
                    },
                    style_header={
                        'backgroundColor': COLORS['primary'],
                        'color': 'white',
                        'fontWeight': 'bold'
                    },
                    style_data_conditional=[
                        {
                            'if': {
                                'filter_query': '{Variance %} > 50',
                                'column_id': 'Variance %'
                            },
                            'backgroundColor': '#ffcccc',
                            'color': 'darkred',
                            'fontWeight': 'bold'
                        },
                        {
                            'if': {
                                'filter_query': '{Variance %} < -10',
                                'column_id': 'Variance %'
                            },
                            'backgroundColor': '#ccffcc',
                            'color': 'darkgreen',
                            'fontWeight': 'bold'
                        }
                    ]
                )
            ])
        ])
    ])


def render_price_comparison():
    """Page 3: Hospital vs Medicare Price Comparison"""
    
    # Scatter plot
    scatter_fig = px.scatter(
        full_data,
        x='medicare_rate',
        y='cash_price',
        size='gross_charge',
        color='category',
        hover_data=['description', 'cpt_hcpcs'],
        title="Hospital Cash Price vs Medicare Rate",
        labels={'medicare_rate': 'Medicare Rate ($)', 'cash_price': 'Hospital Cash Price ($)'},
        height=500
    )
    
    # Add diagonal line (where hospital = medicare)
    max_val = max(full_data['medicare_rate'].max(), full_data['cash_price'].max())
    scatter_fig.add_trace(go.Scatter(
        x=[0, max_val],
        y=[0, max_val],
        mode='lines',
        name='Equal Pricing',
        line=dict(dash='dash', color='gray')
    ))
    
    # Box plot by category
    box_fig = px.box(
        full_data,
        x='category',
        y='cash_price',
        title="Price Distribution by Category",
        labels={'cash_price': 'Cash Price ($)', 'category': 'Category'},
        color='category',
        height=400
    )
    
    
    # NEW: Markup Distribution Histogram
    markup_data = full_data.copy()
    markup_data['markup_pct'] = ((markup_data['cash_price'] - markup_data['medicare_rate']) 
                                  / markup_data['medicare_rate'] * 100)
    
    histogram_fig = px.histogram(
        markup_data,
        x='markup_pct',
        nbins=20,
        title="Distribution of Price Markup from Medicare",
        labels={'markup_pct': 'Markup from Medicare (%)', 'count': 'Number of Services'},
        color_discrete_sequence=[COLORS['info']]
    )
    histogram_fig.add_vline(x=0, line_dash="dash", line_color="red", 
                           annotation_text="0% (Equal to Medicare)", 
                           annotation_position="top right")
    histogram_fig.update_layout(height=400)
    
    # NEW: Service Count by Category
    category_counts = full_data.groupby('category').size().reset_index(name='count')
    count_fig = px.bar(
        category_counts,
        x='category',
        y='count',
        title="Number of Services by Category",
        labels={'category': 'Category', 'count': 'Number of Services'},
        color='category',
        color_discrete_sequence=px.colors.qualitative.Pastel
    )
    count_fig.update_layout(height=400, showlegend=False)
    
    return html.Div([
        # Existing scatter plot
        dbc.Row([
            dbc.Col([
                dcc.Graph(figure=scatter_fig)
            ], md=12),
        ], className="mb-4"),
        
        # NEW: Histogram and Box plot row
        dbc.Row([
            dbc.Col([
                dcc.Graph(figure=histogram_fig)
            ], md=6),
            dbc.Col([
                dcc.Graph(figure=box_fig)
            ], md=6),
        ], className="mb-4"),
        
        # NEW: Service count chart
        dbc.Row([
            dbc.Col([
                dcc.Graph(figure=count_fig)
            ], md=12),
        ])
    ])


def render_insights():
    """Page 4: Key Insights"""
    
    # Calculate key metrics
    avg_markup = ((full_data['cash_price'] - full_data['medicare_rate']) 
                  / full_data['medicare_rate'] * 100).mean()
    
    services_below_medicare = (full_data['cash_price'] < full_data['medicare_rate']).sum()
    total_services = len(full_data)
    
    highest_markup_idx = ((full_data['cash_price'] - full_data['medicare_rate']) 
                          / full_data['medicare_rate']).idxmax()
    highest_markup_service = full_data.loc[highest_markup_idx, 'description']
    highest_markup_pct = ((full_data.loc[highest_markup_idx, 'cash_price'] - 
                           full_data.loc[highest_markup_idx, 'medicare_rate']) / 
                          full_data.loc[highest_markup_idx, 'medicare_rate'] * 100)
    
    return dbc.Row([
        dbc.Col([
            dbc.Alert([
                html.H4("🔍 Key Findings", className="alert-heading"),
                html.Hr(),
                html.P([
                    html.Strong("Surprising Discovery: "),
                    f"Inova's cash prices are on average {abs(avg_markup):.1f}% ",
                    html.Strong("LOWER"), " than Medicare rates!"
                ]),
                html.P([
                    f"{services_below_medicare} out of {total_services} services ({services_below_medicare/total_services*100:.0f}%) ",
                    "are priced below Medicare benchmarks."
                ]),
                html.Hr(),
                html.H5("Highest Markup"),
                html.P([
                    html.Strong(highest_markup_service), 
                    f" is {highest_markup_pct:.1f}% above Medicare rate"
                ]),
                html.Hr(),
                html.H5("What This Means"),
                html.Ul([
                    html.Li("Inova's cash prices are competitive with Medicare"),
                    html.Li("Price transparency reveals unexpected cost structures"),
                    html.Li("Self-pay patients may get better rates than expected"),
                    html.Li("Always ask about cash prices vs insurance billing")
                ])
            ], color="info", className="mb-4"),
            
            # NEW: Savings Calculator
            dbc.Card([
                dbc.CardHeader(html.H5("💰 Savings Calculator")),
                dbc.CardBody([
                    html.P([
                        "If you paid Medicare rates instead of hospital cash prices:"
                    ]),
                    html.H3([
                        "You would ",
                        html.Span(
                            f"SAVE ${abs(full_data['cash_price'].sum() - full_data['medicare_rate'].sum()):,.0f}" 
                            if full_data['cash_price'].sum() > full_data['medicare_rate'].sum() 
                            else f"PAY ${abs(full_data['medicare_rate'].sum() - full_data['cash_price'].sum()):,.0f} MORE",
                            style={'color': COLORS['success'] if full_data['cash_price'].sum() > full_data['medicare_rate'].sum() else COLORS['danger']}
                        )
                    ]),
                    html.Small(f"Total Hospital: ${full_data['cash_price'].sum():,.0f} | Total Medicare: ${full_data['medicare_rate'].sum():,.0f}", className="text-muted")
                ])
            ], className="mb-4"),
            
            # NEW: Top 5 Cheapest Services
            dbc.Row([
                dbc.Col([
                    dbc.Card([
                        dbc.CardHeader(html.H5("✅ Top 5 Best Deals (vs Medicare)")),
                        dbc.CardBody([
                            dash_table.DataTable(
                                data=full_data.assign(
                                    savings=lambda x: x['medicare_rate'] - x['cash_price'],
                                    savings_pct=lambda x: ((x['medicare_rate'] - x['cash_price']) / x['medicare_rate'] * 100)
                                ).nlargest(5, 'savings')[['description', 'cash_price', 'medicare_rate', 'savings', 'savings_pct']].rename(columns={
                                    'description': 'Service',
                                    'cash_price': 'Hospital $',
                                    'medicare_rate': 'Medicare $',
                                    'savings': 'Savings $',
                                    'savings_pct': 'Savings %'
                                }).round(2).to_dict('records'),
                                columns=[
                                    {'name': 'Service', 'id': 'Service'},
                                    {'name': 'Hospital $', 'id': 'Hospital $', 'type': 'numeric', 'format': {'specifier': '$,.2f'}},
                                    {'name': 'Medicare $', 'id': 'Medicare $', 'type': 'numeric', 'format': {'specifier': '$,.2f'}},
                                    {'name': 'Savings $', 'id': 'Savings $', 'type': 'numeric', 'format': {'specifier': '$,.2f'}},
                                    {'name': 'Savings %', 'id': 'Savings %', 'type': 'numeric', 'format': {'specifier': '.1f'}}
                                ],
                                style_cell={'textAlign': 'left', 'padding': '8px', 'fontSize': '11px'},
                                style_header={'backgroundColor': COLORS['success'], 'color': 'white', 'fontWeight': 'bold'},
                                style_data_conditional=[
                                    {'if': {'column_id': 'Savings $'}, 'backgroundColor': '#d4edda', 'color': 'darkgreen', 'fontWeight': 'bold'}
                                ]
                            )
                        ])
                    ], className="mb-3")
                ], md=12)
            ]),
            
            # NEW: Top 5 Most Expensive Services
            dbc.Row([
                dbc.Col([
                    dbc.Card([
                        dbc.CardHeader(html.H5("⚠️ Top 5 Highest Markups (vs Medicare)")),
                        dbc.CardBody([
                            dash_table.DataTable(
                                data=full_data.assign(
                                    markup=lambda x: x['cash_price'] - x['medicare_rate'],
                                    markup_pct=lambda x: ((x['cash_price'] - x['medicare_rate']) / x['medicare_rate'] * 100)
                                ).nlargest(5, 'markup')[['description', 'cash_price', 'medicare_rate', 'markup', 'markup_pct']].rename(columns={
                                    'description': 'Service',
                                    'cash_price': 'Hospital $',
                                    'medicare_rate': 'Medicare $',
                                    'markup': 'Markup $',
                                    'markup_pct': 'Markup %'
                                }).round(2).to_dict('records'),
                                columns=[
                                    {'name': 'Service', 'id': 'Service'},
                                    {'name': 'Hospital $', 'id': 'Hospital $', 'type': 'numeric', 'format': {'specifier': '$,.2f'}},
                                    {'name': 'Medicare $', 'id': 'Medicare $', 'type': 'numeric', 'format': {'specifier': '$,.2f'}},
                                    {'name': 'Markup $', 'id': 'Markup $', 'type': 'numeric', 'format': {'specifier': '$,.2f'}},
                                    {'name': 'Markup %', 'id': 'Markup %', 'type': 'numeric', 'format': {'specifier': '.1f'}}
                                ],
                                style_cell={'textAlign': 'left', 'padding': '8px', 'fontSize': '11px'},
                                style_header={'backgroundColor': COLORS['danger'], 'color': 'white', 'fontWeight': 'bold'},
                                style_data_conditional=[
                                    {'if': {'column_id': 'Markup $'}, 'backgroundColor': '#f8d7da', 'color': 'darkred', 'fontWeight': 'bold'}
                                ]
                            )
                        ])
                    ], className="mb-4")
                ], md=12)
            ]),
            
            dbc.Card([
                dbc.CardHeader(html.H5("About This Dashboard")),
                dbc.CardBody([
                    html.P([
                        "This dashboard analyzes real price transparency data from ",
                        html.Strong("Inova Alexandria Hospital"), 
                        " and compares it to Medicare benchmark rates."
                    ]),
                    html.P([
                        html.Strong("Data Sources:"),
                        html.Ul([
                            html.Li("Inova Hospital Machine-Readable File (19,296 services)"),
                            html.Li("CMS Medicare Fee Schedules (OPPS, PFS, CLFS)"),
                            html.Li("20 common ER services analyzed")
                        ])
                    ]),
                    html.P([
                        html.Strong("Limitations:"),
                        html.Ul([
                            html.Li("Estimates only - actual bills vary by plan specifics"),
                            html.Li("Does not include out-of-network charges"),
                            html.Li("Negotiated rates may differ by insurance company")
                        ])
                    ])
                ])
            ])
        ])
    ])


if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=8050)
