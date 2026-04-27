import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-black group-[.toaster]:text-lcars-peach group-[.toaster]:border-2 group-[.toaster]:border-lcars-orange group-[.toaster]:border-l-8 group-[.toaster]:rounded-none group-[.toaster]:font-sans",
          title: "group-[.toast]:font-display group-[.toast]:uppercase group-[.toast]:tracking-widest group-[.toast]:text-lcars-peach",
          description: "group-[.toast]:text-lcars-peach/70",
          actionButton: "group-[.toast]:bg-lcars-orange group-[.toast]:text-black group-[.toast]:rounded-full group-[.toast]:font-display group-[.toast]:uppercase group-[.toast]:tracking-widest",
          cancelButton: "group-[.toast]:bg-lcars-lavender group-[.toast]:text-black group-[.toast]:rounded-full group-[.toast]:font-display group-[.toast]:uppercase group-[.toast]:tracking-widest",
          error: "group-[.toaster]:border-lcars-red",
          success: "group-[.toaster]:border-lcars-cyan",
          warning: "group-[.toaster]:border-lcars-yellow",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
