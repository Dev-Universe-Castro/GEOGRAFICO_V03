import { storage } from "./storage";

export async function createSampleData() {
  try {
    // Get states for reference
    const states = await storage.getStates();
    const spState = states.find(s => s.code === 'SP');
    
    if (!spState) {
      console.log("São Paulo state not found");
      return;
    }

    // Create sample municipalities in São Paulo
    const municipalities = [
      { name: "Campinas", stateId: spState.id, latitude: "-22.9099", longitude: "-47.0626" },
      { name: "Ribeirão Preto", stateId: spState.id, latitude: "-21.1767", longitude: "-47.8208" },
      { name: "Piracicaba", stateId: spState.id, latitude: "-22.7253", longitude: "-47.6486" },
      { name: "Araraquara", stateId: spState.id, latitude: "-21.7948", longitude: "-48.1759" },
      { name: "Limeira", stateId: spState.id, latitude: "-22.5647", longitude: "-47.4017" },
      { name: "Americana", stateId: spState.id, latitude: "-22.7390", longitude: "-47.3310" },
      { name: "Bauru", stateId: spState.id, latitude: "-22.3147", longitude: "-49.0614" },
      { name: "Presidente Prudente", stateId: spState.id, latitude: "-22.1256", longitude: "-51.3889" },
      { name: "Marília", stateId: spState.id, latitude: "-22.2136", longitude: "-49.9456" },
      { name: "Franca", stateId: spState.id, latitude: "-20.5386", longitude: "-47.4006" },
    ];

    // Insert municipalities
    const createdMunicipalities = [];
    for (const municipality of municipalities) {
      const created = await storage.insertMunicipality(municipality);
      createdMunicipalities.push(created);
    }

    // Get crops for reference
    const crops = await storage.getCrops();
    const banana = crops.find(c => c.name === 'Banana');
    const coffee = crops.find(c => c.name === 'Café');
    const orange = crops.find(c => c.name === 'Laranja');

    if (!banana || !coffee || !orange) {
      console.log("Required crops not found");
      return;
    }

    // Create sample production data
    const productionData = [
      // Banana production
      { municipalityId: createdMunicipalities[0].id, cropId: banana.id, year: 2023, hectares: "1250.50", production: "15600.75" },
      { municipalityId: createdMunicipalities[1].id, cropId: banana.id, year: 2023, hectares: "2180.25", production: "28340.50" },
      { municipalityId: createdMunicipalities[2].id, cropId: banana.id, year: 2023, hectares: "980.75", production: "12750.25" },
      { municipalityId: createdMunicipalities[3].id, cropId: banana.id, year: 2023, hectares: "1560.00", production: "20280.00" },
      { municipalityId: createdMunicipalities[4].id, cropId: banana.id, year: 2023, hectares: "850.30", production: "11055.40" },
      
      // Coffee production
      { municipalityId: createdMunicipalities[0].id, cropId: coffee.id, year: 2023, hectares: "3420.75", production: "4104.90" },
      { municipalityId: createdMunicipalities[1].id, cropId: coffee.id, year: 2023, hectares: "5670.50", production: "6804.60" },
      { municipalityId: createdMunicipalities[2].id, cropId: coffee.id, year: 2023, hectares: "2890.25", production: "3468.30" },
      { municipalityId: createdMunicipalities[5].id, cropId: coffee.id, year: 2023, hectares: "1890.00", production: "2268.00" },
      { municipalityId: createdMunicipalities[6].id, cropId: coffee.id, year: 2023, hectares: "4250.80", production: "5100.96" },
      
      // Orange production
      { municipalityId: createdMunicipalities[2].id, cropId: orange.id, year: 2023, hectares: "8950.25", production: "179005.00" },
      { municipalityId: createdMunicipalities[3].id, cropId: orange.id, year: 2023, hectares: "12500.75", production: "250015.00" },
      { municipalityId: createdMunicipalities[4].id, cropId: orange.id, year: 2023, hectares: "6780.50", production: "135610.00" },
      { municipalityId: createdMunicipalities[7].id, cropId: orange.id, year: 2023, hectares: "4890.00", production: "97800.00" },
      { municipalityId: createdMunicipalities[8].id, cropId: orange.id, year: 2023, hectares: "7650.25", production: "153005.00" },
    ];

    // Insert production data
    await storage.bulkInsertCropProduction(productionData);

    // Create sample company locations
    const companies = await storage.getCompanies();
    const pontoCompany = companies.find(c => c.name === 'PONTO');
    const empresa1 = companies.find(c => c.name === 'Empresa #1');

    if (pontoCompany && empresa1) {
      const companyLocations = [
        { companyId: pontoCompany.id, municipalityId: createdMunicipalities[0].id, latitude: "-22.9099", longitude: "-47.0626", name: "Unidade Campinas" },
        { companyId: pontoCompany.id, municipalityId: createdMunicipalities[1].id, latitude: "-21.1767", longitude: "-47.8208", name: "Unidade Ribeirão Preto" },
        { companyId: empresa1.id, municipalityId: createdMunicipalities[2].id, latitude: "-22.7253", longitude: "-47.6486", name: "Filial Piracicaba" },
        { companyId: empresa1.id, municipalityId: createdMunicipalities[3].id, latitude: "-21.7948", longitude: "-48.1759", name: "Filial Araraquara" },
      ];

      for (const location of companyLocations) {
        await storage.insertCompanyLocation(location);
      }
    }

    console.log("Sample data created successfully!");
    console.log(`Created ${createdMunicipalities.length} municipalities`);
    console.log(`Created ${productionData.length} production records`);
    
  } catch (error) {
    console.error("Error creating sample data:", error);
  }
}