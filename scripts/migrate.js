// scripts/migrate.js
// Ejecuta: node scripts/migrate.js

const fs = require("fs");
const path = require("path");
const https = require("https");

// Cargar variables de entorno desde .env.local manualmente
function loadEnv() {
    const envPath = path.join(__dirname, "..", ".env.local");
    if (!fs.existsSync(envPath)) {
        console.error("❌ No se encontró .env.local");
        process.exit(1);
    }
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
        const [key, ...rest] = line.split("=");
        if (key && rest.length) {
            process.env[key.trim()] = rest.join("=").trim();
        }
    }
}

async function runMigration() {
    loadEnv();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
        console.error("❌ Faltan variables NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
        process.exit(1);
    }

    // Leer el archivo SQL
    const sqlFile = path.join(__dirname, "..", "migrations", "artecom_schema.sql");
    if (!fs.existsSync(sqlFile)) {
        console.error("❌ No se encontró migrations/artecom_schema.sql");
        process.exit(1);
    }

    const sql = fs.readFileSync(sqlFile, "utf-8");

    // Dividir en statements individuales (separados por ;)
    const statements = sql
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith("--"));

    console.log(`\n🚀 Ejecutando migración en: ${supabaseUrl}`);
    console.log(`📋 Statements a ejecutar: ${statements.length}\n`);

    const projectRef = supabaseUrl.replace("https://", "").replace(".supabase.co", "");
    const apiUrl = `https://${projectRef}.supabase.co`;

    let ok = 0;
    let errors = 0;

    for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i].trim();
        if (!stmt) continue;

        // Mostrar las primeras palabras para contexto
        const preview = stmt.substring(0, 60).replace(/\n/g, " ");
        process.stdout.write(`[${i + 1}/${statements.length}] ${preview}... `);

        try {
            const response = await fetch(`${apiUrl}/rest/v1/rpc/exec_sql`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    apikey: serviceKey,
                    Authorization: `Bearer ${serviceKey}`,
                },
                body: JSON.stringify({ sql: stmt }),
            });

            // Si exec_sql no existe (función personalizada), usar el endpoint de query directo
            if (response.status === 404) {
                // Intentar con el endpoint de query via pg_query
                const qResponse = await fetch(`${apiUrl}/pg/query`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${serviceKey}`,
                        "x-client-info": "artecom-migrate/1.0",
                    },
                    body: JSON.stringify({ query: stmt }),
                });

                if (!qResponse.ok) {
                    const err = await qResponse.text();
                    console.log(`⚠️  ${err.substring(0, 80)}`);
                    errors++;
                } else {
                    console.log("✅");
                    ok++;
                }
            } else if (!response.ok) {
                const err = await response.json().catch(() => ({ message: "Error desconocido" }));
                console.log(`⚠️  ${(err.message || err.error || "Error").substring(0, 80)}`);
                errors++;
            } else {
                console.log("✅");
                ok++;
            }
        } catch (e) {
            console.log(`❌ ${e.message}`);
            errors++;
        }
    }

    console.log(`\n${"─".repeat(50)}`);
    console.log(`✅ Exitosos: ${ok}`);
    console.log(`⚠️  Con advertencias: ${errors}`);
    console.log(`${"─".repeat(50)}`);

    if (errors > 0) {
        console.log("\n💡 Tip: Algunos errores son normales si las tablas ya existen.");
        console.log("   Si ves muchos errores críticos, ejecuta el SQL en el Supabase Dashboard.");
    } else {
        console.log("\n🎉 ¡Migración completada exitosamente!");
    }
}

runMigration().catch((e) => {
    console.error("Error fatal:", e.message);
    process.exit(1);
});
