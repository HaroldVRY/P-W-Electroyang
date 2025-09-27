-- ===============================================
-- RESET INMEDIATO DE SENSORES - SUPABASE SQL EDITOR
-- Ejecutar directamente para solucionar el problema del reset
-- ===============================================

-- 1. ELIMINAR DATOS SIMULADOS (VALORES EXTREMOS)
-- ===============================================
DO $$
DECLARE
    deleted_telemetry INTEGER := 0;
    deleted_alerts INTEGER := 0;
    plant_uuid UUID;
BEGIN
    -- Obtener ID de la planta
    SELECT id INTO plant_uuid FROM public.plants LIMIT 1;
    
    -- Eliminar registros de telemetría con valores extremos (simulados)
    WITH deleted_rows AS (
        DELETE FROM public.telemetry 
        WHERE 
            co2_ppm >= 800 OR           -- CO2 extremo > 800 ppm
            nox_ppm >= 100 OR           -- NOx extremo > 100 ppm  
            pm25_ug_m3 >= 100 OR        -- PM2.5 extremo > 100 µg/m³
            so2_ppm >= 1.5 OR           -- SO2 extremo > 1.5 ppm
            no_ppm >= 0.15 OR           -- NO extremo > 0.15 ppm
            no2_ppm >= 0.25 OR          -- NO2 extremo > 0.25 ppm
            co_ppm >= 20 OR             -- CO extremo > 20 ppm
            pm10_ug_m3 >= 150 OR        -- PM10 extremo > 150 µg/m³
            o3_ppm >= 0.25 OR           -- O3 extremo > 0.25 ppm
            temp_c >= 50 OR             -- Temperatura extrema > 50°C
            humidity_pct >= 95          -- Humedad extrema > 95%
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_telemetry FROM deleted_rows;
    
    -- Eliminar alertas relacionadas con simulaciones
    WITH deleted_alerts_rows AS (
        DELETE FROM public.alerts 
        WHERE 
            kind LIKE '%CRITICAL%' OR
            kind LIKE '%WARNING%' OR 
            kind LIKE '%SIMULATION%' OR
            message LIKE '%crítico%' OR
            message LIKE '%elevado%' OR
            message LIKE '%simulación%'
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_alerts FROM deleted_alerts_rows;
    
    -- Crear alerta informativa sobre el reset
    INSERT INTO public.alerts (plant_id, kind, severity, message)
    VALUES (
        plant_uuid,
        'SYSTEM_RESET',
        'info',
        'Datos restablecidos: ' || deleted_telemetry || ' lecturas y ' || deleted_alerts || ' alertas eliminadas'
    );
    
    -- Mostrar resultado
    RAISE NOTICE '=== RESET COMPLETADO ===';
    RAISE NOTICE 'Registros de telemetría eliminados: %', deleted_telemetry;
    RAISE NOTICE 'Alertas eliminadas: %', deleted_alerts;
    RAISE NOTICE 'Sistema restablecido exitosamente';
    
END $$;

-- ===============================================
-- 2. VERIFICAR ESTADO POST-RESET
-- ===============================================

-- Mostrar valores máximos actuales (deberían ser normales ahora)
SELECT 
    '=== VALORES ACTUALES POST-RESET ===' as info,
    COUNT(*) as total_registros,
    MAX(co2_ppm) as max_co2_ppm,
    MAX(nox_ppm) as max_nox_ppm,
    MAX(pm25_ug_m3) as max_pm25_ugm3,
    MAX(so2_ppm) as max_so2_ppm,
    MAX(no_ppm) as max_no_ppm,
    MAX(no2_ppm) as max_no2_ppm,
    MAX(co_ppm) as max_co_ppm,
    MAX(pm10_ug_m3) as max_pm10_ugm3,
    MAX(o3_ppm) as max_o3_ppm,
    MAX(temp_c) as max_temp_c,
    MAX(humidity_pct) as max_humidity_pct
FROM public.telemetry 
WHERE ts >= NOW() - INTERVAL '24 hours';

-- Mostrar últimas lecturas por sensor
SELECT 
    '=== ÚLTIMAS LECTURAS POR SENSOR ===' as info,
    s.kind::text as sensor_tipo,
    COUNT(t.id) as registros_24h,
    MAX(t.ts) as ultima_lectura,
    ROUND(AVG(COALESCE(t.co2_ppm, 0))::numeric, 2) as promedio_co2,
    ROUND(AVG(COALESCE(t.so2_ppm, 0))::numeric, 3) as promedio_so2,
    ROUND(AVG(COALESCE(t.co_ppm, 0))::numeric, 2) as promedio_co
FROM public.sensors s
LEFT JOIN public.telemetry t ON s.id = t.sensor_id 
    AND t.ts >= NOW() - INTERVAL '24 hours'
WHERE s.is_active = true
GROUP BY s.kind::text, s.id
ORDER BY s.kind::text;

-- Contar alertas por severidad
SELECT 
    '=== ALERTAS ACTIVAS ===' as info,
    severity,
    COUNT(*) as cantidad
FROM public.alerts 
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY severity
ORDER BY 
    CASE severity 
        WHEN 'critical' THEN 1 
        WHEN 'warning' THEN 2 
        WHEN 'info' THEN 3 
        ELSE 4 
    END;

-- ===============================================
-- 3. OPCIONAL: GENERAR DATOS NORMALES FRESCOS
-- (Descomenta si necesitas datos de ejemplo)
-- ===============================================

/*
DO $$
DECLARE
    sensor_record RECORD;
    plant_uuid UUID;
BEGIN
    -- Obtener ID de la planta
    SELECT id INTO plant_uuid FROM public.plants LIMIT 1;
    
    -- Generar datos normales para cada sensor (última hora)
    FOR sensor_record IN (
        SELECT id, kind::text as sensor_kind 
        FROM public.sensors 
        WHERE is_active = true
    ) LOOP
        
        -- Insertar una lectura normal para cada sensor
        INSERT INTO public.telemetry (
            sensor_id, ts, co2_ppm, nox_ppm, pm25_ug_m3, temp_c, humidity_pct,
            so2_ppm, no_ppm, no2_ppm, co_ppm, pm10_ug_m3, o3_ppm
        ) VALUES (
            sensor_record.id,
            NOW(),
            -- Valores normales según el tipo de sensor
            CASE WHEN sensor_record.sensor_kind = 'CO2' THEN 300 + (RANDOM() * 100) ELSE NULL END, -- 300-400 ppm
            CASE WHEN sensor_record.sensor_kind = 'NOx' THEN 20 + (RANDOM() * 20) ELSE NULL END,   -- 20-40 ppm
            CASE WHEN sensor_record.sensor_kind = 'PM25' THEN 15 + (RANDOM() * 10) ELSE NULL END,  -- 15-25 µg/m³
            20 + (RANDOM() * 10),        -- Temp: 20-30°C
            40 + (RANDOM() * 30),        -- Humidity: 40-70%
            CASE WHEN sensor_record.sensor_kind = 'SO2' THEN 0.1 + (RANDOM() * 0.3) ELSE NULL END, -- 0.1-0.4 ppm
            CASE WHEN sensor_record.sensor_kind = 'NO' THEN 0.01 + (RANDOM() * 0.03) ELSE NULL END, -- 0.01-0.04 ppm
            CASE WHEN sensor_record.sensor_kind = 'NO2' THEN 0.02 + (RANDOM() * 0.05) ELSE NULL END, -- 0.02-0.07 ppm
            CASE WHEN sensor_record.sensor_kind = 'CO' THEN 1 + (RANDOM() * 3) ELSE NULL END,      -- 1-4 ppm
            CASE WHEN sensor_record.sensor_kind = 'PM10' THEN 25 + (RANDOM() * 20) ELSE NULL END,  -- 25-45 µg/m³
            CASE WHEN sensor_record.sensor_kind = 'O3' THEN 0.03 + (RANDOM() * 0.06) ELSE NULL END -- 0.03-0.09 ppm
        );
        
    END LOOP;
    
    RAISE NOTICE 'Datos normales generados para % sensores activos', 
        (SELECT COUNT(*) FROM public.sensors WHERE is_active = true);
        
END $$;
*/

SELECT 
    '✅ RESET COMPLETADO EXITOSAMENTE' as resultado,
    'Los valores de sensores han sido restablecidos a normalidad' as mensaje;