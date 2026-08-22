import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Providers from "./providers";
import AIChatWidget from "@/components/AIChatWidget";

export const metadata = {
  title: "Scholarly | School ERP",
  description: "A role-based School ERP Management System",
};

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body>
        <Providers session={session}>
          {children}
          <AIChatWidget />
        </Providers>
      </body>
    </html>
  );
}
