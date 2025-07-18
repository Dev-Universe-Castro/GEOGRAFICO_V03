import {
  users,
  states,
  municipalities,
  crops,
  cropProduction,
  companies,
  companyLocations,
  type User,
  type UpsertUser,
  type State,
  type Municipality,
  type Crop,
  type CropProduction,
  type Company,
  type CompanyLocation,
  type InsertState,
  type InsertMunicipality,
  type InsertCrop,
  type InsertCropProduction,
  type InsertCompany,
  type InsertCompanyLocation,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // State operations
  getStates(): Promise<State[]>;
  insertState(state: InsertState): Promise<State>;

  // Municipality operations
  getMunicipalities(): Promise<Municipality[]>;
  getMunicipalitiesByState(stateId: number): Promise<Municipality[]>;
  insertMunicipality(municipality: InsertMunicipality): Promise<Municipality>;

  // Crop operations
  getCrops(): Promise<Crop[]>;
  insertCrop(crop: InsertCrop): Promise<Crop>;

  // Crop production operations
  getCropProduction(filters?: {
    cropId?: number;
    stateId?: number;
    year?: number;
    region?: string;
  }): Promise<Array<CropProduction & { municipality: Municipality & { state: State } } & { crop: Crop }>>;
  insertCropProduction(production: InsertCropProduction): Promise<CropProduction>;
  bulkInsertCropProduction(productions: InsertCropProduction[]): Promise<void>;

  // Company operations
  getCompanies(): Promise<Company[]>;
  getCompanyLocations(companyId?: number): Promise<Array<CompanyLocation & { company: Company } & { municipality: Municipality }>>;
  insertCompany(company: InsertCompany): Promise<Company>;
  insertCompanyLocation(location: InsertCompanyLocation): Promise<CompanyLocation>;

  // Data initialization
  initializeDefaultData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // State operations
  async getStates(): Promise<State[]> {
    return await db.select().from(states);
  }

  async insertState(state: InsertState): Promise<State> {
    const [result] = await db.insert(states).values(state).returning();
    return result;
  }

  // Municipality operations
  async getMunicipalities(): Promise<Municipality[]> {
    return await db.select().from(municipalities);
  }

  async getMunicipalitiesByState(stateId: number): Promise<Municipality[]> {
    return await db.select().from(municipalities).where(eq(municipalities.stateId, stateId));
  }

  async insertMunicipality(municipality: InsertMunicipality): Promise<Municipality> {
    const [result] = await db.insert(municipalities).values(municipality).returning();
    return result;
  }

  // Crop operations
  async getCrops(): Promise<Crop[]> {
    return await db.select().from(crops);
  }

  async insertCrop(crop: InsertCrop): Promise<Crop> {
    const [result] = await db.insert(crops).values(crop).returning();
    return result;
  }

  // Crop production operations
  async getCropProduction(filters?: {
    cropId?: number;
    stateId?: number;
    year?: number;
    region?: string;
  }): Promise<Array<CropProduction & { municipality: Municipality & { state: State } } & { crop: Crop }>> {
    let query = db
      .select()
      .from(cropProduction)
      .leftJoin(municipalities, eq(cropProduction.municipalityId, municipalities.id))
      .leftJoin(states, eq(municipalities.stateId, states.id))
      .leftJoin(crops, eq(cropProduction.cropId, crops.id))
;

    const conditions = [];

    if (filters?.cropId) {
      conditions.push(eq(cropProduction.cropId, filters.cropId));
    }

    if (filters?.stateId) {
      conditions.push(eq(municipalities.stateId, filters.stateId));
    }

    if (filters?.year) {
      conditions.push(eq(cropProduction.year, filters.year));
    }

    if (filters?.region) {
      conditions.push(eq(states.region, filters.region));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query;

    return results.map((result) => ({
      ...result.crop_production,
      municipality: {
        ...result.municipalities!,
        state: result.states!,
      },
      crop: result.crops!,
    }));
  }

  async insertCropProduction(production: InsertCropProduction): Promise<CropProduction> {
    const [result] = await db.insert(cropProduction).values(production).returning();
    return result;
  }

  async bulkInsertCropProduction(productions: InsertCropProduction[]): Promise<void> {
    if (productions.length === 0) return;
    
    const batchSize = 1000;
    for (let i = 0; i < productions.length; i += batchSize) {
      const batch = productions.slice(i, i + batchSize);
      await db.insert(cropProduction).values(batch);
    }
  }

  // Company operations
  async getCompanies(): Promise<Company[]> {
    return await db.select().from(companies);
  }

  async getCompanyLocations(companyId?: number): Promise<Array<CompanyLocation & { company: Company } & { municipality: Municipality }>> {
    let query = db
      .select()
      .from(companyLocations)
      .leftJoin(companies, eq(companyLocations.companyId, companies.id))
      .leftJoin(municipalities, eq(companyLocations.municipalityId, municipalities.id))
;

    if (companyId) {
      query = query.where(eq(companyLocations.companyId, companyId)) as any;
    }

    const results = await query;

    return results.map((result) => ({
      ...result.company_locations,
      company: result.companies!,
      municipality: result.municipalities!,
    }));
  }

  async insertCompany(company: InsertCompany): Promise<Company> {
    const [result] = await db.insert(companies).values(company).returning();
    return result;
  }

  async insertCompanyLocation(location: InsertCompanyLocation): Promise<CompanyLocation> {
    const [result] = await db.insert(companyLocations).values(location).returning();
    return result;
  }

  // Data initialization
  async initializeDefaultData(): Promise<void> {
    // Check if data already exists
    const existingStates = await this.getStates();
    if (existingStates.length > 0) {
      return; // Data already initialized
    }

    // Initialize Brazilian states
    const brazilianStates = [
      { code: 'AC', name: 'Acre', region: 'Norte' },
      { code: 'AL', name: 'Alagoas', region: 'Nordeste' },
      { code: 'AP', name: 'Amapá', region: 'Norte' },
      { code: 'AM', name: 'Amazonas', region: 'Norte' },
      { code: 'BA', name: 'Bahia', region: 'Nordeste' },
      { code: 'CE', name: 'Ceará', region: 'Nordeste' },
      { code: 'DF', name: 'Distrito Federal', region: 'Centro-Oeste' },
      { code: 'ES', name: 'Espírito Santo', region: 'Sudeste' },
      { code: 'GO', name: 'Goiás', region: 'Centro-Oeste' },
      { code: 'MA', name: 'Maranhão', region: 'Nordeste' },
      { code: 'MT', name: 'Mato Grosso', region: 'Centro-Oeste' },
      { code: 'MS', name: 'Mato Grosso do Sul', region: 'Centro-Oeste' },
      { code: 'MG', name: 'Minas Gerais', region: 'Sudeste' },
      { code: 'PA', name: 'Pará', region: 'Norte' },
      { code: 'PB', name: 'Paraíba', region: 'Nordeste' },
      { code: 'PR', name: 'Paraná', region: 'Sul' },
      { code: 'PE', name: 'Pernambuco', region: 'Nordeste' },
      { code: 'PI', name: 'Piauí', region: 'Nordeste' },
      { code: 'RJ', name: 'Rio de Janeiro', region: 'Sudeste' },
      { code: 'RN', name: 'Rio Grande do Norte', region: 'Nordeste' },
      { code: 'RS', name: 'Rio Grande do Sul', region: 'Sul' },
      { code: 'RO', name: 'Rondônia', region: 'Norte' },
      { code: 'RR', name: 'Roraima', region: 'Norte' },
      { code: 'SC', name: 'Santa Catarina', region: 'Sul' },
      { code: 'SP', name: 'São Paulo', region: 'Sudeste' },
      { code: 'SE', name: 'Sergipe', region: 'Nordeste' },
      { code: 'TO', name: 'Tocantins', region: 'Norte' },
    ];

    // Insert states
    for (const state of brazilianStates) {
      await this.insertState(state);
    }

    // Initialize default crops
    const defaultCrops = [
      { name: 'Banana', category: 'Permanente', color: '#7CB342' },
      { name: 'Café', category: 'Permanente', color: '#8B4513' },
      { name: 'Laranja', category: 'Permanente', color: '#FF6600' },
      { name: 'Soja', category: 'Temporária', color: '#228B22' },
      { name: 'Milho', category: 'Temporária', color: '#FFD700' },
      { name: 'Cana-de-açúcar', category: 'Temporária', color: '#90EE90' },
      { name: 'Algodão', category: 'Temporária', color: '#F5F5DC' },
      { name: 'Feijão', category: 'Temporária', color: '#8B4513' },
    ];

    for (const crop of defaultCrops) {
      await this.insertCrop(crop);
    }

    // Initialize default companies
    const defaultCompanies = [
      { name: 'PONTO', color: '#3B82F6', isActive: true },
      { name: 'Empresa #1', color: '#EF4444', isActive: true },
    ];

    for (const company of defaultCompanies) {
      await this.insertCompany(company);
    }
  }
}

export const storage = new DatabaseStorage();
