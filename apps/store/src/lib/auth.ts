import type { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";
import { verifyPassword } from "@/lib/auth-helpers";
import { getModels } from "@/lib/tenant-models";
import { peekRateLimit, hitRateLimit, resetRateLimit } from "@/lib/rate-limit";
import { sendWelcomeEmail } from "@/lib/email";

const LOGIN_LIMIT = 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const CredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const creds = CredentialsSchema.safeParse(credentials);
        if (!creds.success) return null;
        const { email, password } = creds.data;

        const rlKey = `login:${email.toLowerCase().trim()}`;
        if ((await peekRateLimit(rlKey, LOGIN_LIMIT)).limited) return null;

        const { User } = await getModels();
        const user = await User.findOne({ email });
        if (!user) {
          await hitRateLimit(rlKey, LOGIN_LIMIT, LOGIN_WINDOW_MS);
          return null;
        }

        const isValid = await verifyPassword(password, user.password);
        if (!isValid) {
          await hitRateLimit(rlKey, LOGIN_LIMIT, LOGIN_WINDOW_MS);
          return null;
        }

        await resetRateLimit(rlKey);
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role || "user",
          image: user.image || null,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  cookies: {
    sessionToken: {
      name: "store.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const { User } = await getModels();
        const existingUser = await User.findOne({ email: user.email });

        if (!existingUser) {
          await User.create({
            name: user.name,
            email: user.email,
            image: user.image,
            role: "user",
          });
          // Email de bienvenida (no bloquea el login si falla)
          sendWelcomeEmail({ name: user.name ?? "", email: user.email ?? "" }).catch(() => {});
        } else {
          await User.updateOne(
            { email: user.email },
            {
              $set: {
                name: user.name || existingUser.name,
                image: user.image || existingUser.image,
              },
            },
            { runValidators: false }
          );
        }
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      const callbackUrl = new URL(url, baseUrl);
      if (callbackUrl.origin === baseUrl) return callbackUrl.pathname;
      return "/";
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id ?? token.sub) as string;
        session.user.role = token.role as string;
        session.user.name = token.name;
        session.user.email = token.email as string;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.name = user.name;
        token.email = user.email;
        token.role = (user as { role?: string }).role ?? "user";

        if (account?.provider === "google") {
          const { User } = await getModels();
          const dbUser = await User.findOne({ email: user.email });
          if (dbUser) {
            token.id = dbUser._id.toString();
            token.role = dbUser.role;
          }
        } else {
          token.id = user.id;
        }
      } else {
        const { User } = await getModels();
        const dbUser = await User.findOne({ email: token.email });
        if (dbUser) {
          token.id = dbUser._id.toString();
          token.role = dbUser.role;
          token.name = dbUser.name;
          token.email = dbUser.email;
        }
      }
      return token;
    },
  },
};
