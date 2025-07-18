import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Download, User, ChevronDown, Upload } from "lucide-react";
import fertiCoreLogo from "@assets/LOGO_1752835580345.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function MapHeader() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleExport = async () => {
    try {
      const response = await fetch('/api/export-data?format=excel', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'crop_production_data.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export concluído",
        description: "Os dados foram exportados com sucesso",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Erro na exportação",
        description: "Falha ao exportar os dados",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-excel', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const result = await response.json();
      
      toast({
        title: "Upload concluído",
        description: `${result.recordsProcessed} registros processados com sucesso`,
      });
      
      // Refresh the page to show new data
      window.location.reload();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Erro no upload",
        description: "Falha ao processar o arquivo Excel",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 h-16">
      <div className="flex items-center justify-between px-6 py-4 h-full">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 flex items-center justify-center">
            <img 
              src={fertiCoreLogo} 
              alt="FertiCore Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-xl font-bold text-gray-800">FertiCore</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="file-upload" className="sr-only">
              Upload Excel
            </Label>
            <Button
              variant="outline"
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={isUploading}
              className="text-ferticore-green border-ferticore-green hover:bg-ferticore-green hover:text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Carregando...' : 'Importar Excel'}
            </Button>
            <Input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
          
          <Button
            onClick={handleExport}
            className="bg-ferticore-green text-white hover:bg-ferticore-dark"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar Dados
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-ferticore-green rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {user?.firstName || 'Usuário'}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => window.location.href = '/api/logout'}>
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
