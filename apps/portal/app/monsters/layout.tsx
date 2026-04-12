import { Header } from "@/components/header";

export const metadata = {
  title: "Monster Builder | Nimble Portal",
  description: "Create and manage custom monsters for Nimble RPG",
};

export default function MonstersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header user={null} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
