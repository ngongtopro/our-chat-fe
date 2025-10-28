import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import 'antd/dist/reset.css'
import { AuthProvider } from "../contexts/auth-context";
import { RealtimeProvider } from "../contexts/realtime-context";
import AppShell from "../components/app-shell";

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "Love Chat - Single Page App",
  description: "Cùng chat và chơi nào - Always Connected",
};

export default function RootLayout({ 
  children 
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="vi">
      <body className={`${lexend.variable} antialiased`} suppressHydrationWarning>
        <AuthProvider>
          <RealtimeProvider>
            <AppShell>
              {children}
            </AppShell>
          </RealtimeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
