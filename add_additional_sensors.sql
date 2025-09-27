-- ===============================================
-- SCRIPT PARA AGREGAR SENSORES ADICIONALES DE GASES
-- Ejecutar después del script principal fix_database.sql
-- ===============================================

-- 1. EXPANDIR ENUM DE TIPOS DE SENSORES
-- ===============================================
-- Agregar nuevos tipos de sensores al enum existente
-- Nota: Cada ADD VALUE debe estar en su propia transacción
ALTER TYPE public.sensor_kind ADD VALUE IF NOT EXISTS 'SO2';
COMMIT;

ALTER TYPE public.sensor_kind ADD VALUE IF NOT EXISTS 'NO';
COMMIT;

ALTER TYPE public.sensor_kind ADD VALUE IF NOT EXISTS 'NO2';
COMMIT;

ALTER TYPE public.sensor_kind ADD VALUE IF NOT EXISTS 'CO';
COMMIT;

ALTER TYPE public.sensor_kind ADD VALUE IF NOT EXISTS 'PM10';
COMMIT;

ALTER TYPE public.sensor_kind ADD VALUE IF NOT EXISTS 'O3';
COMMIT;

-- 2. AGREGAR COLUMNAS PARA NUEVOS GASES EN TELEMETRY
-- ===============================================
-- Agregar columnas si no existen
ALTER TABLE public.telemetry 
ADD COLUMN IF NOT EXISTS so2_ppm NUMERIC(10, 3),
ADD COLUMN IF NOT EXISTS no_ppm NUMERIC(10, 3),
ADD COLUMN IF NOT EXISTS no2_ppm NUMERIC(10, 3),
ADD COLUMN IF NOT EXISTS co_ppm NUMERIC(10, 3),
ADD COLUMN IF NOT EXISTS pm10_ug_m3 NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS o3_ppm NUMERIC(10, 3);

-- 3. INSERTAR SENSORES ADICIONALES
-- ===============================================
DO $$
DECLARE
    plant_uuid UUID := '0a6c5cbe-d0e0-4e7a-ae97-1080986ee9d9';
    existing_sensors INTEGER;
BEGIN
    -- Verificar cuántos sensores adicionales ya existen
    SELECT COUNT(*) INTO existing_sensors 
    FROM public.sensors 
    WHERE kind IN ('SO2', 'NO', 'NO2', 'CO', 'PM10', 'O3');
    
    IF existing_sensors = 0 THEN
        -- Insertar sensores adicionales de gases
        INSERT INTO public.sensors (plant_id, kind, unit, is_active) VALUES 
        (plant_uuid, 'SO2', 'ppm', true),
        (plant_uuid, 'NO', 'ppm', true), 
        (plant_uuid, 'NO2', 'ppm', true),
        (plant_uuid, 'CO', 'ppm', true),
        (plant_uuid, 'PM10', 'µg/m³', true),
        (plant_uuid, 'O3', 'ppm', true);
        
        RAISE NOTICE 'Sensores adicionales insertados: SO2, NO, NO2, CO, PM10, O3';
    ELSE
        RAISE NOTICE 'Ya existen % sensores adicionales', existing_sensors;
    END IF;
END $$;

-- 4. GENERAR DATOS HISTÓRICOS PARA NUEVOS SENSORES (24H)
-- ===============================================
DO $$
DECLARE
    sensor_so2 UUID;
    sensor_no UUID;
    sensor_no2 UUID;
    sensor_co UUID;
    sensor_pm10 UUID;
    sensor_o3 UUID;
    hour_offset INTEGER;
    base_timestamp TIMESTAMPTZ;
    existing_records INTEGER;
BEGIN
    -- Verificar si ya hay datos para estos sensores
    SELECT COUNT(*) INTO existing_records
    FROM public.telemetry 
    WHERE so2_ppm IS NOT NULL OR no_ppm IS NOT NULL OR no2_ppm IS NOT NULL 
       OR co_ppm IS NOT NULL OR pm10_ug_m3 IS NOT NULL OR o3_ppm IS NOT NULL;
    
    IF existing_records = 0 THEN
        -- Obtener IDs de los nuevos sensores
        SELECT id INTO sensor_so2 FROM public.sensors WHERE kind = 'SO2' LIMIT 1;
        SELECT id INTO sensor_no FROM public.sensors WHERE kind = 'NO' LIMIT 1;
        SELECT id INTO sensor_no2 FROM public.sensors WHERE kind = 'NO2' LIMIT 1;
        SELECT id INTO sensor_co FROM public.sensors WHERE kind = 'CO' LIMIT 1;
        SELECT id INTO sensor_pm10 FROM public.sensors WHERE kind = 'PM10' LIMIT 1;
        SELECT id INTO sensor_o3 FROM public.sensors WHERE kind = 'O3' LIMIT 1;
        
        base_timestamp := NOW() - INTERVAL '24 hours';
        
        -- Generar datos realistas para las últimas 24 horas
        FOR hour_offset IN 0..23 LOOP
            -- Insertar lecturas para cada sensor con valores realistas
            
            -- SO2 (Dióxido de azufre): 0.1-0.5 ppm (normal), hasta 1.0 ppm
            INSERT INTO public.telemetry (sensor_id, ts, so2_ppm) VALUES 
            (sensor_so2, base_timestamp + (hour_offset * INTERVAL '1 hour'), 
             0.05 + (RANDOM() * 0.4) + (CASE WHEN hour_offset % 8 = 0 THEN RANDOM() * 0.6 ELSE 0 END));
             
            -- NO (Óxido nítrico): 10-50 ppb convertido a ppm (0.01-0.05 ppm)
            INSERT INTO public.telemetry (sensor_id, ts, no_ppm) VALUES 
            (sensor_no, base_timestamp + (hour_offset * INTERVAL '1 hour'), 
             0.008 + (RANDOM() * 0.042) + (CASE WHEN hour_offset % 6 = 0 THEN RANDOM() * 0.03 ELSE 0 END));
             
            -- NO2 (Dióxido de nitrógeno): 20-80 ppb convertido a ppm (0.02-0.08 ppm)
            INSERT INTO public.telemetry (sensor_id, ts, no2_ppm) VALUES 
            (sensor_no2, base_timestamp + (hour_offset * INTERVAL '1 hour'), 
             0.015 + (RANDOM() * 0.065) + (CASE WHEN hour_offset % 4 = 0 THEN RANDOM() * 0.04 ELSE 0 END));
             
            -- CO (Monóxido de carbono): 0.5-3 ppm (normal), hasta 8 ppm
            INSERT INTO public.telemetry (sensor_id, ts, co_ppm) VALUES 
            (sensor_co, base_timestamp + (hour_offset * INTERVAL '1 hour'), 
             0.3 + (RANDOM() * 2.5) + (CASE WHEN hour_offset % 12 = 0 THEN RANDOM() * 4 ELSE 0 END));
             
            -- PM10 (Partículas): 20-60 µg/m³ (normal), hasta 150 µg/m³
            INSERT INTO public.telemetry (sensor_id, ts, pm10_ug_m3) VALUES 
            (sensor_pm10, base_timestamp + (hour_offset * INTERVAL '1 hour'), 
             18 + (RANDOM() * 42) + (CASE WHEN hour_offset % 5 = 0 THEN RANDOM() * 80 ELSE 0 END));
             
            -- O3 (Ozono): 0.02-0.1 ppm (normal), hasta 0.2 ppm
            INSERT INTO public.telemetry (sensor_id, ts, o3_ppm) VALUES 
            (sensor_o3, base_timestamp + (hour_offset * INTERVAL '1 hour'), 
             0.015 + (RANDOM() * 0.085) + (CASE WHEN hour_offset % 3 = 0 THEN RANDOM() * 0.05 ELSE 0 END));
             
        END LOOP;
        
        RAISE NOTICE 'Datos históricos generados para 6 nuevos sensores de gases (24h)';
    ELSE
        RAISE NOTICE 'Ya existen % registros de telemetría para gases adicionales', existing_records;
    END IF;
END $$;

-- 5. ACTUALIZAR THRESHOLDS EN SENSORS_INGEST FUNCTION
-- ===============================================
-- Nota: Este comentario es para recordar actualizar la función Edge
-- Los thresholds sugeridos para alertas son:
/*
THRESHOLDS adicionales recomendados:
- SO2:  { warning: 0.5,   critical: 1.0 }    ppm
- NO:   { warning: 0.05,  critical: 0.1 }    ppm  
- NO2:  { warning: 0.08,  critical: 0.15 }   ppm
- CO:   { warning: 5.0,   critical: 15.0 }   ppm
- PM10: { warning: 50,    critical: 100 }    µg/m³
- O3:   { warning: 0.12,  critical: 0.2 }    ppm
*/

-- 6. CREAR ALERTAS DEMO PARA NUEVOS SENSORES
-- ===============================================
DO $$
DECLARE
    plant_uuid UUID := '0a6c5cbe-d0e0-4e7a-ae97-1080986ee9d9';
    existing_alerts INTEGER;
BEGIN
    -- Verificar alertas existentes de gases adicionales
    SELECT COUNT(*) INTO existing_alerts
    FROM public.alerts 
    WHERE kind LIKE '%SO2%' OR kind LIKE '%NO_%' OR kind LIKE '%CO%' 
       OR kind LIKE '%PM10%' OR kind LIKE '%O3%';
    
    IF existing_alerts = 0 THEN
        -- Insertar algunas alertas de ejemplo para mostrar el sistema
        INSERT INTO public.alerts (plant_id, kind, severity, message) VALUES 
        (plant_uuid, 'SO2_WARNING', 'warning', 'SO2 elevado: 0.65 ppm (límite: 0.5 ppm)'),
        (plant_uuid, 'CO_CRITICAL', 'critical', 'CO crítico: 8.2 ppm (límite: 5.0 ppm)'),
        (plant_uuid, 'PM10_WARNING', 'warning', 'PM10 elevado: 68 µg/m³ (límite: 50 µg/m³)'),
        (plant_uuid, 'O3_INFO', 'info', 'O3 dentro de rangos normales: 0.08 ppm');
        
        RAISE NOTICE 'Alertas demo creadas para nuevos sensores';
    ELSE
        RAISE NOTICE 'Ya existen % alertas para gases adicionales', existing_alerts;
    END IF;
END $$;

-- 7. VERIFICAR DATOS INSERTADOS
-- ===============================================
DO $$
DECLARE
    total_sensors INTEGER;
    total_new_sensors INTEGER;
    total_telemetry_new INTEGER;
    total_alerts_new INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_sensors FROM public.sensors;
    SELECT COUNT(*) INTO total_new_sensors FROM public.sensors WHERE kind IN ('SO2', 'NO', 'NO2', 'CO', 'PM10', 'O3');
    
    SELECT COUNT(*) INTO total_telemetry_new 
    FROM public.telemetry 
    WHERE so2_ppm IS NOT NULL OR no_ppm IS NOT NULL OR no2_ppm IS NOT NULL 
       OR co_ppm IS NOT NULL OR pm10_ug_m3 IS NOT NULL OR o3_ppm IS NOT NULL;
       
    SELECT COUNT(*) INTO total_alerts_new
    FROM public.alerts 
    WHERE kind LIKE '%SO2%' OR kind LIKE '%NO_%' OR kind LIKE '%CO%' 
       OR kind LIKE '%PM10%' OR kind LIKE '%O3%';
    
    RAISE NOTICE '=== RESUMEN SENSORES ADICIONALES ===';
    RAISE NOTICE 'Total sensores: %', total_sensors;
    RAISE NOTICE 'Sensores nuevos: % (SO2, NO, NO2, CO, PM10, O3)', total_new_sensors;
    RAISE NOTICE 'Registros telemetría nuevos: %', total_telemetry_new;
    RAISE NOTICE 'Alertas para gases adicionales: %', total_alerts_new;
    
    -- Mostrar tipos de sensores disponibles
    RAISE NOTICE '=== TIPOS DE SENSORES DISPONIBLES ===';
    FOR rec IN (SELECT kind, COUNT(*) as cantidad FROM public.sensors GROUP BY kind ORDER BY kind) LOOP
        RAISE NOTICE '% sensor(es) de tipo: %', rec.cantidad, rec.kind;
    END LOOP;
END $$;

-- 8. MOSTRAR ÚLTIMAS LECTURAS DE NUEVOS SENSORES
-- ===============================================
SELECT 
    'Últimas lecturas de sensores adicionales' as info,
    s.kind as sensor_tipo,
    t.ts as timestamp,
    COALESCE(t.so2_ppm::TEXT, '-') as SO2_ppm,
    COALESCE(t.no_ppm::TEXT, '-') as NO_ppm, 
    COALESCE(t.no2_ppm::TEXT, '-') as NO2_ppm,
    COALESCE(t.co_ppm::TEXT, '-') as CO_ppm,
    COALESCE(t.pm10_ug_m3::TEXT, '-') as PM10_ugm3,
    COALESCE(t.o3_ppm::TEXT, '-') as O3_ppm
FROM public.telemetry t
JOIN public.sensors s ON t.sensor_id = s.id
WHERE s.kind IN ('SO2', 'NO', 'NO2', 'CO', 'PM10', 'O3')
  AND (t.so2_ppm IS NOT NULL OR t.no_ppm IS NOT NULL OR t.no2_ppm IS NOT NULL 
       OR t.co_ppm IS NOT NULL OR t.pm10_ug_m3 IS NOT NULL OR t.o3_ppm IS NOT NULL)
ORDER BY t.ts DESC
LIMIT 12;