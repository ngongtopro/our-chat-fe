import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import 'antd/dist/reset.css'
import HeaderComponent from "../components/header";
import { AuthProvider } from "../contexts/auth-context";

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "Our Chat",
  description: "Cùng chat và chơi nào",
};

export default function RootLayout({ 
  children 
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="vi">
      <body className={`${lexend.variable} antialiased`}>
        <AuthProvider>
          <HeaderComponent />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
