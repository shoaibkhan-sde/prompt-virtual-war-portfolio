// Welcome to the intentionally broken demo app!
// This script simulates a real server crash and automatically sends the error to OutageIQ.

async function sendToOutageIQ(error, serviceName, errorType) {
    console.log(`\n🚨 [CRASH DETECTED] Sending error to OutageIQ...`);
    
    try {
        const response = await fetch('http://localhost:3000/api/v1/incidents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                serviceName: serviceName,
                errorType: errorType,
                stackTrace: error.stack
            })
        });

        if (response.ok) {
            console.log('✅ [SUCCESS] Error successfully reported to OutageIQ Dashboard!\n');
        } else {
            console.log('❌ [FAILED] Could not reach OutageIQ API.');
        }
    } catch (err) {
        console.log('❌ [FAILED] Is OutageIQ running on port 3000?');
    }
}

// --- SIMULATED OUTAGES ---

function triggerDatabaseCrash() {
    console.log('Starting payment-processor service...');
    setTimeout(() => {
        try {
            // Simulating a real code bug: calling a function that doesn't exist
            throw new Error('Connection pool exhausted. FATAL: too many clients already.');
        } catch (error) {
            sendToOutageIQ(error, 'payment-processor', 'DatabaseConnectionError');
        }
    }, 1000);
}

function triggerMemoryLeak() {
    console.log('Starting user-auth service...');
    setTimeout(() => {
        try {
            // Simulating a memory leak crash
            throw new Error('JavaScript heap out of memory. GC limit exceeded.');
        } catch (error) {
            sendToOutageIQ(error, 'user-auth', 'OutOfMemoryError');
        }
    }, 2000);
}

// Run the crashes!
triggerDatabaseCrash();
triggerMemoryLeak();
