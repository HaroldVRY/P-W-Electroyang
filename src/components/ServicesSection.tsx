
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const ServicesSection = () => {
  const services = [
    {
      title: "Bobinado de Motores de Alta Tensión",
      description: "Servicios especializados para motores industriales de alta tensión, cumpliendo con los más altos estándares de seguridad y eficiencia.",
      features: [
        "Motores de 1000V a 15000V",
        "Certificaciones industriales",
        "Pruebas de aislamiento",
        "Garantía de calidad"
      ]
    },
    {
      title: "Bobinado de Motores de Baja Tensión",
      description: "Reparación y bobinado de motores de baja tensión para aplicaciones industriales y comerciales.",
      features: [
        "Motores de 220V a 690V",
        "Reparación rápida",
        "Materiales de primera calidad",
        "Servicio express disponible"
      ]
    },
    {
      title: "Reparación y Mantenimiento de Bobinas",
      description: "Servicios integrales de mantenimiento preventivo y correctivo para maximizar la vida útil de sus equipos.",
      features: [
        "Diagnóstico especializado",
        "Mantenimiento preventivo",
        "Reparaciones de emergencia",
        "Asesoría técnica"
      ]
    },
    {
      title: "Servicios para Plantas Industriales",
      description: "Soluciones especializadas para plantas industriales, eléctricas y mineras con requerimientos específicos.",
      features: [
        "Atención in-situ",
        "Planes de mantenimiento",
        "Soporte 24/7",
        "Inventario de emergencia"
      ]
    }
  ];

  return (
    <section id="services" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Nuestros Servicios</h2>
          <div className="w-24 h-1 bg-blue-600 mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Servicios especializados de bobinado y reparación de motores eléctricos 
            para la industria peruana, con el respaldo de años de experiencia.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {services.map((service, index) => (
            <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-2xl text-blue-900">{service.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 leading-relaxed">{service.description}</p>
                <ul className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-blue-900 rounded-lg p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">¿Necesitas un servicio personalizado?</h3>
          <p className="text-lg text-blue-100 mb-6">
            Contáctanos para discutir tus requerimientos específicos. 
            Desarrollamos soluciones a medida para cada cliente.
          </p>
          <button 
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-white text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Solicitar Consulta Técnica
          </button>
        </div>
      </div>
    </section>
  );
};