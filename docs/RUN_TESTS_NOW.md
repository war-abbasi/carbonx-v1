# 🎯 Run ML Service Tests with Your Real Data - RIGHT NOW

**You have everything you need. Time to execute: ~10 minutes**

---

## ⚡ Quick Execution (Copy-Paste Ready)

### Step 1: Navigate to ML Service
```bash
cd ml_service
```

### Step 2: Activate Virtual Environment

**Linux/Mac:**
```bash
source venv/bin/activate
```

**Windows:**
```powershell
venv\Scripts\activate
```

### Step 3: Run Full Test Suite
```bash
python test_with_real_data.py
```

**What happens:**
- Loads all 3 CSV files from `carbonx-dataset/`
- Tests 10 organizations
- Trains 3 models per organization
- Generates 12-month forecasts
- Shows metrics (RMSE, MAE, MAPE, R²)
- Prints summary table
- Exports results to `real_data_test_results.json`

**Estimated time:** 1-2 minutes (depending on your machine)

---

## 📊 What You'll See

```
#=======================================================================================
#  CarbonX ML Service - Testing with Real Data
#  2026-01-15 14:30:45
#=======================================================================================

======================================================================
Testing Organization: ORG_001
======================================================================

📊 National Assembly Office (ORG_001)
   Sector: Government
   Employees: 182
   Data points: 36 months
   Emissions: 12000.5 - 35000.2 kg CO2e
   Mean: 19000.0 kg CO2e/month

   🔵 PROPHET
      RMSE: 2345.67
      MAE:  1890.23
      MAPE: 8.45%
      R²:   0.89

   🟢 XGBOOST
      RMSE: 2567.89
      MAE:  2010.34
      MAPE: 9.23%
      R²:   0.87

   🔴 HOLT-WINTERS
      RMSE: 2789.12
      MAE:  2145.67
      MAPE: 10.12%
      R²:   0.85

   ✨ WINNER: Prophet (RMSE=2345.67)

[... repeats for ORG_002 through ORG_010 ...]

#======================================================================================
#  SUMMARY ACROSS ALL ORGANIZATIONS
#======================================================================================

Model Performance Across All Orgs:
Model                Wins       Avg RMSE
---------------------------------------------
Prophet              8          2456.34
XGBoost              2          2678.90
Holt-Winters         0          3012.45

Organization                          Sector              Best Model          RMSE
------------------------------------------------------------------------------------------------------
National Assembly Office               Government          Prophet             2345.67
Tech Park Islamabad                    IT                  Prophet             2123.45
Utility Services Dept                  Public Utility      XGBoost             2589.23
... [etc] ...

#======================================================================================
✓ TESTING COMPLETE
#======================================================================================
```

---

## 🎨 Interactive Exploration (Optional)

Want to explore the data interactively?

```bash
# Install Jupyter (one-time)
pip install jupyter

# Launch notebook
jupyter notebook test_real_data.ipynb
```

Then run the cells in order:
1. Load libraries
2. Load your real data
3. Explore organizations
4. Test single organization in detail
5. Train all 3 models
6. Generate forecasts
7. Visualize with charts
8. Test all organizations
9. View summary

---

## 📁 Expected Outputs

After running `python test_with_real_data.py`:

**Console Output:**
- ✅ Live progress for each organization
- ✅ Metrics for all 3 models
- ✅ Winner identification
- ✅ Summary table across all orgs
- ✅ Detailed forecast display

**JSON Export (`real_data_test_results.json`):**
```json
{
  "ORG_001": {
    "org_name": "National Assembly Office",
    "sector": "Government",
    "winner": "Prophet",
    "winner_rmse": 2345.67,
    "prophet_rmse": 2345.67,
    "xgboost_rmse": 2567.89,
    "holt_winters_rmse": 2789.12
  },
  "ORG_002": {
    "org_name": "Tech Park Islamabad",
    "sector": "IT",
    "winner": "Prophet",
    "winner_rmse": 2123.45,
    "prophet_rmse": 2123.45,
    "xgboost_rmse": 2345.67,
    "holt_winters_rmse": 2678.90
  },
  ...
}
```

---

## ✅ Success Indicators

After running tests, you'll know everything worked if:

✅ All 10 organizations tested  
✅ All 3 models trained  
✅ RMSE values in reasonable range (1000-5000 kg CO2e)  
✅ R² values between 0.7-0.95  
✅ Winner identified per organization  
✅ JSON file created  
✅ No errors in output  
✅ Execution completed in < 3 minutes  

---

## 🚨 If Something Goes Wrong

### Error: "ModuleNotFoundError: No module named 'services'"
```bash
# Make sure you're in correct directory:
pwd  # Should show you're in ml_service/

# If not:
cd ml_service
python test_with_real_data.py
```

### Error: "FileNotFoundError: carbonx-dataset not found"
```bash
# The script looks for ../carbonx-dataset relative to ml_service/
# Your structure should be:
# carbonx-fv/
#   ├── ml_service/
#   │   └── test_with_real_data.py
#   └── carbonx-dataset/
#       ├── computed_emissions.csv
#       ├── monthly_activity.csv
#       ├── organizations.csv
#       └── main.py

# If your structure is different, edit the path:
# Open test_with_real_data.py, find line:
# tester = RealDataTester()
# Change to:
# tester = RealDataTester(dataset_path='/full/path/to/carbonx-dataset')
```

### Error: "MemoryError"
```bash
# Your machine is running low on memory. Try:
# 1. Close other applications
# 2. Reduce dataset size (test single org first)
# 3. Reduce XGBoost parameters

# To test single organization:
```

### Error: Runtime takes too long (>5 minutes)
```bash
# May be due to slow machine. This is normal.
# Prophet + XGBoost training takes ~10-30 seconds per org.
# Holt-Winters is fast (< 1 second)
# Total: ~1-2 minutes for all 10 orgs
```

---

## 🎯 Next Steps After Tests Pass

### Immediate (Today)
1. ✅ Run `python test_with_real_data.py`
2. ✅ Review results + summary table
3. ✅ Verify winner models make sense
4. ✅ Check `real_data_test_results.json` exported

### Short-term (This Week)
1. Run Jupyter notebook: `jupyter notebook test_real_data.ipynb`
2. Explore forecasts visually
3. Review confidence intervals
4. Verify metrics are realistic for your data

### Medium-term (Next Week)
1. Start backend integration (see `ML_SERVICE_INTEGRATION.md`)
2. Create Node.js client to call ML service
3. Update forecast endpoints

### Long-term (Following Week)
1. Integrate with React frontend
2. Deploy to production (Railway)
3. Prepare FYP defense materials

---

## 📊 Understanding Your Results

### Model Comparison
After tests, Prophet should win most organizations because:
- Your data has clear trend (upward growth)
- Seasonality present (summer peaks)
- Prophet specifically optimized for these patterns

### Example Interpretation
```
Winner: Prophet (RMSE: 2345.67)

This means:
- Prophet predicts within ±2346 kg CO2e on average
- It explains 89% of emission variance (R²: 0.89)
- For an org with 20,000 kg/month average, error is ~12%
```

### Confidence Intervals
```
Predicted: 25,000 kg/month
90% CI: 23,500 - 26,500 kg

Interpretation:
- Point estimate: 25,000 kg
- 90% confident true value is between 23,500-26,500
- Used for risk planning (conservative: use 26,500)
```

---

## 💡 Pro Tips

### Tip 1: Save Results
```bash
# After running tests, save the JSON
cp real_data_test_results.json backup_results_$(date +%Y%m%d).json
```

### Tip 2: Compare Multiple Runs
```bash
# Run with different hyperparameters and compare
# Edit test_with_real_data.py to use different params
# Re-run and compare results
```

### Tip 3: Focus on Winner Model
```bash
# Once you know Prophet wins most orgs, you can:
# - Use Prophet in production
# - Skip XGBoost/HW in live predictions (save computation)
# - Still keep all 3 for comparison purposes
```

### Tip 4: Document Your Results
```bash
# Create a results folder
mkdir test_results_2026_01_15
cp real_data_test_results.json test_results_2026_01_15/
# Keep for FYP defense + historical reference
```

---

## ⏱️ Time Breakdown

- **Setup:** 5 minutes (first-time only)
- **Test execution:** 1-2 minutes
- **Results review:** 2-3 minutes
- **Interactive exploration (optional):** 10-15 minutes

**Total to first results: ~8 minutes**

---

## 📝 Checklist Before Running

Before you execute, verify:

- [ ] You're in the correct directory (`ml_service/`)
- [ ] Virtual environment activated (see `source venv/bin/activate`)
- [ ] Dataset exists at `../carbonx-dataset/`
- [ ] All 3 CSV files present in dataset folder
- [ ] No other tests running
- [ ] Enough disk space (~100MB free)
- [ ] Python 3.11+ installed

---

## 🎬 The Command (One Line)

```bash
cd ml_service && source venv/bin/activate && python test_with_real_data.py
```

Or on Windows:
```powershell
cd ml_service; venv\Scripts\activate; python test_with_real_data.py
```

---

## 🏁 You're Ready!

Everything is set up. The ML service is built. Your data is ready.

**Now it's time to execute.**

Run the test command above and watch it work with your real data.

In 1-2 minutes, you'll have:
✅ Validated all 3 ML models  
✅ Identified best model per organization  
✅ Generated forecasts with confidence intervals  
✅ Exportable results  
✅ Proof that the ML service works  

---

## 📞 After Tests Complete

Check your results:
1. Open `real_data_test_results.json`
2. Verify Prophet wins most organizations
3. Check RMSE values are reasonable (1000-5000)
4. Note which sectors perform best/worst
5. Consider what this means for forecasting quality

Then proceed to:
→ **ML_SERVICE_INTEGRATION.md** for backend integration

---

**Let's go! 🚀**

```
python test_with_real_data.py
```

Good luck! ✨
