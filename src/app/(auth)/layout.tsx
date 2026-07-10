export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full sm:w-[60%] md:w-[45%] lg:w-[30%]">{children}</div>
    </div>
  );
}
