import type { ButtonHTMLAttributes } from "react";
import "./button.css"

type customProps =
{
    onClick?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
    theme: "green" | "light"; // expanda conforme necessário
}

type Props = Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    Extract<keyof customProps, keyof ButtonHTMLAttributes<HTMLButtonElement>>
> & customProps;

export default function Button({onClick, theme, children, className, ...rest}: Props)
{
    const THEME_CLASS_MAP: Record<customProps["theme"], string> = {
        green: 'btn-primary',
        light: 'btn-secondary',
    }

    const themeClass = THEME_CLASS_MAP[theme] ?? "";

    const composedClassName = [className, "btn", themeClass].filter(Boolean).join(" ");

    return (
        <button
        className={composedClassName}
        onClick={onClick}
        {...rest}> 
            {children}
        </button>)
}