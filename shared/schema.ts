import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Agricultural data tables
export const states = pgTable("states", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 2 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  region: varchar("region", { length: 50 }).notNull(),
});

export const municipalities = pgTable("municipalities", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  stateId: integer("state_id").references(() => states.id),
  ibgeCode: varchar("ibge_code", { length: 10 }).unique(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
});

export const crops = pgTable("crops", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  color: varchar("color", { length: 7 }).notNull(), // hex color
});

export const cropProduction = pgTable("crop_production", {
  id: serial("id").primaryKey(),
  municipalityId: integer("municipality_id").references(() => municipalities.id),
  cropId: integer("crop_id").references(() => crops.id),
  year: integer("year").notNull(),
  hectares: decimal("hectares", { precision: 12, scale: 2 }),
  production: decimal("production", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  color: varchar("color", { length: 7 }).notNull(),
  isActive: boolean("is_active").default(true),
});

export const companyLocations = pgTable("company_locations", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id),
  municipalityId: integer("municipality_id").references(() => municipalities.id),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  name: varchar("name", { length: 200 }),
});

// Relations
export const statesRelations = relations(states, ({ many }) => ({
  municipalities: many(municipalities),
}));

export const municipalitiesRelations = relations(municipalities, ({ one, many }) => ({
  state: one(states, {
    fields: [municipalities.stateId],
    references: [states.id],
  }),
  productions: many(cropProduction),
  companyLocations: many(companyLocations),
}));

export const cropsRelations = relations(crops, ({ many }) => ({
  productions: many(cropProduction),
}));

export const cropProductionRelations = relations(cropProduction, ({ one }) => ({
  municipality: one(municipalities, {
    fields: [cropProduction.municipalityId],
    references: [municipalities.id],
  }),
  crop: one(crops, {
    fields: [cropProduction.cropId],
    references: [crops.id],
  }),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  locations: many(companyLocations),
}));

export const companyLocationsRelations = relations(companyLocations, ({ one }) => ({
  company: one(companies, {
    fields: [companyLocations.companyId],
    references: [companies.id],
  }),
  municipality: one(municipalities, {
    fields: [companyLocations.municipalityId],
    references: [municipalities.id],
  }),
}));

// Schemas
export const insertStateSchema = createInsertSchema(states);
export const insertMunicipalitySchema = createInsertSchema(municipalities);
export const insertCropSchema = createInsertSchema(crops);
export const insertCropProductionSchema = createInsertSchema(cropProduction);
export const insertCompanySchema = createInsertSchema(companies);
export const insertCompanyLocationSchema = createInsertSchema(companyLocations);

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type State = typeof states.$inferSelect;
export type Municipality = typeof municipalities.$inferSelect;
export type Crop = typeof crops.$inferSelect;
export type CropProduction = typeof cropProduction.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type CompanyLocation = typeof companyLocations.$inferSelect;

export type InsertState = z.infer<typeof insertStateSchema>;
export type InsertMunicipality = z.infer<typeof insertMunicipalitySchema>;
export type InsertCrop = z.infer<typeof insertCropSchema>;
export type InsertCropProduction = z.infer<typeof insertCropProductionSchema>;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type InsertCompanyLocation = z.infer<typeof insertCompanyLocationSchema>;
