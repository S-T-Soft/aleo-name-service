export {};

declare global {
  interface Window {
    aleo?: any;
  }
}

declare module "*.svg" {
  import * as React from "react";
  const SVGComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  export default SVGComponent;
}
