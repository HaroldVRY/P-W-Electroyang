export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-blue-300">ELECTROYANG E.I.R.L.</h3>
            <p className="text-gray-400">
              Especialistas en bobinado de motores industriales. 
              Confianza y calidad para el sector eléctrico peruano.
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Servicios</h4>
            <ul className="space-y-2 text-gray-400">
              <li>Bobinado Alta Tensión</li>
              <li>Bobinado Baja Tensión</li>
              <li>Reparación de Bobinas</li>
              <li>Mantenimiento Industrial</li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Contacto</h4>
            <ul className="space-y-2 text-gray-400">
              <li>+51 1 234-5678</li>
              <li>contacto@electroyang.com.pe</li>
              <li>Av. Industrial 123, Lima</li>
              <li>Emergencias 24/7</li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Palabras Clave SEO</h4>
            <div className="flex flex-wrap gap-2">
              <span className="bg-blue-800 text-xs px-2 py-1 rounded">bobinado motores</span>
              <span className="bg-blue-800 text-xs px-2 py-1 rounded">alta tensión</span>
              <span className="bg-blue-800 text-xs px-2 py-1 rounded">tercerización</span>
              <span className="bg-blue-800 text-xs px-2 py-1 rounded">mantenimiento eléctrico</span>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © 2024 ELECTROYANG E.I.R.L. Todos los derechos reservados. 
            Bobinado de motores industriales - Servicio de bobinas alta tensión - 
            Tercerización de bobinado - Empresa de mantenimiento eléctrico Perú
          </p>
        </div>
      </div>
    </footer>
  );
};