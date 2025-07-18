import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

interface LayerControlsProps {
  selectedCrops: number[];
  setSelectedCrops: (crops: number[]) => void;
  selectedState: string;
  setSelectedState: (state: string) => void;
  selectedRegion: string;
  setSelectedRegion: (region: string) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  selectedCompanies: number[];
  setSelectedCompanies: (companies: number[]) => void;
  availableCrops: string[];
}

export default function LayerControls({
  selectedCrops,
  setSelectedCrops,
  selectedState,
  setSelectedState,
  selectedRegion,
  setSelectedRegion,
  selectedYear,
  setSelectedYear,
  selectedCompanies,
  setSelectedCompanies,
  availableCrops,
}: LayerControlsProps) {
  const { toast } = useToast();

  // Fetch crops
  const { data: crops = [] } = useQuery({
    queryKey: ["/api/crops"],
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
    },
  });

  // Fetch states
  const { data: states = [] } = useQuery({
    queryKey: ["/api/states"],
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
    },
  });

  // Fetch companies
  const { data: companies = [] } = useQuery({
    queryKey: ["/api/companies"],
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
    },
  });

  const handleCropToggle = (cropId: number, checked: boolean) => {
    if (checked) {
      setSelectedCrops([...selectedCrops, cropId]);
    } else {
      setSelectedCrops(selectedCrops.filter(id => id !== cropId));
    }
  };

  const handleCompanyToggle = (companyId: number, checked: boolean) => {
    if (checked) {
      setSelectedCompanies([...selectedCompanies, companyId]);
    } else {
      setSelectedCompanies(selectedCompanies.filter(id => id !== companyId));
    }
  };

  const regions = [
    { value: "Norte", label: "Norte" },
    { value: "Nordeste", label: "Nordeste" },
    { value: "Centro-Oeste", label: "Centro-Oeste" },
    { value: "Sudeste", label: "Sudeste" },
    { value: "Sul", label: "Sul" },
  ];

  const years = [2023, 2022, 2021, 2020, 2019, 2018];

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Camadas</h2>
      
      <div className="space-y-4">
        {/* Crops Section */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-700">Culturas</h3>
            <button className="text-ferticore-green hover:text-ferticore-dark">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {availableCrops.map((crop, index) => (
              <div key={index} className="flex items-center space-x-3">
                <Checkbox
                  id={`crop-${index}`}
                  checked={selectedCrops.includes(index)}
                  onCheckedChange={(checked) => handleCropToggle(index, checked as boolean)}
                />
                <Label htmlFor={`crop-${index}`} className="text-sm text-gray-700 flex-1">
                  {crop}
                </Label>
                <div 
                  className="w-4 h-4 rounded-full ml-auto bg-ferticore-green"
                ></div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters Section */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-700 mb-3">Filtros</h3>
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium text-gray-600 mb-1">Estado</Label>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  {states.map((state) => (
                    <SelectItem key={state.id} value={state.id.toString()}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-600 mb-1">Região</Label>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as regiões" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as regiões</SelectItem>
                  {regions.map((region) => (
                    <SelectItem key={region.value} value={region.value}>
                      {region.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-600 mb-1">Ano</Label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Companies Section */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-700 mb-3">Empresas</h3>
          <div className="space-y-2">
            {companies.map((company) => (
              <div key={company.id} className="flex items-center space-x-3">
                <Checkbox
                  id={`company-${company.id}`}
                  checked={selectedCompanies.includes(company.id)}
                  onCheckedChange={(checked) => handleCompanyToggle(company.id, checked as boolean)}
                />
                <Label htmlFor={`company-${company.id}`} className="text-sm text-gray-700 flex-1">
                  {company.name}
                </Label>
                <div 
                  className="w-3 h-3 rounded-full ml-auto"
                  style={{ backgroundColor: company.color }}
                ></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
