import pandas as pd
import sys

try:
    df = pd.read_csv(r'D:\Harvestify-master\Data-processed\crop_recommendation.csv')
    with open('analysis_results.txt', 'w') as f:
        f.write("Column Statistics:\n")
        f.write("-" * 30 + "\n")
        for col in df.columns:
            if df[col].dtype in ['int64', 'float64']:
                f.write(f"Column: {col}\n")
                f.write(f"  Min: {df[col].min()}\n")
                f.write(f"  Max: {df[col].max()}\n")
                f.write("-" * 30 + "\n")
    print("Analysis complete.")
except Exception as e:
    print(f"Error: {e}")
