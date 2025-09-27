-- EnerTwin/EnerRed Complete Database Schema
-- Create all tables with proper constraints, indexes, RLS policies

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create app role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'operator', 'generator', 'consumer', 'kiosk');

-- Create sensor kind enum
CREATE TYPE public.sensor_kind AS ENUM ('CO2', 'NOx', 'PM25', 'TEMP', 'HUM');

-- Create alert severity enum  
CREATE TYPE public.alert_severity AS ENUM ('info', 'warning', 'critical');

-- Plants table (hydroelectric plants)
CREATE TABLE public.plants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location_text TEXT NOT NULL,
    lat NUMERIC(10, 8),
    lon NUMERIC(11, 8),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sensors table
CREATE TABLE public.sensors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id UUID NOT NULL REFERENCES public.plants(id) ON DELETE CASCADE,
    kind public.sensor_kind NOT NULL,
    unit TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Telemetry data table
CREATE TABLE public.telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sensor_id UUID NOT NULL REFERENCES public.sensors(id) ON DELETE CASCADE,
    ts TIMESTAMPTZ NOT NULL DEFAULT now(),
    co2_ppm NUMERIC(10, 2),
    nox_ppm NUMERIC(10, 2), 
    pm25_ug_m3 NUMERIC(10, 2),
    temp_c NUMERIC(5, 2),
    humidity_pct NUMERIC(5, 2),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Hydro state table (digital twin data)
CREATE TABLE public.hydro_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id UUID NOT NULL REFERENCES public.plants(id) ON DELETE CASCADE,
    ts TIMESTAMPTZ NOT NULL DEFAULT now(),
    inflow_m3s NUMERIC(10, 3),
    outflow_m3s NUMERIC(10, 3),
    reservoir_level_m NUMERIC(10, 2),
    gates_pct NUMERIC(5, 2),
    turbine_mw NUMERIC(10, 3),
    energy_mwh NUMERIC(12, 4),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Forecasts table
CREATE TABLE public.forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id UUID NOT NULL REFERENCES public.plants(id) ON DELETE CASCADE,
    ts TIMESTAMPTZ NOT NULL DEFAULT now(),
    horizon_h INTEGER NOT NULL,
    inflow_pred_m3s NUMERIC(10, 3),
    energy_pred_mwh NUMERIC(12, 4),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Alerts table
CREATE TABLE public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id UUID NOT NULL REFERENCES public.plants(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    kind TEXT NOT NULL,
    severity public.alert_severity NOT NULL,
    message TEXT NOT NULL,
    acknowledged_by UUID REFERENCES auth.users(id)
);

-- Profiles table (user information)
CREATE TABLE public.profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role DEFAULT 'consumer',
    display_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Generators table (community energy generators)
CREATE TABLE public.generators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    plant_id UUID REFERENCES public.plants(id),
    name TEXT NOT NULL,
    wp_w NUMERIC(10, 2),
    battery_wh NUMERIC(12, 2),
    controller_eff NUMERIC(4, 3) DEFAULT 0.95,
    battery_eff NUMERIC(4, 3) DEFAULT 0.9,
    reserve_ratio NUMERIC(4, 3) DEFAULT 0.2,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Excedentes table (energy surplus tracking)
CREATE TABLE public.excedentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    generator_id UUID NOT NULL REFERENCES public.generators(id) ON DELETE CASCADE,
    ts TIMESTAMPTZ NOT NULL DEFAULT now(),
    generation_wh NUMERIC(12, 2),
    consumption_wh NUMERIC(12, 2),
    excedente_wh NUMERIC(12, 2),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Wallets table (energy credits)
CREATE TABLE public.wallets (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    balance_credits NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Transactions table (credit transfers)
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_tx_id TEXT UNIQUE NOT NULL,
    ts TIMESTAMPTZ DEFAULT now(),
    from_user UUID REFERENCES auth.users(id),
    to_user UUID REFERENCES auth.users(id),
    credits NUMERIC(15, 2) NOT NULL,
    source TEXT,
    proof_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Kiosks table (redemption points)
CREATE TABLE public.kiosks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location_text TEXT NOT NULL,
    lat NUMERIC(10, 8),
    lon NUMERIC(11, 8),
    inventory_powerbanks INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Kiosk redemptions table
CREATE TABLE public.kiosk_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kiosk_id UUID NOT NULL REFERENCES public.kiosks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ts TIMESTAMPTZ DEFAULT now(),
    credits NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tips table (educational content)
CREATE TABLE public.tips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    audience TEXT,
    tag TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- FAQ table (multilingual support)
CREATE TABLE public.faq (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    q TEXT NOT NULL,
    a TEXT NOT NULL,
    lang TEXT DEFAULT 'es',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chatbot logs table
CREATE TABLE public.chatbot_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ts TIMESTAMPTZ DEFAULT now(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    used_context BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_sensors_plant_id ON public.sensors(plant_id);
CREATE INDEX idx_telemetry_sensor_ts ON public.telemetry(sensor_id, ts DESC);
CREATE INDEX idx_hydro_state_plant_ts ON public.hydro_state(plant_id, ts DESC);
CREATE INDEX idx_forecasts_plant_ts ON public.forecasts(plant_id, ts DESC);
CREATE INDEX idx_alerts_plant_created ON public.alerts(plant_id, created_at DESC);
CREATE INDEX idx_generators_owner ON public.generators(owner_user_id);
CREATE INDEX idx_excedentes_generator_ts ON public.excedentes(generator_id, ts DESC);
CREATE INDEX idx_transactions_from_user ON public.transactions(from_user, ts DESC);
CREATE INDEX idx_transactions_to_user ON public.transactions(to_user, ts DESC);
CREATE INDEX idx_kiosk_redemptions_user ON public.kiosk_redemptions(user_id, ts DESC);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_plants_updated_at BEFORE UPDATE ON public.plants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sensors_updated_at BEFORE UPDATE ON public.sensors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON public.alerts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_generators_updated_at BEFORE UPDATE ON public.generators FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_kiosks_updated_at BEFORE UPDATE ON public.kiosks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tips_updated_at BEFORE UPDATE ON public.tips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_faq_updated_at BEFORE UPDATE ON public.faq FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security on all tables
ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hydro_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.excedentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kiosks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kiosk_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_logs ENABLE ROW LEVEL SECURITY;

-- Create function to check user roles (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is admin or operator
CREATE OR REPLACE FUNCTION public.is_admin_or_operator(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND role IN ('admin', 'operator')
  )
$$;

-- RLS Policies

-- Profiles: users can read all, but only update their own
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can do everything on profiles" ON public.profiles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Plants: readable by operators/admins, full access for admins
CREATE POLICY "Operators and admins can view plants" ON public.plants FOR SELECT USING (public.is_admin_or_operator(auth.uid()));
CREATE POLICY "Admins can manage plants" ON public.plants FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Sensors: same as plants
CREATE POLICY "Operators and admins can view sensors" ON public.sensors FOR SELECT USING (public.is_admin_or_operator(auth.uid()));
CREATE POLICY "Admins can manage sensors" ON public.sensors FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Telemetry: readable by operators/admins, insertable by edge functions
CREATE POLICY "Operators and admins can view telemetry" ON public.telemetry FOR SELECT USING (public.is_admin_or_operator(auth.uid()));
CREATE POLICY "System can insert telemetry" ON public.telemetry FOR INSERT WITH CHECK (true); -- Edge functions will handle this

-- Hydro state: readable by operators/admins, insertable by system
CREATE POLICY "Operators and admins can view hydro state" ON public.hydro_state FOR SELECT USING (public.is_admin_or_operator(auth.uid()));
CREATE POLICY "System can insert hydro state" ON public.hydro_state FOR INSERT WITH CHECK (true);

-- Forecasts: readable by operators/admins, insertable by system
CREATE POLICY "Operators and admins can view forecasts" ON public.forecasts FOR SELECT USING (public.is_admin_or_operator(auth.uid()));
CREATE POLICY "System can insert forecasts" ON public.forecasts FOR INSERT WITH CHECK (true);

-- Alerts: readable by operators/admins, insertable by system
CREATE POLICY "Operators and admins can view alerts" ON public.alerts FOR SELECT USING (public.is_admin_or_operator(auth.uid()));
CREATE POLICY "Operators and admins can update alerts" ON public.alerts FOR UPDATE USING (public.is_admin_or_operator(auth.uid()));
CREATE POLICY "System can insert alerts" ON public.alerts FOR INSERT WITH CHECK (true);

-- Generators: owners and admins can manage their own
CREATE POLICY "Users can view own generators" ON public.generators FOR SELECT USING (auth.uid() = owner_user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can manage own generators" ON public.generators FOR ALL USING (auth.uid() = owner_user_id OR public.has_role(auth.uid(), 'admin'));

-- Excedentes: owners and admins can view
CREATE POLICY "Users can view own excedentes" ON public.excedentes FOR SELECT USING (
  auth.uid() IN (
    SELECT owner_user_id FROM public.generators WHERE id = generator_id
  ) OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "System can insert excedentes" ON public.excedentes FOR INSERT WITH CHECK (true);

-- Wallets: users can view own wallet, admins can view all
CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own wallet" ON public.wallets FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own wallet" ON public.wallets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Transactions: users can view own transactions, admins can view all
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (
  auth.uid() IN (from_user, to_user) OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "System can insert transactions" ON public.transactions FOR INSERT WITH CHECK (true);

-- Kiosks: readable by all, manageable by admins
CREATE POLICY "Everyone can view kiosks" ON public.kiosks FOR SELECT USING (true);
CREATE POLICY "Admins can manage kiosks" ON public.kiosks FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Kiosk redemptions: users can view own, admins can view all
CREATE POLICY "Users can view own redemptions" ON public.kiosk_redemptions FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert redemptions" ON public.kiosk_redemptions FOR INSERT WITH CHECK (true);

-- Tips: readable by all, manageable by admins
CREATE POLICY "Everyone can view tips" ON public.tips FOR SELECT USING (true);
CREATE POLICY "Admins can manage tips" ON public.tips FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- FAQ: readable by all, manageable by admins
CREATE POLICY "Everyone can view faq" ON public.faq FOR SELECT USING (true);
CREATE POLICY "Admins can manage faq" ON public.faq FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Chatbot logs: users can view own logs, admins can view all
CREATE POLICY "Users can view own chatbot logs" ON public.chatbot_logs FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert chatbot logs" ON public.chatbot_logs FOR INSERT WITH CHECK (true);

-- Insert initial data
INSERT INTO public.plants (name, location_text, lat, lon) VALUES 
('Hidroeléctrica San Martín', 'San Martín de Pangoa, Junín, Perú', -11.3869, -74.8817);

INSERT INTO public.sensors (plant_id, kind, unit) 
SELECT 
    p.id,
    unnest(ARRAY['CO2'::public.sensor_kind, 'NOx'::public.sensor_kind, 'PM25'::public.sensor_kind, 'TEMP'::public.sensor_kind, 'HUM'::public.sensor_kind]),
    unnest(ARRAY['ppm', 'ppm', 'µg/m³', '°C', '%'])
FROM public.plants p
LIMIT 1;

INSERT INTO public.kiosks (name, location_text, lat, lon, inventory_powerbanks) VALUES 
('Kiosco Comunal Pangoa', 'Plaza Principal, San Martín de Pangoa', -11.3869, -74.8817, 50),
('Kiosco Mercado Central', 'Mercado Central, San Martín de Pangoa', -11.3875, -74.8820, 30);

INSERT INTO public.tips (title, body, audience, tag) VALUES 
('Ahorro de Energía', 'Usa electrodomésticos eficientes para reducir tu consumo y generar más excedentes.', 'generator', 'efficiency'),
('Créditos Energéticos', 'Los créditos energéticos representan 100 Wh de energía limpia que puedes intercambiar.', 'consumer', 'credits'),
('Mantenimiento Solar', 'Limpia tus paneles solares regularmente para mantener máxima eficiencia.', 'generator', 'maintenance');

INSERT INTO public.faq (q, a, lang) VALUES 
('¿Qué son los créditos energéticos?', 'Los créditos energéticos representan excedentes de energía limpia que puedes intercambiar con otros miembros de la comunidad. 1 crédito = 100 Wh de energía.', 'es'),
('¿Cómo funciona el gemelo digital?', 'Nuestro gemelo digital simula el comportamiento de la central hidroeléctrica en tiempo real, permitiendo optimizar la operación y predecir escenarios futuros.', 'es'),
('Imaynatataq kay créditos energéticos llamkachin?', 'Kay créditos energéticos nisqanqa energía limpia nisqapa pisiyasqanmi, chaytam huk runakuna kaqwan cambianakuwaq. 1 crédito = 100 Wh energía.', 'qu');

-- Create function to handle new user registration (create profile and wallet)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
    
    INSERT INTO public.wallets (user_id, balance_credits)
    VALUES (NEW.id, 0);
    
    RETURN NEW;
END;
$$;

-- Trigger to create profile and wallet for new users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();