import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { prisma } from "../../config/prisma";
import crypto from "crypto";

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            callbackURL: process.env.GOOGLE_CALLBACK_URL!,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0].value;
                if (!email) throw new Error("No email from Google");

                let user = await prisma.user.findUnique({ where: { email } });

                if (!user) {
                    user = await prisma.user.create({
                        data: {
                            email,
                            name: profile.displayName,
                            avatar: profile.photos?.[0].value,
                        },
                    });
                }

                await prisma.account.upsert({
                    where: {
                        provider_providerAccountId: {
                            provider: "GOOGLE",
                            providerAccountId: profile.id,
                        },
                    },
                    update: {
                        accessToken,
                        refreshToken: crypto.randomBytes(64).toString("hex"),
                    },
                    create: {
                        userId: user.id,
                        provider: "GOOGLE",
                        providerAccountId: profile.id,
                        accessToken,
                        refreshToken: crypto.randomBytes(64).toString("hex"),
                    },
                });

                done(null, user);
            } catch (err) {
                done(err as Error);
            }
        }
    )
);

export default passport;
