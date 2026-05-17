import os
import re
import json

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KB_DIR = os.path.join(BASE_DIR, 'knowledge_base')
OUTPUT_DIR = os.path.join(BASE_DIR, 'webapp', 'src', 'data')
OUTPUT_FILE = os.path.join(OUTPUT_DIR, 'database.json')
OUTFIT_PRESET_METADATA_FILE = os.path.join(KB_DIR, 'outfit_preset_metadata.json')


def clean_cell(text):
    return re.sub(r'\s+', ' ', text.replace('`', '').replace('*', '')).strip()

def parse_markdown_table(file_path):
    """Parses a markdown table into a grouped dictionary, structured for the frontend."""
    data = {}
    
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return data

    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    for line in lines:
        line = line.strip()
        if not line or not line.startswith('|') or '---' in line:
            continue
        
        parts = [p.strip() for p in line.split('|')[1:-1]]
        if len(parts) >= 4 and parts[0] not in (
            '維度',
            '類型',
            '特徵維度 (Category)',
            '特徵維度',
            '類別 (Category)',
            '維度分類 (Dimension)',
            '地區風格 (Region Style)',
            '攝影風格 (Photography Style)',
        ):
            if 'regional_portrait_styles' in file_path:
                category = '攝影風格'
                name_zh = clean_cell(parts[0])
                inspiration = clean_cell(parts[1]) if len(parts) > 1 else ""
                prompt_en = clean_cell(parts[2]) if len(parts) > 2 else ""
                desc = clean_cell(parts[3]) if len(parts) > 3 else ""
                if inspiration and inspiration not in ('—', '-'):
                    desc = f"{inspiration} | {desc}" if desc else inspiration
            elif len(parts) >= 5:
                category = clean_cell(parts[1])
                name_zh = clean_cell(parts[2])
                prompt_en = clean_cell(parts[3])
                desc = parts[4] if len(parts) > 4 else ""
            else:
                category = clean_cell(parts[0])
                name_zh = clean_cell(parts[1])
                prompt_en = clean_cell(parts[2])
                desc = parts[3] if len(parts) > 3 else ""
            
            if category not in data:
                data[category] = []

            data[category].append({
                "zh": name_zh,
                "en": prompt_en,
                "desc": clean_cell(desc)
            })
            
    return data


def count_entries(grouped_data):
    return sum(len(items) for items in grouped_data.values())

def load_json_file(file_path):
    if not os.path.exists(file_path):
        return {}
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def merge_outfit_preset_metadata(grouped_data, metadata_by_name):
    category = '套裝 (Outfit Presets)'
    items = grouped_data.get(category, [])
    if not items:
        return 0

    merged_count = 0
    for item in items:
        metadata = metadata_by_name.get(item.get('zh'))
        if not metadata:
            continue
        item['meta'] = metadata
        merged_count += 1

    return merged_count

def preserve_existing_item_metadata(new_database, existing_database):
    """Keep non-table item metadata that Markdown rows cannot represent."""
    preserved_count = 0

    for db_key, grouped_data in new_database.items():
        existing_grouped_data = existing_database.get(db_key, {})
        if not isinstance(existing_grouped_data, dict):
            continue

        for category, items in grouped_data.items():
            existing_items = existing_grouped_data.get(category, [])
            if not isinstance(existing_items, list):
                continue

            existing_by_name = {
                item.get('zh'): item
                for item in existing_items
                if isinstance(item, dict) and item.get('zh')
            }

            for item in items:
                existing_item = existing_by_name.get(item.get('zh'))
                if not existing_item:
                    continue

                for key, value in existing_item.items():
                    if key in ('zh', 'en', 'desc') or key in item:
                        continue
                    item[key] = value
                    preserved_count += 1

    return preserved_count

def main():
    print("Starting sync from MD to JSON...")
    
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    database = {}
    
    # Files to process
    files_to_sync = {
        'regional_portrait_styles.md': 'Regional',
        'wardrobe_and_styling.md': 'Wardrobe',
        'camera_and_lighting.md': 'CameraLighting',
        'locations_and_sets.md': 'Locations',
        'character_design.md': 'Character',
        'negative_prompts.md': 'Negative'
    }
    
    outfit_preset_metadata = load_json_file(OUTFIT_PRESET_METADATA_FILE)

    for filename, db_key in files_to_sync.items():
        file_path = os.path.join(KB_DIR, filename)
        print(f"Parsing {filename}...")
        parsed_data = parse_markdown_table(file_path)
        if filename == 'wardrobe_and_styling.md':
            merged_count = merge_outfit_preset_metadata(parsed_data, outfit_preset_metadata)
            print(f"  Outfit preset metadata merged: {merged_count}")
        print(f"  Categories: {len(parsed_data)} | Entries: {count_entries(parsed_data)}")
        database[db_key] = parsed_data

    existing_database = load_json_file(OUTPUT_FILE)
    preserved_count = preserve_existing_item_metadata(database, existing_database)
    if preserved_count:
        print(f"Preserved existing item metadata fields: {preserved_count}")
        
    # Validation
    if not database.get('Character'):
        print("Warning: Database might be empty or parsing failed.")
    else:
        character_total = count_entries(database['Character'])
        if character_total < 10:
            print(f"Warning: Character database looks too small ({character_total} entries).")
        
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(database, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully synced dictionaries to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
