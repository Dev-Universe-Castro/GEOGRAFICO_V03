import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import * as XLSX from 'xlsx';
import multer from 'multer';
import { insertCropProductionSchema } from "@shared/schema";
import { createSampleData } from "./sampleData";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Initialize database with default data
  await storage.initializeDefaultData();
  
  // Create sample data for demonstration
  await createSampleData();

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // States routes
  app.get('/api/states', async (req, res) => {
    try {
      const states = await storage.getStates();
      res.json(states);
    } catch (error) {
      console.error("Error fetching states:", error);
      res.status(500).json({ message: "Failed to fetch states" });
    }
  });

  // Municipalities routes
  app.get('/api/municipalities', async (req, res) => {
    try {
      const { stateId } = req.query;
      let municipalities;
      
      if (stateId) {
        municipalities = await storage.getMunicipalitiesByState(parseInt(stateId as string));
      } else {
        municipalities = await storage.getMunicipalities();
      }
      
      res.json(municipalities);
    } catch (error) {
      console.error("Error fetching municipalities:", error);
      res.status(500).json({ message: "Failed to fetch municipalities" });
    }
  });

  // Crops routes
  app.get('/api/crops', async (req, res) => {
    try {
      const crops = await storage.getCrops();
      res.json(crops);
    } catch (error) {
      console.error("Error fetching crops:", error);
      res.status(500).json({ message: "Failed to fetch crops" });
    }
  });

  // Crop production routes
  app.get('/api/crop-production', async (req, res) => {
    try {
      const { cropId, stateId, year, region } = req.query;
      
      const filters: any = {};
      if (cropId) filters.cropId = parseInt(cropId as string);
      if (stateId) filters.stateId = parseInt(stateId as string);
      if (year) filters.year = parseInt(year as string);
      if (region) filters.region = region as string;

      const production = await storage.getCropProduction(filters);
      res.json(production);
    } catch (error) {
      console.error("Error fetching crop production:", error);
      res.status(500).json({ message: "Failed to fetch crop production" });
    }
  });

  // Companies routes
  app.get('/api/companies', async (req, res) => {
    try {
      const companies = await storage.getCompanies();
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  app.get('/api/company-locations', async (req, res) => {
    try {
      const { companyId } = req.query;
      const locations = await storage.getCompanyLocations(
        companyId ? parseInt(companyId as string) : undefined
      );
      res.json(locations);
    } catch (error) {
      console.error("Error fetching company locations:", error);
      res.status(500).json({ message: "Failed to fetch company locations" });
    }
  });

  // Excel upload route (protected)
  app.post('/api/upload-excel', isAuthenticated, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      // Process Excel data and insert into database
      const productionData = [];
      
      for (const row of data as any[]) {
        // Assuming Excel columns: Municipality, State, Crop, Year, Hectares, Production
        // You'll need to adjust this based on your actual Excel structure
        if (row.Municipality && row.State && row.Crop && row.Year && row.Hectares) {
          // Find or create municipality
          const states = await storage.getStates();
          const state = states.find(s => s.name === row.State || s.code === row.State);
          
          if (state) {
            const municipalities = await storage.getMunicipalitiesByState(state.id);
            let municipality = municipalities.find(m => m.name === row.Municipality);
            
            if (!municipality) {
              municipality = await storage.insertMunicipality({
                name: row.Municipality,
                stateId: state.id,
                ibgeCode: row.IBGECode || null,
                latitude: row.Latitude || null,
                longitude: row.Longitude || null,
              });
            }

            // Find or create crop
            const crops = await storage.getCrops();
            let crop = crops.find(c => c.name === row.Crop);
            
            if (!crop) {
              crop = await storage.insertCrop({
                name: row.Crop,
                category: row.Category || 'Temporária',
                color: row.Color || '#7CB342',
              });
            }

            productionData.push({
              municipalityId: municipality.id,
              cropId: crop.id,
              year: parseInt(row.Year),
              hectares: parseFloat(row.Hectares).toString(),
              production: row.Production ? parseFloat(row.Production).toString() : null,
            });
          }
        }
      }

      // Bulk insert production data
      if (productionData.length > 0) {
        await storage.bulkInsertCropProduction(productionData);
      }

      res.json({ 
        message: "Excel data processed successfully", 
        recordsProcessed: productionData.length 
      });
    } catch (error) {
      console.error("Error processing Excel file:", error);
      res.status(500).json({ message: "Failed to process Excel file" });
    }
  });

  // Export data route (protected)
  app.get('/api/export-data', isAuthenticated, async (req, res) => {
    try {
      const { format = 'excel' } = req.query;
      const production = await storage.getCropProduction();

      if (format === 'excel') {
        const exportData = production.map(p => ({
          Municipality: p.municipality.name,
          State: p.municipality.state.name,
          Region: p.municipality.state.region,
          Crop: p.crop.name,
          Category: p.crop.category,
          Year: p.year,
          Hectares: p.hectares,
          Production: p.production,
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Production Data');
        
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=crop_production_data.xlsx');
        res.send(buffer);
      } else {
        res.json(production);
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
