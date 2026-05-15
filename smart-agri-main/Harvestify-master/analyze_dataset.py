import pandas as pd

def analyze_csv():
    try:
        csv_path = r'D:\Harvestify-master\Data-processed\crop_recommendation.csv'
        print(f"Reading file: {csv_path}")
        df = pd.read_csv(csv_path)
        
        output_file = 'analysis_results.txt'
        with open(output_file, 'w') as f:
            f.write("| Column | Min | Max |\n")
            f.write("| :--- | :--- | :--- |\n")
            
            for col in df.columns:
                if pd.api.types.is_numeric_dtype(df[col]):
                    min_val = df[col].min()
                    max_val = df[col].max()
                    # Format float values to 2 decimal places if needed
                    if isinstance(min_val, float):
                        min_val = f"{min_val:.2f}"
                    if isinstance(max_val, float):
                        max_val = f"{max_val:.2f}"
                        
                    f.write(f"| {col} | {min_val} | {max_val} |\n")
        
        print(f"Analysis complete. Results written to {output_file}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    analyze_csv()
