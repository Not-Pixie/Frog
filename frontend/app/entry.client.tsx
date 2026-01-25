import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

// Suprimir warnings específicos de hydration em produção
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Hydration failed') ||
     args[0].includes('There was an error while hydrating') ||
     args[0].includes('hydrated but some attributes'))
  ) {
    return;
  }
  originalError.call(console, ...args);
};

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>
  );
});
