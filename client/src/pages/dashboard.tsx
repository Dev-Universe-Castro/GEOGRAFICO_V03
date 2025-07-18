import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import MapHeader from "@/components/ui/map-header";
import MapContainer from "@/components/map/MapContainer";
import LayerControls from "@/components/map/LayerControls";
import MapLegend from "@/components/map/MapLegend";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedCrops, setSelectedCrops] = useState<number[]>([]);
  const [selectedState, setSelectedState] = useState<string>("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<number>(2023);
  const [selectedCompanies, setSelectedCompanies] = useState<number[]>([]);
  const [availableCrops, setAvailableCrops] = useState<string[]>([]);

  // Load available crops from summary file
  useEffect(() => {
    fetch('/data/summary.json')
      .then(response => response.json())
      .then(data => {
        setAvailableCrops(data.crops || []);
        // Auto-select first crop if available
        if (data.crops && data.crops.length > 0) {
          setSelectedCrops([0]);
        }
      })
      .catch(error => {
        console.error('Error loading crops:', error);
        toast({
          title: "Erro ao carregar culturas",
          description: "Falha ao carregar lista de culturas disponíveis",
          variant: "destructive",
        });
      });
  }, [toast]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-ferticore-green rounded-full flex items-center justify-center animate-pulse">
            <div className="w-10 h-10 bg-white rounded-full"></div>
          </div>
          <p className="text-gray-600">Carregando sistema...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MapHeader />
      
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <div className="w-80 bg-white shadow-lg border-r border-gray-200 overflow-y-auto">
          <LayerControls
            selectedCrops={selectedCrops}
            setSelectedCrops={setSelectedCrops}
            selectedState={selectedState}
            setSelectedState={setSelectedState}
            selectedRegion={selectedRegion}
            setSelectedRegion={setSelectedRegion}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            selectedCompanies={selectedCompanies}
            setSelectedCompanies={setSelectedCompanies}
            availableCrops={availableCrops}
          />
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <MapContainer
            selectedCrops={selectedCrops}
            selectedState={selectedState}
            selectedRegion={selectedRegion}
            selectedYear={selectedYear}
            selectedCompanies={selectedCompanies}
            availableCrops={availableCrops}
          />
          
          <MapLegend />
        </div>
      </div>
    </div>
  );
}
