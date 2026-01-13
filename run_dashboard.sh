#!/bin/bash
# Quick start script for ER Bill Explainer Dashboard

echo "🚀 Starting ER Bill Explainer Dashboard..."
echo ""

# Activate virtual environment
source venv/bin/activate

# Check if dependencies are installed
if ! python3 -c "import dash" 2>/dev/null; then
    echo "📦 Installing dashboard dependencies..."
    pip install -q dash plotly dash-bootstrap-components
fi

echo "✅ Dependencies ready"
echo ""
echo "🌐 Starting dashboard server..."
echo "📊 Dashboard will open at: http://127.0.0.1:8050"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Run dashboard
python3 dashboard.py
