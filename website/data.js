// ER Bill Explainer - Embedded Dataset
// 20 common ER services with realistic pricing from Inova Alexandria Hospital

const ER_DATA = {
  hospital: {
    name: "Inova Alexandria Hospital",
    city: "Alexandria",
    state: "VA",
    ccn: "490089"
  },

  services: [
    // Facility - ER Visit Levels
    {
      cpt: "99281", description: "ER visit, minimal complexity", category: "facility",
      typical_use: "Minor injury or illness",
      gross_charge: 622, cash_price: 186.60, negotiated_min: 140, negotiated_median: 210, negotiated_max: 350, medicare_rate: 72.68, payer_count: 8
    },
    {
      cpt: "99282", description: "ER visit, low complexity", category: "facility",
      typical_use: "Simple laceration or sprain",
      gross_charge: 962, cash_price: 288.60, negotiated_min: 200, negotiated_median: 340, negotiated_max: 520, medicare_rate: 141.58, payer_count: 10
    },
    {
      cpt: "99283", description: "ER visit, moderate complexity", category: "facility",
      typical_use: "Moderate injury requiring imaging",
      gross_charge: 1585, cash_price: 475.50, negotiated_min: 380, negotiated_median: 560, negotiated_max: 900, medicare_rate: 234.48, payer_count: 12
    },
    {
      cpt: "99284", description: "ER visit, high complexity", category: "facility",
      typical_use: "Severe injury or acute illness",
      gross_charge: 2730, cash_price: 819.00, negotiated_min: 600, negotiated_median: 950, negotiated_max: 1500, medicare_rate: 417.68, payer_count: 12
    },
    {
      cpt: "99285", description: "ER visit, very high complexity", category: "facility",
      typical_use: "Life-threatening emergency",
      gross_charge: 4165, cash_price: 1249.50, negotiated_min: 900, negotiated_median: 1450, negotiated_max: 2300, medicare_rate: 625.13, payer_count: 11
    },

    // Imaging
    {
      cpt: "70450", description: "CT head/brain without contrast", category: "imaging",
      typical_use: "Head injury evaluation",
      gross_charge: 3200, cash_price: 960.00, negotiated_min: 500, negotiated_median: 850, negotiated_max: 1800, medicare_rate: 186.12, payer_count: 9
    },
    {
      cpt: "70486", description: "CT face without contrast", category: "imaging",
      typical_use: "Facial trauma",
      gross_charge: 2850, cash_price: 855.00, negotiated_min: 450, negotiated_median: 780, negotiated_max: 1600, medicare_rate: 195.89, payer_count: 7
    },
    {
      cpt: "71045", description: "Chest X-ray, single view", category: "imaging",
      typical_use: "Respiratory symptoms",
      gross_charge: 425, cash_price: 127.50, negotiated_min: 60, negotiated_median: 105, negotiated_max: 250, medicare_rate: 26.43, payer_count: 11
    },
    {
      cpt: "71046", description: "Chest X-ray, 2 views", category: "imaging",
      typical_use: "Chest pain or trauma",
      gross_charge: 550, cash_price: 165.00, negotiated_min: 80, negotiated_median: 140, negotiated_max: 320, medicare_rate: 31.12, payer_count: 12
    },
    {
      cpt: "73610", description: "Ankle X-ray, 3+ views", category: "imaging",
      typical_use: "Ankle injury",
      gross_charge: 480, cash_price: 144.00, negotiated_min: 70, negotiated_median: 120, negotiated_max: 280, medicare_rate: 29.34, payer_count: 10
    },

    // Lab Tests
    {
      cpt: "85025", description: "Complete Blood Count (CBC) with differential", category: "lab",
      typical_use: "Infection or anemia workup",
      gross_charge: 185, cash_price: 55.50, negotiated_min: 20, negotiated_median: 42, negotiated_max: 100, medicare_rate: 10.87, payer_count: 12
    },
    {
      cpt: "80053", description: "Comprehensive Metabolic Panel (CMP)", category: "lab",
      typical_use: "General health assessment",
      gross_charge: 325, cash_price: 97.50, negotiated_min: 35, negotiated_median: 72, negotiated_max: 180, medicare_rate: 14.49, payer_count: 12
    },
    {
      cpt: "81001", description: "Urinalysis, automated", category: "lab",
      typical_use: "Urinary symptoms",
      gross_charge: 95, cash_price: 28.50, negotiated_min: 10, negotiated_median: 22, negotiated_max: 55, medicare_rate: 3.65, payer_count: 11
    },
    {
      cpt: "82947", description: "Glucose, blood quantitative", category: "lab",
      typical_use: "Diabetes or altered mental status",
      gross_charge: 115, cash_price: 34.50, negotiated_min: 12, negotiated_median: 28, negotiated_max: 65, medicare_rate: 5.14, payer_count: 10
    },
    {
      cpt: "85610", description: "Prothrombin time (PT)", category: "lab",
      typical_use: "Bleeding or anticoagulation monitoring",
      gross_charge: 130, cash_price: 39.00, negotiated_min: 15, negotiated_median: 32, negotiated_max: 75, medicare_rate: 5.44, payer_count: 9
    },

    // Procedures
    {
      cpt: "12001", description: "Simple repair, superficial wound", category: "procedure",
      typical_use: "Laceration repair",
      gross_charge: 1250, cash_price: 375.00, negotiated_min: 200, negotiated_median: 320, negotiated_max: 700, medicare_rate: 172.89, payer_count: 8
    },
    {
      cpt: "29125", description: "Application of short arm splint", category: "procedure",
      typical_use: "Wrist or hand injury",
      gross_charge: 680, cash_price: 204.00, negotiated_min: 100, negotiated_median: 180, negotiated_max: 400, medicare_rate: 59.46, payer_count: 7
    },
    {
      cpt: "36415", description: "Routine venipuncture", category: "procedure",
      typical_use: "Blood draw for lab tests",
      gross_charge: 75, cash_price: 22.50, negotiated_min: 8, negotiated_median: 18, negotiated_max: 45, medicare_rate: 3.00, payer_count: 12
    },
    {
      cpt: "96372", description: "Injection, subcutaneous/intramuscular", category: "procedure",
      typical_use: "Medication administration",
      gross_charge: 320, cash_price: 96.00, negotiated_min: 40, negotiated_median: 75, negotiated_max: 185, medicare_rate: 25.84, payer_count: 11
    },
    {
      cpt: "94640", description: "Nebulizer treatment", category: "procedure",
      typical_use: "Asthma or respiratory distress",
      gross_charge: 445, cash_price: 133.50, negotiated_min: 60, negotiated_median: 110, negotiated_max: 260, medicare_rate: 37.41, payer_count: 9
    }
  ],

  // Insurance plan presets for What-If Simulator
  planPresets: {
    bronze: {
      name: "Bronze (ACA)",
      deductible: 7000, coinsurance: 40, copay: 0, oopMax: 9100,
      color: "#CD7F32", description: "Low premium, high out-of-pocket"
    },
    silver: {
      name: "Silver (ACA)",
      deductible: 4000, coinsurance: 30, copay: 150, oopMax: 9100,
      color: "#C0C0C0", description: "Moderate premium & out-of-pocket"
    },
    gold: {
      name: "Gold (ACA)",
      deductible: 1500, coinsurance: 20, copay: 250, oopMax: 8700,
      color: "#FFD700", description: "Higher premium, lower out-of-pocket"
    },
    platinum: {
      name: "Platinum (ACA)",
      deductible: 500, coinsurance: 10, copay: 350, oopMax: 4000,
      color: "#E5E4E2", description: "Highest premium, lowest out-of-pocket"
    },
    hdhp: {
      name: "HDHP + HSA",
      deductible: 3000, coinsurance: 20, copay: 0, oopMax: 7050,
      color: "#4A90D9", description: "Tax-advantaged, high deductible"
    }
  },

  // Red flag thresholds
  defaultThresholds: {
    medicareMultiplier: 5.0,
    negotiatedVariancePct: 200,
    outlierPercentile: 95
  },

  // Virginia state average Medicare multipliers per CPT (simulated from CMS data)
  stateBenchmarks: {
    state: "Virginia",
    avgMultiplier: 2.1,
    byCpt: {
      "99281": 5.8, "99282": 4.9, "99283": 4.5, "99284": 4.2, "99285": 4.0,
      "70450": 11.2, "70486": 9.8, "71045": 10.5, "71046": 11.8, "73610": 10.8,
      "85025": 10.2, "80053": 13.8, "81001": 15.2, "82947": 13.2, "85610": 14.5,
      "12001": 4.5, "29125": 7.2, "36415": 15.0, "96372": 7.8, "94640": 7.5
    },
    // Category-level state averages (gross_charge ÷ medicare_rate)
    byCategory: {
      facility: { stateAvg: 4.7, nationalMedian: 4.2, percentile75: 5.5 },
      imaging: { stateAvg: 10.8, nationalMedian: 9.5, percentile75: 13.0 },
      lab: { stateAvg: 13.4, nationalMedian: 11.0, percentile75: 16.0 },
      procedure: { stateAvg: 8.4, nationalMedian: 7.2, percentile75: 10.5 }
    }
  },

  // National percentile thresholds for markup ratios
  nationalPercentiles: {
    p25: 3.0, p50: 5.5, p75: 9.0, p90: 14.0, p95: 18.0
  }
};
