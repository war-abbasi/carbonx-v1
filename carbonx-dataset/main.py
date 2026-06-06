import numpy as np
import pandas as pd
from datetime import datetime

np.random.seed(42)

# -----------------------------
# CONFIGURATION
# -----------------------------
NUM_ORGS = 10
MONTHS = 36

start_date = "2023-01-01"

org_names = [
    "National Assembly Office",
    "Tech Park Islamabad",
    "Utility Services Dept",
    "Green Energy Corp",
    "Metro Logistics",
    "Healthcare Network",
    "University Campus",
    "Smart City Admin",
    "Banking HQ",
    "Manufacturing Unit"
]

sectors = [
    "Government",
    "IT",
    "Public Utility",
    "Energy",
    "Logistics",
    "Healthcare",
    "Education",
    "Smart City",
    "Finance",
    "Industrial"
]

# -----------------------------
# EMISSION FACTORS (kg CO2e)
# -----------------------------
EF = {
    "electricity": 0.41,
    "diesel": 2.68,
    "petrol": 2.31,
    "flight": 0.15,
    "waste": 0.45,
    "water": 0.34
}

# -----------------------------
# ORGANIZATIONS
# -----------------------------
orgs = []
for i in range(NUM_ORGS):
    orgs.append({
        "org_id": f"ORG_{i+1:03d}",
        "org_name": org_names[i],
        "sector": sectors[i],
        "base_employees": np.random.randint(80, 500)
    })

org_df = pd.DataFrame(orgs)

# -----------------------------
# DATE RANGE
# -----------------------------
dates = pd.date_range(start=start_date, periods=MONTHS, freq="MS")

activity_rows = []
emission_rows = []

# -----------------------------
# GENERATION LOOP
# -----------------------------
for org in orgs:
    employees = org["base_employees"]

    for t, date in enumerate(dates):

        # Growth trend (slight increase in operations)
        growth_factor = 1 + (t * np.random.uniform(0.002, 0.01))

        # Seasonality (higher electricity in summer)
        seasonal = 1 + 0.15 * np.sin(2 * np.pi * t / 12)

        # Employee drift
        employees = int(employees * (1 + np.random.normal(0.002, 0.01)))

        electricity = int(np.random.normal(20000, 4000) * growth_factor * seasonal)
        diesel = int(np.random.normal(3000, 800) * growth_factor)
        petrol = int(np.random.normal(1200, 300) * growth_factor)
        flight = int(np.random.normal(2500, 1200) * growth_factor)
        waste = int(np.random.normal(600, 120) * growth_factor)
        water = int(np.random.normal(150, 40) * growth_factor)

        # ensure no negatives
        values = [electricity, diesel, petrol, flight, waste, water]
        values = [max(0, v) for v in values]

        electricity, diesel, petrol, flight, waste, water = values

        # -----------------------------
        # EMISSIONS CALCULATION
        # -----------------------------
        scope1 = (diesel * EF["diesel"] + petrol * EF["petrol"])
        scope2 = electricity * EF["electricity"]
        scope3 = (
            flight * EF["flight"] +
            waste * EF["waste"] +
            water * EF["water"]
        )

        total = scope1 + scope2 + scope3

        # -----------------------------
        # STORE ACTIVITY
        # -----------------------------
        activity_rows.append([
            org["org_id"],
            date.strftime("%Y-%m"),
            electricity,
            diesel,
            petrol,
            flight,
            waste,
            water,
            employees
        ])

        # -----------------------------
        # STORE EMISSIONS
        # -----------------------------
        emission_rows.append([
            org["org_id"],
            date.strftime("%Y-%m"),
            scope1,
            scope2,
            scope3,
            total
        ])

# -----------------------------
# DATAFRAMES
# -----------------------------
activity_df = pd.DataFrame(activity_rows, columns=[
    "org_id","month","electricity_kwh","diesel_liters",
    "petrol_liters","flight_km","waste_kg","water_m3","employees"
])

emissions_df = pd.DataFrame(emission_rows, columns=[
    "org_id","month","scope1","scope2","scope3","total_co2e"
])

# -----------------------------
# EXPORT CSVs
# -----------------------------
org_df.to_csv("organizations.csv", index=False)
activity_df.to_csv("monthly_activity.csv", index=False)
emissions_df.to_csv("computed_emissions.csv", index=False)

print("Dataset generated successfully!")
print(activity_df.head())