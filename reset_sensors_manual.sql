-- ===============================================
-- SCRIPT DE RESET MANUAL - SENSORES
-- Para restablecer valores a normalidad
-- ===============================================

-- OPCIÓN 1: ELIMINAR SOLO DATOS SIMULADOS (RECOMENDADO)
-- ===============================================

-- 1. Eliminar registros de telemetría con valores extremos (simulados)
DELETE FROM public.telemetry 
WHERE 
    co2_ppm >= 800 OR           -- Valores extremos CO2 > 800 ppm
    nox_ppm >= 100 OR           -- Valores extremos NOx > 100 ppm  
    pm25_ug_m3 >= 100 OR        -- Valores extremos PM2.5 > 100 µg/m³
    so2_ppm >= 1.5 OR           -- Valores extremos SO2 > 1.5 ppm
    no_ppm >= 0.15 OR           -- Valores extremos NO > 0.15 ppm
    no2_ppm >= 0.25 OR          -- Valores extremos NO2 > 0.25 ppm
    co_ppm >= 20 OR             -- Valores extremos CO > 20 ppm
    pm10_ug_m3 >= 150 OR        -- Valores extremos PM10 > 150 µg/m³
    o3_ppm >= 0.25 OR           -- Valores extremos O3 > 0.25 ppm
    temp_c >= 50 OR             -- Temperaturas extremas > 50°C
    humidity_pct >= 95;         -- Humedad extrema > 95%

-- 2. Eliminar alertas relacionadas con simulaciones
DELETE FROM public.alerts 
WHERE 
    kind LIKE '%CRITICAL%' OR
    kind LIKE '%WARNING%' OR 
    kind LIKE '%SIMULATION%' OR
    message LIKE '%crítico%' OR
    message LIKE '%elevado%' OR
    message LIKE '%simulación%';

-- 3. Crear alerta de sistema sobre el reset
INSERT INTO public.alerts (plant_id, kind, severity, message)
SELECT 
    id as plant_id,
    'SYSTEM_RESET' as kind,
    'info' as severity,
    'Sistema restablecido manualmente: datos simulados eliminados' as message
FROM public.plants 
LIMIT 1;

-- ===============================================
-- OPCIÓN 2: RESET COMPLETO (MÁS AGRESIVO)
-- Eliminar TODOS los datos de las últimas 24 horas
-- ⚠️ USAR CON PRECAUCIÓN ⚠️
-- ===============================================

/*
-- Descomentar si necesitas reset completo:

-- Eliminar toda la telemetría de las últimas 24 horas
DELETE FROM public.telemetry 
WHERE ts >= NOW() - INTERVAL '24 hours';

-- Eliminar todas las alertas recientes
DELETE FROM public.alerts 
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- Crear alerta de sistema sobre el reset completo
INSERT INTO public.alerts (plant_id, kind, severity, message)
SELECT 
    id as plant_id,
    'SYSTEM_RESET_COMPLETE' as kind,
    'warning' as severity,
    'Reset completo: todos los datos de 24h eliminados' as message
FROM public.plants 
LIMIT 1;
*/

-- ===============================================
-- VERIFICACIÓN POST-RESET
-- ===============================================

-- Verificar qué datos quedan después del reset
SELECT 
    'Verificación post-reset' as info;

-- Contar registros de telemetría por sensor
SELECT 
    s.kind::text as sensor_tipo,
    COUNT(t.id) as registros_restantes,
    MAX(t.ts) as ultima_lectura
FROM public.sensors s
LEFT JOIN public.telemetry t ON s.id = t.sensor_id
WHERE s.is_active = true
GROUP BY s.kind::text
ORDER BY s.kind::text;

-- Contar alertas activas
SELECT 
    severity,
    COUNT(*) as cantidad_alertas
FROM public.alerts 
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY severity
ORDER BY severity;

-- Mostrar valores máximos actuales (deberían ser normales)
SELECT 
    'Valores máximos actuales' as info,
    MAX(co2_ppm) as max_co2,
    MAX(nox_ppm) as max_nox,
    MAX(pm25_ug_m3) as max_pm25,
    MAX(so2_ppm) as max_so2,
    MAX(no_ppm) as max_no,
    MAX(no2_ppm) as max_no2,
    MAX(co_ppm) as max_co,
    MAX(pm10_ug_m3) as max_pm10,
    MAX(o3_ppm) as max_o3,
    MAX(temp_c) as max_temp,
    MAX(humidity_pct) as max_humidity
FROM public.telemetry 
WHERE ts >= NOW() - INTERVAL '1 hour';

-- ===============================================
-- REGENERAR DATOS NORMALES (OPCIONAL)
-- Si necesitas datos de ejemplo después del reset
-- ===============================================

/*
-- Descomentar para generar datos normales:

DO $$
DECLARE
    sensor_record RECORD;
    hour_offset INTEGER;
    base_timestamp TIMESTAMPTZ;
BEGIN
    base_timestamp := NOW() - INTERVAL '2 hours';
    
    -- Generar 2 horas de datos normales para cada sensor
    FOR sensor_record IN (SELECT id, kind FROM public.sensors WHERE is_active = true) LOOP
        FOR hour_offset IN 0..1 LOOP
            INSERT INTO public.telemetry (sensor_id, ts, co2_ppm, nox_ppm, pm25_ug_m3, temp_c, humidity_pct,
                                        so2_ppm, no_ppm, no2_ppm, co_ppm, pm10_ug_m3, o3_ppm) 
            VALUES (
                sensor_record.id,
                base_timestamp + (hour_offset * INTERVAL '1 hour'),
                300 + (RANDOM() * 100),      -- CO2: 300-400 ppm (normal)
                20 + (RANDOM() * 20),        -- NOx: 20-40 ppm (normal)
                15 + (RANDOM() * 10),        -- PM2.5: 15-25 µg/m³ (normal)
                20 + (RANDOM() * 10),        -- Temp: 20-30°C (normal)
                40 + (RANDOM() * 30),        -- Humidity: 40-70% (normal)
                0.1 + (RANDOM() * 0.3),      -- SO2: 0.1-0.4 ppm (normal)
                0.01 + (RANDOM() * 0.03),    -- NO: 0.01-0.04 ppm (normal)
                0.02 + (RANDOM() * 0.05),    -- NO2: 0.02-0.07 ppm (normal)
                1 + (RANDOM() * 3),          -- CO: 1-4 ppm (normal)
                25 + (RANDOM() * 20),        -- PM10: 25-45 µg/m³ (normal)
                0.03 + (RANDOM() * 0.06)     -- O3: 0.03-0.09 ppm (normal)
            );
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Datos normales generados para % sensores', (SELECT COUNT(*) FROM public.sensors WHERE is_active = true);
END $$;
*/

SELECT 'Reset completado exitosamente' as resultado;