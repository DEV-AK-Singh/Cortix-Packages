import { AuthRequest } from "../../middleware/auth.middleware";
import { prisma } from "../../config/prisma";

export class UserController {
    static async getMe(req: AuthRequest, res: any) {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                accounts: {
                    select: {
                        provider: true,
                    },
                },
            },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const githubConnected = user.accounts.some(
            (acc) => acc.provider === "GITHUB"
        );

        res.json({
            ...user,
            githubConnected,
        });
    }
};