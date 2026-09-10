
import sys
import os
import time

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    print("Attempting to import gemini_service...")
    import services.gemini_service as gemini_service
    print("Import successful.")
    
    print("Calling gemini_service.chat('Find best gate')...")
    start = time.time()
    res = gemini_service.chat("Find best gate")
    end = time.time()
    print(f"Result: {res}")
    print(f"Time taken: {end - start:.2f}s")
    
except Exception as e:
    import traceback
    traceback.print_exc()
    print(f"Error: {e}")
