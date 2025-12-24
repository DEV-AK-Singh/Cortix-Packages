import jwt from "jsonwebtoken";

export class GoogleController {
    static GoogleCallback(req: any, res: any) {
        const user = req.user as any;
        try {
            const token = jwt.sign(
                { id: user.id, email: user.email },
                process.env.JWT_SECRET!,
                { expiresIn: "7d" }
            );
            res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}`);
        } catch (err) {
            console.error(err);
            res.redirect(`${process.env.FRONTEND_URL}/auth/failure?error=Token%20Generation%20Failed`);
        }
    }
};