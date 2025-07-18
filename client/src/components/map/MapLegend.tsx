import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { getColorForHectares, getHectareRanges } from "@/lib/mapUtils";

export default function MapLegend() {
  const { toast } = useToast();

  // Get legend data
  const { data: legendData } = useQuery({
    queryKey: ["/api/crop-production"],
    select: (data) => {
      if (!data || data.length === 0) return null;
      
      const ranges = getHectareRanges();
      const totalMunicipalities = data.length;
      
      return ranges.map(range => {
        const count = data.filter(d => {
          const hectares = parseFloat(d.hectares);
          return hectares >= range.min && hectares <= range.max;
        }).length;
        
        const percentage = totalMunicipalities > 0 ? (count / totalMunicipalities) * 100 : 0;
        
        return {
          ...range,
          count,
          percentage,
          color: getColorForHectares(range.min + 1),
        };
      });
    },
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

  if (!legendData) {
    return null;
  }

  return (
    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 min-w-64 z-[1000]">
      <h3 className="font-semibold text-gray-800 mb-3">Legendas</h3>
      <div className="space-y-2">
        <div className="font-medium text-sm text-gray-700 mb-2">
          Lavouras permanentes, por município
        </div>
        <div className="text-xs text-gray-500 mb-3">
          Colheita em hectares
        </div>
        <div className="space-y-1">
          {legendData.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-xs text-gray-600 flex-1">
                {item.min.toLocaleString('pt-BR')} - {item.max.toLocaleString('pt-BR')}
              </span>
              <span className="text-xs text-gray-400">
                {item.count} ({item.percentage.toFixed(2)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
