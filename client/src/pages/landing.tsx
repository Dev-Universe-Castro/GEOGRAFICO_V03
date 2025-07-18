import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import fertiCoreLogo from "@assets/LOGO_1752835580345.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-ferticore-light to-ferticore-green flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl mx-auto bg-white shadow-2xl">
        <CardContent className="p-12 text-center">
          <div className="mb-8">
            <div className="w-32 h-32 mx-auto mb-6 flex items-center justify-center">
              <img 
                src={fertiCoreLogo} 
                alt="FertiCore Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <p className="text-xl text-gray-600 mb-2">Sistema de Análise Agrícola</p>
            <p className="text-gray-500">
              Visualize dados de produção agrícola brasileira com mapas interativos
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-ferticore-green/10 rounded-full flex items-center justify-center mb-2">
                  <svg className="w-6 h-6 text-ferticore-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <span>Mapas Interativos</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-ferticore-green/10 rounded-full flex items-center justify-center mb-2">
                  <svg className="w-6 h-6 text-ferticore-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span>Dados Municipais</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-ferticore-green/10 rounded-full flex items-center justify-center mb-2">
                  <svg className="w-6 h-6 text-ferticore-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </div>
                <span>Filtros Avançados</span>
              </div>
            </div>
            
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="bg-ferticore-green hover:bg-ferticore-dark text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              Entrar no Sistema
            </Button>
            
            <p className="text-sm text-gray-500">
              Acesse dados de produção agrícola de todo o Brasil
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
