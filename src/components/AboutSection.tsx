import { Card, CardContent } from "@/components/ui/card";

export const AboutSection = () => {
  return (
    <section id="about" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Quiénes Somos</h2>
          <div className="w-24 h-1 bg-blue-600 mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            ELECTROYANG E.I.R.L. se ha consolidado como el socio estratégico de confianza 
            para las principales empresas del sector eléctrico en Perú.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900">
              Experiencia y Confianza Industrial
            </h3>
            
            <p className="text-lg text-gray-700 leading-relaxed">
              Durante años, ELECTROYANG E.I.R.L. ha ganado prestigio como proveedor externo 
              especializado para compañías reconocidas del sector eléctrico como 
              <span className="font-semibold text-blue-900"> Itesa y Delcrosa</span>.
            </p>
            
            <p className="text-lg text-gray-700 leading-relaxed">
              Estas empresas líderes recurren a nosotros cuando sus lotes de bobinado 
              exceden sus capacidades internas, confiando en nuestra capacidad para 
              mantener sus estándares de calidad y cumplir con sus plazos más exigentes.
            </p>

            <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-600">
              <p className="text-lg font-medium text-blue-900">
                "Ambas empresas destacan la calidad de nuestro trabajo y la velocidad 
                de producción como uno de los mejores terceros del rubro."
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <Card className="text-center p-6">
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold text-blue-600">15+</div>
                <p className="text-gray-700">Años de Experiencia</p>
              </CardContent>
            </Card>
            
            <Card className="text-center p-6">
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold text-blue-600">500+</div>
                <p className="text-gray-700">Motores Reparados</p>
              </CardContent>
            </Card>
            
            <Card className="text-center p-6">
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold text-blue-600">98%</div>
                <p className="text-gray-700">Satisfacción Cliente</p>
              </CardContent>
            </Card>
            
            <Card className="text-center p-6">
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold text-blue-600">24h</div>
                <p className="text-gray-700">Respuesta Técnica</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-16 bg-white p-8 rounded-lg shadow-lg">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Nuestro Compromiso
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-full"></div>
              </div>
              <h4 className="font-semibold text-lg mb-2">Equipo Técnico Especializado</h4>
              <p className="text-gray-600">Profesionales con amplia experiencia en bobinado industrial</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-full"></div>
              </div>
              <h4 className="font-semibold text-lg mb-2">Estándares de Calidad</h4>
              <p className="text-gray-600">Cumplimiento riguroso con las normativas del sector eléctrico</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-full"></div>
              </div>
              <h4 className="font-semibold text-lg mb-2">Soporte Continuo</h4>
              <p className="text-gray-600">Apoyo especializado para mantener la continuidad operativa</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
