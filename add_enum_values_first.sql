-- ===============================================
-- SCRIPT ALTERNATIVO PARA SENSORES ADICIONALES
-- Ejecutar este script SI el anterior da problemas con enum
-- ===============================================

-- PARTE 1: SOLO AGREGAR VALORES AL ENUM (ejecutar primero)
-- ===============================================

-- Verificar valores del enum actual
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'public.sensor_kind'::regtype ORDER BY enumsortorder;

-- Agregar nuevos valores uno por uno
DO $$
BEGIN
    -- SO2
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SO2' AND enumtypid = 'public.sensor_kind'::regtype) THEN
        ALTER TYPE public.sensor_kind ADD VALUE 'SO2';
        RAISE NOTICE 'Agregado SO2 al enum';
    END IF;
END $$;

DO $$
BEGIN
    -- NO
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'NO' AND enumtypid = 'public.sensor_kind'::regtype) THEN
        ALTER TYPE public.sensor_kind ADD VALUE 'NO';
        RAISE NOTICE 'Agregado NO al enum';
    END IF;
END $$;

DO $$
BEGIN
    -- NO2
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'NO2' AND enumtypid = 'public.sensor_kind'::regtype) THEN
        ALTER TYPE public.sensor_kind ADD VALUE 'NO2';
        RAISE NOTICE 'Agregado NO2 al enum';
    END IF;
END $$;

DO $$
BEGIN
    -- CO
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'CO' AND enumtypid = 'public.sensor_kind'::regtype) THEN
        ALTER TYPE public.sensor_kind ADD VALUE 'CO';
        RAISE NOTICE 'Agregado CO al enum';
    END IF;
END $$;

DO $$
BEGIN
    -- PM10
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PM10' AND enumtypid = 'public.sensor_kind'::regtype) THEN
        ALTER TYPE public.sensor_kind ADD VALUE 'PM10';
        RAISE NOTICE 'Agregado PM10 al enum';
    END IF;
END $$;

DO $$
BEGIN
    -- O3
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'O3' AND enumtypid = 'public.sensor_kind'::regtype) THEN
        ALTER TYPE public.sensor_kind ADD VALUE 'O3';
        RAISE NOTICE 'Agregado O3 al enum';
    END IF;
END $$;

-- Verificar que se agregaron correctamente
SELECT 'Valores del enum actualizados:' as info, enumlabel as valor 
FROM pg_enum WHERE enumtypid = 'public.sensor_kind'::regtype 
ORDER BY enumsortorder;