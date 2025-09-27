import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Local FAQ/rules fallback when no OpenAI
const localFAQ = [
  {
    keywords: ['créditos', 'creditos', 'credits'],
    answer: 'Los créditos energéticos representan excedentes de energía limpia. 1 crédito = 100 Wh de energía que puedes intercambiar con otros miembros de la comunidad.'
  },
  {
    keywords: ['gemelo', 'digital', 'simulación', 'twin'],
    answer: 'Nuestro gemelo digital simula el comportamiento de la central hidroeléctrica en tiempo real, permitiendo optimizar la operación y predecir escenarios futuros.'
  },
  {
    keywords: ['caudal', 'agua', 'flow', 'inflow'],
    answer: 'El caudal de entrada es el volumen de agua que llega al embalse por segundo. Es crucial para la generación de energía.'
  },
  {
    keywords: ['sequía', 'drought', 'lluvia', 'rain'],
    answer: 'Durante sequías, se recomienda activar fuentes de respaldo y reducir la exportación de energía para mantener reservas.'
  },
  {
    keywords: ['emisiones', 'co2', 'nox', 'pm25', 'pollution'],
    answer: 'Monitoreamos CO₂, NOx y PM2.5 para asegurar operación limpia. Los valores normales son: CO₂ < 400ppm, NOx < 50ppm, PM2.5 < 35µg/m³.'
  }
];

async function getContextFromGemelo() {
  try {
    // Get latest hydro state
    const { data: hydroState } = await supabase
      .from('hydro_state')
      .select('*')
      .order('ts', { ascending: false })
      .limit(1)
      .single();

    // Get latest forecast
    const { data: forecast } = await supabase
      .from('forecasts')
      .select('*')
      .order('ts', { ascending: false })
      .limit(1)
      .single();

    // Get recent alerts
    const { data: alerts } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);

    let context = '';
    
    if (hydroState) {
      context += `Estado actual del gemelo hidroeléctrico:
- Caudal de entrada: ${hydroState.inflow_m3s} m³/s
- Nivel del embalse: ${hydroState.reservoir_level_m} m
- Generación: ${hydroState.energy_mwh} MWh
- Turbinas: ${hydroState.turbine_mw} MW\n`;
    }

    if (forecast) {
      context += `Pronóstico: Se espera caudal de ${forecast.inflow_pred_m3s} m³/s y generación de ${forecast.energy_pred_mwh} MWh.\n`;
    }

    if (alerts && alerts.length > 0) {
      context += `Alertas recientes: ${alerts.map(a => a.message).join(', ')}\n`;
    }

    return context;
  } catch (error) {
    console.error('Error getting context:', error);
    return '';
  }
}

function findLocalAnswer(question: string): string | null {
  const lowerQ = question.toLowerCase();
  
  for (const faq of localFAQ) {
    if (faq.keywords.some(keyword => lowerQ.includes(keyword))) {
      return faq.answer;
    }
  }
  
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, userId } = await req.json();
    
    if (!question) {
      return new Response(JSON.stringify({ error: 'Question is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing question:', question);
    
    let answer = '';
    let usedContext = false;
    
    // Get context from digital twin
    const context = await getContextFromGemelo();
    
    if (openAIApiKey) {
      console.log('Using OpenAI for response');
      
      const systemPrompt = `Eres un asistente educativo especializado en energía hidroeléctrica y sostenibilidad para comunidades rurales en Perú. 
      
Responde en español de manera clara y educativa. Si tienes contexto del gemelo digital, úsalo en tu respuesta.

Contexto actual del sistema:
${context}

Principios clave:
- 1 crédito energético = 100 Wh de energía limpia
- Promover el intercambio comunitario de energía
- Educación sobre sostenibilidad y eficiencia energética
- Explicar términos técnicos de manera sencilla`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question }
          ],
          temperature: 0.7,
          max_tokens: 300,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        answer = data.choices[0].message.content;
        usedContext = context.length > 0;
      } else {
        console.error('OpenAI API error:', await response.text());
        throw new Error('OpenAI API failed');
      }
    } else {
      console.log('Using local FAQ system');
      
      // Try local FAQ first
      const localAnswer = findLocalAnswer(question);
      
      if (localAnswer) {
        answer = localAnswer;
        
        // Add context if available
        if (context) {
          answer += `\n\nEstado actual: ${context}`;
          usedContext = true;
        }
      } else {
        answer = 'Lo siento, no tengo información específica sobre esa pregunta. ¿Podrías reformularla o preguntar sobre créditos energéticos, el gemelo digital, o el monitoreo de emisiones?';
      }
    }

    // Log the interaction
    if (userId) {
      await supabase
        .from('chatbot_logs')
        .insert({
          user_id: userId,
          question,
          answer,
          used_context: usedContext
        });
    }

    console.log('Response generated, used_context:', usedContext);

    return new Response(JSON.stringify({ 
      answer,
      used_context: usedContext,
      context: context || null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chatbot function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      answer: 'Disculpa, ocurrió un error procesando tu pregunta. Por favor intenta de nuevo.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});