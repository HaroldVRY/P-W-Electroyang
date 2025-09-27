-- ===============================================
-- SCRIPT PARA VERIFICAR DATOS POST-SIMULACIÓN
-- Ejecutar después de correr gemelo_simulate
-- ===============================================

-- Verificar datos recientes en hydro_state
SELECT 
    'hydro_state' as tabla,
    COUNT(*) as total_registros,
    MAX(ts) as ultimo_registro,
    MIN(ts) as primer_registro
FROM public.hydro_state
UNION ALL
-- Verificar datos recientes en forecasts  
SELECT 
    'forecasts' as tabla,
    COUNT(*) as total_registros,
    MAX(ts) as ultimo_registro,
    MIN(ts) as primer_registro
FROM public.forecasts
UNION ALL
-- Verificar datos de telemetría
SELECT 
    'telemetry' as tabla,
    COUNT(*) as total_registros,
    MAX(ts) as ultimo_registro,
    MIN(ts) as primer_registro
FROM public.telemetry
UNION ALL
-- Verificar alertas
SELECT 
    'alerts' as tabla,
    COUNT(*) as total_registros,
    MAX(created_at) as ultimo_registro,
    MIN(created_at) as primer_registro
FROM public.alerts;

-- Ver últimos 5 registros de cada tabla importante
SELECT '=== ÚLTIMOS HYDRO_STATE ===' as info;
SELECT ts, inflow_m3s, outflow_m3s, reservoir_level_m, turbine_mw 
FROM public.hydro_state 
ORDER BY ts DESC 
LIMIT 5;

SELECT '=== ÚLTIMOS TELEMETRY ===' as info;
SELECT ts, co2_ppm, nox_ppm, pm25_ug_m3, temp_c, humidity_pct 
FROM public.telemetry 
ORDER BY ts DESC 
LIMIT 5;

SELECT '=== ÚLTIMAS ALERTAS ===' as info;
SELECT created_at, kind, severity, message 
FROM public.alerts 
ORDER BY created_at DESC 
LIMIT 5;