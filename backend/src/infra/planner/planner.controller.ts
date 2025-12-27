import { Request, Response } from "express";
import { InfraPlannerService } from "./planner.service";
import { prisma } from "../../config/prisma";
import { AuthRequest } from "../../middleware/auth.middleware";

const infraService = new InfraPlannerService();

export class InfraController {
  async planInfrastructure(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      const project = await prisma.project.findFirst({
        where: { id, userId },
      });

      if (!project) return res.status(404).json({ error: "Project not found" });
      
      // Update stage to reflecting processing
      // In a real prod app, you might queue this with BullMQ
      const plan = await infraService.createDeploymentPlan(id);

      return res.status(200).json({
        message: "Infrastructure plan generated successfully",
        plan: plan[0], // Returns the created plan from the transaction
      });
    } catch (error: any) {
      console.error("Infra Planning Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  async getPlan(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      const project = await prisma.project.findFirst({
        where: { id, userId },
      });

      if (!project) return res.status(404).json({ error: "Project not found" });
      
      const plan = await prisma.infrastructurePlan.findUnique({
        where: { projectId: id },
      });
      if (!plan) return res.status(404).json({ error: "Plan not found" });
      return res.json(plan);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}