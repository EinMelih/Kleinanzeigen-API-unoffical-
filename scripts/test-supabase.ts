/**
 * Supabase Connection Test
 * Run with: bun scripts/test-supabase.ts
 */
import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

async function testConnection() {
    console.log('🔗 Testing Supabase connection...\n');

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
        process.exit(1);
    }

    console.log(`📍 URL: ${SUPABASE_URL}`);
    console.log(`🔑 Key: ${SUPABASE_KEY.substring(0, 20)}...`);

    try {
        // Test 1: Check if tables exist
        console.log('\n📋 Checking tables...');

        const tablesResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/items?select=id&limit=1`,
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                },
            }
        );

        if (tablesResponse.status === 200) {
            console.log('✅ Table "items" exists!');
        } else if (tablesResponse.status === 404) {
            console.log('⚠️ Table "items" not found - run the SQL schema first!');
        } else {
            const error = await tablesResponse.text();
            console.log(`⚠️ Items table check: ${tablesResponse.status} - ${error}`);
        }

        // Test 2: Check config table
        const configResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/config?select=*`,
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                },
            }
        );

        if (configResponse.status === 200) {
            const config = await configResponse.json();
            console.log('✅ Table "config" exists!');
            if (config.length > 0) {
                console.log('📊 Config data:', JSON.stringify(config[0], null, 2));
            } else {
                console.log('⚠️ Config table is empty - run the SQL schema!');
            }
        } else if (configResponse.status === 404) {
            console.log('⚠️ Table "config" not found - run the SQL schema first!');
        } else {
            console.log(`⚠️ Config table check: ${configResponse.status}`);
        }

        // Test 3: Insert test item
        console.log('\n🧪 Testing insert...');

        const testItem = {
            platform_item_id: 'test-123',
            title: 'Test Artikel',
            status: 'NEW',
            confidence_score: 85,
            max_sniping_price: 100.00,
        };

        const insertResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/items`,
            {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation',
                },
                body: JSON.stringify(testItem),
            }
        );

        if (insertResponse.status === 201) {
            const inserted = await insertResponse.json();
            console.log('✅ Test item inserted!');
            console.log(`   ID: ${inserted[0]?.id}`);

            // Clean up - delete test item
            await fetch(
                `${SUPABASE_URL}/rest/v1/items?platform_item_id=eq.test-123`,
                {
                    method: 'DELETE',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                    },
                }
            );
            console.log('🗑️ Test item deleted (cleanup)');
        } else {
            const error = await insertResponse.text();
            console.log(`⚠️ Insert failed: ${insertResponse.status} - ${error}`);
        }

        console.log('\n✅ Supabase connection test complete!');

    } catch (error) {
        console.error('❌ Connection failed:', error);
    }
}

testConnection();
