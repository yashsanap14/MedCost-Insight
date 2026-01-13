# Power BI DAX Measures

This document contains all DAX measures for the ER Bill Explainer dashboard.

---

## Core Measures

### Allowed Amount Estimate

```dax
Allowed_Estimate = 
VAR NegotiatedRate = MEDIAN(fact_prices[negotiated_median])
VAR BenchmarkRate = AVERAGE(fact_benchmarks[medicare_rate])
RETURN
    COALESCE(NegotiatedRate, BenchmarkRate, 0)
```

**Purpose**: Estimates the "allowed amount" (what insurance actually pays) by using the hospital's negotiated rate if available, otherwise falling back to Medicare benchmark.

---

### Patient Responsibility

```dax
Patient_Owes = 
VAR Copay = [Selected_Copay]
VAR DeductibleRemaining = [Selected_Deductible]
VAR CoinsurancePct = [Selected_Coinsurance] / 100
VAR AllowedTotal = [Allowed_Estimate]
VAR DeductiblePart = MIN(DeductibleRemaining, AllowedTotal)
VAR CoinsurancePart = CoinsurancePct * (AllowedTotal - DeductiblePart)
RETURN
    Copay + DeductiblePart + CoinsurancePart
```

**Purpose**: Calculates estimated patient out-of-pocket cost based on:
1. ER copay
2. Remaining deductible
3. Coinsurance percentage

---

### Insurance Payment

```dax
Insurance_Pays = 
[Allowed_Estimate] - [Patient_Owes]
```

**Purpose**: Estimates how much insurance will pay (allowed amount minus patient responsibility).

---

### Variance from Medicare

```dax
Variance_Pct = 
VAR HospitalPrice = AVERAGE(fact_prices[cash_price])
VAR MedicareBenchmark = AVERAGE(fact_benchmarks[medicare_rate])
RETURN
    DIVIDE(
        HospitalPrice - MedicareBenchmark,
        MedicareBenchmark,
        0
    )
```

**Purpose**: Shows how much hospital charges exceed (or are below) Medicare benchmarks.

---

### Variance Amount

```dax
Variance_Amount = 
AVERAGE(fact_prices[cash_price]) - AVERAGE(fact_benchmarks[medicare_rate])
```

**Purpose**: Dollar amount of variance from Medicare benchmark.

---

## Parameter Measures

These measures reference What-If parameters created in Power BI.

### Selected Copay

```dax
Selected_Copay = 
SELECTEDVALUE('Copay Parameter'[Copay], 250)
```

**Default**: $250

---

### Selected Deductible

```dax
Selected_Deductible = 
SELECTEDVALUE('Deductible Parameter'[Deductible Remaining], 500)
```

**Default**: $500

---

### Selected Coinsurance

```dax
Selected_Coinsurance = 
SELECTEDVALUE('Coinsurance Parameter'[Coinsurance %], 20)
```

**Default**: 20%

---

## Aggregation Measures

### Total Billed Charges

```dax
Total_Billed = 
SUM(fact_prices[gross_charge])
```

---

### Average Cash Price

```dax
Avg_Cash_Price = 
AVERAGE(fact_prices[cash_price])
```

---

### Average Medicare Rate

```dax
Avg_Medicare_Rate = 
AVERAGE(fact_benchmarks[medicare_rate])
```

---

### Service Count

```dax
Service_Count = 
DISTINCTCOUNT(fact_prices[service_id])
```

---

### Hospital Count

```dax
Hospital_Count = 
DISTINCTCOUNT(fact_prices[provider_id])
```

---

## Breakdown Measures

### Copay Component

```dax
Copay_Component = 
[Selected_Copay]
```

**Purpose**: For donut chart showing patient cost breakdown.

---

### Deductible Component

```dax
Deductible_Component = 
VAR DeductibleRemaining = [Selected_Deductible]
VAR AllowedTotal = [Allowed_Estimate]
RETURN
    MIN(DeductibleRemaining, AllowedTotal)
```

---

### Coinsurance Component

```dax
Coinsurance_Component = 
VAR CoinsurancePct = [Selected_Coinsurance] / 100
VAR AllowedTotal = [Allowed_Estimate]
VAR DeductiblePart = [Deductible_Component]
RETURN
    CoinsurancePct * (AllowedTotal - DeductiblePart)
```

---

## Conditional Formatting Measures

### Variance Color

```dax
Variance_Color = 
VAR Variance = [Variance_Pct]
RETURN
    SWITCH(
        TRUE(),
        Variance > 1, "#D32F2F",      // Red: >100% above Medicare
        Variance > 0.5, "#F57C00",    // Orange: 50-100% above
        Variance > 0, "#FBC02D",      // Yellow: 0-50% above
        "#388E3C"                     // Green: At or below Medicare
    )
```

**Purpose**: Color codes variance from Medicare benchmarks.

---

## Tooltip Measures

### Tooltip - Service Details

```dax
Tooltip_Service = 
"Service: " & SELECTEDVALUE(dim_service[description]) & 
UNICHAR(10) & "CPT Code: " & SELECTEDVALUE(dim_service[cpt_hcpcs]) &
UNICHAR(10) & "Category: " & SELECTEDVALUE(dim_service[category])
```

---

### Tooltip - Price Breakdown

```dax
Tooltip_Prices = 
"Gross Charge: $" & FORMAT([Total_Billed], "#,##0") &
UNICHAR(10) & "Cash Price: $" & FORMAT([Avg_Cash_Price], "#,##0") &
UNICHAR(10) & "Medicare: $" & FORMAT([Avg_Medicare_Rate], "#,##0") &
UNICHAR(10) & "Variance: " & FORMAT([Variance_Pct], "0.0%")
```

---

## How to Create What-If Parameters

### Copay Parameter

1. Modeling tab → New Parameter
2. Name: "Copay Parameter"
3. Data type: Whole number
4. Minimum: 0
5. Maximum: 500
6. Increment: 50
7. Default: 250

### Deductible Parameter

1. Modeling tab → New Parameter
2. Name: "Deductible Parameter"
3. Data type: Whole number
4. Minimum: 0
5. Maximum: 5000
6. Increment: 100
7. Default: 500

### Coinsurance Parameter

1. Modeling tab → New Parameter
2. Name: "Coinsurance Parameter"
3. Data type: Whole number
4. Minimum: 0
5. Maximum: 50
6. Increment: 5
7. Default: 20

---

## Usage Tips

1. **Create measures in a dedicated "Measures" table** for organization
2. **Use folders** to group related measures (right-click → Display Folder)
3. **Format measures** appropriately:
   - Currency: `$#,##0`
   - Percentage: `0.0%`
   - Whole number: `#,##0`
4. **Add descriptions** to measures (right-click → Properties → Description)

---

## Testing Measures

Test each measure by creating a simple table visual:
1. Add `dim_service[description]` to rows
2. Add measure to values
3. Verify calculations are correct
4. Check for BLANK() or error values
