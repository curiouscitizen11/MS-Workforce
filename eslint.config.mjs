import nextVitals from "eslint-config-next/core-web-vitals"

const config = [
  ...nextVitals,
  {
    rules: {
      // These rules arrived with Next.js 16. The existing screens already follow
      // the older checks. Turning the new ones off keeps that behaviour.
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
    },
  },
  {
    ignores: [".next/**", "node_modules/**", "out/**"],
  },
]

export default config
