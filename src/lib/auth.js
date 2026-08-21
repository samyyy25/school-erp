const CredentialsProvider = require("next-auth/providers/credentials").default;
const GoogleProvider = require("next-auth/providers/google").default;
const bcrypt = require("bcryptjs");
const prisma = require("./prisma");

const providers = [
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error("Email and password are required");
      }

      const email = credentials.email.toLowerCase().trim();
      const user = await prisma.user.findUnique({
        where: { email },
        include: { student: true, staff: true },
      });

      if (!user) {
        throw new Error("Invalid email or password");
      }

      if (!user.isActive) {
        throw new Error("Your account has been deactivated. Please contact your school administrator.");
      }

      const isValid = await bcrypt.compare(credentials.password, user.password);
      if (!isValid) {
        throw new Error("Invalid email or password");
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl || null,
        studentId: user.student?.id || null,
        staffId: user.staff?.id || null,
      };
    },
  }),
];

// Conditionally enable Google OAuth if environment variables are set
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

const authOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const existing = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase().trim() },
          include: { student: true, staff: true },
        });
        if (!existing) {
          // Auto-create student user if registering via Google
          const created = await prisma.user.create({
            data: {
              name: user.name || "Student",
              email: user.email.toLowerCase().trim(),
              password: await bcrypt.hash(Math.random().toString(36), 10),
              role: "STUDENT",
              avatarUrl: user.image || null,
              student: {
                create: {
                  admissionNo: `G-${Date.now().toString().slice(-6)}`,
                },
              },
            },
            include: { student: true, staff: true },
          });
          user.id = created.id;
          user.role = created.role;
          user.studentId = created.student?.id || null;
          user.staffId = created.staff?.id || null;
        } else {
          if (!existing.isActive) return false;
          user.id = existing.id;
          user.role = existing.role;
          user.studentId = existing.student?.id || null;
          user.staffId = existing.staff?.id || null;
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.uid = user.id;
        token.role = user.role;
        token.studentId = user.studentId;
        token.staffId = user.staffId;
        token.avatarUrl = user.avatarUrl;
      }
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.avatarUrl) token.avatarUrl = session.avatarUrl;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.uid;
        session.user.role = token.role;
        session.user.studentId = token.studentId;
        session.user.staffId = token.staffId;
        session.user.avatarUrl = token.avatarUrl;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

module.exports = { authOptions };
