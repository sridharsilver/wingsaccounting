import logo from "@/assets/wings-logo.png";

export function Logo({ className = "h-8" }: { className?: string }) {
  return (
    <>
      {/* Light Mode Logo */}
      <div className={`relative ${className} dark:hidden inline-block`} style={{ aspectRatio: '172/34' }}>
        <img 
          src={logo} 
          alt="Wings Accounting" 
          className="h-full w-full object-contain"
        />
      </div>
      
      {/* Dark Mode Logo */}
      <div className={`relative ${className} hidden dark:inline-block`} style={{ aspectRatio: '172/34' }}>
        <img 
          src={logo} 
          alt="Wings Accounting" 
          className="h-full w-full object-contain brightness-0 invert"
        />
        <img 
          src={logo} 
          alt="" 
          className="absolute inset-0 h-full w-full object-contain"
          style={{ clipPath: 'inset(0 72% 0 0)' }} 
        />
      </div>
    </>
  );
}
