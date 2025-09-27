-- ===============================================
-- SCRIPT PARA ARREGLAR BASE DE DATOS ENERTWIN
-- Ejecutar en Supabase SQL Editor
-- ===============================================

-- 1. POBLAR DATOS INICIALES SI NO EXISTEN
-- ===============================================

-- Verificar si ya existe la planta
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.plants LIMIT 1) THEN
        -- Insertar planta hidroeléctrica
        INSERT INTO public.plants (id, name, location_text, lat, lon) VALUES 
        ('0a6c5cbe-d0e0-4e7a-ae97-1080986ee9d9', 'Hidroeléctrica San Martín', 'San Martín de Pangoa, Junín, Perú', -11.3869, -74.8817);
        
        RAISE NOTICE 'Planta hidroeléctrica insertada';
    ELSE
        RAISE NOTICE 'Planta ya existe';
    END IF;
END $$;

-- 2. INSERTAR SENSORES SI NO EXISTEN
-- ===============================================
DO $$
DECLARE
    plant_uuid UUID := '0a6c5cbe-d0e0-4e7a-ae97-1080986ee9d9';
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.sensors LIMIT 1) THEN
        INSERT INTO public.sensors (plant_id, kind, unit, is_active) VALUES 
        (plant_uuid, 'CO2', 'ppm', true),
        (plant_uuid, 'NOx', 'ppm', true),
        (plant_uuid, 'PM25', 'µg/m³', true),
        (plant_uuid, 'TEMP', '°C', true),
        (plant_uuid, 'HUM', '%', true);
        
        RAISE NOTICE 'Sensores insertados';
    ELSE
        RAISE NOTICE 'Sensores ya existen';
    END IF;
END $$;

-- 3. INSERTAR DATOS DEMO DE TELEMETRÍA (ÚLTIMAS 24H)
-- ===============================================
DO $$
DECLARE
    sensor_co2 UUID;
    sensor_nox UUID;
    sensor_pm25 UUID;
    sensor_temp UUID;
    sensor_hum UUID;
    hour_offset INTEGER;
    base_timestamp TIMESTAMPTZ;
BEGIN
    -- Obtener IDs de sensores
    SELECT id INTO sensor_co2 FROM public.sensors WHERE kind = 'CO2' LIMIT 1;
    SELECT id INTO sensor_nox FROM public.sensors WHERE kind = 'NOx' LIMIT 1;
    SELECT id INTO sensor_pm25 FROM public.sensors WHERE kind = 'PM25' LIMIT 1;
    SELECT id INTO sensor_temp FROM public.sensors WHERE kind = 'TEMP' LIMIT 1;
    SELECT id INTO sensor_hum FROM public.sensors WHERE kind = 'HUM' LIMIT 1;
    
    -- Si no hay datos de telemetría, insertar datos demo
    IF NOT EXISTS (SELECT 1 FROM public.telemetry LIMIT 1) THEN
        base_timestamp := NOW() - INTERVAL '24 hours';
        
        -- Generar datos para las últimas 24 horas
        FOR hour_offset IN 0..23 LOOP
            INSERT INTO public.telemetry (sensor_id, ts, co2_ppm, nox_ppm, pm25_ug_m3, temp_c, humidity_pct) VALUES 
            -- CO2 sensor
            (sensor_co2, base_timestamp + (hour_offset * INTERVAL '1 hour'), 
             300 + (RANDOM() * 100), null, null, null, null),
            -- NOx sensor  
            (sensor_nox, base_timestamp + (hour_offset * INTERVAL '1 hour'), 
             null, 20 + (RANDOM() * 30), null, null, null),
            -- PM2.5 sensor
            (sensor_pm25, base_timestamp + (hour_offset * INTERVAL '1 hour'), 
             null, null, 15 + (RANDOM() * 25), null, null),
            -- Temperature sensor
            (sensor_temp, base_timestamp + (hour_offset * INTERVAL '1 hour'), 
             null, null, null, 22 + (RANDOM() * 8), null),
            -- Humidity sensor
            (sensor_hum, base_timestamp + (hour_offset * INTERVAL '1 hour'), 
             null, null, null, null, 60 + (RANDOM() * 30));
        END LOOP;
        
        RAISE NOTICE 'Datos de telemetría demo insertados (24h)';
    ELSE
        RAISE NOTICE 'Ya existen datos de telemetría';
    END IF;
END $$;

-- 4. INSERTAR DATOS DEMO DE HYDRO_STATE (ÚLTIMAS 48H)
-- ===============================================
DO $$
DECLARE
    plant_uuid UUID := '0a6c5cbe-d0e0-4e7a-ae97-1080986ee9d9';
    hour_offset INTEGER;
    base_timestamp TIMESTAMPTZ;
    inflow NUMERIC;
    outflow NUMERIC;
    level NUMERIC;
    turbine NUMERIC;
BEGIN
    -- Si no hay datos de hydro_state, insertar datos demo
    IF NOT EXISTS (SELECT 1 FROM public.hydro_state LIMIT 1) THEN
        base_timestamp := NOW() - INTERVAL '48 hours';
        
        -- Generar datos para las últimas 48 horas
        FOR hour_offset IN 0..47 LOOP
            -- Simular variación natural con patrones diarios
            inflow := 25.0 + (5.0 * SIN((hour_offset % 24) * PI() / 12)) + (RANDOM() * 4 - 2);
            outflow := inflow * 0.9;
            level := 120.0 + (RANDOM() * 2 - 1);
            turbine := LEAST(15.0, outflow * 0.4);
            
            INSERT INTO public.hydro_state (
                plant_id, ts, inflow_m3s, outflow_m3s, 
                reservoir_level_m, gates_pct, turbine_mw, energy_mwh
            ) VALUES (
                plant_uuid, 
                base_timestamp + (hour_offset * INTERVAL '1 hour'),
                inflow,
                outflow,
                level,
                (outflow / 30.0) * 100,
                turbine,
                turbine * 1.0
            );
        END LOOP;
        
        RAISE NOTICE 'Datos de hydro_state demo insertados (48h)';
    ELSE
        RAISE NOTICE 'Ya existen datos de hydro_state';
    END IF;
END $$;

-- 5. INSERTAR ALGUNOS PRONÓSTICOS DEMO
-- ===============================================
DO $$
DECLARE
    plant_uuid UUID := '0a6c5cbe-d0e0-4e7a-ae97-1080986ee9d9';
    forecast_hour INTEGER;
    base_timestamp TIMESTAMPTZ;
BEGIN
    -- Si no hay pronósticos, insertar algunos demo
    IF NOT EXISTS (SELECT 1 FROM public.forecasts LIMIT 1) THEN
        base_timestamp := NOW();
        
        -- Generar pronósticos para las próximas 168 horas (7 días)
        FOR forecast_hour IN 1..168 LOOP
            INSERT INTO public.forecasts (
                plant_id, ts, horizon_h, inflow_pred_m3s, energy_pred_mwh
            ) VALUES (
                plant_uuid,
                base_timestamp,
                forecast_hour,
                24.0 + (3.0 * SIN(forecast_hour * PI() / 12)) + (RANDOM() * 2 - 1),
                9.0 + (2.0 * SIN(forecast_hour * PI() / 12)) + (RANDOM() * 1 - 0.5)
            );
        END LOOP;
        
        RAISE NOTICE 'Pronósticos demo insertados (7 días)';
    ELSE
        RAISE NOTICE 'Ya existen pronósticos';
    END IF;
END $$;

-- 6. INSERTAR KIOSCOS DEMO
-- ===============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.kiosks LIMIT 1) THEN
        INSERT INTO public.kiosks (name, location_text, lat, lon, inventory_powerbanks) VALUES 
        ('Kiosco Comunal Pangoa', 'Plaza Principal, San Martín de Pangoa', -11.3869, -74.8817, 50),
        ('Kiosco Mercado Central', 'Mercado Central, San Martín de Pangoa', -11.3875, -74.8820, 30),
        ('Kiosco Escuela Rural', 'Escuela Primaria, San Martín de Pangoa', -11.3860, -74.8825, 20);
        
        RAISE NOTICE 'Kioscos demo insertados';
    ELSE
        RAISE NOTICE 'Kioscos ya existen';
    END IF;
END $$;

-- 7. VERIFICAR POLÍTICAS RLS PARA EDGE FUNCTIONS
-- ===============================================

-- Asegurar que las edge functions pueden insertar datos
DROP POLICY IF EXISTS "System can insert hydro state" ON public.hydro_state;
CREATE POLICY "System can insert hydro state" ON public.hydro_state FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert forecasts" ON public.forecasts;
CREATE POLICY "System can insert forecasts" ON public.forecasts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert telemetry" ON public.telemetry;
CREATE POLICY "System can insert telemetry" ON public.telemetry FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert alerts" ON public.alerts;
CREATE POLICY "System can insert alerts" ON public.alerts FOR INSERT WITH CHECK (true);

-- Permitir lectura de datos básicos para usuarios autenticados
DROP POLICY IF EXISTS "Authenticated users can view hydro state" ON public.hydro_state;
CREATE POLICY "Authenticated users can view hydro state" ON public.hydro_state FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Authenticated users can view forecasts" ON public.forecasts;
CREATE POLICY "Authenticated users can view forecasts" ON public.forecasts FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Authenticated users can view telemetry" ON public.telemetry;
CREATE POLICY "Authenticated users can view telemetry" ON public.telemetry FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Authenticated users can view sensors" ON public.sensors;
CREATE POLICY "Authenticated users can view sensors" ON public.sensors FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Authenticated users can view plants" ON public.plants;
CREATE POLICY "Authenticated users can view plants" ON public.plants FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- 8. MOSTRAR RESUMEN DE DATOS INSERTADOS
-- ===============================================
DO $$
BEGIN
    RAISE NOTICE '=== RESUMEN DE DATOS ===';
    RAISE NOTICE 'Plantas: % registros', (SELECT COUNT(*) FROM public.plants);
    RAISE NOTICE 'Sensores: % registros', (SELECT COUNT(*) FROM public.sensors);
    RAISE NOTICE 'Telemetría: % registros', (SELECT COUNT(*) FROM public.telemetry);
    RAISE NOTICE 'Estados hidro: % registros', (SELECT COUNT(*) FROM public.hydro_state);
    RAISE NOTICE 'Pronósticos: % registros', (SELECT COUNT(*) FROM public.forecasts);
    RAISE NOTICE 'Kioscos: % registros', (SELECT COUNT(*) FROM public.kiosks);
END $$;