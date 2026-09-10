import os
from PIL import Image

# Directories to search for PNGs
TARGET_DIRS = [
    'frontend/public/images',
    'frontend/public',
    'frontend/src/assets'
]

def convert_png_to_webp():
    print("Starting WebP conversion process...")
    
    for dir_path in TARGET_DIRS:
        if not os.path.exists(dir_path):
            print(f"Directory not found: {dir_path}")
            continue
            
        print(f"Processing directory: {dir_path}")
        
        for filename in os.listdir(dir_path):
            if filename.lower().endswith('.png'):
                png_path = os.path.join(dir_path, filename)
                webp_filename = os.path.splitext(filename)[0] + '.webp'
                webp_path = os.path.join(dir_path, webp_filename)
                
                try:
                    with Image.open(png_path) as img:
                        # Convert to RGB if needed (WebP supports RGBA, but just in case)
                        img.save(webp_path, 'WEBP', quality=80)
                        
                    orig_size = os.path.getsize(png_path) / 1024
                    new_size = os.path.getsize(webp_path) / 1024
                    reduction = ((orig_size - new_size) / orig_size) * 100
                    
                    print(f"Converted: {filename} -> {webp_filename}")
                    print(f"   [{orig_size:.1f}KB -> {new_size:.1f}KB] ({reduction:.1f}% reduction)")
                except Exception as e:
                    print(f"Failed to convert {filename}: {e}")

    print("\nConversion completed!")

if __name__ == "__main__":
    convert_png_to_webp()
