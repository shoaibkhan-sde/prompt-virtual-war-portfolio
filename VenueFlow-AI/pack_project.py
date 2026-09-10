import os

# Configuration: What to include and what to ignore
TARGET_EXTENSIONS = ('.py', '.jsx', '.js', '.html', '.css', '.md', '.json')
IGNORE_DIRS = {'node_modules', '.git', '__pycache__', 'dist', 'build', '.venv'}
OUTPUT_FILE = 'venueflow_context.txt'

def pack_project():
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as outfile:
        for root, dirs, files in os.walk('.'):
            # Prune ignored directories
            dirs[:] = [d for d in list(dirs) if d not in IGNORE_DIRS]
            
            for file in files:
                if file.endswith(TARGET_EXTENSIONS) and file != OUTPUT_FILE:
                    file_path = os.path.join(root, file)
                    relative_path = os.path.relpath(file_path, '.')
                    
                    outfile.write(f"\n{'='*50}\n")
                    outfile.write(f"FILE: {relative_path}\n")
                    outfile.write(f"{'='*50}\n\n")
                    
                    try:
                        with open(file_path, 'r', encoding='utf-8') as infile:
                            outfile.write(infile.read())
                    except Exception as e:
                        outfile.write(f"Error reading file: {e}")
                    outfile.write("\n")

    print(f"[OK] Project consolidated into {OUTPUT_FILE}")

if __name__ == "__main__":
    pack_project()