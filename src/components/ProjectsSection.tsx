
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const ProjectsSection = () => {
  const projects = [
    {
      title: "Apoyo a Delcrosa - Entrega Express",
      description: "Soporte especializado para cumplir con la entrega de 100 motores industriales en tiempo récord.",
      details: [
        "100 motores de alta tensión",
        "Entrega en menos de 15 días",
        "Trabajo coordinado 24/7",
        "Calidad certificada"
      ],
      client: "Delcrosa",
      year: "2023"
    },
    {
      title: "Soporte Itesa - Continuidad Operativa",
      description: "Mantenimiento de emergencia para garantizar la continuidad operativa durante paradas de planta programadas.",
      details: [
        "Reparación de 50+ motores",
        "Servicio de emergencia 24h",
        "Coordinación con paradas de planta",
        "Cero interrupciones adicionales"
      ],
      client: "Itesa",
      year: "2023"
    },
    {
      title: "Proyecto Minero - Alta Tensión",
      description: "Bobinado especializado de motores de alta tensión para operaciones mineras en condiciones extremas.",
      details: [
        "Motores de 15kV",
        "Resistencia a condiciones extremas",
        "Pruebas especializadas",
        "Garantía extendida"
      ],
      client: "Sector Minero",
      year: "2022"
    }
  ];

  const testimonials = [
    {
      quote: "ELECTROYANG ha demostrado ser un socio confiable cuando necesitamos expandir nuestra capacidad de producción. Su velocidad y calidad son excepcionales.",
      author: "Gerente de Operaciones",
      company: "Empresa del Sector Eléctrico",
      rating: 5
    },
    {
      quote: "La calidad del trabajo de ELECTROYANG nos permite mantener nuestros estándares sin comprometer los tiempos de entrega. Altamente recomendados.",
      author: "Jefe de Mantenimiento",
      company: "Industria Eléctrica",
      rating: 5
    }
  ];

  return (
    <section id="projects" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Proyectos Realizados</h2>
          <div className="w-24 h-1 bg-blue-600 mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Casos de éxito que demuestran nuestra capacidad para apoyar a las 
            principales empresas del sector eléctrico peruano.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {projects.map((project, index) => (
            <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    {project.client}
                  </span>
                  <span className="text-sm text-gray-500">{project.year}</span>
                </div>
                <CardTitle className="text-xl text-gray-900">{project.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 leading-relaxed">{project.description}</p>
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">Características del Proyecto:</h4>
                  <ul className="space-y-1">
                    {project.details.map((detail, idx) => (
                      <li key={idx} className="flex items-center space-x-3 text-sm">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                        <span className="text-gray-700">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Lo que dicen nuestros clientes
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="space-y-4">
                <div className="flex space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <div key={i} className="w-5 h-5 bg-yellow-400 rounded-full"></div>
                  ))}
                </div>
                <blockquote className="text-lg text-gray-700 italic leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>
                <div className="pt-4 border-t border-gray-200">
                  <p className="font-semibold text-gray-900">{testimonial.author}</p>
                  <p className="text-gray-600">{testimonial.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center bg-blue-900 rounded-lg p-8 text-white">
          <h3 className="text-2xl font-bold mb-4">¿Tu empresa tiene un proyecto desafiante?</h3>
          <p className="text-lg text-blue-100 mb-6">
            Conversemos sobre cómo podemos apoyarte a cumplir tus objetivos de producción 
            manteniendo los más altos estándares de calidad.
          </p>
          <button 
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-white text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Discutir tu Proyecto
          </button>
        </div>
      </div>
    </section>
  );
};
