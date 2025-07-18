#!/usr/bin/env python3
"""
Script to process agricultural data from Excel and generate JSON files for each crop.
Creates geographic data in the format needed for the web application.
"""

import pandas as pd
import json
import os
from pathlib import Path

def process_excel_to_json(excel_path, output_dir):
    """
    Process Excel file and generate JSON files for each crop.
    This handles the IBGE format where municipalities are rows and crops are columns.
    
    Args:
        excel_path (str): Path to the Excel file
        output_dir (str): Output directory for JSON files
    """
    try:
        # Read the Excel file
        print(f"Reading Excel file: {excel_path}")
        df = pd.read_excel(excel_path, engine='openpyxl')
        
        # Print column info for debugging
        print(f"Columns found: {df.columns.tolist()}")
        print(f"Shape: {df.shape}")
        print(f"First few rows:\n{df.head()}")
        
        # Create output directory
        os.makedirs(output_dir, exist_ok=True)
        
        # Extract municipality and state information from 'MUNICÍPIO - UF' column
        municipality_col = 'MUNICÍPIO - UF'
        ibge_col = 'CÓDIGO IBGE'
        
        # State mapping for coordinates (approximate centers)
        state_coords = {
            'AC': (-9.0238, -70.8120),  # Acre
            'AL': (-9.5713, -36.7820),  # Alagoas
            'AP': (1.4144, -51.7865),   # Amapá
            'AM': (-4.9609, -61.9478),  # Amazonas
            'BA': (-13.2905, -41.7104), # Bahia
            'CE': (-5.4984, -39.3206),  # Ceará
            'DF': (-15.8267, -47.9218), # Distrito Federal
            'ES': (-19.1834, -40.3089), # Espírito Santo
            'GO': (-15.8270, -49.8362), # Goiás
            'MA': (-4.9609, -45.2744),  # Maranhão
            'MT': (-12.6819, -56.9211), # Mato Grosso
            'MS': (-20.7722, -54.7852), # Mato Grosso do Sul
            'MG': (-18.5122, -44.5550), # Minas Gerais
            'PA': (-3.7120, -52.4531),  # Pará
            'PB': (-7.2400, -36.7820),  # Paraíba
            'PR': (-24.8932, -51.4008), # Paraná
            'PE': (-8.8137, -36.9541),  # Pernambuco
            'PI': (-8.5569, -42.7370),  # Piauí
            'RJ': (-22.9035, -43.2096), # Rio de Janeiro
            'RN': (-5.4026, -36.9541),  # Rio Grande do Norte
            'RS': (-30.0346, -51.2177), # Rio Grande do Sul
            'RO': (-11.5057, -63.5806), # Rondônia
            'RR': (2.7376, -62.0751),   # Roraima
            'SC': (-27.2423, -50.2189), # Santa Catarina
            'SP': (-23.5505, -46.6333), # São Paulo
            'SE': (-10.5741, -37.3857), # Sergipe
            'TO': (-10.1753, -48.2982), # Tocantins
        }
        
        # Get all crop columns (excluding IBGE code and municipality)
        crop_columns = [col for col in df.columns if col not in [ibge_col, municipality_col]]
        
        # Filter out crops with mostly empty data
        valid_crops = []
        for crop in crop_columns:
            # Count non-null, non-dash values
            valid_count = df[crop].apply(lambda x: str(x).strip() not in ['-', 'nan', '', 'None']).sum()
            if valid_count > 10:  # Only include crops with at least 10 valid entries
                valid_crops.append(crop)
        
        print(f"Found {len(valid_crops)} valid crops with sufficient data")
        
        # Process each crop
        for crop in valid_crops:
            print(f"Processing crop: {crop}")
            
            # Get data for this crop
            crop_data = df[[ibge_col, municipality_col, crop]].copy()
            
            # Clean the data
            crop_data = crop_data[crop_data[crop].notna()]
            crop_data = crop_data[crop_data[crop].astype(str).str.strip() != '-']
            
            # Convert production values to numeric
            crop_data[crop] = pd.to_numeric(crop_data[crop], errors='coerce')
            crop_data = crop_data.dropna(subset=[crop])
            
            if len(crop_data) == 0:
                print(f"No valid data for crop: {crop}")
                continue
            
            # Create GeoJSON-like structure for the crop
            features = []
            
            for idx, row in crop_data.iterrows():
                # Extract municipality name and state
                municipality_state = str(row[municipality_col])
                
                # Extract state code (assuming format "Municipality (ST)")
                state_code = None
                if '(' in municipality_state and ')' in municipality_state:
                    state_code = municipality_state.split('(')[-1].split(')')[0]
                    municipality_name = municipality_state.split('(')[0].strip()
                else:
                    municipality_name = municipality_state
                    state_code = 'SP'  # Default to SP if not found
                
                # Get coordinates based on state
                base_lat, base_lng = state_coords.get(state_code, (-23.5505, -46.6333))
                
                # Add some randomness to spread points within the state
                import random
                random.seed(hash(municipality_name) % 1000)  # Consistent randomness
                lat = base_lat + (random.random() - 0.5) * 2  # +/- 1 degree
                lng = base_lng + (random.random() - 0.5) * 2  # +/- 1 degree
                
                # Map regions
                region_map = {
                    'AC': 'Norte', 'AM': 'Norte', 'AP': 'Norte', 'PA': 'Norte', 'RO': 'Norte', 'RR': 'Norte', 'TO': 'Norte',
                    'AL': 'Nordeste', 'BA': 'Nordeste', 'CE': 'Nordeste', 'MA': 'Nordeste', 'PB': 'Nordeste', 'PE': 'Nordeste', 'PI': 'Nordeste', 'RN': 'Nordeste', 'SE': 'Nordeste',
                    'GO': 'Centro-Oeste', 'MT': 'Centro-Oeste', 'MS': 'Centro-Oeste', 'DF': 'Centro-Oeste',
                    'ES': 'Sudeste', 'MG': 'Sudeste', 'RJ': 'Sudeste', 'SP': 'Sudeste',
                    'PR': 'Sul', 'RS': 'Sul', 'SC': 'Sul'
                }
                
                feature = {
                    "type": "Feature",
                    "properties": {
                        "municipality": municipality_name,
                        "state": state_code,
                        "crop": crop,
                        "hectares": float(row[crop]),
                        "production": float(row[crop]),  # In this dataset, the value represents production
                        "year": 2023,  # Default year
                        "region": region_map.get(state_code, 'Sudeste'),
                        "ibge_code": str(row[ibge_col]) if pd.notna(row[ibge_col]) else None
                    },
                    "geometry": {
                        "type": "Point",
                        "coordinates": [float(lng), float(lat)]
                    }
                }
                features.append(feature)
            
            # Create GeoJSON structure
            geojson_data = {
                "type": "FeatureCollection",
                "name": f"{crop}_production",
                "features": features
            }
            
            # Save to JSON file
            safe_crop_name = str(crop).replace('/', '_').replace(' ', '_').replace('(', '').replace(')', '').replace('*', '').lower()
            output_file = os.path.join(output_dir, f"{safe_crop_name}.json")
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(geojson_data, f, ensure_ascii=False, indent=2)
            
            print(f"Created {output_file} with {len(features)} features")
        
        # Create summary file
        summary = {
            "total_crops": len(valid_crops),
            "total_records": len(df),
            "crops": valid_crops,
            "data_format": "IBGE agricultural production data",
            "description": "Agricultural production data by municipality and crop"
        }
        
        with open(os.path.join(output_dir, "summary.json"), 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
        
        print(f"Processing complete! Created {len(valid_crops)} crop files and summary.json")
        
    except Exception as e:
        print(f"Error processing Excel file: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    excel_path = "attached_assets/tabela5457_1752835669304.xlsx"
    output_dir = "client/public/data"
    
    process_excel_to_json(excel_path, output_dir)