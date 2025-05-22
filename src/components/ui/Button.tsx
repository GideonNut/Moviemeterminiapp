interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
}

export function Button({ 
  children, 
  className = "", 
  isLoading = false, 
  variant = 'primary',
  ...props 
}: ButtonProps) {
  const baseStyles = "w-full py-3 px-6 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantStyles = {
    primary: "bg-white text-black hover:bg-white/90 active:bg-white/80",
    secondary: "bg-black text-white border border-white hover:bg-white/10 active:bg-white/20",
    outline: "bg-transparent text-white border border-white hover:bg-white/10 active:bg-white/20"
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
        </div>
      ) : (
        children
      )}
    </button>
  );
}
