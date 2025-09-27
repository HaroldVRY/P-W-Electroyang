-- ===============================================
-- SCRIPT PARA VERIFICAR Y CORREGIR DATOS DE SENSORES ADICIONALES
-- Ejecutar después de add_additional_sensors.sql para verificar todo
-- ===============================================

-- 1. MOSTRAR TODOS LOS SENSORES Y SUS TIPOS
-- ===============================================
SELECT 
    'SENSORES REGISTRADOS' as categoria,
    kind as tipo_sensor,
    unit as unidad,
    COUNT(*) as cantidad,
    is_active as activo
FROM public.sensors 
GROUP BY kind, unit, is_active
ORDER BY kind;

-- 2. VERIFICAR ÚLTIMAS LECTURAS POR TIPO DE SENSOR
-- ===============================================
WITH latest_readings AS (
    SELECT DISTINCT ON (s.kind)
        s.kind,
        s.unit,
        t.ts,
        CASE s.kind
            WHEN 'CO2' THEN t.co2_ppm::TEXT
            WHEN 'NOx' THEN t.nox_ppm::TEXT
            WHEN 'PM25' THEN t.pm25_ug_m3::TEXT
            WHEN 'SO2' THEN t.so2_ppm::TEXT
            WHEN 'NO' THEN t.no_ppm::TEXT
            WHEN 'NO2' THEN t.no2_ppm::TEXT
            WHEN 'CO' THEN t.co_ppm::TEXT
            WHEN 'PM10' THEN t.pm10_ug_m3::TEXT
            WHEN 'O3' THEN t.o3_ppm::TEXT
            WHEN 'TEMP' THEN t.temp_c::TEXT
            WHEN 'HUM' THEN t.humidity_pct::TEXT
        END as ultimo_valor
    FROM public.sensors s
    LEFT JOIN public.telemetry t ON s.id = t.sensor_id
    WHERE t.ts IS NOT NULL
    ORDER BY s.kind, t.ts DESC
)
SELECT 
    'ÚLTIMAS LECTURAS POR SENSOR' as categoria,
    kind as tipo,
    unit as unidad,
    ultimo_valor as valor,
    ts as timestamp
FROM latest_readings
ORDER BY kind;

-- 3. CONTAR REGISTROS DE TELEMETRÍA POR CAMPO
-- ===============================================
SELECT 
    'CONTEO DE DATOS TELEMETRÍA' as categoria,
    'CO2' as gas, COUNT(co2_ppm) as registros FROM public.telemetry WHERE co2_ppm IS NOT NULL
UNION ALL SELECT 'CONTEO DE DATOS TELEMETRÍA', 'NOx', COUNT(nox_ppm) FROM public.telemetry WHERE nox_ppm IS NOT NULL
UNION ALL SELECT 'CONTEO DE DATOS TELEMETRÍA', 'PM2.5', COUNT(pm25_ug_m3) FROM public.telemetry WHERE pm25_ug_m3 IS NOT NULL
UNION ALL SELECT 'CONTEO DE DATOS TELEMETRÍA', 'SO2', COUNT(so2_ppm) FROM public.telemetry WHERE so2_ppm IS NOT NULL
UNION ALL SELECT 'CONTEO DE DATOS TELEMETRÍA', 'NO', COUNT(no_ppm) FROM public.telemetry WHERE no_ppm IS NOT NULL
UNION ALL SELECT 'CONTEO DE DATOS TELEMETRÍA', 'NO2', COUNT(no2_ppm) FROM public.telemetry WHERE no2_ppm IS NOT NULL
UNION ALL SELECT 'CONTEO DE DATOS TELEMETRÍA', 'CO', COUNT(co_ppm) FROM public.telemetry WHERE co_ppm IS NOT NULL
UNION ALL SELECT 'CONTEO DE DATOS TELEMETRÍA', 'PM10', COUNT(pm10_ug_m3) FROM public.telemetry WHERE pm10_ug_m3 IS NOT NULL
UNION ALL SELECT 'CONTEO DE DATOS TELEMETRÍA', 'O3', COUNT(o3_ppm) FROM public.telemetry WHERE o3_ppm IS NOT NULL
UNION ALL SELECT 'CONTEO DE DATOS TELEMETRÍA', 'TEMP', COUNT(temp_c) FROM public.telemetry WHERE temp_c IS NOT NULL
UNION ALL SELECT 'CONTEO DE DATOS TELEMETRÍA', 'HUM', COUNT(humidity_pct) FROM public.telemetry WHERE humidity_pct IS NOT NULL
ORDER BY gas;

-- 4. SIMULAR DATOS ADICIONALES PARA TESTING (OPCIONAL)
-- ===============================================
-- Descomentar las siguientes líneas si necesitas más datos de prueba

/*
DO $$
DECLARE
    sensor_rec RECORD;
    base_timestamp TIMESTAMPTZ;
BEGIN
    base_timestamp := NOW() - INTERVAL '12 hours';
    
    -- Generar datos adicionales para cada sensor en las últimas 12 horas
    FOR sensor_rec IN (SELECT id, kind FROM public.sensors WHERE kind IN ('SO2', 'NO', 'NO2', 'CO', 'PM10', 'O3')) LOOP
        
        -- Generar 12 registros (uno por hora)
        FOR i IN 0..11 LOOP
            CASE sensor_rec.kind
                WHEN 'SO2' THEN
                    INSERT INTO public.telemetry (sensor_id, ts, so2_ppm) 
                    VALUES (sensor_rec.id, base_timestamp + (i * INTERVAL '1 hour'), 
                            0.1 + (RANDOM() * 0.8));
                            
                WHEN 'NO' THEN
                    INSERT INTO public.telemetry (sensor_id, ts, no_ppm) 
                    VALUES (sensor_rec.id, base_timestamp + (i * INTERVAL '1 hour'), 
                            0.01 + (RANDOM() * 0.09));
                            
                WHEN 'NO2' THEN
                    INSERT INTO public.telemetry (sensor_id, ts, no2_ppm) 
                    VALUES (sensor_rec.id, base_timestamp + (i * INTERVAL '1 hour'), 
                            0.02 + (RANDOM() * 0.13));
                            
                WHEN 'CO' THEN
                    INSERT INTO public.telemetry (sensor_id, ts, co_ppm) 
                    VALUES (sensor_rec.id, base_timestamp + (i * INTERVAL '1 hour'), 
                            1.0 + (RANDOM() * 8.0));
                            
                WHEN 'PM10' THEN
                    INSERT INTO public.telemetry (sensor_id, ts, pm10_ug_m3) 
                    VALUES (sensor_rec.id, base_timestamp + (i * INTERVAL '1 hour'), 
                            20 + (RANDOM() * 80));
                            
                WHEN 'O3' THEN
                    INSERT INTO public.telemetry (sensor_id, ts, o3_ppm) 
                    VALUES (sensor_rec.id, base_timestamp + (i * INTERVAL '1 hour'), 
                            0.03 + (RANDOM() * 0.17));
            END CASE;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Datos adicionales de prueba generados';
END $$;
*/

-- 5. VERIFICAR CONFIGURACIÓN COMPLETA
-- ===============================================
SELECT 
    'RESUMEN FINAL' as info,
    (SELECT COUNT(*) FROM public.sensors) as total_sensores,
    (SELECT COUNT(DISTINCT kind) FROM public.sensors) as tipos_diferentes,
    (SELECT COUNT(*) FROM public.telemetry) as registros_telemetria,
    (SELECT COUNT(*) FROM public.alerts WHERE kind LIKE '%SO2%' OR kind LIKE '%NO%' OR kind LIKE '%CO%' OR kind LIKE '%PM10%' OR kind LIKE '%O3%') as alertas_gases_adicionales;