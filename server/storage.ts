import {
  users,
  projects,
  secrets,
  type User,
  type UpsertUser,
  type Project,
  type Secret,
  type InsertProject,
  type InsertSecret,
  type UpdateProject,
  type UpdateSecret,
  type ProjectWithSecrets,
  type SecretWithDecrypted,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, ilike, or, desc, sql } from "drizzle-orm";
import { encrypt, decrypt } from "./encryption";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Project operations
  getUserProjects(userId: string): Promise<ProjectWithSecrets[]>;
  getProject(id: string, userId: string): Promise<ProjectWithSecrets | undefined>;
  createProject(project: InsertProject, userId: string): Promise<Project>;
  updateProject(id: string, project: UpdateProject, userId: string): Promise<Project | undefined>;
  deleteProject(id: string, userId: string): Promise<boolean>;
  
  // Secret operations
  getSecret(id: string, userId: string): Promise<SecretWithDecrypted | undefined>;
  createSecret(secret: InsertSecret, userId: string): Promise<Secret>;
  updateSecret(id: string, secret: UpdateSecret, userId: string): Promise<Secret | undefined>;
  deleteSecret(id: string, userId: string): Promise<boolean>;
  
  // Search operations
  searchProjects(query: string, userId: string, platform?: string): Promise<ProjectWithSecrets[]>;
  getDashboardStats(userId: string): Promise<{
    totalProjects: number;
    totalSecrets: number;
    totalPlatforms: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

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

  // Project operations
  async getUserProjects(userId: string): Promise<ProjectWithSecrets[]> {
    const projectsWithSecrets = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        userId: projects.userId,
        platforms: projects.platforms,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        secrets: sql`json_agg(
          json_build_object(
            'id', ${secrets.id},
            'name', ${secrets.name},
            'type', ${secrets.type},
            'platform', ${secrets.platform},
            'encryptedValues', ${secrets.encryptedValues},
            'projectId', ${secrets.projectId},
            'createdAt', ${secrets.createdAt},
            'updatedAt', ${secrets.updatedAt}
          )
        ) FILTER (WHERE ${secrets.id} IS NOT NULL)`.as('secrets'),
        secretCount: sql`COUNT(${secrets.id})`.as('secretCount'),
      })
      .from(projects)
      .leftJoin(secrets, eq(projects.id, secrets.projectId))
      .where(eq(projects.userId, userId))
      .groupBy(projects.id)
      .orderBy(desc(projects.updatedAt));

    return projectsWithSecrets.map(project => ({
      ...project,
      secrets: (project.secrets as any) || [],
      secretCount: Number(project.secretCount),
    }));
  }

  async getProject(id: string, userId: string): Promise<ProjectWithSecrets | undefined> {
    const [projectWithSecrets] = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        userId: projects.userId,
        platforms: projects.platforms,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        secrets: sql`json_agg(
          json_build_object(
            'id', ${secrets.id},
            'name', ${secrets.name},
            'type', ${secrets.type},
            'platform', ${secrets.platform},
            'encryptedValues', ${secrets.encryptedValues},
            'projectId', ${secrets.projectId},
            'createdAt', ${secrets.createdAt},
            'updatedAt', ${secrets.updatedAt}
          )
        ) FILTER (WHERE ${secrets.id} IS NOT NULL)`.as('secrets'),
        secretCount: sql`COUNT(${secrets.id})`.as('secretCount'),
      })
      .from(projects)
      .leftJoin(secrets, eq(projects.id, secrets.projectId))
      .where(and(eq(projects.id, id), eq(projects.userId, userId)))
      .groupBy(projects.id);

    if (!projectWithSecrets) return undefined;

    return {
      ...projectWithSecrets,
      secrets: (projectWithSecrets.secrets as any) || [],
      secretCount: Number(projectWithSecrets.secretCount),
    };
  }

  async createProject(project: InsertProject, userId: string): Promise<Project> {
    const [newProject] = await db
      .insert(projects)
      .values({ ...project, userId })
      .returning();
    return newProject;
  }

  async updateProject(id: string, project: UpdateProject, userId: string): Promise<Project | undefined> {
    const [updatedProject] = await db
      .update(projects)
      .set({ ...project, updatedAt: new Date() })
      .where(and(eq(projects.id, id), eq(projects.userId, userId)))
      .returning();
    return updatedProject;
  }

  async deleteProject(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Secret operations
  async getSecret(id: string, userId: string): Promise<SecretWithDecrypted | undefined> {
    const [secret] = await db
      .select()
      .from(secrets)
      .innerJoin(projects, eq(secrets.projectId, projects.id))
      .where(and(eq(secrets.id, id), eq(projects.userId, userId)));

    if (!secret) return undefined;

    try {
      const encryptedValues = secret.secrets.encryptedValues as Record<string, string>;
      const decryptedValues: Record<string, string> = {};
      
      for (const [key, encryptedValue] of Object.entries(encryptedValues)) {
        decryptedValues[key] = decrypt(encryptedValue);
      }
      
      return {
        ...secret.secrets,
        decryptedValues,
      };
    } catch (error) {
      console.error('Failed to decrypt secret:', error);
      throw new Error('Failed to decrypt secret values');
    }
  }

  async createSecret(secret: InsertSecret, userId: string): Promise<Secret> {
    // Verify project belongs to user
    const project = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, secret.projectId), eq(projects.userId, userId)));

    if (!project.length) {
      throw new Error('Project not found or unauthorized');
    }

    // Encrypt all secret values
    const encryptedValues: Record<string, string> = {};
    for (const [key, value] of Object.entries(secret.values)) {
      encryptedValues[key] = encrypt(value);
    }

    const [newSecret] = await db
      .insert(secrets)
      .values({
        name: secret.name,
        type: secret.type,
        platform: secret.platform,
        encryptedValues,
        projectId: secret.projectId,
      })
      .returning();

    // Update project's platforms array if needed
    const currentPlatforms = project[0].platforms || [];
    if (!currentPlatforms.includes(secret.platform)) {
      await db
        .update(projects)
        .set({
          platforms: [...currentPlatforms, secret.platform],
          updatedAt: new Date(),
        })
        .where(eq(projects.id, secret.projectId));
    }

    return newSecret;
  }

  async updateSecret(id: string, secret: UpdateSecret, userId: string): Promise<Secret | undefined> {
    // Get existing secret and verify ownership
    const existingSecret = await this.getSecret(id, userId);
    if (!existingSecret) return undefined;

    const updateData: any = {};
    
    if (secret.name !== undefined) updateData.name = secret.name;
    if (secret.type !== undefined) updateData.type = secret.type;
    if (secret.platform !== undefined) updateData.platform = secret.platform;
    if (secret.values !== undefined) {
      const encryptedValues: Record<string, string> = {};
      for (const [key, value] of Object.entries(secret.values)) {
        encryptedValues[key] = encrypt(value);
      }
      updateData.encryptedValues = encryptedValues;
    }
    
    updateData.updatedAt = new Date();

    const [updatedSecret] = await db
      .update(secrets)
      .set(updateData)
      .where(eq(secrets.id, id))
      .returning();

    return updatedSecret;
  }

  async deleteSecret(id: string, userId: string): Promise<boolean> {
    // Verify secret belongs to user through project
    const secretWithProject = await db
      .select({ secretId: secrets.id })
      .from(secrets)
      .innerJoin(projects, eq(secrets.projectId, projects.id))
      .where(and(eq(secrets.id, id), eq(projects.userId, userId)));

    if (!secretWithProject.length) return false;

    const result = await db.delete(secrets).where(eq(secrets.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Search operations
  async searchProjects(query: string, userId: string, platform?: string): Promise<ProjectWithSecrets[]> {
    let whereCondition: any = eq(projects.userId, userId);

    if (query) {
      whereCondition = and(
        whereCondition,
        or(
          ilike(projects.name, `%${query}%`),
          ilike(projects.description, `%${query}%`)
        )
      );
    }

    if (platform) {
      whereCondition = and(
        whereCondition,
        sql`${platform} = ANY(${projects.platforms})`
      );
    }

    const projectsWithSecrets = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        userId: projects.userId,
        platforms: projects.platforms,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        secrets: sql`json_agg(
          json_build_object(
            'id', ${secrets.id},
            'name', ${secrets.name},
            'type', ${secrets.type},
            'platform', ${secrets.platform},
            'encryptedValues', ${secrets.encryptedValues},
            'projectId', ${secrets.projectId},
            'createdAt', ${secrets.createdAt},
            'updatedAt', ${secrets.updatedAt}
          )
        ) FILTER (WHERE ${secrets.id} IS NOT NULL)`.as('secrets'),
        secretCount: sql`COUNT(${secrets.id})`.as('secretCount'),
      })
      .from(projects)
      .leftJoin(secrets, eq(projects.id, secrets.projectId))
      .where(whereCondition)
      .groupBy(projects.id)
      .orderBy(desc(projects.updatedAt));

    return projectsWithSecrets.map(project => ({
      ...project,
      secrets: (project.secrets as any) || [],
      secretCount: Number(project.secretCount),
    }));
  }

  async getDashboardStats(userId: string): Promise<{
    totalProjects: number;
    totalSecrets: number;
    totalPlatforms: number;
  }> {
    console.log('Getting dashboard stats for user:', userId);
    // Get basic stats
    const [stats] = await db
      .select({
        totalProjects: sql`COUNT(DISTINCT ${projects.id})`.as('totalProjects'),
        totalSecrets: sql`COUNT(${secrets.id})`.as('totalSecrets'),
      })
      .from(projects)
      .leftJoin(secrets, eq(projects.id, secrets.projectId))
      .where(eq(projects.userId, userId));

    // Get unique platforms count with a separate query
    const platformStats = await db.execute(sql`
      SELECT COUNT(DISTINCT platform_elem) as total_platforms
      FROM (
        SELECT unnest(platforms) as platform_elem
        FROM projects
        WHERE user_id = ${userId} AND platforms IS NOT NULL AND array_length(platforms, 1) > 0
      ) AS platform_list
    `);

    return {
      totalProjects: Number(stats.totalProjects),
      totalSecrets: Number(stats.totalSecrets),
      totalPlatforms: Number(platformStats.rows[0]?.total_platforms || 0),
    };
  }
}

export const storage = new DatabaseStorage();
