export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
