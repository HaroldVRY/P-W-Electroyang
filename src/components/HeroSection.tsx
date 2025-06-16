import { Button } from "@/components/ui/button";


export const HeroSection = () => {
  const scrollToContact = () => {
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="pt-16 min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-white space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Servicios de Bobinado
              <span className="text-blue-300"> Industrial</span>
            </h1>
            
            <div className="text-xl md:text-2xl text-blue-100 space-y-4">
              <p className="font-semibold">
                ¿Tu empresa necesita cumplir con pedidos urgentes de bobinado?
              </p>
              <p className="text-lg">
                Descubre cómo podemos ayudarte con nuestros servicios especializados.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <p className="text-lg italic">"Confianza de los líderes del sector eléctrico"</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <p className="text-lg italic">"Calidad superior. Producción rápida. Compromiso industrial."</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                onClick={scrollToContact}
              >
                Solicitar Cotización
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-blue-900 px-8 py-3"
                onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Ver Servicios
              </Button>
            </div>
          </div>

          <div className="relative space-y-6">
            {/* Imagen principal del taller de trabajo */}
            <div className="relative bg-gradient-to-r from-gray-800 to-gray-600 rounded-lg p-4 shadow-2xl">
              <img 
                src="taller.png" 
                alt="Taller de bobinado ELECTROYANG - Instalaciones modernas para motores industriales"
                className="w-full h-64 object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-blue-900/20 rounded-lg"></div>
              <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
                Taller especializado ELECTROYANG E.I.R.L.
              </div>
            </div>

            {/* Imagen del equipo de trabajo */}
            <div className="relative bg-gradient-to-r from-gray-700 to-gray-500 rounded-lg p-4 shadow-xl">
              <img 
                src="equipo.jpg" 
                alt="Equipo técnico ELECTROYANG - Personal especializado con EPP completo"
                className="w-full h-48 object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-blue-900/20 rounded-lg"></div>
              <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
                Equipo técnico certificado con EPP
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-300 rounded-full opacity-20"></div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-blue-400 rounded-full opacity-30"></div>
          </div>
        </div>
      </div>
    </section>
  );
};
